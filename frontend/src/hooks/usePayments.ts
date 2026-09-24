import { useCallback, useState } from "react";
import { axiosClient } from "../lib/axiosClient";
import type { PaymentDTO } from "../types/pi";

type PaymentMetadata = {
  productId: string;
};

type UsePaymentsArgs = {
  isAuthenticated: boolean;
  onRequireAuth: () => void;
};

export const IRRA_TOKEN_CANONICAL =
  "IRRA:GAAKMEW7GM5364YRRXFVVMF52R4YEEHB7LUNYTX3OONXUJKPKZXB6OK3";

export const usePayments = ({ isAuthenticated, onRequireAuth }: UsePaymentsArgs) => {
  const [isLoading, setIsLoading] = useState(false);

  const onReadyForServerApproval = useCallback(async (paymentId: string) => {
    await axiosClient.post("/payments/approve", { paymentId });
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
    setIsLoading(false);
  }, []);

  const orderProduct = useCallback(
    async (memo: string, amount: number, metadata: PaymentMetadata, onConfirmed?: () => void) => {
      if (!isAuthenticated) {
        onRequireAuth();
        return;
      }

      setIsLoading(true);
      try {
        await window.Pi.createPayment(
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
              } finally { setIsLoading(false); }
            },
            onCancel,
            onError,
          }
        );
      } catch (err) {
        console.error("Error creating payment:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, onRequireAuth, onReadyForServerApproval, onCancel, onError]
  );

  return {
    orderProduct,
    isLoading,
  };
};
