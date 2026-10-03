import { useEffect, useRef, useState } from "react";
import { axiosClient, PI_ACCESS_TOKEN_KEY } from "../lib/axiosClient";
import { PI_OAUTH_STATE_KEY } from "../config/piOAuth";
import type { User } from "../types/pi";
import { ADMIN_MODE_KEY } from "./shipFleet";

import { useLocale } from "../i18n";

type CallbackStatus = "working" | "success" | "error";

const PiSignInCallback = () => {
  const { t } = useLocale();
  const started = useRef(false);
  const [status, setStatus] = useState<CallbackStatus>("working");
  const [message, setMessage] = useState("Completing secure Pi sign-in…");

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let active = true;

    const completeSignIn = async () => {
      const params = new URLSearchParams(window.location.hash.slice(1));
      const expectedState = sessionStorage.getItem(PI_OAUTH_STATE_KEY);
      const returnedState = params.get("state");
      const error = params.get("error");
      const accessToken = params.get("access_token");

      history.replaceState(null, "", window.location.pathname);
      sessionStorage.removeItem(PI_OAUTH_STATE_KEY);

      if (!expectedState || returnedState !== expectedState) {
        throw new Error("Sign-in verification failed. Start Pi sign-in again.");
      }
      if (error) {
        throw new Error(error === "access_denied" ? "Pi sign-in was not approved." : "Pi sign-in was cancelled or expired.");
      }
      if (!accessToken) {
        throw new Error("Pi returned no valid sign-in token.");
      }

      sessionStorage.setItem(PI_ACCESS_TOKEN_KEY, accessToken);
      await axiosClient.post<{ user: User }>("/user/signin", { authResult: { accessToken } });
      localStorage.setItem("cryptoid_pi_session", "1");
      sessionStorage.removeItem(ADMIN_MODE_KEY);

      if (!active) return;
      setStatus("success");
      setMessage("Signed in. Opening Cryptoid Evolution…");
      const returnTo = sessionStorage.getItem("cryptoid_pi_return_to") === "/admin" ? "/admin" : "/";
      sessionStorage.removeItem("cryptoid_pi_return_to");
      window.setTimeout(() => window.location.replace(returnTo), 500);
    };

    completeSignIn().catch((error: unknown) => {
      sessionStorage.removeItem(PI_ACCESS_TOKEN_KEY);
      if (!active) return;
      setStatus("error");
      const knownErrors = new Set(["Sign-in verification failed. Start Pi sign-in again.", "Pi sign-in was not approved.", "Pi sign-in was cancelled or expired.", "Pi returned no valid sign-in token."]);
      setMessage(error instanceof Error && knownErrors.has(error.message) ? error.message : "Could not sign in with Pi. Please retry.");
    });

    return () => { active = false; };
  }, []);

  return (
    <main className="app-shell landing-shell">
      <div className="signin-overlay">
        <section className="signin-modal" role="status" aria-live="polite">
          <p className="eyebrow">{t("Sign in with Pi")}</p>
          <h1>{status === "error" ? t("Sign-in failed") : t("Connect your Pi wallet")}</h1>
          <p>{t(message)}</p>
          {status === "error" ? <a className="button button-primary" href="/">{t("Go home")}</a> : null}
        </section>
      </div>
    </main>
  );
};

export default PiSignInCallback;
