# Testnet veröffentlicht, anschließend Reaktoränderung geprüft

## Öffentlicher Stand

https://cryptoid-evolution-testnet.vercel.app/ ist READY auf
Deployment dpl_BcDkVkATpUrCRDNB5zYcQ8jkEqBR,
Commit d005c99b03dfdfe9433e300ac1add26a38a74eb9,
Baum a69893d6f703bfc0f39c50e1c03bffdd3ed81df2.
Die Veröffentlichung ist ausschließlich für das bestehende Testnet-Projekt
prj_JpvzU9ZS8bFkn9jZgE51Gct8TZpF im Team
team_KzJmtl0QyoYZAOu5RQKsAR2i erfolgt. Technisches target=production
ist hier die reguläre Umgebung des Testnet-Projekts.

Die getestete Sockeloptimierung wurde gezielt auf die wirkliche öffentliche
Basis ce073547 übertragen. Nur bossWeaponRenderer.ts ist als Laufzeitdatei
geändert. vercel.json behält die regulären Buildbefehle, API-Funktionen und
Routen und ergänzt nur die Autodeploy-Sperre für diesen Releasebranch.
API/Backend/übrige Frontend-Dateien sind genau die öffentliche Basis.
CI42183573684, Jobs127778538127/127778538301:475Release-Tests/0Fehler,
TypeScript/Vite,2100RGBA-Vergleiche und9Lebensdauerfälle bestehen.

Öffentlich geprüft: Home200, API200, anonymerAdmin401. HTML außer den
gebauten Assets unverändert. Ausgelieferter GamePage-Chunk enthält richtigen
Commit/Baum. Gemeinsamer shipEvolution-Chunk enthält echten Chromium-Pfad und
expliziten iOS-Ausschluss. Keine Diagnosevorschau öffentlich ausgeliefert.
Das eingebettete workingTreeDirty ist true; daher kein sauberer Vercel-
Arbeitsbaum behauptet. Der Branch-Quellvergleich und die Auslieferung wurden
separat geprüft. Details und Assetpfade in receipt.json.

Produktion cryptoid-evolution.vercel.app bleibt nachweislich
READY dpl_6N3FdS9XGXasCWrpMksngxCPNPRk/ce073547.
Rollback-Testnet dpl_239zEifRV84KCpbyHumnuHmSGm9T sowie main/ce073547 bleiben.

## Anschließend ausdrücklich beauftragter Reaktorstand

Kandidat199ef5982418db92b3281d4fa6546d4886ec152b,
Baum b1788d222d52646434ad7d982ef80b72077af5d2,
Branch codex/reactor-hit-20261106. Nicht veröffentlicht.

Nur der vollständige Reaktor samt bewegten Türen und ihren Konturen erzeugt
nun den bestehenden Boss-HP-Treffer. Die392Geschütze behalten ihre eigenen
Treffer und ihre Schutzphase. Rumpfschüsse erzeugen nur beim Eintritt einen
vorhandenen kurzlebigen Einschlag und fliegen weiter, damit der Reaktor hinter
dem Rumpf erreichbar bleibt. Keine zusätzlichen permanenten Rumpf-Hitzeflecken,
Shot-Felder, Timer, RAF, Canvas oder Kollisionshistorien.

Reaktorschüsse aktualisieren nicht mehr das Ganzschiff-Mündungslicht. Ein
lokaler SVG-Pfad blendet180ms lang in der wirklichen Geschossfarbe aus.
Andere Geschützbeleuchtung, äußere Explosionen und Schussaudio bleiben.
Feste Baugruppe, Türen und Treffer teilen denselben Öffnungswert.
GamePage hat nur drei exakt reversible, vollständig geprüfte Änderungen.
Bestehende historische Quellfingerprints wurden nicht gelockert.

CI42186429746 /Job127787769876 SUCCESS:29gezielteTests einschließlich
7500Reaktor-/Türpositionsprüfungen, alle392Geschütze, Sweeps, Rumpfeintritt,
Erreichbarkeit durch den Rumpf, gespeicherte Geometrie, ungültige Pfade,
500identische nicht feuernde SVG-Ausgaben und150lokale farbige Schussblitze.
Dazu475bestehendeRelease-Tests; insgesamt504Tests/0Fehler, TS/Vite und leerer
abschließenderTracked-Source-Diff. Die500+150Darstellungsfälle sind echte
React-SVG-Serverausgaben, keine nativen Bildvergleiche oder physische Geräte.

Vorhandene HP-Faktoren, Geschütz-/Schusszeiten, Bomber/EMP, Saves, Belohnungen,
Kampagnenfortschritt und die bereits veröffentlichte Sockeloptimierung bleiben.
Die flächige Bombe erreicht weiterhin den exponierten Reaktor wie bisher.
Kein belegter Gesamtspeichervorteil, iPhone-Abnahme oder White-Screen-Fix.
Testnet wurde nach dieser Kandidatenarbeit nochmals als d005c99 bestätigt.
