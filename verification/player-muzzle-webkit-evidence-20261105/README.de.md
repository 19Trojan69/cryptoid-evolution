# Geschützte Variante mit lokalem Mündungslicht

Der Nutzerhinweis „alles aktuell“ wird akzeptiert. Ein weiteres Geräteupdate ist
keine Voraussetzung. Die zuvor wiederholte Updateempfehlung war ein unnötiger
Umweg. Die White-Screen-Ursache und ein dauerhaft wirksamer Fix bleiben offen.

## Tatsächliche Änderung

Der getrennte Gerätebranch `codex/muzzle-scope-device-20261105` basiert exakt auf
dem bisherigen Deployment-Commit `b092f6462a623c3ad2c12e634963028d462c5fcf`.
Geprüfte Quelle: `9f3bf451c01d6976ea1a50342cdec1470e2e080b`.
Quellbaum: `a02d45e0f93946f866f36c6aae9c9e6451962aa0`.

Nur der virtuelle Schreibort von `--muzzle-light` wechselt vom Spieler-Unterbaum
zum vorhandenen einzelnen Mündungsblitz-Verbraucher. Der schon geprüfte Helper
wird wiederverwendet. Werte, Formel, vorhandene CSS-Regel, Knoten, Grafik, Ton,
Spiel- und Animationsuhren bleiben erhalten. Kein neuer Timer oder Listener.
Das vorhandene Fehlerjournal bleibt bytegleich. Im Bereitstellungseinstieg
wechselt genau ein Import. Alle fünf Runtime-Quellbäume und vercel.json bleiben
unverändert. Der Gerätebranch bleibt auf dem tatsächlich geprüften Commit.

Die frühere negative Chromium-Ressourcenentscheidung zum selben Helper bleibt
negativ. Die neue Prüfung betrifft den konkreten Vererbungsumfang und die
Integration mit dem später ergänzten Journal. Sie misst weder native Cache-
Einträge noch eine RAM-Ersparnis oder Smartphone-Stabilität. Der öffentlich
untersuchte WebKit-Cache ist ein Prüfpfad, keine bewiesene Absturzursache.

## Browser- und Auslieferungsbelege

CI: https://github.com/19Trojan69/cryptoid-evolution/actions/runs/42014925446
Beide Jobs sind tatsächlich abgeschlossen und erfolgreich: Chromium
127202954485, WebKit 127202953989. Engine-Versionen stehen in den Original-ZIPs
und den beiden Zusammenfassungen: Chromium 151.0.7922.34, WebKit 26.5, Linux.
Das sind keine physischen Smartphone- oder Pi-Browser-Tests.

Je drei bestehende kurze Zyklen (60/10/10 Sekunden), mit regulären Pausen,
Waffenmenü, bestätigtem Ausstieg und normalem Bericht. Alle ursprünglichen
Zeit-, Quellen-, Lücken- und Fehlerbedingungen bleiben unverändert. Acht feste
Lichtwerte stimmen in berechneter Darstellung und Geometrie überein; bestehende
Knoten sowie Animationsidentität und Timing bleiben erhalten. Tatsächlich
berechnete Variablenreichweite: Root 7 von 7 Elementen, lokaler Verbraucher
1 von 7. Das zählt keine ausgeführten Style-Neuberechnungen oder Cacheeinträge.
Die früheren zehn Zustands- und zwölf Fehlerfälle wurden nicht erneut gestartet.
Die beendete Simulatorserie wurde nicht wieder aufgenommen.

Neue geschützte Vorschau: `dpl_GqYVUaFSrSwUinbqrZGk8uDP7qQR`, READY,
Preview / target:null, Team `team_KzJmtl0QyoYZAOu5RQKsAR2i`, Projekt
`prj_JpvzU9ZS8bFkn9jZgE51Gct8TZpF`.
https://cryptoid-evolution-testnet-dh40j3ucm-19-trojan69.vercel.app/

Ein temporärer Zugriffslink wurde erfolgreich geöffnet. Sein geheimer Parameter
wird nicht archiviert. Nur für den neuen Branch wurde die zusätzliche Vercel-
Feedbackleiste deaktiviert. Zugriffsschutz bleibt aktiv. Produktion, öffentliches
Testnet und vorheriger Diagnosealias behalten ihre bisherigen Deployments;
konkrete IDs stehen in `hosted/verification.json`. Kein Merge, keine Promotion.

HTML und Metadaten HTTP 200; HTML 6.325 UTF-8-Bytes, SHA256
`ed15c50557dda6946fb5cb23989ed1c5ea6bf349979a92726a48db8d6e51da1d`,
exakt der Build-Metadatenhash. Drei ausgelieferte Stoppuhr-Dateien stimmen mit
ihren Metadaten überein. Journal-Quell-/Transformationshashes und der kompilierte
Controller stimmen mit beiden CI-Engines überein. Die vollständigen Metadaten
sind nicht identisch: Zwei generierte Builder-Digests enthalten absolute
Checkout-Pfade und unterscheiden sich zwischen GitHub und Vercel. Diese
Abweichungen werden in `hosted/delivery-proof.json` ausdrücklich dokumentiert.

## Tatsächlich abgeschlossener gehosteter Ablauf

Frischer kurzer Cloud-Browserlauf auf genau diesem bereitgestellten Stand:
Start angehalten 00:00; manuelle Pause 00:39 und unverändert gehalten;
manuelles Fortsetzen, 00:55 laufend; Waffenmenü bei 00:59 pausiert;
Countdown, danach 01:17 laufend; regulärer Home-Dialog, bestätigter Ausstieg;
01:22 beendet; normaler UI-Download erfolgreich. Originalexport:
`hosted/normal-report.json`, 8.002 Bytes, SHA256
`7ef0ebe04f3c1480cfafaa83edc442c56aeb8f5b75740c20099cc949b35218ad`.

`criticalMatchesLatestStopwatch` ist true. Journal- und Kurzberichtsuhr entsprechen
der Stoppuhr vollständig: ID `9f3bf451-1793877157644-1`, Quellcommit wie oben,
mode `ended`, elapsedMs `82226.19999998808`, unobservedGaps 0.
Der Ressourcenpunkt ist diesem Lauf zugeordnet: Audio 6.925.568 Buffer-Bytes,
0 Clock-Stalls, 3 Wiederaufnahmen, Canvas 0 registrierte Effekte, 0 Cache-Bytes,
4 Surface-Bytes, 0 Fehler. Dies ist der letzte begrenzte Punkt, kein nativer
Speicher- oder Spitzenlastnachweis. Journal: zwei normale popstate-Ereignisse;
keine error-/unhandledrejection-Einträge im Journal oder Kurzbericht.
Fehlende Einträge beweisen weiterhin keine native Fehlerfreiheit.

## Nächster gezielter Gerätefall

Ein einzelner Lauf mit dem tatsächlich veränderten Kandidaten im Pi Browser:
Testszene vorbereiten, öffnen, Fortsetzen. Vollaufzeichnung bleibt aus,
Testschutz wie bisher an. Danach regulär aussteigen und den letzten Bericht
vorbereiten und speichern. Bei White Screen dieselbe Adresse erneut öffnen
und vor einem neuen Start den Bericht speichern. Den exportierten Bericht
auswerten, bevor ein weiterer unveränderter Lauf verlangt wird. Eine erfolgreiche
kurze Geräteprüfung allein ist kein dauerhafter White-Screen-Fix.

Die Original-CI-ZIPs unter `artifacts/` sind unveränderte Downloadbytes mit
GitHub-SHA256 in `ci-receipt.json`. `manifest.json` enthält die archivierten
Dateihashes. Keine Zugangsdaten oder geheimen Freigabeparameter sind enthalten.
