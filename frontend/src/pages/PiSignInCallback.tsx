import { useEffect, useRef, useState } from "react";
import { axiosClient } from "../lib/axiosClient";
import { PI_OAUTH_STATE_KEY } from "../config/piOAuth";
import type { User } from "../types/pi";

type CallbackStatus = "working" | "success" | "error";

const PiSignInCallback = () => {
  const started = useRef(false);
  const [status, setStatus] = useState<CallbackStatus>("working");
  const [message, setMessage] = useState("Pi-Anmeldung wird sicher abgeschlossen …");

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
        throw new Error("Die sichere Anmeldeprüfung ist fehlgeschlagen. Bitte starte die Pi-Anmeldung erneut.");
      }
      if (error) {
        throw new Error(error === "access_denied" ? "Die Pi-Anmeldung wurde nicht bestätigt." : "Die Pi-Anmeldung wurde abgebrochen oder ist abgelaufen.");
      }
      if (!accessToken) {
        throw new Error("Pi hat kein gültiges Anmeldetoken zurückgegeben.");
      }

      await axiosClient.post<{ user: User }>("/user/signin", { authResult: { accessToken } });
      localStorage.setItem("cryptoid_pi_session", "1");

      if (!active) return;
      setStatus("success");
      setMessage("Anmeldung erfolgreich. Cryptoid Evolution wird geöffnet …");
      window.setTimeout(() => window.location.replace("/"), 500);
    };

    completeSignIn().catch((error: unknown) => {
      if (!active) return;
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Die Pi-Anmeldung konnte nicht abgeschlossen werden.");
    });

    return () => { active = false; };
  }, []);

  return (
    <main className="app-shell landing-shell">
      <div className="signin-overlay">
        <section className="signin-modal" role="status" aria-live="polite">
          <p className="eyebrow">PI SIGN-IN</p>
          <h1>{status === "error" ? "Anmeldung fehlgeschlagen" : "Pi-Konto verbinden"}</h1>
          <p>{message}</p>
          {status === "error" ? <a className="button button-primary" href="/">Zurück zur Startseite</a> : null}
        </section>
      </div>
    </main>
  );
};

export default PiSignInCallback;
