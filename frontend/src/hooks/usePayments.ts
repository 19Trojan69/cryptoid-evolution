import { useCallback, useState } from "react";
import { axiosClient } from "../lib/axiosClient";
import type { PaymentDTO } from "../types/pi";

type PaymentMetadata = {
  productId: string;
};

type UsePaymentsArgs = {
  isAuthenticated: boolean;
  userUid: string | null;
  onRequireAuth: () => void;
};

export const IRRA_TOKEN_CANONICAL =
  "IRRA:GAAKMEW7GM5364YRRXFVVMF52R4YEEHB7LUNYTX3OONXUJKPKZXB6OK3";

export const usePayments = ({ isAuthenticated, userUid, onRequireAuth }: UsePaymentsArgs) => {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");

  const onReadyForServerApproval = useCallback(async (paymentId: string) => {
    try {
      await axiosClient.post("/payments/approve", { paymentId });
    } catch (error) {
      console.error("Payment approval failed", error);
      setPaymentMessage("Die Test-Pi-Zahlung konnte nicht bestätigt werden. Bitte versuche es erneut.");
      setIsLoading(false);
    }
  }, []);

  const onCancel = useCallback(async (paymentId: string) => {
    setIsLoading(false);
    try {
      await axiosClient.post("/payments/cancelled_payment", { paymentId });
    } catch (err) {
      console.error("Error cancelling payment:", err);
    }
  }, []);

  const onError = useCallback((error: Error, payment?: PaymentDTO) => {
    console.error("Payment error:", error, payment);
    setPaymentMessage("Die Test-Pi-Zahlung konnte nicht gestartet werden. Bitte versuche es erneut.");
    setIsLoading(false);
  }, []);

  const orderProduct = useCallback(
    async (memo: string, amount: number, metadata: PaymentMetadata, onConfirmed?: () => void) => {
      if (!isAuthenticated) {
        onRequireAuth();
        return;
      }

      setPaymentMessage("");
      setIsLoading(true);
      try {
        if (!window.Pi?.authenticate || !window.Pi?.createPayment) {
          throw new Error("Pi SDK unavailable");
        }
        // Pi Sign-in currently grants identity scopes only. Request the payments
        // scope through the Pi Browser SDK before opening the wallet flow.
        const paymentAuth = await window.Pi.authenticate(
          ["username", "payments"],
          payment => { void axiosClient.post("/payments/incomplete", { payment }).catch(error => {
            console.error("Could not resume incomplete payment", error);
          }); }
        );
        if (!userUid || paymentAuth.user.uid !== userUid) {
          throw new Error("Pi payment account differs from signed-in account");
        }
        window.Pi.createPayment(
          {
            amount,
            memo,
            metadata,
          },
          {
            onReadyForServerApproval,
            onReadyForServerCompletion: async (paymentId: string, txid: string) => {
              try {
                await axiosClient.post("/payments/complete", { paymentId, txid });
                onConfirmed?.();
              } catch (error) {
                console.error("Payment verification failed", error);
                setPaymentMessage("Die Zahlung wurde nicht bestätigt. Bitte überprüfe sie vor einem erneuten Versuch.");
              } finally { setIsLoading(false); }
            },
            onCancel,
            onError,
          }
        );
      } catch (err) {
        console.error("Error creating payment:", err);
        setPaymentMessage("Zahlung nicht gestartet. Bitte melde dich im Pi Browser mit demselben Pi-Konto an und versuche es erneut.");
        setIsLoading(false);
      }
    },
    [isAuthenticated, userUid, onRequireAuth, onReadyForServerApproval, onCancel, onError]
  );

  return {
    orderProduct,
    isLoading,
    paymentMessage,
  };
};
