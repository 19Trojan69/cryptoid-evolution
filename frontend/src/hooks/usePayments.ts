import { useCallback, useRef, useState } from "react";
import { axiosClient, PI_ACCESS_TOKEN_KEY } from "../lib/axiosClient";
import type { PaymentDTO } from "../types/pi";

type PaymentMetadata = {
  productId: string;
  quantity?: number;
  weaponModel?: 2;
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
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState("");
  const paymentPending = useRef(false);
  // A saved server login does not authenticate a freshly loaded Pi SDK.
  const sdkToken = useRef<string | null>(null);
  const [paymentDiagnostic, setPaymentDiagnostic] = useState(() => sessionStorage.getItem(PAYMENT_DIAGNOSTIC_KEY) || "");
  const confirmedCallback = useRef<(() => void | Promise<void>) | undefined>(undefined);
  const incomplete = useRef(new Map<string, PaymentDTO>());
  const recovering = useRef(new Map<string, Promise<void>>());

  const rememberDiagnostic = useCallback((message: string) => {
    setPaymentDiagnostic(message);
    if (message) sessionStorage.setItem(PAYMENT_DIAGNOSTIC_KEY, message);
    else sessionStorage.removeItem(PAYMENT_DIAGNOSTIC_KEY);
  }, []);
  const finish = useCallback(() => {
    paymentPending.current = false;
    setIsLoading(false);
  }, []);
  const fail = useCallback((stage: string, error: unknown) => {
    rememberDiagnostic(`${stage}: ${formatPaymentDiagnostic(error)}`);
    setPaymentStatus("");
    sdkToken.current = null;
    finish();
  }, [finish, rememberDiagnostic]);

  const recoverPayment = useCallback((payment: PaymentDTO) => {
    const running = recovering.current.get(payment.identifier);
    if (running) return running;
    const pending = (async () => {
      setPaymentStatus("Confirming payment…");
      const { data } = await axiosClient.post("/payments/incomplete", { payment });
      if (data?.completed !== true) throw new Error("Payment not confirmed");
      incomplete.current.delete(payment.identifier);
      rememberDiagnostic("");
      setPaymentStatus("purchase confirmed.");
      await confirmedCallback.current?.();
    })().finally(() => recovering.current.delete(payment.identifier));
    recovering.current.set(payment.identifier, pending);
    return pending;
  }, [rememberDiagnostic]);

  const orderProduct = useCallback(async (memo: string, amount: number, metadata: PaymentMetadata, onConfirmed?: () => void | Promise<void>) => {
    if (paymentPending.current) return;
    setActiveProductId(metadata.productId);
    rememberDiagnostic("");
    if (!isAuthenticated) {
      setPaymentStatus("Connect your Pi account to see your saved loadout.");
      onRequireAuth();
      return;
    }
    paymentPending.current = true;
    setIsLoading(true);
    setPaymentStatus("Connecting to Pi…");
    confirmedCallback.current = onConfirmed;
    try {
      if (typeof window.Pi?.authenticate !== "function" || typeof window.Pi?.createPayment !== "function") {
        throw new Error("Pi SDK unavailable. Open the app in Pi Browser.");
      }
      if (!sdkToken.current || sdkToken.current !== sessionStorage.getItem(PI_ACCESS_TOKEN_KEY)) {
        sdkToken.current = null;
        const authResult = await window.Pi.authenticate(["username", "payments"], payment => {
          incomplete.current.set(payment.identifier, payment);
          // The SDK also calls this when a later purchase finds an unfinished payment.
          if (sdkToken.current) void recoverPayment(payment).then(finish).catch(error => fail("Recovery", error));
        });
        if (!authResult.accessToken) throw new Error("Pi authentication did not return an access token");
        const previousToken = sessionStorage.getItem(PI_ACCESS_TOKEN_KEY);
        sessionStorage.setItem(PI_ACCESS_TOKEN_KEY, authResult.accessToken);
        // Keep the active mission session when Pi returns the same verified token.
        if (previousToken !== authResult.accessToken) {
          await axiosClient.post("/user/signin", { authResult });
        }
        sdkToken.current = authResult.accessToken;
      }
      if (incomplete.current.size) {
        for (const payment of incomplete.current.values()) await recoverPayment(payment);
        // Restored charges are shown first. Never silently create a second purchase.
        finish();
        return;
      }
      setPaymentStatus("Opening payment…");
      await window.Pi.createPayment({ amount, memo, metadata }, {
        onReadyForServerApproval: async paymentId => {
          setPaymentStatus("Approving payment…");
          try {
            const { data } = await axiosClient.post("/payments/approve", { paymentId });
            if (data?.approved !== true) throw new Error("Payment approval not confirmed");
            setPaymentStatus("Connect your Pi wallet");
          } catch (error) { fail("Approval", error); }
        },
        onReadyForServerCompletion: async (paymentId, txid) => {
          setPaymentStatus("Confirming payment…");
          try {
            const { data } = await axiosClient.post("/payments/complete", { paymentId, txid });
            if (data?.completed !== true) throw new Error("Payment not confirmed");
            rememberDiagnostic("");
            setPaymentStatus("purchase confirmed.");
            await onConfirmed?.();
          } catch (error) { fail("Completion", error); }
          finally { finish(); }
        },
        onCancel: async paymentId => {
          setPaymentStatus("Payment cancelled.");
          finish();
          try { await axiosClient.post("/payments/cancelled_payment", { paymentId }); }
          catch { /* Pi cancellation is authoritative; no purchase is credited here. */ }
        },
        onError: error => {
          if (!sessionStorage.getItem(PAYMENT_DIAGNOSTIC_KEY)) fail("Pi SDK", error);
          else finish();
        },
      });
    } catch (error) { fail("Pi", error); }
  }, [isAuthenticated, onRequireAuth, recoverPayment, finish, fail, rememberDiagnostic]);

  return { orderProduct, isLoading, paymentDiagnostic, activeProductId, paymentStatus };
};
