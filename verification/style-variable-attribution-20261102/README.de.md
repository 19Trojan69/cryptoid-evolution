# CSS-Variablen-Schreibpfade – 2. November 2026

Fortsetzung der gesicherten nativen Zuordnung bei `5ae00a57`. Nach 20 aktiven
Minuten wurden 398,6 MiB Blink-Heap und 103,6 MiB native Blink-Objektbytes
gemessen; nach angeforderter inaktiver GC 18,5 bzw. 4,6 MiB. Große Gruppen
betrafen `CSSVariableData`, `ComputedStyle` und Style-Unterbestände. Der
isolierte Mini-Start-Guard zeigte vorher keine verlässliche PSS-Verbesserung.
Diese Ergebnisse und Rohbelege bleiben unverändert in
`../inactive-native-allocation-20261101/` und `../isolated-mini-pacing-20261101/`.

## Enger nächster Nachweis

Eine frische, auf 60 aktive Sekunden begrenzte Originalszene zählt erfolgreiche
Aufrufe von `CSSStyleDeclaration.setProperty` für CSS-Variablen. HTML-/SVG-
Style-Getter ordnen die Deklaration beim ersten beobachteten Zugriff einem
primitiven Tag-/Klassenlabel zu. WeakMap-Schlüssel sind Style-Deklarationen;
keine Elemente, Komponenten oder Elementlisten werden exportiert oder stark
in der Beobachtung gehalten. Höchstens 512 Ausgabegruppen und 128 letzte
Eigenschaftswerte pro schwachem Schlüssel sind erlaubt. Überlauf ist ein Fehler.

Gezählt werden erste, gleiche und verschiedene **aufeinanderfolgend beobachtete
Aufrufargumente** pro Deklaration/Eigenschaft, einschließlich Priorität. Es gibt
keine zusätzlichen `getPropertyValue`-/Computed-Style-Abfragen. Die Zählung
beweist daher weder gleiche tatsächliche Styles noch Style-Invalidierungen,
Layoutarbeit oder native Allokatorbytes. Andere Schreib-APIs werden nicht
umfassend erfasst; Aufrufe ohne beobachteten Eigentümer bleiben ausdrücklich
unzugeordnet. Originalreceiver, Argumente, Rückgaben, Ausnahmen und die Anzahl
eigener Objekt-Stringkonvertierungen bleiben erhalten.

Die Zählung beginnt in derselben Browserauswertung wie die erste aktive
Stoppuhrbeobachtung. Sie verändert keine Styles, Spielwerte, Uhren, Grafik,
CSS-Animationen, Ton, Timer oder RAF. Die Getter-/Methodenwrapper verursachen
zusätzliche Beobachtungsarbeit; diese Aufnahme ist ausdrücklich **kein
unbeeinflusster Speichervergleich**. Nach dem aktiven Intervall werden die
Originaldeskriptoren wiederhergestellt und die Diagnosebrücke entfernt, bevor
der bestehende Home-Pausendialog und die inaktiven Heap-Aufnahmen beginnen.
Ein später von anderem Code ersetzter Deskriptor wird nicht überschrieben und
darf keine erfolgreiche Wiederherstellung behaupten.

Konfiguration und Regressionen sperren diese Wrapper für 20-Minuten-
Speichervergleiche sowie für Kombinationen mit nativer Dump-Erfassung, den
Mini-Start-Guards oder früheren Grafik-Kontrollen. Ohne Flag bleiben die
bisherigen Messpfade erhalten. Der neue Ablauf benötigt positive Zählungen
sowohl vom originalen Spielerschiff als auch vom originalen Boss-SVG.

Fünf neue Tests führen die tatsächlich in den Browser injizierte Funktion mit
kontrollierten Hosts aus: Aufrufidentität und Rückgabe, begrenztes Intervall,
vollständige Wiederherstellung, einmalige Objektkonvertierung, native Ausnahmen,
unzugeordnete Aufrufe, Budgetüberschreitung und konkurrierende spätere Wrapper.
Hinzu kommen die vorhandenen Inspektions-/Collector-/Parserprüfungen. Erst
danach führt die CI die Originalszene für eine echte aktive Minute aus.

Es gibt keinen Spielquellen-Patch, keine neue Geräte-URL und keine Freigabe.
Ergebnisse werden nach Erhalt und Prüfung des tatsächlichen Artefakts ergänzt.
