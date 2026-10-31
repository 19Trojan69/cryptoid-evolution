# Fortsetzung: Abschlussprüfung kleiner Boss-Treffer

Der White Screen ist nicht nachweislich behoben. React/TypeScript/Vite. Nur geschützte Gast-Previews, kein öffentliches Testnet/Mainnet und kein main-Merge. Echte Accounts, Spielstände, Käufe und Ranglisten bleiben geschützt. Spieltempo, Uhren, Balance, Einfingersteuerung, nur manuelles Fortsetzen und Audio bleiben unverändert. Alte Geräte-Zweige und URLs einfrieren. Keine allgemeinen Untersuchungen oder Jetsam-Schleife neu beginnen.

## Abgeschlossener Besitzerlauf

Besitzer ausdrücklich: **„whitescreen“**. Datei cryptoid-diagnose-2026-10-31T19-26-07-895Z-5f148cc9.json, 8290 Bytes, SHA-256 1378a626743217bed49040f9551b67d778aac01d4b41f7db39798e3e4c03bcb3. Quelle 290113362eea446aa9d4171aaaddd7220e3bf646 / Baum 6acb9cff2dd908f0532cd986319f0965a46b5da0: statische Boss-Hotspot-Kinder ausgelassen, Heat-Ebene/Inline-Masken vorhanden, aktive Masken none, Reflexion aus, kleine Treffer an.

Uhr/Kurzbericht passen: **15:00 / 900561 aktive ms / running**, null aufgezeichnete Lücken. Reaktor, Vollaufzeichnung aus, Testschutz an, fullSession:null. **32 Ereignisse / 26 Verwerfungen oder Begrenzungen sind keine Absturzzahlen.** Letzter Kontaktabschluss 13:38 / 818172 aktive ms, 81524 reale ms vor Checkpoint. Frühere Zwei-Kontakt-/Gesteneinträge um 01:15 belegen keinen unmittelbaren Auslöser oder vollständige Eingabegeschichte. Wärme und besondere Idle-Spielweise wurden nicht erneut bestätigt.

843 ms nach dem laufenden Checkpoint beginnt neues home-Dokument: navigate, boot-after-active-session, vorheriger Sitzungsmarker aktiv/playing/boss-fight. Kein normaler Abschluss aufgezeichnet. Exakte Absturzsekunde/native Ursache werden nicht gemessen. Die längere Dauer als einzelne frühere Versuche beweist keine Verbesserung. Test abgeschlossen, **kein weiterer unveränderter Smartphone-Lauf offen**. Bereinigter Nachweis ../boss2-static-hotspots-control-20261031/evidence/owner-static-hotspots-failure.json, Nachweiscommit 257a62ee562d3586cce0ee0b54e26ea44cf2b6a2; Rohbericht nicht in Git.

15:00 ist Besitzerzeit. 01:32 war der alte Assistenten-Desktoplauf. 08:45 gehört zur Füllungsvariante f67fd2e4; 09:10/10:56 zu 67dabc71. Beobachter und Laufzeiten nicht vermischen. Entfernen der statischen Hotspot-Kinder war als alleinige Reparatur unzureichend. Keine einzelne Speicher-/GPU-/WebKit-/Cache-/Wärme-/Eingabeursache bewiesen.

## Begründeter neuer Vergleich

Die getrennten kleinen Treffer verwenden FinishedEffect, Originalblob 1f943eb9114756c4b26a66dd14f9c6883176a37c. Sein animationend-Handler ruft getAnimations({subtree:true}) auf und entfernt DOM vorzeitig erst, wenn alle zurückgegebenen Animationen finished/idle sind. Bei fehlender/fehlschlagender Inspektion besteht bereits der Fallback auf die normale Eltern-Lebensdauer. HullDamage hält den neuesten keyed Minitreffer; GamePage ersetzt boss.hit je Treffer. Ein abgeschlossenes unsichtbares Mini-Element kann bis zum nächsten Treffer/Bossentfernen bleiben. Das ist begrenzt und kein Lecknachweis.

Privater Kandidat: Nur für `.hull-mini-explosion` unter `.sector-boss` vor der nativen Abschlussinspektion aus dem Handler zurückkehren. FinishedEffect-Komponente, Hook und Handler bleiben. Andere Effekte behalten die originale Inspektion. Komplette Treffer-Markup/CSS, Funken und Dauern bleiben; keine neuen Timer, RAF, Hooks, Canvas, Assets oder Spielregeln. Sichtbare Animation läuft weiter. Der Vergleich ändert native Abschlussinspektion **und** vorzeitige Entfernung bereits abgeschlossenen DOMs gemeinsam; keine reine Methoden-Kausalität vortäuschen. Transformation ist an den Originaltext gebunden und exakt reversibel. Der tatsächliche Callback wird für Boss-Mini/Nicht-Boss-Mini/andere Effekte geprüft.

Statische Boss-Hotspots bleiben ausgelassen, Heat-Ebene/Inline-Masken/Bildvorbereitung bestehen, aktive Masken none und Reflexion aus. Originalboss, Gesundheit, Hintergrund und kleine Treffer bleiben. BossWeaponsView sowie frühere Filter-/Reaktor-/gewöhnliche Explosions-Canvas-Kontrollen bleiben ausgeschlossen; übriger Vordergrund bleibt vereinfacht. Originalsimulation einschließlich boss.hit/hullFires, Uhren, Tempo, Balance, Input, Audio und manuelles Resume unverändert. Originale frontend/backend/api/assets/private-preview-Bäume bleiben gepinnt. Gastisolation ohne echte Auth/Backend/Accounts/Käufe/Rangliste/Uploads.

## Erster QA-Fehlschlag und korrigierte Beweisgrenze

Erste Quelle b5759f90948fae98fba7f0ec40e6168348b4ac13 wurde **nicht ausgeliefert**. Actions 41234937994: 24 Quelltests, Scope und Typen bestanden; beide Kandidatenläufe scheiterten an der zu weit gefassten Erwartung „alle nativen Boss-Mini-Aufrufe=0“. Kontroll-/Kandidatentotale: Chromium 134/86, WebKit 97/82. Vollständiger erster Fehlversuch bleibt in evidence/initial-native-counter-failure.json erhalten.

Ein zweiter Pfad ist im Originalcode belegt: cssFramePacing.ts, Blob 5d9cc3e5b40792277d9813b2953196affbc0eaf3, Zeilen 50–58, entdeckt Animationen bei animationstart/transitionrun ebenfalls über getAnimations. **Diese vorhandene Taktung bleibt unverändert.** Die Spieländerung im FinishedEffect-Guard ist ebenfalls unverändert; korrigiert wurde die Trennung der Aufrufpfade im QA-Nachweis und dessen Metadatenbeschreibung.

Die automatisierten Browser nutzen dazu einen begrenzten nativen Aufrufzähler mit Capture/Bubble-Ereignisfenster. WeakMap merkt nur laufende Ereignisse und wird beim Bubbling gelöscht, auch wenn React das Element inzwischen entfernt. Keine Event-/Node-Historie und kein solcher Probe-Code im ausgelieferten Spiel. Ruhender Phasenstatus muss none sein. Erforderlich: Startaufrufe in beiden Bedingungen >0, Abschlussaufrufe >0 in der Kontrolle und 0 im Kandidaten, echte Endereignisse in beiden >=3, sichtbare originale Treffer/Radialverläufe/3–5 Funken und höchstens ein beobachtetes Boss-Mini. Totale und sonstige Aufrufe bleiben ausgewiesen. **Keine globale Freiheit von getAnimations behaupten.** Fehlt brauchbarer Kontrollbeweis, keinen neuen Smartphone-Test zuweisen. Desktopzähler sind keine Messung des gescheiterten Besitzerlaufs oder nativer Ressourcen.

## Laufzeit und aktueller Prüfstand

- Quelle: d72db0a8ca5c70b91db9b7760366773e2836db66
- Baum: 73c23f8a5dba0bb93ab676c4ad3954ddf7ff1228
- Arbeitszweig: codex/boss2-mini-completion-control-20261031
- Eingefrorener Geräte-Zweig: codex/boss2-mini-completion-device-20261031
- Banner: TREFFERTEST: Originaltreffer; native Abschlussprüfung aus
- Szenenende: -no-static-hotspots-no-mini-inspection
- Flag CRYPTOID_BOSS_MINI_INSPECTION_OFF=0: originale Abschlussprüfung; Standard 1: vorhandener Eltern-Fallback nur für Boss-Mini. Beide haben statische Kinder aus.

Elf lokale Zieltests bestehen. Lokaler Checkout ist teilweise: FinishedEffect-Test nutzt textgleich gepinnte Remote-Quelle als temporäre Testfixture; der vollständige CI-Test liest die echte unveränderte Frontend-Datei. Korrigierter Lauf **Actions 41235613143** bestanden: alle 24 Quelltests, Scope/Typen und vier vollständige Kontroll-/Kandidatenläufe in Chromium/WebKit. Chromium: Abschlussaufrufe 48/0 bei Startaufrufen 86/86. WebKit: Abschlussaufrufe 26/0 bei Startaufrufen 76/84. Endereignisse in beiden vorhanden, Phasenstatus none, höchstens ein beobachtetes Boss-Mini, originale sichtbare Treffer/Geometrie/Steuerung/Pause/Resume/Endbericht bestanden. Diese Zähler sind Pfadnachweise, kein Performance- oder Speichervergleich. Kein neuer Geräte-Link vor bestandenen Prüfungen und tatsächlicher geschützter Auslieferungsprüfung. Kein Besitzer-Ergebnis für diese neue Quelle und kein dauerhafter Fix behauptet.

## Tatsächliche geschützte Auslieferung

Neue Preview **https://cryptoid-evolution-testnet-r4s9cheli-19-trojan69.vercel.app/**, READY/Preview/42 s, Deployment **dpl_73cfVDheGR6f7shhSiEUnSAEvYpv** (Copy ID). Quelle d72db0a8 / Baum 73c23f8a stimmen mit dem bestandenen Vergleich überein. Standard Protection in Deployment Settings beobachtet, Custom-Domain-Zuweisung Skipped. Gastschutz und ausgeschaltete echte Auth/Backend/Accounts/Payments/Uploads/automatisches Resume direkt geprüft. Metadaten bestätigen: kein QA-Wrapper ausgeliefert, native Startentdeckung bleibt aktiv, nicht sämtliche nativen Abfragen entfernt. Banner und neue Szenenkennung stimmen. Kurzer tatsächlicher Hosted-Lifecycle-Abgleich abgeschlossen, siehe unten; noch kein Besitzer-Ergebnis.

## Tatsächlicher Hosted-Lifecycle-Abgleich des Assistenten

Direkt auf neuer Adresse: Quelle/Baum/Banner/Gastschutz stimmen. Originaler Minitreffer sichtbar mit Deckkraft 1, ursprünglichen Radialverläufen und drei Funken außerhalb der Heat-Ebene; ein Boss-Mini, keine statischen Hotspot-Kinder. Heat-Ebene block/Inline-Maske vorhanden, aktive Standard-/WebKit-Maske none, Reflexion none. Originales Bossbild geladen, 227 Sterne/vier Planeten/null Spielfeld-Canvas. Pause hielt 01:04 fest, ausdrücklich mit Countdown fortgesetzt; normaler Home-/Bestätigungsabschluss mit passendem Kurzbericht und nach Neuladen wiederhergestellter Zeit.

**01:24 / 84087.30000000447 aktive ms / ended sind nur der Assistenten-Desktop-Cloud-Chromium-Lauf**, kein Besitzer-/iPhone-Ergebnis. Vollaufzeichnung aus/Testschutz an/fullSession:null, 16 Ereignisse/null Verwerfungen/null aufgezeichnete Lücken; **ein stalled-Zustandseintrag**. Keine Behauptung unterbrechungsfreier Performance. Native Aufrufzähler sind nur CI-Belege; in Hosted-/Besitzerlauf nicht gemessen, Probe nicht ausgeliefert. Bereinigter Nachweis evidence/hosted-mini-completion-candidate.json und Bild evidence/hosted-preview-ready.jpg. Rohbericht/Sitzungskennung/Kontakthistorie nicht in Git. Laufzeitquelle/Geräte-Zweig d72db0a8 bleiben eingefroren; spätere Nachweis-Commits sind keine neuen Laufzeitstände.

## Nächster Besitzer-Schritt für die geprüfte neue Variante

Nur bei erfüllter Beweisgrenze und geprüfter neuer Preview die tatsächliche Änderung anbieten. Dasselbe iPhone/Pi Browser, Reaktor, Vollaufzeichnung aus, Testschutz an; vorbereiten/öffnen/manuell fortsetzen, laufende Stoppuhr prüfen. Möglichst 20 aktive Minuten nur laufen lassen, normal beenden und Bericht sichern. Bei White Screen exakt die neue Adresse im selben Browser öffnen und vor weiterem Start Bericht sichern. Keine Wiederholung der unveränderten 15:00-Variante, keine Vollspiel-/Mainnet-Freigabe aus einem einzelnen guten Lauf. Gezielte Bestätigung/Rückführung nötig, bevor ein Fix akzeptiert wird.
