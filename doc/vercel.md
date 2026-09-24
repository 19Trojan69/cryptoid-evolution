# Cryptoid Evolution auf Vercel

## Spieloberfläche

Dieses Repository wird bei Vercel aus dem **Repository-Stammverzeichnis** importiert. `vercel.json` installiert die Frontend-Abhängigkeiten, baut `frontend/dist` und leitet Spielrouten wie `/game` auf die React-Anwendung weiter. Das Stammverzeichnis ist wichtig: Das Frontend liest sowohl den Hangar-Katalog aus `backend/src/hangarCatalog.ts` als auch die Nutzungsbedingungen aus `TERMS_OF_SERVICE.md`.

1. Repository `19Trojan69/cryptoid-evolution` als neues Vercel-Projekt importieren.
2. **Root Directory** auf `./` lassen. Build-, Install- und Output-Einstellungen aus `vercel.json` übernehmen.
3. Für eine Vorschau zunächst ohne `VITE_BACKEND_URL` bauen; das Arcade-Spiel funktioniert lokal im Browser. Anmeldung, Pi-Zahlungen, der serverseitige Hangar und die globale Bestenliste sind dann nicht verfügbar.
4. Für diese Online-Funktionen zunächst eine erreichbare HTTPS-API mit MongoDB einrichten und in den Vercel-Umgebungsvariablen `VITE_BACKEND_URL` auf deren HTTPS-Adresse setzen. Anschließend neu deployen. Die API muss für die Vercel-Adresse CORS mit Anmeldedaten zulassen und Sitzungs-Cookies korrekt ausstellen.

**Wichtig:** `backend/src/index.ts` ist derzeit für einen dauerhaft laufenden Server mit MongoDB und beschreibbarem Log-Verzeichnis gebaut. Diese API wird durch die Frontend-Konfiguration nicht als Vercel Function bereitgestellt. Ohne eine gesondert bereitgestellte API dürfen Pi-Käufe und Bestenlisten nicht als betriebsbereit beworben werden. `PI_API_KEY`, Datenbankzugang und `SESSION_SECRET` gehören nur in die serverseitigen Umgebungsvariablen, niemals in `VITE_`-Variablen oder Git.

Der Text unter „Nutzungsbedingungen / Terms of Service“ ist im Repository ausdrücklich als **Entwurf** gekennzeichnet. Vor einer öffentlichen Freigabe müssen die Angaben und die Zahlungsregeln rechtlich geprüft werden.
