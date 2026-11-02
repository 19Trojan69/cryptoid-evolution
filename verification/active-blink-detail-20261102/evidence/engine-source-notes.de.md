# Quellbezug der nativen Style-Klassen

Gelesen am 2. November 2026, exakt am Chromium-Tag `151.0.7922.34`.
Diese Quellbezüge ergänzen die Messdaten; sie ersetzen keinen Retainer- oder
Allokationsstack-Nachweis des laufenden Spiels und keine Smartphone-Abnahme.

## Direkt im Browsercode geprüft

- [matched_properties_cache.cc](https://github.com/chromium/chromium/blob/151.0.7922.34/third_party/blink/renderer/core/css/resolver/matched_properties_cache.cc):
  Die Cache-Suche vergleicht auch geerbte Variablen. Ein Miss kann neue
  Cache-Objekte/-Einträge hinzufügen. Die GC-Weak-Callback-Registrierung führt
  zur Bereinigung; dort liegen die Grenze 500 und das LRU-Ziel 300. Diese
  Bereinigung ist nicht einfach ein bei jedem Hinzufügen ausgeführter harter Cap.
- [matched_properties_cache.h](https://github.com/chromium/chromium/blob/151.0.7922.34/third_party/blink/renderer/core/css/resolver/matched_properties_cache.h):
  Die Cache-Einträge referenzieren Styles und Eltern-Styles über getracete
  `Member`-Felder; die Gültigkeit der Property-Schlüssel wird gesondert über
  GC-Schwäche behandelt. Ein solcher Cache kann also Style-Unterstrukturen
  referenzieren; dies benennt nur einen im Quellcode vorhandenen Besitzpfad.
- [blink_gc_memory_dump_provider.cc](https://github.com/chromium/chromium/blob/151.0.7922.34/third_party/blink/renderer/platform/heap/blink_gc_memory_dump_provider.cc):
  Der Detailprovider aggregiert pro Typ über Seiten und gibt globale Typzeilen
  mit Größe und Objektanzahl aus. Diese globalen Zeilen sind die Datenbasis;
  zugehörige Seiten-/Eltern-/Aliaswerte werden nicht zusätzlich addiert.

## Zulässige und unzulässige Folgerungen

Die Kalibrierung zeigt tatsächlich Style-, CSS-Variablen- und
`CachedMatchedProperties`-Objekte. Der Browsercode liefert dazu einen plausiblen
Mechanismus für Bestände, deren Größe von Style-Änderungen und späteren
Bereinigungszeitpunkten abhängt. Der im Spiel bereits gemessene häufige Wechsel
von `--boss-thrust` und `--weapon-charge` an großen Unterbäumen ist damit eine
gezielte Arbeitshypothese für die folgenden Lastdaten.

**Nicht bewiesen:** Die native Anzahl `CachedMatchedProperties` ist kein gelesener
aktueller Cache-Eintragszähler. Sie kann noch nicht bereinigte Objekte umfassen.
Eine globale Klasse verrät weder ihre konkreten aktuellen Referenten noch den
auslösenden React-/Spielaufruf. Aus der GC-Callback-Grenze folgt kein im Spiel
gemessener unbeschränkter Cache und keine bewiesene mobile Absturzursache.
Auch eine einzelne große Klasse erklärt nicht automatisch alle freien Heap-
Bereiche, Poolbestände oder die vollständige Prozess-PSS.

Erst die tatsächlich abgeschlossenen Druckaufnahmen zeigen, welche Klassen beim
großen aktiven Heap vertreten sind. Eine darauf beruhende virtuelle Variante
muss Darstellung, Animationen und Uhren erhalten und wiederholt gegen das
Original geprüft werden. Es wird keine Browsergrenze oder GC-Steuerung verändert.
