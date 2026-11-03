# Spielfeld-Kontakte mit anschließendem Dauertest

Dieser reine Testzweig lässt die bereitgestellte Diagnose und sämtliche Spielquellen unverändert. Zwei getrennte Checkouts halten die Testanleitung außerhalb der exakt eingefrorenen Quelle `ac98e95166b0e2013186257904da46323840dab5`, Baum `99092ec24e843fb1e419dc382bc2523a4edc0b42`. Vor und nach jedem Lauf werden der gesamte getrackte Stand, die exakt zwei bekannten erzeugten npm-Locks und die ausgelieferten JS-/CSS-Dateien geprüft. Es gibt keine neue Bereitstellung und keine Änderung an Main, Produktion, Schutz oder Projektschlüsseln.

## Korrigierter erster Ansatz

Die ursprüngliche Testanleitung `63b48555`, CI [41583486452](https://github.com/19Trojan69/cryptoid-evolution/actions/runs/41583486452), nahm fälschlich einen Start am linken Rand an. Das wurde aus dem älteren `__crossDeviceTest.openReactor()`-Helfer in `fixture.mjs` abgeleitet. Der tatsächlich verwendete vorbereitete Gerätepfad in `devicePreviewTransform.mjs` setzt die Szene ohne diesen Positionswechsel auf. Beide nativen Engines zeigen tatsächlich x=0,5 und y=0,78. Die neue falsche Vorbedingung stoppt beide Jobs vor der eigentlichen Messung; es gab weder neue vollständige Kurzläufe noch einen gestarteten Langlauf. Dies ist ein Fehler dieses Testansatzes und wird nicht zum Spielabsturz oder erfolgreichen Test umklassifiziert.

Damit ist auch die frühere Behauptung einer fehlenden mittleren Schusslinie zurückgenommen: Die bestehenden Dauertests stehen bereits in der Mitte. Der noch nicht kombinierte Ablauf ist normale Spielfeld-Eingabe mit beobachteten Positionswechseln und anschließend langem Betrieb nach dem Loslassen. Dieser korrigierte Prüfauftrag hat deshalb keinen gesonderten Reaktorschadens-Gate. Es wird keine neue Ursache aus der verworfenen Startpositions-Hypothese abgeleitet.

## Neuer Ablauf

Je ein frischer Chromium-/WebKit-Runner baut das vorhandene Paket. Zuerst muss der vollständige bisherige 60/10/10-Sekunden-Ablauf mit der tatsächlichen mittleren Startposition bestehen. Danach führt ein frischer Browser denselben Ablauf aus, ergänzt um sieben normale native ein-fingrige Spielfeldkontakte je Zyklus. Jede angeforderte horizontale Position muss tatsächlich im Spiel erreicht werden. Der letzte Kontakt führt zurück zur Mitte.

Erst wenn beide kurzen Abläufe bestehen, startet im jeweiligen Job ein weiterer frischer Browser mit denselben Kontakten und anschließend 1.800 realen aktiven Sekunden ohne weitere Spielfeld-Eingabe. Echte Pause, Waffenmenü, bestätigter Home-Ausstieg, zwei neue kurze Läufe und regulärer Berichtsexport bleiben erforderlich. Die vorhandenen harten Gates für Dokument, aktive Frames, Uhr-ID, unveränderte Uhr, null Beobachtungslücken und unerwartete Pausen bleiben byteinhaltlich erhalten. Jeder Fehlschlag stoppt die folgenden Phasen dieses Jobs.

Die sieben Kontakte sind normale Browser-Eingabe, keine direkte Spielzustandszuweisung. Sie sind kein kontinuierlicher Drag und kein Multitouch-Replay. Die Positionsprüfung liest den vorhandenen Inspector während der Vorbereitung; der ursprüngliche aktive Messrhythmus wird nicht erhöht. Der erzeugte Testtreiber bleibt außerhalb des Kandidaten-Checkouts. Seine Vorlage besitzt einen festen SHA-256-Hash, und die Einfügungen sind exakt reversibel. Kein Anwendungsskript, Browser-API, Effekt, Audio oder Spieluhr wird ersetzt. Jeder Ablauf erhält einen getrennten Ergebnis-Unterpfad, damit Kurzlaufdateien unterschiedlicher Bedingungen nicht vermischt werden.

## Grenzen

Der vorhandene Testschutz mit Bossgesundheits-Untergrenze bleibt aktiv. Die identische 430×825-Viewport-/DPR-3-Konfiguration ist eine synthetische Testeinstellung, keine Bestätigung eines physischen Telefons. Zufällige Gegner-/Effektfolgen bleiben ungesetzt. Die Kontaktfolge ist keine Rekonstruktion privater Besitzerkoordinaten. Es gibt keinen kausalen Speichervergleich zwischen den Abläufen. Linux-PSS und App-Teilzähler messen weder native iPhone-Terminierung noch weiße Pixel.

Diese Prüfung ergänzt eine konkrete Kombination aus Eingabe und Laufdauer. Ein grüner Linux-Lauf ist keine Behebung oder Abnahme des mobilen White Screens. Private Besitzerberichte und Videos sind nicht Bestandteil dieses Zweigs.

Status: korrigierte Vorbereitung; die native CI des ersten Ansatzes bleibt fehlgeschlagen und getrennt erhalten. Neue Ergebnisse werden an der korrigierten Quell-ID festgehalten.
