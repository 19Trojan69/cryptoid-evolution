# Käufe, Waffenaktivierung und Vollaufzeichnung

Am 23. Oktober meldet Marc fehlgeschlagene Käufe und Aktivierungen gekaufter
Waffen. Rund 15 Minuten im Pausenmenü führten in diesem Lauf zu keinem Absturz.
Sein neuer v6-Bericht stammt aus der offiziell veröffentlichten Vergleichsversion
`38002f07f9c8c20cb68e4416492ab7749944b104`.

## Befund des Geräts

Der Dokumentstart liegt bei 05:31:30.469 Uhr und der Bericht bei 06:15:39.517 Uhr
(Europe/Vienna). Diese etwa 44 Minuten umfassen Pausen und sind keine 44 Minuten
aktive Spielzeit. Der letzte Ablauf zeigt Level 68: Projektiltreffer, `destroying`,
`game-over`, `home-intent`, anschließend `unmount` und `finished: true`.
Das ist ein regulärer Spielabschluss. Es gibt hier keinen Nachweis eines neuen
unerwarteten Neustarts und noch keinen Beweis einer dauerhaften Absturzbehebung.

`lastSavedAt` bleibt auf 05:38:19.878 Uhr stehen. Die Vollaufzeichnung meldet ab
05:38:27.224 Uhr einen `storage-error`: zuletzt 3550 bestätigte Datensätze,
danach Beobachtung 3553 bei Level 51. Beim Lesen ist die Datenbank erreichbar,
liefert aber keine Sitzungszusammenfassungen. Der Bericht enthält weder die
ursprüngliche Datenbankexception noch die fehlgeschlagenen Kaufantworten.

Die zeitliche Nähe ist ein Ansatzpunkt. Sie beweist weder einen gemeinsamen
Fehler von Server und Browserspeicher noch eine volle Speicherquote, einen
abgelaufenen Login oder eine Ursache des früheren Whitescreens. Die weiterhin
verfügbaren lokalen Ringaufzeichnungen sind von der fehlenden Vollaufzeichnung
zu unterscheiden. Vorhandene Kauf-/Spielstanddaten werden nicht gelöscht.

## Reproduzierte Fehler und vorbereitete Korrektur

Die tatsächlichen Auswahlfunktionen und die unveränderten Konto-/Aktivierungs-
Handler bestätigen weiter offene Vorgänge mit derselben Vorgangsnummer. Eine
bereits gewährte Ladung wird dadurch nicht ein zweites Mal verbraucht.

Im tatsächlichen Menü blockiert eine fehlgeschlagene Bestandsabfrage zusätzlich
den Wiederholungsbutton dieser offenen Aktivierung. Der Button bleibt nun für
genau diese Vorgangsnummer benutzbar. Auch die reine Bestandsaktualisierung ist
bei einer offenen Bestätigung wieder möglich. Neue Käufe bleiben bis zur
Klärung und einem bestätigten Bestand gesperrt.

Im tatsächlichen Zahlungshook sind Lesen, Speichern und Löschen einer optionalen
Fehlermeldung bisher ungeschützt. Bei verweigertem Speicher oder einer vollen
Quote kann deshalb die Fehlerbehandlung selbst werfen und den Kaufstatus auf
„beschäftigt“ festhalten. Die Meldung wird nun unmittelbar im Arbeitsspeicher
geführt; ihre zusätzliche Speicherung darf fehlschlagen. SDK-Fehler verwenden
dieselbe aktuelle Meldung statt eines möglicherweise alten Speicherwerts.
Tokenanforderungen, Pi-Metadaten, Serverbestätigungen und Kaufgutschriften bleiben
unverändert. Ein neuer Kauf entsteht ausschließlich durch die bestehende Aktion.

Die Aufzeichnung behält bisher eine vom Browser außerplanmäßig geschlossene
Datenbankverbindung im Cache. Nach dem `close`-Ereignis wird genau dieser
Cacheeintrag nun ungültig; die nächste vorhandene Lese-/Schreibaktion öffnet die
Datenbank neu. Es gibt keine Wiederholungsschleife und keinen automatischen
Neustart einer bereits fehlgeschlagenen Aufzeichnung. Gelöschte Historie wird
nicht rekonstruiert oder als vollständig ausgegeben.

Im bisherigen Statusmarker steht zusätzlich eine feste Fehlerkategorie:
`history-missing`, `quota-exceeded`, `storage-denied`, `connection-closed`,
`timeout`, `blocked`, `sequence-conflict`, `storage-unavailable`, `write-failed`
oder `unknown`. Beliebige Fehlermeldungen, URLs, Stacks oder Identitäten werden
dafür nicht gespeichert. Das liefert beim nächsten tatsächlichen Fehler mehr
Information, erklärt aber nicht rückwirkend die Exception dieses Laufs.

## Prüfung und Grenzen

Vor der Korrektur scheitert die neue Menüregression bei 17 bestehenden Erfolgen.
Fünf der sechs neuen Zahlungstests scheitern; die gesunde Kaufkontrolle besteht.
Die drei neuen Speicherprüfungen scheitern: geschlossenes Verbindungsobjekt,
fehlende Historie und fehlende sichere Fehlerkategorien. Alle drei Fälle werden
mit tatsächlichem Recorder-/Store-Code und isolierter IndexedDB ausgelöst.

Nach der Korrektur bestehen im vollständigen Build 87 Prüfungen: 12 Sprachtests,
36 Aufzeichnungs-/Export-/Grafikdiagnosefälle, 15 Canvas-Regressionen sowie
18 Waffen- und 6 Zahlungsprüfungen. Sprachenfreigabe, TypeScript und Vite sind
erfolgreich. Die vier geänderten Hook-/Utilitymodule linten ohne Meldungen.
Der vorhandene Hinweis auf große Bundles bleibt bestehen. Der erste isolierte
Grafiktestlauf fand noch keine generierten PNGs; nach dem regulären `prebuild`
bestehen diese unveränderten Prüfungen ebenfalls. Es wurde kein Test abgeschwächt.

Die Auswahltests führen die tatsächlichen Handler aus; zwei Fälle nutzen die
unveränderten Backendhandler mit isolierten Speicherkonten. Die Zahlungstests
ersetzen React-Zustandsplanung, SDK-Brücke und Transport. IndexedDB wird durch
`fake-indexeddb` einschließlich erzwungener Schließung und Historienverlust
geprüft. Das sind keine physischen iPhone-, Pi-Login- oder Walletprüfungen.
Die verfügbaren Playwright-Module besitzen hier keine installierte Browserengine.

GamePage, Bildladen, Grafik, CSS, Sounds, Backend/API, Preise, Bestände und
Spielstand-Warteschlange sind bytegleich zum Ausgangsstand. Sieben Ausgangsblobs
wurden unabhängig mit dem aktuell veröffentlichten GitHub-Stand verglichen.

Vorbereitung auf `codex/shop-storage-audit-20261023`, automatisches Deployment
deaktiviert. Offizielles Testnet bleibt bei `38002f0`; Mainnet und alle festen
Release-/Rollbackreferenzen bleiben erhalten. Veröffentlichung ist ein eigener
Freigabeschritt gemäß `frontend/AGENTS.md`.
