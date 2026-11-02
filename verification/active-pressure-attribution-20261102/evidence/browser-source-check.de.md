# Abgleich mit Browser-Primärquellen

Gelesen am 2. November 2026. Diese Einträge sind Kontext für weitere Prüfungen,
kein Ersatz für Cryptoid-Messdaten und keine Diagnose der Smartphones.

| Primärquelle | Im Bericht beschriebener Mechanismus | Bezug zur vorhandenen Cryptoid-Quelle |
| --- | --- | --- |
| [Chromium 368341452](https://issues.chromium.org/issues/368341452) | Historische OOM-/GC-Diskussion zu großen geerbten Custom-Property-Beständen. Der indexierte Verlauf meldet im Oktober 2024 einen Allokationsfix für Canary 132 und unterscheidet rückgewinnbare Bestände von verbleibendem Speicherbedarf. | Der neue tatsächliche CI-Renderer ist 151.0.7922.34; unsere früheren Dumps nennen bereits `HashTrieNode<CSSVariableData>`. Das ist kein Nachweis, dass der historische Defekt hier wieder vorliegt. Häufigere CSS-Schreibzugriffe oder engere Vererbung dürfen ohne Messung nicht automatisch als höherer bzw. niedrigerer Speicherverbrauch gelten. |
| [WebKit 260925](https://bugs.webkit.org/show_bug.cgi?id=260925) | Ein unbegrenzter Style-Resolver-Sharing-Cache bei vielen unterschiedlichen Shadow-Styles wurde 2023 begrenzt. Die Speicherbehandlung konnte den Bestand zuvor stark reduzieren. | Unter `frontend/src` wurde kein `attachShadow`-/`adoptedStyleSheets`-Aufruf gefunden. Die besondere Shadow-Style-Reproduktion ist damit nicht unser nachgewiesener Pfad. Ein ähnlicher Kurvenverlauf identifiziert keinen gemeinsamen Fehler. |
| [WebKit 324693](https://bugs.webkit.org/show_bug.cgi?id=324693) | Ein Bericht vom September 2026 beschreibt GPU-Prozesswachstum bei wechselnden kurzen Canvas-Texten mit heruntergeladenen Fonts auf iOS 27. Das ist ein gemeldeter Mechanismus mit konkreten Gegenbedingungen. | Der laufende Punkte-Canvas verwendet explizit `bold 16px system-ui`; der andere gefundene Textpfad ist ein separat ausgelöster Sammlungs-Export mit `sans-serif`. Der aktuelle Boss-Dauerlauf ruft diesen Export nicht auf. Die gemeldete Custom-Font-Reproduktion ist damit nicht als Cryptoid-Ursache belegt. |

Die Chromium-Seite lieferte beim direkten Leseabruf nur einen Anmeldelink;
der historische Kommentarverlauf wurde aus dem öffentlich indexierten
Primärquellen-Ergebnis gelesen. Beide WebKit-Berichte waren direkt lesbar.
Es wurden keine Anhänge ausgeführt, keine Browserflags oder Spielquellen
geändert und keine Browser-/OS-Aktualisierung als Reparatur behauptet.

Reproduzierbarer Quellabgleich:

```bash
rg -n 'attachShadow|adoptedStyleSheets|new CSSStyleSheet|fillText|strokeText' frontend/src
```

Die tatsächlich eingesetzten physischen Browser-/OS-Builds sind hier nicht
neu gemessen. Ein Linux-Chromium-Allokatorbefund gilt deshalb weiterhin nicht
als physischer iOS-/Android-/Pi-Browser-Abbruchnachweis.
