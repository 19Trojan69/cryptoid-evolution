import { useCallback, useEffect, useRef, useState } from "react";
import { axiosClient, PI_ACCESS_TOKEN_KEY } from "../lib/axiosClient";
import { PI_AUTH_ATTEMPT_KEY } from "../config/piOAuth";
import type { PaymentDTO } from "../types/pi";

type PaymentMetadata = {
  productId: string;
  quantity?: number;
  weaponModel?: 2;
  powerModel?: 1;
};

type UsePaymentsArgs = {
  isAuthenticated: boolean;
  accountId?: string;
  network?: "mainnet" | "testnet";
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
const PAYMENT_ACCOUNT_MESSAGE = "Your Pi Browser account does not match this game session. Sign in with the same Pi account before retrying.";

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

export const usePayments = ({ isAuthenticated, accountId, network, onRequireAuth }: UsePaymentsArgs) => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState("");
  const paymentPending = useRef(false);
  const lifecycle = useRef({ active: true, generation: 0 });
  const identity = useRef({ isAuthenticated, accountId, network });
  useEffect(() => {
    const current = lifecycle.current; current.active = true;
    return () => { current.active = false; current.generation++; };
  }, []);
  const attemptVersion = useRef(0);
  // A saved server login does not authenticate a freshly loaded Pi SDK.
  const sdkToken = useRef<string | null>(null);
  const sdkUid = useRef<string | null>(null);
  const [paymentDiagnostic, setPaymentDiagnostic] = useState(() => {
    try { return sessionStorage.getItem(PAYMENT_DIAGNOSTIC_KEY) || ""; }
    catch { return ""; }
  });
  const diagnosticRef = useRef(paymentDiagnostic);
  const incomplete = useRef(new Map<string, PaymentDTO>());
  const recovering = useRef(new Map<string, Promise<void>>());
  const recoveryReceiver = useRef<((payment: PaymentDTO) => void) | null>(null);
  const authEpoch = sessionStorage.getItem(PI_AUTH_ATTEMPT_KEY);
  useEffect(() => {
    identity.current = { isAuthenticated, accountId, network };
    const retiredVersion = ++attemptVersion.current;
    let active = true;
    paymentPending.current = false;
    sdkToken.current = null;
    sdkUid.current = null;
    incomplete.current.clear();
    recovering.current.clear();
    recoveryReceiver.current = null;
    void Promise.resolve().then(() => {
      if (!active || attemptVersion.current !== retiredVersion) return;
      setIsLoading(false); setActiveProductId(null); setPaymentStatus("");
    });
    return () => { active = false; };
  }, [isAuthenticated, accountId, network, authEpoch]);

  const rememberDiagnostic = useCallback((message: string) => {
    diagnosticRef.current = message;
    setPaymentDiagnostic(message);
    try {
      if (message) sessionStorage.setItem(PAYMENT_DIAGNOSTIC_KEY, message);
      else sessionStorage.removeItem(PAYMENT_DIAGNOSTIC_KEY);
    } catch { /* An optional error backup must never hold checkout or its busy state. */ }
  }, []);
  const finish = useCallback(() => {
    paymentPending.current = false;
    setIsLoading(false);
  }, []);
  const fail = useCallback((stage: string, error: unknown) => {
    const detail = formatPaymentDiagnostic(error);
    rememberDiagnostic(`${stage}: ${detail}`);
    setPaymentStatus(detail === "payment_account_mismatch" || detail === "payment_account_verification_failed"
      ? PAYMENT_ACCOUNT_MESSAGE : "");
    sdkToken.current = null;
    sdkUid.current = null;
    finish();
  }, [finish, rememberDiagnostic]);

  const orderProduct = useCallback(async (memo: string, amount: number, metadata: PaymentMetadata, onConfirmed?: () => void | Promise<void>) => {
    if (paymentPending.current || !lifecycle.current.active) return;
    setActiveProductId(metadata.productId);
    rememberDiagnostic("");
    if (!isAuthenticated) {
      setPaymentStatus("Connect your Pi account to see your saved loadout.");
      onRequireAuth();
      return;
    }
    const version = ++attemptVersion.current;
    const generation = lifecycle.current.generation;
    const authAttempt = sessionStorage.getItem(PI_AUTH_ATTEMPT_KEY);
    let token = sessionStorage.getItem(PI_ACCESS_TOKEN_KEY);
    const current = () => lifecycle.current.active && lifecycle.current.generation === generation
      && attemptVersion.current === version && identity.current.isAuthenticated
      && identity.current.accountId === accountId && identity.current.network === network
      && sessionStorage.getItem(PI_AUTH_ATTEMPT_KEY) === authAttempt && sessionStorage.getItem(PI_ACCESS_TOKEN_KEY) === token;
    const done = () => { if (current()) finish(); };
    const failed = (stage: string, error: unknown) => { if (current()) fail(stage, error); };
    let verifiedUid = accountId || (sdkToken.current === token ? sdkUid.current : null);
    const confirmedPayments = new Set<string>();
    const confirmOnce = async (paymentId: string) => {
      if (!current() || confirmedPayments.has(paymentId)) return;
      confirmedPayments.add(paymentId);
      rememberDiagnostic("");
      setPaymentStatus("purchase confirmed.");
      await onConfirmed?.();
    };
    const recoverPayment = (payment: PaymentDTO) => {
      if (!current()) return Promise.resolve();
      if (verifiedUid && payment.user_uid !== verifiedUid) return Promise.reject(new Error("payment_account_mismatch"));
      const running = recovering.current.get(payment.identifier);
      if (running) return running;
      const pending = (async () => {
        if (!current()) return;
        setPaymentStatus("Confirming payment…");
        const { data } = await axiosClient.post("/payments/incomplete", { payment });
        if (!current()) return;
        if (data?.completed !== true) throw new Error("Payment not confirmed");
        incomplete.current.delete(payment.identifier);
        await confirmOnce(payment.identifier);
      })().finally(() => recovering.current.delete(payment.identifier));
      recovering.current.set(payment.identifier, pending);
      return pending;
    };
    recoveryReceiver.current = payment => {
      if (!current()) return;
      incomplete.current.set(payment.identifier, payment);
      if (sdkToken.current) void recoverPayment(payment).then(done).catch(error => failed("Recovery", error));
    };
    paymentPending.current = true;
    setIsLoading(true);
    setPaymentStatus("Connecting to Pi…");
    try {
      if (typeof window.Pi?.authenticate !== "function" || typeof window.Pi?.createPayment !== "function") {
        throw new Error("Pi SDK unavailable. Open the app in Pi Browser.");
      }
      if (!sdkToken.current || sdkToken.current !== token) {
        sdkToken.current = null;
        sdkUid.current = null;
        const authResult = await window.Pi.authenticate(["username", "payments"], payment => {
          // A cached SDK session keeps this native callback between orders. Route
          // discoveries to the latest context, which rechecks account/network.
          recoveryReceiver.current?.(payment);
        });
        if (!current()) return;
        if (!authResult.accessToken) throw new Error("Pi authentication did not return an access token");
        // The paused mission supplies authentication state but may not pass its
        // UID. Bind it to the existing server session even when Pi reuses the
        // same token; neither an SDK field nor a token cache proves that UID.
        if (!verifiedUid) {
          const { data: session } = await axiosClient.get("/user/me");
          if (!current()) return;
          verifiedUid = session?.user?.uid;
        }
        if (!verifiedUid || authResult.user?.uid !== verifiedUid) throw new Error("payment_account_mismatch");
        // Changing the SDK token must not silently switch the account of an
        // active mission. Verify the current server account before rebinding.
        if (token !== authResult.accessToken) {
          const { data: session } = await axiosClient.post("/user/signin", { authResult }, { headers: { Authorization: `Bearer ${authResult.accessToken}` } });
          if (!current()) return;
          if (session?.user?.uid !== verifiedUid) throw new Error("payment_account_verification_failed");
          sessionStorage.setItem(PI_ACCESS_TOKEN_KEY, authResult.accessToken);
          token = authResult.accessToken;
        }
        sdkUid.current = verifiedUid;
        sdkToken.current = authResult.accessToken;
      }
      if (!current()) return;
      if (incomplete.current.size) {
        for (const payment of incomplete.current.values()) { if (!current()) return; await recoverPayment(payment); }
        // Restored charges are shown first. Never silently create a second purchase.
        done();
        return;
      }
      setPaymentStatus("Opening payment…");
      let completing: Promise<void> | undefined;
      await window.Pi.createPayment({ amount, memo, metadata }, {
        onReadyForServerApproval: async paymentId => {
          if (!current()) return;
          setPaymentStatus("Approving payment…");
          try {
            const { data } = await axiosClient.post("/payments/approve", { paymentId });
            if (!current()) return;
            if (data?.approved !== true) throw new Error("Payment approval not confirmed");
            setPaymentStatus("Connect your Pi wallet");
          } catch (error) { failed("Approval", error); }
        },
        onReadyForServerCompletion: async (paymentId, txid) => {
          if (!current() || confirmedPayments.has(paymentId)) return;
          if (completing) return completing;
          completing = (async () => {
            setPaymentStatus("Confirming payment…");
            try {
              const { data } = await axiosClient.post("/payments/complete", { paymentId, txid });
              if (!current()) return;
              if (data?.completed !== true) throw new Error("Payment not confirmed");
              await confirmOnce(paymentId);
            } catch (error) { failed("Completion", error); }
            finally { done(); }
          })();
          return completing;
        },
        onCancel: async paymentId => {
          if (!current()) return;
          setPaymentStatus("Payment cancelled.");
          done();
          try { await axiosClient.post("/payments/cancelled_payment", { paymentId }); }
          catch { /* Pi cancellation is authoritative; no purchase is credited here. */ }
        },
        onError: error => {
          if (!current()) return;
          if (!diagnosticRef.current) failed("Pi SDK", error);
          else done();
        },
      });
    } catch (error) { failed("Pi", error); }
  }, [isAuthenticated, accountId, network, onRequireAuth, finish, fail, rememberDiagnostic]);

  return { orderProduct, isLoading, paymentDiagnostic, activeProductId, paymentStatus };
};
