# Reaktor samt Türen als einziges Boss-HP-Ziel, lokaler Schussblitz

Ausdrückliche Besitzeraufträge vom06.11.2026: Zuerst die geprüfte
Sockeloptimierung auf Testnet veröffentlichen; anschließend Reaktorschaden nur
bei Treffern am gesamten Reaktor einschließlich seiner Türen zählen. Andere
Geschütze behalten ihre eigenen Treffer-/Schadensregeln. Der Rumpf zeigt nur
Einschläge. Beim Reaktorschuss leuchtet ausschließlich der Reaktor kurz in
der tatsächlichen Geschossfarbe auf, nicht der ganze Boss.

Die erste Veröffentlichung ist abgeschlossen: Testnet
https://cryptoid-evolution-testnet.vercel.app/ läuft auf READY
dpl_BcDkVkATpUrCRDNB5zYcQ8jkEqBR, Commit
d005c99b03dfdfe9433e300ac1add26a38a74eb9, Baum
a69893d6f703bfc0f39c50e1c03bffdd3ed81df2. Produktion bleibt
dpl_6N3FdS9XGXasCWrpMksngxCPNPRk/ce073547. Dieser neue Reaktorbranch baut
genau darauf auf und hat automatisches Vercel-Deployment abgeschaltet.

## Beabsichtigtes Verhalten

- Ganze feste100×160SVG-Reaktorbaugruppe plus beide bewegten Türpolygone
  einschließlich ihres1.3breiten SVG-Randes als Treffervolumen. Öffnungswert
  wird gemeinsam mit BossReactorView berechnet; keine zweite Uhr. Gesweepte
  Schüsse werden analytisch geschnitten, auch an geöffneten Türen.
- Bestehende Geschützphase, alle392Geschütze, HP-Faktor2, Warn-/Schusszeiten,
  Mündungspositionen, Pause, gespeicherte Kämpfe, Belohnungen und Bomben bleiben.
  Die bereits bestehende flächige Bombe erreicht auch den exponierten Reaktor;
  sie ist kein Rumpfprojektil und wird nicht neu balanciert.
- Rumpfschüsse fliegen weiter. So bleibt ein weiter oben liegender Reaktor
  hinter dem unverwundbaren Rumpf erreichbar. Nur beim Eintritt in die feste
  Hülle wird eine bereits vorhandene kurzlebige Einschlagmarke gesetzt.
  Keine zusätzlichen permanenten Rumpf-Hitzeflecken, Listen oder Shot-Felder.
- Reaktorimpulse aktualisieren nicht mehr den Ganzschiff-Mündungslichtwert.
  Andere Geschütze und bestehende externe Explosionsbeleuchtung bleiben.
  Ein lokaler SVG-Pfad in Geschossfarbe blendet mit dem bestehenden180ms-
  Schussfenster aus; kein zusätzlicher Timer, RAF, Filter oder Canvas.

GamePage enthält genau drei autorisierte Änderungen: Helperimport, sichtbarer
schadensloser Rumpfeintritt und Entfernen des globalen Lichtimpulses aus dem
ansonsten unveränderten Audiozweig. Der exakte reversible Quellguard erhält
alle übrigen historischen Ganzquellen-Prüfungen. Die Darstellung außerhalb
des ausdrücklich gewünschten Reaktorschussblitzes wird gegen das vorherige
Original geprüft.

## Prüfungen und Grenzen

Lokale Geometrieprüfungen bestehen:7500Reaktor-/Türpositionen, schnelle Sweeps,
alle392Geschütze, Rumpftreffer ohne HP/Hitze-/Projectile-Änderung, wiederholte
Innenpunkte ohne neue Effekte, Erreichbarkeit des Reaktors durch den Rumpf,
Fortsetzung gespeicherter Geometrie und ungültige Pfade. CI ergänzt die
Originaldarstellung außerhalb des Schussfensters für500Konfigurationen,
150farbige lokale Schussblitze, den wirklichen Audio-/Lichtzweig und die
bisherigen Release-Tests/TypeScript/Vite.

Kein Beleg für eine Gesamtspeicherreduktion, physische Smartphone-Abnahme oder
White-Screen-Behebung. Die Trefferflächen und das Gameplay ändern sich auf
ausdrücklichen Wunsch; Schwierigkeits-/Laufzeitfolgen sind noch nicht auf einem
echten Gerät abgenommen. Dieser Reaktorstand ist nicht veröffentlicht.
