import { useCallback, useEffect, useRef, useState } from "react";
import { axiosClient, PI_ACCESS_TOKEN_KEY } from "../lib/axiosClient";
import type { AuthResult, PaymentDTO, SessionUser, User } from "../types/pi";
import { ADMIN_MODE_KEY } from "../pages/shipFleet";
import { createPiOAuthState, PI_OAUTH_CLIENT_ID, PI_OAUTH_ORIGIN, PI_OAUTH_REDIRECT_URI, PI_OAUTH_STATE_KEY } from "../config/piOAuth";
import axios from "axios";

const detectPiBrowser = async () => {
  try {
    if (typeof window.Pi?.getPiHostAppInfo === "function") {
      const timeout = new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 1500));
      const hostInfo = await Promise.race([window.Pi.getPiHostAppInfo(), timeout]);
      if (hostInfo?.hostApp === "pi-browser") return true;
    }
  } catch (err) {
    console.warn("Could not query Pi Browser host info", err);
  }

  const userAgent = navigator.userAgent.toLowerCase();
  return (
    userAgent.includes("pibrowser") ||
    userAgent.includes("pi-browser")
  );
};

export const useAuth = () => {
  const pendingPayments = useRef<PaymentDTO[]>([]);
  const signingIn = useRef(false);
  const autoAttempted = useRef(false);
  const [user, setUser] = useState<User | null>(null);
  const [canAdmin, setCanAdmin] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState("");

  const refreshSession = useCallback(async () => {
    setAuthError("");
    try {
      const { data } = await axiosClient.get<SessionUser>("/user/me");
      setUser(data.user);
      setCanAdmin(data.canAdmin);
      setAdminMode(data.adminMode);
      sessionStorage.setItem(ADMIN_MODE_KEY, data.adminMode ? "1" : "0");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        localStorage.removeItem("cryptoid_pi_session");
        sessionStorage.removeItem(PI_ACCESS_TOKEN_KEY);
        sessionStorage.removeItem(ADMIN_MODE_KEY);
        setUser(null); setCanAdmin(false); setAdminMode(false);
        setAuthError("Die Pi-Anmeldung ist abgelaufen. Bitte erneut anmelden.");
      } else {
        setAuthError("Die Pi-Sitzung konnte nicht geprüft werden. Bitte erneut versuchen.");
      }
      throw error;
    } finally { setAuthReady(true); }
  }, []);

  const onIncompletePaymentFound = useCallback(async (payment: PaymentDTO) => {
    pendingPayments.current.push(payment);
  }, []);

  const signInUser = useCallback(async (authResult: AuthResult) => {
    sessionStorage.setItem(PI_ACCESS_TOKEN_KEY, authResult.accessToken);
    try {
      const { data } = await axiosClient.post<SessionUser>("/user/signin", { authResult });
      localStorage.setItem("cryptoid_pi_session", "1");
      sessionStorage.removeItem("cryptoid_pi_auto_signed_out");
      setUser(data.user);
      setCanAdmin(data.canAdmin);
      setAdminMode(false);
      sessionStorage.removeItem(ADMIN_MODE_KEY);
      setShowSignIn(false);
      setAuthError("");
      setAuthReady(true);
      for (const payment of pendingPayments.current.splice(0)) {
        try { await axiosClient.post("/payments/incomplete", { payment }); }
        catch (err) { console.error("Could not resume incomplete payment", err); }
      }
    } catch (err) {
      sessionStorage.removeItem(PI_ACCESS_TOKEN_KEY);
      console.error("Error signing in:", err);
      throw err;
    }
  }, []);

  const signIn = useCallback(async () => {
    if (signingIn.current) return;
    signingIn.current = true;
    setIsLoading(true);
    setAuthError("");
    try {
      const isPiBrowser = await detectPiBrowser();
      if (window.location.pathname === "/admin") sessionStorage.setItem("cryptoid_pi_return_to", "/admin");

      // Pi Apps running inside Pi Browser must use the Browser SDK authentication
      // flow. Pi.signIn is the separate OAuth flow intended for ordinary browsers.
      if (isPiBrowser) {
        const authResult = await window.Pi.authenticate(
          ["username", "payments", "wallet_address"],
          onIncompletePaymentFound,
        );
        await signInUser(authResult);
        return;
      }

      if (window.location.origin !== PI_OAUTH_ORIGIN && !["localhost", "127.0.0.1"].includes(window.location.hostname)) {
        window.location.assign(`${PI_OAUTH_ORIGIN}/?pi_signin=1${window.location.pathname === "/admin" ? "&return_to=admin" : ""}`);
        return;
      }

      if (typeof window.Pi.signIn === "function") {
        const state = createPiOAuthState();
        sessionStorage.setItem(PI_OAUTH_STATE_KEY, state);
        window.Pi.signIn({
          clientId: PI_OAUTH_CLIENT_ID,
          redirectUri: PI_OAUTH_REDIRECT_URI,
          scopes: ["username", "wallet_address"],
          state,
        });
        return;
      }

      throw new Error("Pi sign-in is unavailable in this browser.");
    } catch (err) {
      console.error("Error authenticating:", err);
      setAuthError("Die Pi-Anmeldung konnte nicht abgeschlossen werden. Bitte erneut versuchen.");
    } finally {
      signingIn.current = false;
      setIsLoading(false);
    }
  }, [onIncompletePaymentFound, signInUser]);

  useEffect(() => {
    let active = true;
    const start = async () => {
      try {
        if (localStorage.getItem("cryptoid_pi_session") || sessionStorage.getItem(PI_ACCESS_TOKEN_KEY)) {
          try {
            const { data } = await axiosClient.get<SessionUser>("/user/me");
            if (!active) return;
            setUser(data.user); setCanAdmin(data.canAdmin); setAdminMode(data.adminMode);
            sessionStorage.setItem(ADMIN_MODE_KEY, data.adminMode ? "1" : "0");
            return;
          } catch (error) {
            if (!active) return;
            if (!axios.isAxiosError(error) || error.response?.status !== 401) {
              setAuthError("Die Pi-Sitzung konnte nicht geprüft werden. Bitte erneut versuchen.");
              return;
            }
            localStorage.removeItem("cryptoid_pi_session");
            sessionStorage.removeItem(PI_ACCESS_TOKEN_KEY);
          }
        }
        sessionStorage.removeItem(ADMIN_MODE_KEY);
        const inPiBrowser = await detectPiBrowser();
        if (!active || autoAttempted.current || sessionStorage.getItem("cryptoid_pi_auto_signed_out")) return;
        autoAttempted.current = true;
        if (inPiBrowser) await signIn();
      } finally {
        if (active) setAuthReady(true);
      }
    };
    void start();
    return () => { active = false; };
  }, [signIn]);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await axiosClient.get("/user/signout");
      sessionStorage.setItem("cryptoid_pi_auto_signed_out", "1");
      setUser(null);
      setCanAdmin(false);
      setAdminMode(false);
      sessionStorage.removeItem(ADMIN_MODE_KEY);
      sessionStorage.removeItem(PI_ACCESS_TOKEN_KEY);
      localStorage.removeItem("cryptoid_pi_session");
    } catch (err) {
      console.error("Error signing out:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setAdminPreview = useCallback(async (enabled: boolean) => {
    const { data } = await axiosClient.post<{ canAdmin: boolean; adminMode: boolean }>("/user/admin-mode", { enabled });
    setCanAdmin(data.canAdmin);
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
