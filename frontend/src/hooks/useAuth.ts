import { useCallback, useEffect, useRef, useState } from "react";
import { axiosClient, PI_ACCESS_TOKEN_KEY } from "../lib/axiosClient";
import type { AuthResult, PaymentDTO, SessionUser, User } from "../types/pi";
import { ADMIN_MODE_KEY, shipSaveNetwork } from "../pages/shipFleet";
import { beginPiAuthAttempt, getPiOAuthConfiguration, PI_AUTH_ATTEMPT_KEY, PI_OAUTH_STATE_KEY, safePiReturnPath, storePiOAuthTransaction } from "../config/piOAuth";
import axios from "axios";
import { withPiAuthTimeout } from "../lib/piAuthTimeout";

import { updateOwnerLifecycleAccess } from '../lib/ownerLifecycle';

const detectPiBrowser = async () => {
  const ua = navigator.userAgent.toLowerCase();
  // Native identification should not wait for a potentially slow SDK host query.
  if (ua.includes('pibrowser') || ua.includes('pi-browser')) return true;
  // The SDK/host bridge can arrive after the React app on mobile browsers.
  for (let attempt = 0; !window.Pi && attempt < 10; attempt++) {
    await new Promise(resolve => window.setTimeout(resolve, 200));
  }
  if (typeof window.Pi?.getPiHostAppInfo !== 'function') return false;
  let timer: number | undefined;
  try {
    const hostInfo = await Promise.race([
      window.Pi.getPiHostAppInfo(),
      new Promise<null>(resolve => { timer = window.setTimeout(() => resolve(null), 5000); }),
    ]);
    return hostInfo?.hostApp === 'pi-browser';
  } catch { return false; }
  finally { window.clearTimeout(timer); }
};

export const useAuth = ({ autoSignIn = true }: { autoSignIn?: boolean } = {}) => {
  const pendingPayments = useRef<PaymentDTO[]>([]);
  const signingIn = useRef(false);
  const autoAttempted = useRef(false);
  const confirmedPiBrowser = useRef(false);
  // An old native bridge/API reply must not change the session of a later route.
  // Generation also distinguishes React's setup/cleanup/setup lifecycle replay.
  const authLifecycle = useRef({ active: true, generation: 0 });
  useEffect(() => {
    const lifecycle = authLifecycle.current;
    lifecycle.active = true;
    return () => { lifecycle.active = false; lifecycle.generation++; };
  }, []);
  const [user, setUser] = useState<User | null>(null);
  const [canAdmin, setCanAdmin] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState("");

  const refreshSession = useCallback(async () => {
    const generation = authLifecycle.current.generation;
    const tokenBefore = sessionStorage.getItem(PI_ACCESS_TOKEN_KEY);
    const authAttempt = sessionStorage.getItem(PI_AUTH_ATTEMPT_KEY);
    const current = () => authLifecycle.current.active && authLifecycle.current.generation === generation
      && sessionStorage.getItem(PI_AUTH_ATTEMPT_KEY) === authAttempt && sessionStorage.getItem(PI_ACCESS_TOKEN_KEY) === tokenBefore;
    setAuthError("");
    try {
      const { data } = await axiosClient.get<SessionUser>("/user/me");
      if (!current()) return;
      setUser(data.user);
      setCanAdmin(data.canAdmin);
    updateOwnerLifecycleAccess(data.canAdmin === true);
      setAdminMode(data.adminMode);
      sessionStorage.setItem(ADMIN_MODE_KEY, data.adminMode ? "1" : "0");
    } catch (error) {
      if (!current()) return;
      updateOwnerLifecycleAccess(false);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        localStorage.removeItem("cryptoid_pi_session");
        sessionStorage.removeItem(PI_ACCESS_TOKEN_KEY);
        sessionStorage.removeItem(ADMIN_MODE_KEY);
        setUser(null); setCanAdmin(false); updateOwnerLifecycleAccess(false); setAdminMode(false);
        setAuthError("Pi session expired. Sign in again.");
      } else {
        setAuthError("Could not verify the Pi session. Please retry.");
      }
      throw error;
    } finally { if (current()) setAuthReady(true); }
  }, []);

  const onIncompletePaymentFound = useCallback(async (payment: PaymentDTO) => {
    pendingPayments.current.push(payment);
  }, []);

  const signInUser = useCallback(async (authResult: AuthResult, current: () => boolean) => {
    if (!current()) return;
    try {
      const { data } = await axiosClient.post<SessionUser>("/user/signin", { authResult }, { headers: { Authorization: `Bearer ${authResult.accessToken}` } });
      if (!current()) return;
      sessionStorage.setItem(PI_ACCESS_TOKEN_KEY, authResult.accessToken);
      localStorage.setItem("cryptoid_pi_session", "1");
      sessionStorage.removeItem("cryptoid_pi_auto_signed_out");
      setUser(data.user);
      setCanAdmin(data.canAdmin);
    updateOwnerLifecycleAccess(data.canAdmin === true);
      setAdminMode(false);
      sessionStorage.removeItem(ADMIN_MODE_KEY);
      setShowSignIn(false);
      setAuthError("");
      setAuthReady(true);
      for (const payment of pendingPayments.current.splice(0)) {
        if (!current()) break;
        try { await axiosClient.post("/payments/incomplete", { payment }); }
        catch (err) { console.error("Could not resume incomplete payment", err); }
      }
    } catch (err) {
      if (!current()) return;
      console.error("Error signing in:", err);
      throw err;
    }
  }, []);

  const signIn = useCallback(async () => {
    const generation = authLifecycle.current.generation;
    const lifecycleCurrent = () => authLifecycle.current.active && authLifecycle.current.generation === generation;
    if (signingIn.current || !lifecycleCurrent()) return;
    const attempt = beginPiAuthAttempt(sessionStorage);
    const tokenBefore = sessionStorage.getItem(PI_ACCESS_TOKEN_KEY);
    const current = () => lifecycleCurrent() && sessionStorage.getItem(PI_AUTH_ATTEMPT_KEY) === attempt
      && sessionStorage.getItem(PI_ACCESS_TOKEN_KEY) === tokenBefore;
    signingIn.current = true;
    setIsLoading(true);
    setAuthError("");
    try {
      const isPiBrowser = confirmedPiBrowser.current || await detectPiBrowser();
      if (!current()) return;

      // Pi Apps running inside Pi Browser must use the Browser SDK authentication
      // flow. Pi.signIn is the separate OAuth flow intended for ordinary browsers.
      if (isPiBrowser) {
        for (let attempt = 0; current() && typeof window.Pi?.authenticate !== 'function' && attempt < 25; attempt++) {
          await new Promise(resolve => window.setTimeout(resolve, 200));
        }
        if (!current()) return;
        if (typeof window.Pi?.authenticate !== 'function') throw new Error('Pi SDK unavailable');
        const authResult = await withPiAuthTimeout(() => window.Pi.authenticate(
          ["username", "payments", "wallet_address"],
          onIncompletePaymentFound,
        ));
        if (!current()) return;
        await signInUser(authResult, () => lifecycleCurrent() && sessionStorage.getItem(PI_AUTH_ATTEMPT_KEY) === attempt);
        return;
      }

      const configuration = getPiOAuthConfiguration(window.location.origin, shipSaveNetwork);
      if (!configuration || typeof window.Pi?.signIn !== "function") {
        setAuthError("Browser sign-in is not configured for this environment. Open this page in Pi Browser to sign in.");
        return;
      }
      const returnTo = safePiReturnPath(window.location.pathname);
      storePiOAuthTransaction(sessionStorage, configuration, attempt, returnTo);
      window.Pi.signIn({
        clientId: configuration.clientId,
        redirectUri: configuration.redirectUri,
        scopes: ["username", "wallet_address"],
        state: attempt,
      });
    } catch (err) {
      if (!current()) return;
      console.error("Error authenticating:", err);
      setAuthError("Could not sign in with Pi. Please retry.");
    } finally {
      if (lifecycleCurrent()) {
        signingIn.current = false;
        setIsLoading(false);
        setAuthReady(true);
      }
    }
  }, [onIncompletePaymentFound, signInUser]);

  useEffect(() => {
    let active = true;
    const start = async () => {
      const tokenBefore = sessionStorage.getItem(PI_ACCESS_TOKEN_KEY);
      const authAttempt = sessionStorage.getItem(PI_AUTH_ATTEMPT_KEY);
      const current = () => active && sessionStorage.getItem(PI_AUTH_ATTEMPT_KEY) === authAttempt && sessionStorage.getItem(PI_ACCESS_TOKEN_KEY) === tokenBefore;
      try {
        if (localStorage.getItem("cryptoid_pi_session") || sessionStorage.getItem(PI_ACCESS_TOKEN_KEY)) {
          try {
            const { data } = await axiosClient.get<SessionUser>("/user/me");
            if (!current()) return;
            setUser(data.user); setCanAdmin(data.canAdmin); setAdminMode(data.adminMode);
            updateOwnerLifecycleAccess(data.canAdmin === true);
            sessionStorage.setItem(ADMIN_MODE_KEY, data.adminMode ? "1" : "0");
            return;
          } catch (error) {
            if (!current()) return;
            updateOwnerLifecycleAccess(false);
            if (!axios.isAxiosError(error) || error.response?.status !== 401) {
              setAuthError("Could not verify the Pi session. Please retry.");
              return;
            }
            localStorage.removeItem("cryptoid_pi_session");
            sessionStorage.removeItem(PI_ACCESS_TOKEN_KEY);
            if (!autoSignIn) setAuthError("Pi session expired. Sign in again.");
          }
        }
        sessionStorage.removeItem(ADMIN_MODE_KEY);
        if (!autoSignIn) return;
        const inPiBrowser = await detectPiBrowser();
        if (!active || autoAttempted.current || sessionStorage.getItem("cryptoid_pi_auto_signed_out")) return;
        autoAttempted.current = true;
        if (inPiBrowser) { confirmedPiBrowser.current = true; await signIn(); }
      } finally {
        if (active) setAuthReady(true);
      }
    };
    void start();
    return () => { active = false; };
  }, [autoSignIn, signIn]);

  const signOut = useCallback(async () => {
    authLifecycle.current.generation++;
    signingIn.current = false;
    const attempt = beginPiAuthAttempt(sessionStorage);
    sessionStorage.removeItem(PI_OAUTH_STATE_KEY);
    const current = () => authLifecycle.current.active && sessionStorage.getItem(PI_AUTH_ATTEMPT_KEY) === attempt;
    updateOwnerLifecycleAccess(false);
    setIsLoading(true);
    try {
      await axiosClient.get("/user/signout");
      if (!current()) return;
      sessionStorage.setItem("cryptoid_pi_auto_signed_out", "1");
      setUser(null);
      setCanAdmin(false); updateOwnerLifecycleAccess(false);
      setAdminMode(false);
      sessionStorage.removeItem(ADMIN_MODE_KEY);
      sessionStorage.removeItem(PI_ACCESS_TOKEN_KEY);
      localStorage.removeItem("cryptoid_pi_session");
    } catch (err) {
      console.error("Error signing out:", err);
    } finally {
      if (current()) setIsLoading(false);
    }
  }, []);

  const setAdminPreview = useCallback(async (enabled: boolean) => {
    const generation = authLifecycle.current.generation, token = sessionStorage.getItem(PI_ACCESS_TOKEN_KEY), attempt = sessionStorage.getItem(PI_AUTH_ATTEMPT_KEY);
    const { data } = await axiosClient.post<{ canAdmin: boolean; adminMode: boolean }>("/user/admin-mode", { enabled });
    if (!authLifecycle.current.active || authLifecycle.current.generation !== generation
      || sessionStorage.getItem(PI_ACCESS_TOKEN_KEY) !== token || sessionStorage.getItem(PI_AUTH_ATTEMPT_KEY) !== attempt) return;
    setCanAdmin(data.canAdmin);
    updateOwnerLifecycleAccess(data.canAdmin === true);
    setAdminMode(data.adminMode);
    sessionStorage.setItem(ADMIN_MODE_KEY, data.adminMode ? "1" : "0");
  }, []);

  const closeSignIn = useCallback(() => {
    setShowSignIn(false);
  }, []);

  return {
    user,
    canAdmin,
    adminMode,
    setAdminPreview,
    isAuthenticated: Boolean(user),
    showSignIn,
    signIn,
    signOut,
    closeSignIn,
    requireAuth: () => setShowSignIn(true),
    isLoading,
    authReady,
    authError,
    refreshSession,
  };
};
