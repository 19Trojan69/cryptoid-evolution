# Testnet-Veröffentlichung mit Rücksicherung – 19. Oktober 2026

Der Nutzer hat die Testnet-Veröffentlichung samt Rücksicherung ausdrücklich
freigegeben: „Ja, dann machen wir das bitte mit einer Rückabsicherung, dass ich
wieder zurücksetzen kann.“

## Veröffentlichter Stand

- URL: https://cryptoid-evolution-testnet.vercel.app
- Projekt: `cryptoid-evolution-testnet` (`prj_JpvzU9ZS8bFkn9jZgE51Gct8TZpF`).
- Quellstand: `66eb357cc08a6b5f9b32a9242d6875ed475532fa`.
- Deployment: `dpl_8h9mgxiRDUerhJr4PyCPTiaPQgR4`, Status READY.
- Die Vercel-Umgebung heißt innerhalb dieses separaten Testnet-Projekts
  „production“. Das ist keine Mainnet-Veröffentlichung.
- Der gesamte Quellbaum entspricht exakt dem lokal geprüften Stand
  `92f392e2efe5608a7d589e2d14c2593a2626c5bb`; Tree: `cec8743f06146e3b2e1d292219917e9ff24dae8d`.
- Laufzeitänderung gegenüber f24 ausschließlich in CanvasEffects.tsx.
  Spielregeln, HUD, Artwork, Sound, Login, Käufe und Spielstände wurden nicht
  bearbeitet. Es wurden keine Datenbankmigrationen oder Käufe ausgeführt.

## Gesicherte Rücksetzversion

- Bisheriger Quellstand: `f24ca60cb87d9442edf683f04b34b73670b56f45`.
- Separater GitHub-Branch:
  [backup/testnet-before-canvas-surface-reuse-20261019](https://github.com/19Trojan69/cryptoid-evolution/tree/backup/testnet-before-canvas-surface-reuse-20261019).
  Der Vergleich mit f24 ergab exakt denselben Commit.
- Bisheriges Deployment: `dpl_Dx7LdXMRd1YJ4CnxfrfW8Q2fzFPw`.
  Nach der Veröffentlichung erneut als READY bestätigt; nicht gelöscht.
- [Bisheriges Deployment in Vercel öffnen](https://vercel.com/19-trojan69/cryptoid-evolution-testnet/Dx7LdXMRd1YJ4CnxfrfW8Q2fzFPw).

## So wird zurückgesetzt

Im Vercel-Projekt **cryptoid-evolution-testnet** zum bisherigen Deployment
`Dx7LdXMRd1YJ4CnxfrfW8Q2fzFPw` wechseln und die dort verfügbare
Rollback-Funktion verwenden. Deren Verfügbarkeit in der aktuellen Oberfläche
wurde nicht geprüft: Die Verbindung verweigerte die Rollback-Kandidatenliste
mit HTTP 403. Es wird daher keine geprüfte Ein-Klick-Rücksetzung behauptet.

Der konkrete alternative Rückweg ist, genau das erhaltene alte Deployment
erneut als Production-Deployment **dieses Testnet-Projekts** bereitzustellen,
ohne den neuesten Branch-Commit zu verwenden. Dieser Bereitstellungsweg wurde
für die neue Veröffentlichung erfolgreich verwendet. Der folgende Request
beschreibt die alte, unveränderte Quelle; er wurde dokumentiert, nicht ausgeführt:

```json
{
  "name": "cryptoid-evolution-testnet",
  "project": "prj_JpvzU9ZS8bFkn9jZgE51Gct8TZpF",
  "deploymentId": "dpl_Dx7LdXMRd1YJ4CnxfrfW8Q2fzFPw",
  "target": "production",
  "withLatestCommit": false
}
```

Danach den offiziellen Testnet-Alias auf die alte Quelle f24 prüfen.
Mainnet bleibt ausgeschlossen. Alternativ kann der gesicherte GitHub-Branch
als Quelle für einen neuen Testnet-Build dienen. „Testnet auf f24 zurücksetzen“
bezeichnet damit einen eindeutig festgelegten Rücksetzauftrag.

## Abgeschlossene Prüfungen

- 275 exakte native Rastervergleiche, Ressourcen-/Aufräumtests und der vollständige
  Frontend-Build waren vor der Veröffentlichung bestanden.
- Das neue Testnet-Deployment wurde aus dem geprüften Commit mit bestehenden
  Production-Einstellungen des Testnet-Projekts gebaut und als READY bestätigt.
- Der offizielle Testnet-Alias zeigt auf das neue Deployment.
- Öffentliche Startseite: HTTP 200. Live-GamePage stimmt mit dem lokalen Build
  unter denselben Release-Flags überein, wenn ausschließlich importierte
  Asset-Hashnamen normalisiert werden. Die ursprüngliche Abweichung zum
  allgemeinen lokalen Build entfällt mit `VITE_CRYPTOID_DIAGNOSTICS=0`.
- Die ausgelieferte CSS-Datei stimmt bytegenau mit dem geprüften Build überein.
- Katalog: HTTP 200, Backend-Markierung `testnet-catalog`.
- Anonymer Adminstatus: HTTP 401, kein Adminzugriff.
- Der alte öffentliche Diagnoseexport leitet weiter nach Home: HTTP 307.
- Mainnet-Alias vor/nach Veröffentlichung unverändert auf
  `dpl_4hwbUd5xYqetnh5VHfFZ7H6pxwhe`.

## Grenzen und nächster Test

Dies bestätigt Bereitstellung und die beschriebenen Prüfungen. Es gibt weiterhin
keine physische iPhone-/WebKit-Speicher- oder FPS-Prüfung und keinen Beleg, dass
der Whitescreen vollständig behoben ist. Der geschützte Vorschau-HTTP-Zugriff
war wegen Vercel-Berechtigungen nicht möglich; öffentlicher Testnet-Zugriff und
die genannten Live-Prüfungen funktionierten. Deployment Protection blieb aktiv.

Als nächster Gerätetest genügt zunächst der gezielte Bereich um den vierten
Boss (intern Sector 40 / bossId 4) und den Übergang zur Bonusrunde, soweit über
den normalen Spielfortschritt erreichbar. Kein zusätzlicher vollständiger
Durchlauf ausschließlich zum erneuten Sammeln derselben bisherigen Zähler.
