# Korrektur der fünf Ressourcenbefunde

Freigegeben am 20. Oktober 2026 um 13:12 Europe/Vienna mit „Dann fixe das bitte
alles“. Ausgangspunkt ist der veröffentlichte Testnet-Code `b15306f`; der
Audit-Branch steht vor den Änderungen auf `804b633`. Die folgenden Korrekturen
betreffen genau die fünf zuvor benannten Bereiche.

1. **Boss-Basisfläche:** Die Basisfläche wechselt erst nach erfolgreichem
   Kontextaufbau und Zeichnen in den bestehenden Cache. Bei null oder einer
   Ausnahme wird sie in `finally` auf Größe null gesetzt. Die ursprüngliche
   Ausnahme beziehungsweise der vorhandene false-Rückgabepfad bleibt erhalten.

2. **Felsentexturen:** Nicht verfügbare oder fehlschlagende Texturen geben null
   zurück und geben ihre neue Arbeitsfläche vollständig frei. Das erzeugt keinen
   unbehandelten Fehler im vorhandenen Vorbereitungstimer. Eine nicht verfügbare
   Textur wird nicht an `drawImage` übergeben und nicht in den Cache aufgenommen;
   ein späterer regulärer Zeichenaufruf kann erneut vorbereiten. Kein zusätzlicher
   Timer und keine Ersatzgrafik. Physik und Kollisionen werden nicht verändert.

3. **Boss-Karten:** Die Waffenzeichnung muss erfolgreich sein. Die sichtbare
   Waffen-Arbeitsfläche wird einschließlich der internen Basis über
   `disposeBossWeapons` entsorgt. Kombinationsfläche und fehlgeschlagene Ausgabe
   werden bei jedem Ausgang freigegeben; nur die erfolgreiche Karte bleibt im
   bestehenden Cache. Fehlende Waffen können keine fälschlich erfolgreiche Karte
   mehr erzeugen.

4. **Schiffskarten:** Die große Quellfläche wird in `finally` freigegeben.
   Eine unvollständige Ausgabe wird ebenfalls freigegeben; eine erfolgreiche
   Ausgabe bleibt wie bisher erhalten. Nach einer Ablehnung kann dieselbe Karte
   über den vorhandenen Cache-Fehlerpfad erneut geladen werden.

5. **Boss-Texturen:** Eine separate Map führt bereits laufende Ladevorgänge
   zusammen, auch wenn deren Eintrag aus dem weiterhin auf zwei begrenzten Cache
   verdrängt wurde. Abschluss und Fehler entfernen den aktiven Eintrag nach
   Identität. Fehlgeschlagene Ladungen können erneut angefordert werden.

## Prüfung

- 44 tatsächliche Vorher-/Nachher-Aufrufe für Kontext-null, Kontext-, Transform-,
  Zeichen- und Readback-Ausnahmen, leere Bilder, erfolgreiche Aufbereitung,
  Freigabe, Wiederholbarkeit, parallele Ladungen, Cache-Grenze und Ladefehler.
- Sieben Prüfungen mit den tatsächlichen TSX-Effects und Timer-Callbacks des
  Felsen-Layers: drei Fehlerarten mit alter/neuer Version sowie Unmount vor
  Vorbereitungsbeginn. Neue Version: kein ungefangener Vorbereitungsfehler,
  keine Übergabe fehlender Texturen an `drawImage`, erfolgreiche Erholung und
  unverändert begrenzte Vorbereitung mit sauberem Timer-Abbruch.
- 1.803 exakte RGBA-Vergleiche mit Originaldateien im nativen CPU-Raster:
  1.650 Boss-Zeichenfälle (alle 50 Bosse, drei Auflösungsverhältnisse, neun
  Hitzestufen, Zerstörung/Recoil/Frozen), 50 Boss-Karten in 1200px-Aufbereitung,
  60 Schiffseditionen, 29 Farb-IDs, sieben Felsentexturen und sieben vollständige
  Felsen-/Effektframes.
- 68 gezielte bestehende Tests bestehen: Boss-/Reaktorkampf, alle 392 Geschütze,
  Sektorfluss, Felsenphysik, Kartenregeln/-Download, Loop-Erholung, Admin-Audio
  und Owner-Diagnose. Der Release-Build besteht einschließlich 12 Sprachtests,
  Freigabe-Sprachprüfung, TypeScript und Vite. Bestehende große Bundle-Warnung.
- Der historische Befund-Audit bleibt mit seinen 15 Fällen gegen exakt `b15306f`
  reproduzierbar. Seine gespeicherte JSON-Ausgabe bleibt bytegleich.

Prüfskripte im Verzeichnis `frontend`:

```sh
node scripts/verifyAdditionalResourceFixes.mjs
node scripts/verifyRockFailureRecovery.mjs
node scripts/verifyBossHeatLifetime.mjs
```

Die zugehörigen JSON-Ergebnisse liegen neben diesem Bericht. Die Testhosts halten
Flächen absichtlich zur Prüfung fest. Ein Browser kann unreferenzierte Objekte
auch durch Garbage Collection zurückgewinnen; die früher fehlende ausdrückliche
Freigabe ist kein Beweis eines dauerhaften Leaks. Diese Tests messen keine
physische iPhone-/WebKit-/GPU-/Prozessspeichermenge und beweisen weiterhin nicht
die Ursache des Whitescreens. Erfolgreiche Bilder sind pixelgleich; Spielregeln,
HUD, Sounds, Konten, Käufe, Spielstände und Ranglisten wurden nicht geändert.

Die Veröffentlichung im bestehenden offiziellen Testnet ist um 13:25:37.836
Europe/Vienna abgeschlossen: `23b9f83` /
`dpl_whZtejzMwRDZEDs71ohk3GGDaWHn`, Status READY. `b15306f` /
`dpl_4ckqHNmsXh7NnQiYK79aHcsYeAZK` bleibt als unmittelbare Rückfallversion
gesichert. API, alle drei Highscore-Antworten und Originalgrafik sind unverändert
geprüft; Mainnet bleibt unverändert. Elf neue Server-Anfragen enthalten keine
Warnungs-/Fehler-/Fatal-Protokolle. Details und ausgelieferte Versionskennung
stehen in `release.json`, der sichtbare Nachweis in `testnet-ready.jpg`.
