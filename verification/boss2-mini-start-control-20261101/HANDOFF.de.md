# Fortsetzung: Startbehandlung kleiner Boss-Treffer

Nur React/TypeScript/Vite, geschützte Gast-Previews. Kein öffentliches Testnet/Mainnet/main-Merge; echte Accounts/Spielstände/Käufe/Rangliste schützen. Spieltempo/Uhren/Balance/Einfingersteuerung/manuelles Fortsetzen/Audio unverändert. Bestehende Geräte-Zweige/URLs einfrieren. Keine allgemeine Untersuchung/Jetsam wiederholen. White Screen nicht nachweislich behoben.

## Tatsächlich neu ausgewerteter Besitzerlauf

Quelle d72db0a8ca5c70b91db9b7760366773e2836db66 / Baum73c23f8a5dba0bb93ab676c4ad3954ddf7ff1228; letzter Link r4s9cheli gehört dazu. Bericht cryptoid-diagnose-2026-11-01T08-29-24-853Z-52e5a414.json,8201Bytes/SHA-256 d7106acc2b9986cbed66c3c5147b9cad56b4ccd36563bc12c388fa17c713f214. Uhr und Kurzbericht passen: **16:02/962934 aktive ms/running**, null aufgezeichnete Lücken. Reaktor/Vollaufzeichnung aus/Testschutz an/fullSession:null. Top-level testOptions:null; Optionen aus passendem Kurzbericht.

Neues home-Dokument203ms nach dem Checkpoint, navigate, boot-after-active-session828ms nach Checkpoint, vorher aktiv/playing/boss-fight; kein normaler Abschluss aufgezeichnet. Der reine Upload enthielt noch keine Symptombeschreibung. In der anschließenden Ergebnisfrage bestätigte der Besitzer ausdrücklich White Screen. Pixel werden nicht gemessen; genaue Absturzsekunde/native Ursache bleiben offen. 31Ereignisse/null Verwerfungen sind keine Absturzzahl oder Vollaufzeichnung. Letzter Kontakt bei02:12/132618aktiven ms,829520reale ms vor Checkpoint. Kein unmittelbarer Eingabetrigger, keine besondere Idle-Spielweise/Wärme neu bestätigt. 16:02 beweist keine Verbesserung gegenüber15:00 oder8–10Minuten.

Abschlussprüfung und frühe Entfernung fertigen Treffer-DOMs sind im geprüften Build aus; Startentdeckung und Frame-Easing noch an. Kandidat nicht als Reparatur bestätigt, Lauf geschlossen, kein unveränderter Smartphone-Wiederholungstest offen. Bereinigter Nachweis ../boss2-mini-completion-control-20261031/evidence/owner-mini-completion-abrupt-return.json, Nachweiscommit b8b135f73fcf20b70f59791acff6e0aef344f63f. Rohbericht und Kontakthistorie nicht in Git. 01:24 war nur der Assistenten-Desktoplauf auf dieser alten Preview; nicht Besitzerzeit.

## Kleine neue Vergleichsgrenze

Original cssFramePacing.ts, Blob5d9cc3e5b40792277d9813b2953196affbc0eaf3, normierter SHA-2568e08da3d503cbfcd9104d3809ef7c8ce214e9053bda15b030fa3ddc5cd152010. Bereits im vorigen CI positiv belegte Startabfrage bei animationstart/transitionrun. Danach nativeFrameEasing, effect.updateTiming, Map und finish/cancel-Listener. Keine dieser begrenzten Strukturen beweist ein Leck oder die Smartphone-Ursache.

Build-Transformation ergänzt genau zwei umkehrbare Guards nur für `.sector-boss .hull-mini-explosion` einschließlich Funkenkindern: vor Ziel-getAnimations und vor Registrierung. Der zweite Guard gilt auch für initialen Root-Scan und direkte paceAnimation-Registrierung. Ursprüngliches Mini-Markup/CSS/Verläufe/Formen/Funken/Keyframes/Dauern bleiben, Browser spielt die authored CSS-Animation weiter. Nur zusätzliche60-Hz-Quantisierung/natives Timing-Nachstellen/Listenerregistrierung dieser Untergruppe entfallen gemeinsam. Das ist kein reiner Methodenvergleich und keine allgemeine Aufhebung der Taktung: andere Effekte und initiale Root-Abfrage bleiben. Spieluhren/Simulation/Tempo/Audio/Input bleiben unverändert; keine Timer/RAF/Hooks/Assets/Canvas hinzugefügt.

Abschlussprüfung/frühe Mini-Entfernung bleiben in Kontrolle und Kandidat aus, ein neuester keyed Mini maximal. Statische Hotspots weiter ausgelassen; leere Heat-Ebene, Inline-Masken, Bildvorbereitung bleiben; aktive Masken none, Reflexion aus. Originalboss/Gesundheit/Hintergründe und kleine Treffer bleiben. BossWeaponsView/frühere Filter/Reaktor/gewöhnliche Explosions-Canvas-Kontrollen bleiben ausgeschlossen, übriger Vordergrund vereinfacht. Originalquellbäume gepinnt; Änderung nur im privaten Build.

## Prüfen vor Auslieferung

Arbeitszweig codex/boss2-mini-start-control-20261101. Flag CRYPTOID_BOSS_MINI_START_PACING_OFF=0 ist der Besitzerbedingung entsprechende Kontrolle; Standard1 neuer Kandidat. Szenenende -no-mini-inspection-no-mini-start-pacing. Banner **TREFFERTEST: Originaltreffer; zusätzliche Animationstaktung aus**. Neuer Geräte-Zweig erst nach bestandenen Prüfungen an exakt getesteter Quelle einfrieren.

Vier lokale Zieltests führen den tatsächlichen Abschluss-Callback und das tatsächliche TS-Pacing-Modul mit isolierten Hosts aus; exakte Umkehrung, Quellpins, Mini/Nicht-Mini/Boss/Nicht-Boss, initialer Scan/direkte Registrierung/Events und Aufräumen. Lokaler Checkout teilweise: gepinnte textgleiche Remote-Dateien liegen nur als externe Testfixtures vor. Vollständiger Quell-/Typ-/Vite-/Browserbeweis ist inzwischen in CI bestanden, nicht als lokal vollständigen Build ausgeben.

Browser-QA ausschließlich im isolierten Testkontext: Miniwurzel UND Funken-Unterelemente zählen, getAnimations und KeyframeEffect.updateTiming zählen, echte animationstart/end-Ereignisse. Kontrolle muss positive Startabfragen UND Timing-Schreibvorgänge zeigen; Kandidat beides0, Endabfragen in beiden0. Sichtbare Originaltreffer/Dauern/3–5Funken/ein beobachteter Mini plus Layout, Pause/Uhrfreeze, explizites Resume, Steuerung, Waffenmenü und normaler Endbericht in Chromium/WebKit erforderlich. Keine QA-Probe ausliefern, keine nativen Messwerte vom Besitzergerät unterstellen. Kein Link ohne bestandene Kontrollen und tatsächliche geschützte Hosted-Prüfung. Keine Smartphone-Ergebnisse für neue Quelle bisher.

## Tatsächlich bestandener vollständiger Vergleich

Laufzeitquelle **2dc37bdb6d52ddd29bcfad9269dbb4b3f76bffcf**, Baum **d0e4ea74bee804375e8f7c292b22e5c27bcf7a73**. Actions **41289850128**, completed/success; Chromium-Job124798633236 und WebKit-Job124798633418 success. **26 Quelltests**, Originalbaum-Pins, Typen, zwei vollständige Vite-Bedingungen je Browser und **vier kurze Kontroll-/Kandidaten-Spielflüsse** bestanden.

| Nachweis nur im CI-Kontext | Chromium Kontrolle / Kandidat | WebKit Kontrolle / Kandidat |
| --- | --- | --- |
| native Mini-Zielabfragen, Wurzel und Funken | 257 / 0 | 252 / 0 |
| native Mini-Timing-Schreibvorgänge | 305 / 0 | 276 / 0 |
| echte Mini-Start-Ereignisse | 257 / 257 | 252 / 263 |
| echte Mini-End-Ereignisse | 48 / 48 | 24 / 21 |
| beobachtetes Maximum Mini-DOM | 1 / 1 | 1 / 1 |

Abschlussaufrufe in beiden0, Phasenstatus nach Dispatch none. Andere native Timing-Schreibvorgänge bleiben positiv (Chromium247/41, WebKit263/41); kein globales Entfernen nativer Behandlung. Originaler sichtbarer Burst/Radialverläufe/3–5Funken/0.38s-Dauer, Originalbossbild/227Sterne/vierPlaneten/null Szenen-Canvas, beibehaltene Heat-Ebene/Inline-Maske/aktive Masken none/Reflexion aus, Geometrie/Steuerung/Pause/Resume/Waffenmenü/normaler Endbericht bestätigt. Zähler unterscheiden jetzt Wurzel UND Kinder und sind nicht direkt mit dem früheren Nur-Wurzel-Zähler48/0 oder86/86 vergleichbar. Es sind Pfadbelege, keine Performance-/Speicher-/Wärme- oder Smartphone-Stabilitätsmessungen.

Neuer fester Geräte-Zweig **codex/boss2-mini-start-device-20261101** zeigt ausschließlich auf2dc37bdb. Alte Geräte-Zweige/Links bleiben eingefroren. Beleg evidence/synthetic-mini-start-comparison.json. Keine Besitzerzeit für diese neue Variante und kein Fix bestätigt. Tatsächliche geschützte Hosted-Prüfung vor Übergabe des Links erforderlich; deren Ergebnis separat ergänzen.

## Tatsächlich geschützte Preview und Hosted-Abgleich

Neue Adresse **https://cryptoid-evolution-testnet-e13dxxhkg-19-trojan69.vercel.app/**. Vercel-Deployment **dpl_64BJNF9th2rYzJZgSaK1SUkhnCWV**, READY/Preview/**44s**. Quelle2dc37bdb und Baumd0e4ea74 stimmen mit bestandenen CI-Läufen überein. Standard Protection in Deployment Settings direkt beobachtet; Custom-Domain-Zuweisung Skipped, automatische Git-Deployments false. Kein öffentliches Testnet/Mainnet/main-Merge. Öffentliches main bleibt ce073547cf573375d141bf846f70e294138dbd73.

Ausgelieferter Banner, Szenenkennung, Mini-Start-Flag und Gastschutz stimmen; echte Auth/Backend/Accounts/Payments/Uploads/automatisches Resume false. Kein QA-Wrapper ausgeliefert. Tatsächlicher kurzer Hosted-Lifecycle des **Assistenten in Cloud-Chromium**: sichtbarer Originalburst mit Deckkraft1, Radialverläufen, vier Funken und0.38s-Dauer; ein Mini. Heat-Ebene block/Inline-Masken vorhanden, aktive Standard-/WebKit-Maske jeweils none (CSS-getPropertyValue), statische Hotspots0, Reflexion none, originales Bossbild geladen,227Sterne/vierPlaneten/null Szenen-Canvas. Pause hielt **01:15** fest, explizites Resume mit Countdown; normaler Home-/Bestätigungsabschluss und passender Bericht, Zeit nach Reload wiederhergestellt.

**01:23 /83751.5aktive ms/ended sind ausschließlich Assistentenzeit**, kein Besitzer-/iPhone-/Pi-Browser-Lauf. Reaktor, Vollaufzeichnung aus/Testschutz an/fullSession:null,18Ereignisse/null Verwerfungen/null aufgezeichnete Lücken; **zwei stalled-Zustandseinträge**, daher keine Behauptung unterbrechungsfreier Performance. Native Aufruf-/Timingzähler wurden nur in CI gemessen, im Hosted-/Besitzerlauf nicht. Nachweise evidence/hosted-mini-start-candidate.json und evidence/hosted-preview-ready.jpg. Kein Rohbericht und keine Sitzungs-/Kontakthistorie in Git.

## Nächster Besitzer-Schritt: neuer Test steht erst bevor

Dieser Link und diese Änderung sind erst jetzt bereit. **Kein Smartphone-Lauf auf der neuen Quelle wurde als gestartet oder abgeschlossen gemeldet.** Die zuletzt bestätigten16:02/White Screen gehören zur vorherigen Quelle d72db0a8/r4s9cheli, nicht2dc37bdb/e13dxxhkg. Alte Links nicht erneut als offene unveränderte Tests behandeln.

Für den neuen Vergleich dasselbe iPhone/Pi Browser, **Reaktor offen/Vollaufzeichnung aus/Testschutz an**. Vorbereiten, öffnen, ausdrücklich Fortsetzen; möglichst20aktive Minuten nur laufen lassen und anschließend normal beenden/Bericht sichern. Bei White Screen dieselbe neue Adresse im selben Browser öffnen, **vor einem weiteren Start** den letzten Bericht sichern. Keine Ergebnisse oder laufenden Tests unterstellen. Einzelner guter Lauf wäre keine dauerhafte Reparatur/Freigabe; keinen neuen Mechanismus ohne Nachweis behaupten. Gerätzweig/URL2dc37bdb bleiben eingefroren, spätere Nachweis-Commits sind nicht der getestete Laufzeitstand.
