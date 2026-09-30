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

type PaymentDiagnosticResponse = {
  error?: string;
  message?: string;
  stage?: string;
  network?: string;
  diagnostic?: {
    code?: string;
    piStatus?: number;
    piCode?: string;
    piMessage?: string;
  };
};

const PAYMENT_DIAGNOSTIC_KEY = "cryptoid_payment_diagnostic";

const formatPaymentDiagnostic = (error: unknown) => {
  const response = (error as { response?: { status?: number; data?: PaymentDiagnosticResponse } })?.response;
  const data = response?.data;
  const parts: string[] = [];

  if (data?.error) parts.push(data.error);
  if (data?.diagnostic?.code) parts.push(data.diagnostic.code);
  if (data?.diagnostic?.piStatus) parts.push(`Pi API ${data.diagnostic.piStatus}`);
  if (data?.diagnostic?.piCode) parts.push(data.diagnostic.piCode);
  if (data?.diagnostic?.piMessage) parts.push(data.diagnostic.piMessage);
  if (data?.network) parts.push(`network: ${data.network}`);
  if (!parts.length && response?.status) parts.push(`HTTP ${response.status}`);

  const fallback = error instanceof Error ? error.message : "Unknown payment error";
  return parts.length ? parts.join(" · ") : fallback;
};

export const IRRA_TOKEN_CANONICAL =
  "IRRA:GAAKMEW7GM5364YRRXFVVMF52R4YEEHB7LUNYTX3OONXUJKPKZXB6OK3";

export const usePayments = ({ isAuthenticated, onRequireAuth }: UsePaymentsArgs) => {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentDiagnostic, setPaymentDiagnostic] = useState(() => sessionStorage.getItem(PAYMENT_DIAGNOSTIC_KEY) || "");

  const rememberDiagnostic = useCallback((message: string) => {
    setPaymentDiagnostic(message);
    if (message) sessionStorage.setItem(PAYMENT_DIAGNOSTIC_KEY, message);
    else sessionStorage.removeItem(PAYMENT_DIAGNOSTIC_KEY);
  }, []);

  const onReadyForServerApproval = useCallback(async (paymentId: string) => {
    try {
      await axiosClient.post("/payments/approve", { paymentId });
    } catch (error) {
      const diagnostic = formatPaymentDiagnostic(error);
      rememberDiagnostic(`Approval: ${diagnostic}`);
      console.error("Payment approval diagnostic:", diagnostic);
      throw error;
    }
  }, [rememberDiagnostic]);

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
    setPaymentDiagnostic(current => {
      if (current) return current;
      const next = `Pi SDK: ${error.message || "Payment failed"}`;
      sessionStorage.setItem(PAYMENT_DIAGNOSTIC_KEY, next);
      return next;
    });
    setIsLoading(false);
  }, []);

  const orderProduct = useCallback(
    async (memo: string, amount: number, metadata: PaymentMetadata, onConfirmed?: () => void) => {
      if (!isAuthenticated) {
        onRequireAuth();
        return;
      }

      rememberDiagnostic("");
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
                rememberDiagnostic("");
                onConfirmed?.();
              } catch (error) {
                const diagnostic = formatPaymentDiagnostic(error);
                rememberDiagnostic(`Completion: ${diagnostic}`);
                console.error("Payment verification failed", error);
              } finally { setIsLoading(false); }
            },
            onCancel,
            onError,
          }
        );
      } catch (err) {
        if (!sessionStorage.getItem(PAYMENT_DIAGNOSTIC_KEY)) {
          const diagnostic = formatPaymentDiagnostic(err);
          rememberDiagnostic(`Create payment: ${diagnostic}`);
        }
        console.error("Error creating payment:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, onRequireAuth, onReadyForServerApproval, onCancel, onError, rememberDiagnostic]
  );

  return {
    orderProduct,
    isLoading,
    paymentDiagnostic,
  };
};
