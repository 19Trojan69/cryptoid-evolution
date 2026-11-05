# Kurzes natives Profil der tatsächlich laufenden Darstellung

Basis ist die bestehende 9f3-Gerätevorschau mit direkten Boss-Verbrauchern,
mobilem HUD, lokalem Mündungslicht und unverändertem Fehlerjournal.
Nur neue Prüfdateien; alle fünf geschützten Runtime-Bäume und vercel.json bleiben gleich.
Kein Deployment, keine Smartphone-Prüfung und keine Wiederaufnahme der Simulatorserie.

Ein Chromium-Lauf prüft zunächst an acht bekannten Änderungen einer kleinen
Fixture, dass der native Trace Style-Spans, Invalidierungen und den tatsächlichen
DOM-Besitzer liefert. Erst danach startet das unveränderte echte Spiel regulär.
Im offenen Bosskampf werden sechs Sekunden native Style-Ereignisse erfasst.
Während dieses Fensters gibt es keine zusätzlichen aktiven DOM-/Style-Reads,
API-Wrapper, Game-Timer, RAF, GC, Heap-Snapshots oder Speicherdumps.
Inspektor und unveränderte Uhr werden vor und nach dem Fenster gelesen.
Frames, Spielzeit und Kernsalven müssen fortschreiten; keine technische Pause,
Dokument-/Quellenänderung oder erfasste Uhrlücke ist zulässig.

Das Profil verursacht selbst Browserarbeit. Seine Dauer ist kein unbeeinflusster
FPS-/CPU-/RAM-Vergleich. Es ordnet native Invalidierungsereignisse DOM-Besitzern
und Gründen zu. Deren Anzahl ist weder eine Allokationsgröße noch die Zahl
tatsächlicher Style-Berechnungen pro Element. Diese Arbeit wird getrennt aus
UpdateLayoutTree.elementCount gezählt. Falls die Engine keine per-node
ResolveStyle-Ereignisse liefert, wird daraus keine vollständige Knoten-Rangliste
erfunden. Ereignisse ohne Frame-ID bleiben als nur prozessbezogen gekennzeichnet.
Es gibt keine zeitbasierte Vermutung, dass die erste geplante Invalidierung die
gesamte folgende Style-Arbeit verursacht hätte.

Erst nach Trace-Ende und echter manueller Pause werden Backend-Knoten-IDs in
primitive Tag-/ID-/Klassenlabels übersetzt. Bereits entfernte Knoten bleiben
ausdrücklich unaufgelöst. Feste Erfassungsbudgets schützen den Prüfer; sie sind
keine erfundenen Grenzwerte für ein stabiles Spiel. Überlauf, Datenverlust und
fehlgeschlagene Kalibrierung bleiben Fehler und erlauben keinen automatischen Retry.
Der Lauf endet regulär über den bestätigten Home-Ausstieg.

Dies ist ein gezielter zusätzlicher Ursachenhinweis vor einer Bereinigung,
kein White-Screen-Fix und kein wiederholter unveränderter Besitzer-Dauertest.
Primärgrundlagen: https://web.dev/articles/reduce-the-scope-and-complexity-of-style-calculations
und die offiziellen Chromium-DevTools-Trace-Ereignistypen.
