# Verbindliche Arbeitsweise nach Besitzeranweisung vom 05.11.2026

Die White-Screen-Behebung richtet sich nach passenden offiziellen Empfehlungen
der tatsächlich verwendeten Plattformen und Bibliotheken. Keine erfundenen
allgemeinen Speichergrenzen, prozentualen Einsparziele oder Kompensationsformeln
werden als Entwicklervorgabe ausgegeben. Frühere selbst gewählte Diagnosekriterien
bleiben historische Versuchskriterien; sie sind keine allgemeine Entwicklervorgabe.
Alte Fehlschläge werden durch diese neue Arbeitsanweisung nicht umgewertet.

Jede Änderung braucht eine konkrete Quellstelle, die anwendbare dokumentierte
Empfehlung und einen Nachweis im vorhandenen Spiel. Fehlerberichte aus anderen
Browsern, Backends oder Versionen sind Hinweise, bis der passende Aufrufpfad und
die Bedingungen belegt sind. Browserinterne Implementierungsdetails sind kein
portabler Webstandard.

Abnahmekriterien werden aus den tatsächlichen Anforderungen abgeleitet: Mechanik,
Grafik, Ton, Steuerung und Spielgeschwindigkeit erhalten. Ein enger Test darf
strenger sein, wird aber ausdrücklich als projektspezifischer Vergleich bezeichnet.
Kein Testschwellwert wird als universelle Vorgabe von WebKit, Chrome oder React
behauptet. Ein Vergleich ohne Vorteil ist kein Fix; ein Fehler des Testaufbaus ist
kein Spielabsturz. Auf Basis bereits ausgeführter Versuche wird nicht nur durch
veränderte Kriterien ein Erfolg hergestellt.

Allgemeine Optimierungshinweise werden nicht automatisch als White-Screen-Fix
eingebaut. Zuerst Funktion und Wirkung prüfen, dann die unverändert erhaltene
Darstellung und Bedienung. Keine weitere unveränderte Handy-Dauerprüfung ohne
konkreten Erkenntnisgewinn. USB und Systemanmeldungen sind keine Voraussetzung.
Die beendete Simulatorserie bleibt beendet.

Der vorbereitete Boss-Positionskandidat verwendet entsprechend nur die originalen
Koordinaten mit der standardisierten CSS-Eigenschaft translate. Eine zunächst
lokal entworfene 1/64-Rundung wurde vor Commit und Ausführung entfernt. Sie wird
nicht nachträglich zum Bestehen der Geometrieprüfung wieder eingeführt.

Offizielle Grundlagen für die derzeitige Rendering-Hypothese:

- Chrome: bevorzugt transform/opacity bzw. unabhängiges translate für Bewegung,
  um unnötige Layoutarbeit zu vermeiden:
  https://developer.chrome.com/docs/modern-web-guidance/guides/ui-behaviors/motion
- WebKit: Compositing-Layer können Renderingarbeit sparen, kosten aber Speicher;
  Anzahl und Kosten müssen zur konkreten Seite passen:
  https://webkit.org/web-inspector/layers-tab/

Diese Regeln halten den Besitzerauftrag fest; sie behaupten keine universelle
Abnahmevorschrift aller Spieleentwickler. Die White-Screen-Ursache bleibt offen.
