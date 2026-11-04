# Begrenzte Wiederverwendung der unveraenderten Schussdarstellung

Die bisherige reine Verschiebung des Muendungslichts belegt keinen Ressourcen-
Fix. Dieser isolierte Kandidat prueft einen anderen Aufwand: fuer jeden neuen
Schuss erzeugt projectilePresentation.ts bisher ein frisches natives div samt
Pseudo-Elementen. Der Kandidat bewahrt bis zu32 abgeschlossene Eintraege je
Spieler-/Gegnergruppe auf und verwendet sie fuer spaetere Schuesse wieder.
Leere Pools erzeugen weiterhin die originalen Elemente. Aktive Grenzen,
Schussdaten, Reihenfolge, Bewegungsformeln und Trefferlogik bleiben unveraendert.
Keine per-Frame-Sets, Timer, Frames, Globals oder neuen Schussanimationen.
Dispose gibt beide Pools und die vorhandenen Gruppen frei.

Nur der exakte Modul-SHA256 deb3c488892c3096b5086b35ab3141aa1e1c5f7cd34f2e8a1ae714ef9ebd96db
ist erlaubt. Vier feste Hunks muessen den ganzen Originaltext wiederherstellen.
Die echte importierte TypeScript-Modulpruefung darf keine neuen Fehler haben.
Vite erhaelt nur eine virtuelle Variante; die Runtime-Quelldateien, Controller,
Clock, CSS, Audio und Assets bleiben bytegleich. Beide Arme benutzen denselben
direkten Boss-Style-/HUD-Stand und den ORIGINALEN Muendungslicht-Schreibpfad.

Vor laengeren Messungen muessen beide Engines Folgendes bestehen:

1. Isolierte echte Browser-DOM-Pruefung mit24.000 neuen synthetischen Schuessen,
   echter unveraenderter CSS und echten importierten Profilfarben. Haupt-/Pseudo-
   Computed Styles, Geometrie, weiterlebende Knoten, mutable Appearance, leere
   Bestaende und groesserer Burst stimmen ueberein. Nach Overflow duerfen genau
   die fehlenden136 von200 Elementen neu entstehen: hoechstens64 werden gepoolt.
   Jede unerwartete native Schussanimation laesst die Pruefung scheitern, statt
   ihre Wiedergabe ohne Neustartvertrag zu veraendern.
2. Urspruenglicher kompletter60/10/10-s-Gastablauf beider Arme: normaler Start,
   Fortschritt, echte Pause/Resume, Waffenmenue, Home und Bericht. Nur hier weist
   ein schwacher MutationObserver die tatsaechliche Knoten-Wiederverwendung nach.
   Das ist keine unbeeinflusste Ressourcenmessung und kein neuer Feldkontakt-Test.

Erst dann zwei frische20-Minuten-Prozesse pro Arm in Chromium, dieselben
unbeschleunigten aktiven Uhren, keine aktiven Traces/Heaps/GC/Animation-Scans/
Screenshots/Observer/API-Wrapper. Bestehende harte Pausen-/Home-Gates und alle
inaktiven Dumps bleiben erhalten. Fuer die Entscheidung muessen alle vier
Laeufe vollstaendig sein und BEIDE Paare mindestens15% niedrigeren Renderer-
PSS-Schlussmedian zeigen. Reine API-/Erzeugungszahlen reichen nicht. Ein
bestandener Host-Vergleich beweist noch keine native iPhone-/Android-Stabilitaet.
Bei fehlendem Vorteil kein neuer Besitzer-Dauertest aus diesem Kandidaten.
Keine privaten Handydateien, kein oeffentliches Deployment oder neuer Spielstand.

## Erster Paketversuch vor dem Spielstart gestoppt

CI41777545605 aus e32b10094996a114974b4970f575a35b49f3fb72 besteht in allen
vier Jobs die reversible Quelle und die native Darstellungspruefung:24.000
synthetische Schuesse,24.002 statt14 erzeugte Elemente einschliesslich zweier
Gruppen. Der folgende Build stoppt in beiden Armen und Engines, weil der
bestehende Paket-Builder alle CRYPTOID_-Umgebungsvariablen absichtlich entfernt.
Die neu eingefuehrte Variantenwahl lag irrtuemlich ebenfalls in diesem Bereich.
Kein Spieleinstieg und keine Speicherlaeufe dieser Serie. Die Korrektur gibt
nur dieser Build-Einstellung einen separaten Namen; Quell-/Paketpruefungen und
die absichtliche Entfernung der anderen Diagnose-Schalter bleiben unveraendert.

## Abschluss: kein verlasslicher Speichervorteil, nicht als Fix uebernehmen

Korrigierte Quelle bdb81737eb35bca32542381119b0b046290a1242,
CI41777900101: alle vier Kurzablaeufe und alle vier Speicherlaeufe bestehen.
Jeder Speicherlauf beobachtet1.200.000 aktive ms und428 fortgeschrittene
Reaktor-Salven. Derselbe vorhandene private Boss-2-Aufbau, keine komplette
Kampagne und kein physisches Smartphone. Die Langlaeufe installieren den
kurzen Wiederverwendungs-Beobachter ausdruecklich nicht.

| Wiederholung | Kontrolle Schlussmedian MiB | Pool Schlussmedian MiB | Abnahme |
|---|---:|---:|---:|
| 1 | 295.9902 | 293.0088 | 1.0073 % |
| 2 | 285.9033 | 296.5771 | -3.7334 % |

Kein Paar erfuellt die vorab festgelegten15%. Die nativen Blink-Objektbytes
am inaktiven Punkt vor ausdruecklicher GC sind12.730.200/7.969.656 und
9.538.296/10.092.520 fuer Kontrolle/Pool. Das ist keine einheitliche Abnahme.
Zwei unseeded unabhaengige Host-Prozesse pro Arm beweisen auch keine kausale
Verschlechterung. Deutlich weniger neue native DOM-Elemente sind somit in
dieser Serie kein nachgewiesener Renderer-PSS- oder White-Screen-Vorteil.

Entscheidung: den Pool nicht als White-Screen-Fix uebernehmen, kein neuer
Besitzer-Dauertest und kein Telefon-Preview aus diesem Ergebnis. Keine
Runtime-/Grafik-/Audio-/Input-/Uhr-Aenderung und kein Deployment. Der native
Abbruchgrund und eine dauerhafte iOS-/Android-Behebung bleiben ungeklaert.

Alle28 transportkomprimierten Ergebnisdateien wurden byte-/hashgeprueft.
Alle acht Original-Artefakt-ZIPs stimmen in Groesse und SHA256 mit GitHub
ueberein; ihre erfassten Dateien sind identisch. Acht Heap-gzip-Digests und
Dekompressionsgroessen bestehen, ohne neue Heap-Graph-Auswertung dieser Serie.
Alle16 nativen Dumps wurden mit dem unveraenderten bestehenden Parser erneut
eingelesen und alle Kategorien/Fragmentzuordnungen verglichen. Vergleich,
Manifeste und Nachpruefer stehen unter evidence/. Native Traces haben wegen
der unveraenderten Transporthuelle zwei gzip-Huellen (.json.gz.gz).
Die ZIPs haben die normale siebentaegige CI-Aufbewahrung; die komprimierten
erfassten Ergebnisse, nativen Traces, Quittungen und Entscheidung stehen im Git.
