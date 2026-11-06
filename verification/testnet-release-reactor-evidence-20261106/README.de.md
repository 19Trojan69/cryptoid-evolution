# Testnet: Sockeloptimierung und Reaktoränderung veröffentlicht

Aktuell öffentlich: https://cryptoid-evolution-testnet.vercel.app/
READY-Deployment dpl_HXX57EN88Qto9j84RPhmYt4HFLx6,
Commit199ef5982418db92b3281d4fa6546d4886ec152b,
Baumb1788d222d52646434ad7d982ef80b72077af5d2,
Branchcodex/reactor-hit-20261106.

Veröffentlicht ausschließlich im bestehenden Testnet-Projekt
prj_JpvzU9ZS8bFkn9jZgE51Gct8TZpF, Team
team_KzJmtl0QyoYZAOu5RQKsAR2i. Das technische target=production bezeichnet
hier die reguläre Umgebung des Testnet-Projekts, nicht das Produktionsprojekt.
Automatische Git-Deployments für die Arbeitsbranches bleiben gesperrt.
Main bleibt ce073547; kein Merge oder Schutzabbau.

## Aktuelles Verhalten

Die zuvor geprüfte Chromium-Sockeloptimierung ist enthalten. Boss-HP-Schaden
entsteht bei Projektiltreffern nur am vollständigen Reaktor samt bewegten Türen
und deren sichtbarer Kontur. Alle392Geschütze behalten ihre eigenen Treffer,
Schadensregeln und bisherige Schutzphase. Rumpfschüsse erzeugen eine bestehende
kurzlebige Einschlagmarke und fliegen weiter, damit der Reaktor hinter dem
unverwundbaren Rumpf erreichbar bleibt. Kein zusätzlicher permanenter Hitzefleck,
Shot-Zustand, Kollisionsverlauf, Canvas, Timer oder RAF.

Reaktorschüsse verändern nicht mehr den Ganzschiff-Mündungslichtwert. Nur ein
lokaler SVG-Pfad blendet180ms lang in der wirklichen Geschossfarbe aus.
Andere Geschützbeleuchtung, externe Explosionen und Schussaudio bleiben.
Trefferflächen und Darstellung verwenden denselben Türöffnungswert.
GamePage enthält nur drei exakt reversible autorisierte Änderungen; vorhandene
historische Ganzquellen-Prüfungen wurden nicht gelockert.

## Abgeschlossene Prüfungen

CI42186429746 /Job127787769876 SUCCESS.29gezielteTests plus475bestehende
Release-Tests, insgesamt504/0Fehler. Dazu TypeScript, Vite und leerer
abschließenderTracked-Source-Diff. Geprüft sind7500Reaktor-/Türpositionen,
alle392Geschütze, schnelle Sweeps, Rumpfeintritt ohne HP/Hitze-/Shot-Änderung,
Erreichbarkeit des Reaktors, gespeicherte Geometrie und ungültige Pfade.
500nicht feuernde SVG-Ausgaben entsprechen dem Original,150lokale farbige
Schussblitze und der echte Audio-/Lichtzweig bestehen. Die650Darstellungsfälle
sind React-SVG-Serverausgaben, keine native Smartphone-Bildabnahme.

Nach Veröffentlichung ohne Authentifizierung geprüft: Startseite200, API200,
anonymerAdmin401, alle geladenen Assets200. Exakter Commit und Baum in der
normalen ausgelieferten App. Lokaler Reaktorblitz im gemeinsam verwendeten
powerUps-BHSSRcNt.js, Projektfarben-CSS, Chromiumoptimierung/iOS-Ausschluss
und vollständige statische GamePage-Importkette bestätigt. Keine öffentliche
Diagnosevorschau. Assetpfade, SHA256 und vollständige Prüfflags in public-smoke.json.
Ein anfänglicher Teilprobe fehlte das gemeinsam verwendete powerUps-Modul;
die Prüfung der vollständigen Importkette besteht ohne Laufzeitquellkorrektur.
Das eingebettete workingTreeDirty ist true; ein sauberer Vercel-Arbeitsbaum
wird daher nicht behauptet. CI und ausgelieferte Source-Identität sind separat
geprüft. Keine echte Pi-Anmeldung, Zahlung oder Spielstandsänderung getestet.

## Zuvor zuerst veröffentlichter Stand und Rückfall

Wie vom Besitzer angefordert zuerst nur die Sockeloptimierung veröffentlicht:
READY dpl_BcDkVkATpUrCRDNB5zYcQ8jkEqBR,
Commitd005c99b03dfdfe9433e300ac1add26a38a74eb9,
Bauma69893d6f703bfc0f39c50e1c03bffdd3ed81df2.
Sie wurde gezielt auf die wirkliche öffentliche Basisce073547 übertragen,
mit alleiniger Renderer-Laufzeitänderung und regulären App-Buildbefehlen.
CI42183573684, Jobs127778538127/127778538301:475Release-Tests/TS/Vite,
2100RGBA-Vergleiche und9Lebensdauerfälle bestehen. Originales Pixelartefakt
13485973648 ist als ZIP mit SHA256 im Beleg erhalten.

Dieser d005c99-Stand bleibt unmittelbare Rückfallversion. Älteres Testnet
 dpl_239zEifRV84KCpbyHumnuHmSGm9T/maince073547 bleibt ebenfalls erhalten.
Produktioncryptoid-evolution.vercel.app ist nach der Reaktorveröffentlichung
weiterhin READY dpl_6N3FdS9XGXasCWrpMksngxCPNPRk/ce073547.

## Grenzen

Bestehende HP-Faktoren, Geschütz-/Schusszeiten, flächige Bomben/EMP, Saves,
Belohnungen und Kampagnenfortschritt bleiben. Die bestehende flächige Bombe
trifft weiterhin den exponierten Reaktor; sie wurde nicht neu balanciert.
Kein belegter Gesamtspeichervorteil der Reaktoränderung, keine physische
Smartphone-Abnahme und kein bestätigter White-Screen-Fix. Die Chromium-
Sockeleinsparung betrifft nur ihre zusätzlichen logischen Rasterflächen.
