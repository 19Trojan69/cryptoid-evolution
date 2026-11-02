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

## Bestätigter Kurzlauf

Quelle `0f21c59239fafad5f2d396bcf940f8e7812a9d5d`, Baum
`51d66b277803a3dc200a3c675a603b3cbaeb8e44`,
[CI 41382160334](https://github.com/19Trojan69/cryptoid-evolution/actions/runs/41382160334).
Beide Jobs sind erfolgreich. Der Browser beobachtet 60.000 ms aktive Zeit und
21 zusätzliche Kernsalven. Alle zehn inaktiven Grenzen und beide Heap-Aufnahmen
bestehen. ZIP-Digest/Integrität, beide Snapshot-Digests, Rohgrößen und erneut
berechnete Graph-/Klassensummen stimmen. Das vollständige Capture ist verlustfrei
komprimiert gesichert; vier weitere Offline-Regressionen sichern Quellen,
Laufzeit, ursprüngliche Besitzer, Zählkonsistenz und vollständige Wiederherstellung.

Insgesamt 24.929 erfolgreiche CSS-Variablen-Aufrufe: 3.619 erste Beobachtungen,
13.634 gleiche vorher beobachtete Argumente und 7.676 verschiedene Argumente.
Kein Aufruf bleibt ohne beobachteten Besitzer oder klassifizierbares Argument;
kein Überlauf, Beobachterfehler oder fehlgeschlagener Originalaufruf wird gezählt.
Sämtliche originalen Getter-/Methodendeskriptoren sind vor der Pause wiederhergestellt
und die Beobachtungsbrücke ist entfernt. Der Testschutz und die fehlende aktive
Spielereingabe sind dieselbe diagnostische Bedingung wie zuvor; die konstanten
Schiffswerte dürfen nicht auf alle echten Steuerungszustände verallgemeinert werden.

| Beobachteter Pfad | Aufrufe | gleiches vorheriges Argument | anderes vorheriges Argument |
| --- | ---: | ---: | ---: |
| Spielerschiff `--flame-length` | 3.696 | 3.695 | 0 |
| Spielerschiff `--hull-light` | 3.696 | 3.695 | 0 |
| Spielerschiff `--visual-bank` | 3.696 | 3.695 | 0 |
| Spielerschiff `--muzzle-light` | 3.696 | 2.549 | 1.146 |
| Boss-Wurzel `--boss-thrust` | 1.797 | 0 | 1.796 |
| Boss-SVG `--weapon-charge` | 1.797 | 0 | 1.796 |

Je Pfad kommt die erste Beobachtung hinzu. Die Aufrufe sind keine Allokator-
Messung. Ein gleiches Argument beweist keinen vermiedenen oder verursachten
nativen Style-Aufwand. Der instrumentierte PSS wird ausdrücklich nicht mit den
unbeeinflussten Langläufen als Optimierungswirkung verglichen.

## Abgeleiteter isolierter Versuch

`--boss-thrust` wird in der vollständigen Quelle nur an der Boss-Wurzel gesetzt
und nur für die Höhe der vorhandenen `.boss-engine-flame` verwendet. Der Wert
wechselt im echten Kurzlauf 1.796-mal. Das rechtfertigt als einzelnen Versuch,
**denselben Ausdruck direkt an den bestehenden Triebwerksflammen zu setzen**,
statt ihn durch den gesamten Boss-Unterbaum zu vererben. Grafik, Anker, Anzahl,
CSS-Regeln, Animationen und Spieluhren müssen identisch bleiben.

Das ist zunächst eine überprüfbare Hypothese zur Style-Erzeugung. Bei mehreren
Flammen können mehr API-Schreibzugriffe entstehen; reine Aufrufzahlen sind
deshalb kein Erfolgskriterium. Erforderlich sind ein genau begrenzter und
umkehrbarer Vergleich, gleiche berechnete Darstellung und native Zeitabläufe,
danach wiederholte Original-/Vergleichs-Langläufe ohne aktive Beobachtungswrapper.
Erst eine reproduzierte Ressourcenverbesserung rechtfertigt einen Runtime-Patch.
Die frühere Mini-Start-Negativserie und die offene WebKit-Startlücke bleiben erhalten.

**Nachgewiesen:** konkrete ursprüngliche Style-Schreibpfade, vollständige
Beobachtungsfreigabe und nachprüfbare Zählungen. **Vermutung:** kleinere
Vererbungsbereiche könnten die native Style-Belastung senken. **Keine bestätigte
Spielverbesserung oder Smartphone-Behebung** aus dieser kurzen API-Zählung.
