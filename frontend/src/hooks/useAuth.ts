import { useCallback, useEffect, useRef, useState } from "react";
import { axiosClient } from "../lib/axiosClient";
import type { AuthResult, PaymentDTO, SessionUser, User } from "../types/pi";
import { ADMIN_MODE_KEY } from "../pages/shipFleet";
import { createPiOAuthState, PI_OAUTH_CLIENT_ID, PI_OAUTH_ORIGIN, PI_OAUTH_REDIRECT_URI, PI_OAUTH_STATE_KEY } from "../config/piOAuth";

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
  const referrer = document.referrer.toLowerCase();

  return (
    userAgent.includes("pibrowser") ||
    userAgent.includes("pi-browser") ||
    referrer.includes("minepi.com") ||
    referrer.includes("pi.app")
  );
};

export const useAuth = () => {
  const pendingPayments = useRef<PaymentDTO[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [canAdmin, setCanAdmin] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("cryptoid_pi_session")) {
      sessionStorage.removeItem(ADMIN_MODE_KEY);
      return;
    }

    let active = true;
    axiosClient.get<SessionUser>("/user/me")
      .then(({ data }) => { if (active) { setUser(data.user); setCanAdmin(data.canAdmin); setAdminMode(data.adminMode); sessionStorage.setItem(ADMIN_MODE_KEY, data.adminMode ? "1" : "0"); } })
      .catch(() => { localStorage.removeItem("cryptoid_pi_session"); sessionStorage.removeItem(ADMIN_MODE_KEY); });

    return () => { active = false; };
  }, []);

  const onIncompletePaymentFound = useCallback(async (payment: PaymentDTO) => {
    pendingPayments.current.push(payment);
  }, []);

  const signInUser = useCallback(async (authResult: AuthResult) => {
    try {
      const { data } = await axiosClient.post<SessionUser>("/user/signin", { authResult });
      localStorage.setItem("cryptoid_pi_session", "1");
      setUser(data.user);
      setCanAdmin(data.canAdmin);
      setAdminMode(false);
      sessionStorage.removeItem(ADMIN_MODE_KEY);
      setShowSignIn(false);
      for (const payment of pendingPayments.current.splice(0)) {
        try { await axiosClient.post("/payments/incomplete", { payment }); }
        catch (err) { console.error("Could not resume incomplete payment", err); }
      }
    } catch (err) {
      console.error("Error signing in:", err);
      throw err;
    }
  }, []);

  const signIn = useCallback(async () => {
    setIsLoading(true);
    try {
      const isPiBrowser = await detectPiBrowser();

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
        window.location.assign(`${PI_OAUTH_ORIGIN}/?pi_signin=1`);
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
    } finally {
      setIsLoading(false);
    }
  }, [onIncompletePaymentFound, signInUser]);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await axiosClient.get("/user/signout");
      setUser(null);
      setCanAdmin(false);
      setAdminMode(false);
      sessionStorage.removeItem(ADMIN_MODE_KEY);
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
  };
};
