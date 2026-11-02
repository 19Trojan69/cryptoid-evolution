# Isolierter Vererbungsbereich der Boss-Schubvariable – 2. November 2026

Direkte Fortsetzung von `8f2d7080`: Die native Langmessung zeigt große
bereinigbare Blink-/Style-Bestände. Die anschließend tatsächlich beobachtete
CSS-API-Zählung findet 1.797 Schreibzugriffe der Boss-Schubvariable in einer
aktiven Minute, davon 1.796 mit geändertem vorherigem Aufrufwert. Die Variable
wird am großen Boss-Wurzelknoten gesetzt; die unveränderte Quelle verwendet
sie nur für die Höhe der bestehenden Triebwerksflammen.

## Genau eine virtuelle Änderung

`control` baut das Originalmodul `BossHullView.tsx` bytegleich. `leaf` berechnet
denselben Ausdruck weiterhin einmal und deklariert denselben String direkt
an den vorhandenen Flammen statt an der Wurzel. Nur drei exakte Textstellen
ändern sich; die vollständige Umkehrung muss das Original-Blob
`68dd74e598caa060ae8825d3c56b199ba0d08449` ergeben. Kein anderer Style, Knoten,
Anker, Sprite, Effekt, Canvas, natives Easing, Ton, Spielobjekt, Spieluhr oder
Cleanup-Pfad ändert sich. Es gibt keine neue App-Schleife, RAF, Timer oder
Beobachter. Dateien unter `frontend` bleiben unverändert; das Renderingmodul
wird ausschließlich im ausdrücklich bezeichneten QA-Build transformiert.

Dies ist eine Hypothesenprüfung, noch kein übernommener Spiel-Patch. Bei mehreren
Flammen entstehen zusätzliche Style-Schreibzugriffe; deren Anzahl ist kein
Erfolgskriterium. Der vermutete Nutzen liegt in geringerer Vererbung an
nicht verbrauchende Unterbäume. Speicherwirkung muss tatsächlich gemessen werden.
Die früheren Mini-Start-Guards und alle Flat-/Filter-/Canvas-/Masken-Kontrollen
bleiben aus. Neue Style-API-Beobachtungswrapper dürfen nicht kombiniert werden.

## Technische Gates

Fünf neue Regressionen führen den ursprünglichen und den transformierten JSX-
Funktionskörper aus. In 600 Kombinationen aller 50 tatsächlichen Boss-Geometrien
mit Bewegungs-/Eintritts-/Gesundheitszuständen sind alle anderen Knoten und Props
gleich; jede bestehende Flamme erhält exakt den ursprünglichen String. Alle
50 fallenden Bossdarstellungen und fehlende Modelle bleiben vollständig gleich.
Beide virtuellen vollständigen TypeScript-Varianten müssen bestehen.

Danach beginnen zwei frische kurze Browserläufe, je 60 aktive Sekunden. Erst
nach bestätigter bestehender Home-Dialogpause wird die aktuelle Deklaration
einmal auf die Gegenseite verteilt und zurückgesetzt. Derselbe gerade gerenderte
Wert wird verwendet. Der echte Browser muss exakt gleiche berechnete Flammen-
höhen und Variablenwerte sowie dieselben nativen Animationsobjekte, Startzeiten
und Wiedergaberaten liefern. Die ursprünglichen Inline-Styles werden vollständig
wiederhergestellt. Das SVG erbt die Variable nur im Kontrollzustand. Kein App-
oder Animationsclock-Schreibzugriff ist Bestandteil dieses Nachweises.

Diese inaktive Prüfmutation erfolgt ausschließlich im Kurzlauf, vor der
folgenden Heap-Erfassung. Sie ist kein unbeeinflusster Speicher-Kontrollwert.
Erst wenn beide Varianten bestehen, beginnen vier unabhängige Langläufe mit
je 20 Minuten tatsächlich beobachteter aktiver Zeit: zweimal Original, zweimal
Flammendeklaration. Keine aktiven API-Wrapper, Traces, Snapshots, GC, Screenshots,
Animationsscans oder Verteilungsmutationen. Quellen, Engine, Pakete, Lock-Digest,
aktive Uhr, fortlaufende Frames und Kernsalven werden geprüft.

Nach der aktiven Strecke verwendet jeder Lauf dieselben bestehenden zehn
Freigabegrenzen, zwei Heap-Snapshots und vier expliziten nativen Allokator-Dumps
erst nach der bestätigten Pause. Die Zuordnung, Fragment-/Aliasgrenzen und
Diagnoseeinflüsse aus der vorigen Phase bleiben Grundlage der Auswertung.
Vier unseeded Läufe ersetzen keine physische Geräteabnahme. Ein niedriger
einzelner Endpunkt gilt nicht als bestätigte Verbesserung.

Es wird keine neue Spiel-/Geräteversion veröffentlicht. Die offene WebKit-
Original-Startlücke, die Mini-Start-Negativserie und der ungeklärte Smartphone-
White-Screen bleiben erhalten. Ergebnisse werden nach tatsächlicher Prüfung
ergänzt.
