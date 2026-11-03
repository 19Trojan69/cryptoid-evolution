# Prüfung der Dokument-Neustartpfade

Gegenstand ist ausschließlich die eingefrorene isolierte Gerätequelle `ac98e95166b0e2013186257904da46323840dab5`. Dies ist eine Quellprüfung, kein Nachweis eines physischen Beendigungsgrunds. Die aktuelle Browser-Version und native Prozessspeicher sind daraus nicht ablesbar.

Der Geräte-Builder ersetzt `App.tsx` durch `devicePreviewApp.jsx`, `useAuth.ts` durch die Gastimplementierung und den echten Pi-SDK-Loader durch die lokale Testdatei. Eine Suche nach harten Navigationsaufrufen in den Frontend- und Gerätequellen findet unter anderem normale Anmelde-/OAuth-Wechsel und einen manuell betätigten Reload-Button in der allgemeinen Route-Recovery. Diese Treffer dürfen nicht ungeprüft zu automatischen Neustarts im isolierten Spiel erklärt werden.

Im tatsächlich verwendeten Geräte-Router öffnet jede neue Dokumentausführung das Menü: `history.replaceState` setzt einen gegebenenfalls vorhandenen Pfad vor dem Boot-Eintrag auf `/`. Das erzeugt selbst kein neues Dokument. Deshalb erklärt ein im Export sichtbarer Menüpfad nicht, warum das vorherige Dokument endete. Er kann auch auf einen vorausgehenden Neustart mit ursprünglichem `/game` folgen.

Die überprüften Home-/Speicherausstiege von `GamePage.tsx` verwenden den vorhandenen SPA-Router. Die Fehlerbehandlung `interruptionRef` pausiert einen laufenden Zustand, stoppt Eingabe und Audio und schreibt den vorhandenen Zustand zurück. In diesen Quellstellen gibt es keinen automatischen `location.reload`-/`assign`-/`replace`-Aufruf, der einen aktiven Gastlauf nach einer festen Laufzeit neu lädt. Die Suche beweist nicht das Fehlen jeder möglichen Host-, Extension-, SDK- oder nativen Navigationsursache.

Die bestehenden Geräte-Kurzberichte zählen nur ausgewählte AudioBuffer und Canvas-Effektflächen. `paintedShipResourceStats()` ist ein separater vorhandener Modul-Getter; Browser-Compositing-/GPU- und gesamter Prozessspeicher gehören nicht zu diesen Teilzählern. Der aktuelle Kontakt-Dauertest ergänzt keine neue Anwendungstelemetrie.

## Primärquellen zum verbleibenden Messbereich

Im [WebKit-Bericht 279637](https://bugs.webkit.org/show_bug.cgi?id=279637) wurde ein anderer iPhone-Seitenabbruch vom Entwickler als Speicher-Druckfall eingeordnet; dort wurden besonders Grafik-/Compositing-Allokationen untersucht. Der [Bericht 277848](https://bugs.webkit.org/show_bug.cgi?id=277848) erläutert ebenfalls, dass native Prozessbeendigung vom gesamten Speicherdruck beeinflusst werden kann. Beide sind historische Fremdfälle und keine Diagnose dieses Spiels. Ihre genannten Grenzwerte werden ausdrücklich nicht als aktuelles Speicherlimit für das Testtelefon übernommen.

Die zusätzlich gefundenen Blur-Fehlerberichte betreffen überwiegend starke Verzögerungen beim Seitenaufbau. Sie belegen keinen Zusammenhang mit dem hier untersuchten späteren Dokumentwechsel. Daraus wird weder eine Grafikänderung noch eine Abschaltung von Ton oder Effekten abgeleitet.
