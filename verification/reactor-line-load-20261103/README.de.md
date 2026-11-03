# Reaktor-Trefferlast auf eingefrorener Quelle

Die bisherigen Dauertests verwenden den Reaktorstart, der das Schiff bei x=0,075 an den linken Rand setzt. Der bestehende Testablauf bewegt es anschließend nicht ins mittlere Schussfeld. Seine vier bestandenen 30-Minuten-Läufe sind deshalb kein Dauerbeleg für gezielte Reaktortreffer aus der Mitte.

Dieser reine Testzweig lässt die bereitgestellte Diagnose und sämtliche Spielquellen unverändert. Zwei getrennte Checkouts halten die Testanleitung außerhalb der exakt eingefrorenen Quelle `ac98e95166b0e2013186257904da46323840dab5`, Baum `99092ec24e843fb1e419dc382bc2523a4edc0b42`. Vor und nach jedem Lauf werden der gesamte getrackte Stand, die exakt zwei bekannten erzeugten npm-Locks und die ausgelieferten JS-/CSS-Dateien geprüft. Es gibt keine neue Bereitstellung und keine Änderung an Main, Produktion, Schutz oder Projektschlüsseln.

## Neuer Ablauf

Je ein frischer Chromium-/WebKit-Runner baut das vorhandene Paket. Zuerst muss der vollständige bisherige 60/10/10-Sekunden-Ablauf am linken Rand bestehen. Danach führt ein frischer Browser denselben Ablauf aus, ergänzt nur um einen normalen nativen Spielfeld-Tap pro Zyklus. Der tatsächliche Spielerwert muss x≈0,5 erreichen, und die reale Bossgesundheit muss vor der Messung sinken. Direkte Zustandszuweisung, zusätzliche Testwaffen, beschleunigte Uhren und automatisches Fortsetzen sind ausgeschlossen.

Erst wenn beide kurzen Abläufe bestehen, startet im jeweiligen Job ein weiterer frischer Browser mit 1.800 realen aktiven Sekunden in der mittleren Schusslinie. Anschließend bleiben echte Pause, Waffenmenü, bestätigter Home-Ausstieg, zwei neue kurze Läufe und regulärer Berichtsexport erforderlich. Bestehende harte Gates für Dokument, aktive Frames, Uhr-ID, unveränderte Uhr, null Beobachtungslücken und unerwartete Pausen bleiben byteinhaltlich erhalten. Jeder Fehlschlag bleibt ein Fehlschlag und stoppt die folgenden Phasen dieses Jobs.

Die Feldberührung ist normale Browser-Eingabe. Die anschließenden Inspector-Lesungen zur Platzierung und Trefferbestätigung sind offengelegt; der vorhandene aktive Messrhythmus wird nicht erhöht. Der erzeugte externe Testtreiber bleibt außerhalb des Kandidaten-Checkouts. Die Prüfkopie des alten Treibers hat einen festen SHA-256-Hash; die gezielten Einfügungen sind exakt reversibel. Kein Anwendungsskript, Browser-API oder Effektcode wird ersetzt.

## Grenzen

Die Anfangsabnahme beweist tatsächlichen Reaktorschaden, nicht jeden späteren Treffer. Der bereits vorhandene Testschutz mit Bossgesundheits-Untergrenze bleibt aktiv. Die identische 430×825-Viewport-/DPR-3-Konfiguration ist eine synthetische Testeinstellung und keine Bestätigung eines physischen Telefons. Zufällige Gegner-/Effektfolgen bleiben ungesetzt. Die verschiedenen Spielerpositionen sind absichtlich verschiedene Spielabläufe; daraus wird kein kausaler Speichervergleich abgeleitet. Linux-PSS, aktive DOM-Frames und App-Teilzähler messen weder native iPhone-Terminierung noch weiße Pixel.

Diese Prüfung erweitert eine konkrete Deckungslücke. Ein grüner Linux-Lauf ist keine Behebung oder Abnahme des mobilen White Screens. Private Besitzerberichte und Videos sind nicht Bestandteil dieses Zweigs.

Status: Vorbereitung und lokale Adapter-/Quellschutzprüfungen; native Ergebnisse werden am exakten Test-Commit separat festgehalten.
