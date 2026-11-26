import { useEffect, useState } from "react";
import { axiosClient, PI_ACCESS_TOKEN_KEY } from "../lib/axiosClient";
import { getPiOAuthConfiguration, PI_AUTH_ATTEMPT_KEY, PI_OAUTH_STATE_KEY, validatePiOAuthTransaction } from "../config/piOAuth";
import type { User } from "../types/pi";
import { ADMIN_MODE_KEY, shipSaveNetwork } from "./shipFleet";

import { useLocale } from "../i18n";

type CallbackStatus = "working" | "success" | "error";

const PiSignInCallback = () => {
  const { t } = useLocale();
  const [status, setStatus] = useState<CallbackStatus>("working");
  const [message, setMessage] = useState("Completing secure Pi sign-in…");

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    let pendingAttempt: string | null = null;
    const current = () => active && (pendingAttempt === null || sessionStorage.getItem(PI_AUTH_ATTEMPT_KEY) === pendingAttempt);
    const completeSignIn = async () => {
      // React StrictMode can retire the first setup before work starts. The next
      // setup may consume the same transaction; it must not be abandoned by a ref.
      await Promise.resolve();
      if (!active) return;
      const params = new URLSearchParams(window.location.hash.slice(1));
      history.replaceState(null, "", window.location.pathname);
      const configuration = getPiOAuthConfiguration(window.location.origin, shipSaveNetwork);
      if (!configuration) throw new Error("Browser sign-in is not configured for this environment. Open this page in Pi Browser to sign in.");
      const transaction = validatePiOAuthTransaction(sessionStorage.getItem(PI_OAUTH_STATE_KEY), params.get("state"), configuration,
        sessionStorage.getItem(PI_AUTH_ATTEMPT_KEY));
      if (!transaction || params.getAll("state").length !== 1 || params.getAll("access_token").length > 1 || params.getAll("error").length > 1) {
        throw new Error("Sign-in verification failed. Start Pi sign-in again.");
      }
      pendingAttempt = transaction.state;
      sessionStorage.removeItem(PI_OAUTH_STATE_KEY);
      const error = params.get("error");
      if (error) throw new Error(error === "access_denied" ? "Pi sign-in was not approved." : "Pi sign-in was cancelled or expired.");
      const accessToken = params.get("access_token");
      if (!accessToken || accessToken.length > 8192 || /\s/.test(accessToken)) throw new Error("Pi returned no valid sign-in token.");
      const tokenBefore = sessionStorage.getItem(PI_ACCESS_TOKEN_KEY);
      await axiosClient.post<{ user: User }>("/user/signin", { authResult: { accessToken } }, {
        headers: { Authorization: `Bearer ${accessToken}` }, signal: controller.signal,
      });
      if (!current() || sessionStorage.getItem(PI_ACCESS_TOKEN_KEY) !== tokenBefore) return;
      sessionStorage.setItem(PI_ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem("cryptoid_pi_session", "1");
      sessionStorage.removeItem("cryptoid_pi_auto_signed_out");
      sessionStorage.removeItem(ADMIN_MODE_KEY);
      sessionStorage.removeItem("cryptoid_pi_return_to");
      setStatus("success");
      setMessage("Signed in. Opening Cryptoid Evolution…");
      window.location.replace(transaction.returnTo);
    };
    void completeSignIn().catch((error: unknown) => {
      if (!current()) return;
      setStatus("error");
      const knownErrors = new Set(["Browser sign-in is not configured for this environment. Open this page in Pi Browser to sign in.", "Sign-in verification failed. Start Pi sign-in again.", "Pi sign-in was not approved.", "Pi sign-in was cancelled or expired.", "Pi returned no valid sign-in token."]);
      setMessage(error instanceof Error && knownErrors.has(error.message) ? error.message : "Could not sign in with Pi. Please retry.");
    });
    return () => { active = false; controller.abort(); };
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
