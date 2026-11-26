# Cryptoid Evolution auf Vercel

Stand: 25. November 2026. Diese Beschreibung ersetzt die ältere Annahme einer ausschließlich statischen Frontend-Bereitstellung.

Das Repository wird aus dem Stammverzeichnis gebaut. `vercel.json` installiert Frontend und Backend, führt die Backend-Tests und den vollständigen Frontend-Build aus und stellt `frontend/dist` bereit. Die Vercel Function `api/index.ts` lädt `backend/src/apiGateway.ts` und die Express-Anwendung aus `backend/src/index.ts`. `/api/*` wird an diese Funktion weitergeleitet; weitere Spielrouten werden durch die vorhandenen Rewrite-Regeln aufgelöst. `backend/src/index.ts` verwendet unter Vercel stdout statt eines beschreibbaren Log-Verzeichnisses.

Die API benötigt eine erreichbare MongoDB und die passenden serverseitigen Einstellungen. Testnet-Routing kann bestimmte Anfragen an den vorhandenen API-Dienst weitergeben; daher müssen Gateway, Sitzungen, App-Zugangsdaten und Netzwerk gemeinsam geprüft werden. Ein erfolgreicher Frontend-Build allein belegt keinen funktionsfähigen Login, Checkout oder NFT-Ausgabeweg.

## Konfiguration und Prüfung

1. Root Directory auf `./` lassen und die Build-, Install- und Output-Einstellungen aus der für das jeweilige Projekt gültigen `vercel.json` verwenden.
2. Den tatsächlich veröffentlichten Commit und die projektbezogene Konfiguration für Mainnet und Testnet getrennt ermitteln. Der Default-Branch ist kein Nachweis des Live-Stands.
3. API, MongoDB, Sitzungsgeheimnis und die jeweils richtige Pi-App-/Netzwerkzuordnung serverseitig konfigurieren. Bestehende Produktionswerte nicht in ein anderes Projekt kopieren.
4. Bei gleicher Herkunft nutzt die Anwendung die bestehende `/api`-Anbindung. `VITE_BACKEND_URL` nur setzen, wenn eine abweichende, ausdrücklich vorgesehene API-Herkunft verwendet wird; CORS und Sitzungs-Cookies müssen dann dazu passen.
5. Tests und Typprüfungen ausführen: `npm test --prefix backend` und `npm run build --prefix frontend`. Diese Befehle erzeugen kein Deployment. Ein Hosting- oder SDK-Erfolg ersetzt keine reale Zahlungsabnahme oder Prüfung auf physischen Geräten.

`PI_API_KEY`, Datenbankzugang, `SESSION_SECRET` und sonstige Geheimnisse gehören ausschließlich in serverseitige Einstellungen. Niemals in `VITE_`-Variablen, Browserantworten oder Git speichern.

## Freigabe

Der Betrieb als Mainnet-Vorschau ist von der Aktivierung echter Käufe getrennt. Ein API-Schlüssel, eine Wallet-Adresse, eine erreichbare Blockchain und eine gespeicherte Betreiberfreigabe reichen jeweils allein nicht aus. Checkout-Nachweise, erforderliche externe Pi-Freigaben und die Bereitschaft aller enthaltenen Leistungen müssen zum aktuellen App-, Netzwerk- und Katalogstand passen. Bei fehlender Evidenz bleibt die serverseitige Sperre bestehen.

Der aktuelle Arbeitsauftrag erlaubt weder automatische Deployments oder Merges noch echte Zahlungen, Nachrichten oder NFT-Ausgaben. Vor einem späteren Push muss die automatische Vercel-Bereitstellung für den Arbeitsbranch wirksam ausgeschlossen sein. Ein PR dient der Prüfung und ist keine Freigabe der veröffentlichten Anwendung.

Offizielle Voraussetzungen und noch zu belegende Portalwerte: [`../docs/pi-next-readiness-20261125.md`](../docs/pi-next-readiness-20261125.md).
