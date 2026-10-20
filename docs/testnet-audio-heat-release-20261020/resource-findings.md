# Weitere Ressourcenbefunde vor einer Korrektur

20. Oktober 2026. Untersucht wurde der jetzt veröffentlichte Testnet-Code
`b15306f2d22d2196275091c904d068829879efc7`. Die beiden zuvor freigegebenen
Korrekturen sind um 13:02:35.446 Europe/Vienna veröffentlicht worden. Diese
anschließende Untersuchung verändert keine Laufzeitdatei. Neue Befunde werden
wie vom Nutzer verlangt zuerst benannt und noch nicht behoben.

## Belegte Befunde und Reihenfolge

1. **Boss-Waffen: Basisfläche wird bei Ausnahmen nicht ausdrücklich freigegeben.**
   `bossWeaponRenderer.ts` legt vor dem Cache-Eintrag eine Canvas-Basisfläche an.
   Wirft deren `getContext`, `setTransform` oder `drawImage`, fehlt die Freigabe
   durch `finally`. Die spätere `disposeBossWeapons`-Funktion kennt diese Fläche
   nicht. Der kontrollierte Aufruf belegt dies für Kontext- und Zeichenfehler:
   Nach Dispose bleibt jeweils eine Fläche mit 600 × 1200 logischen Pixeln ohne
   ausdrückliche Freigabe (2.880.000 nominelle RGBA-Bytes im Test). Das betrifft
   den tatsächlichen Boss-Renderer im Spiel. Der bereits veröffentlichte Fix
   betrifft die separaten Hitze-Kacheln, nicht diese Basisfläche. Sinnvolle spätere
   Korrektur: Besitz erst nach erfolgreicher Vorbereitung übertragen, sonst die
   Fläche im Fehlerpfad freigeben und die ursprüngliche Ausnahme bewahren.

2. **Bonus-Felsen: Fehlender 2D-Kontext wird dereferenziert.**
   `BonusRockLayer.tsx` erzwingt mit `!` lediglich einen TypeScript-Typ. Liefert
   `getContext('2d')` null, folgt tatsächlich ein Fehler bei `g.translate` und die
   neue 192 × 192-Fläche wird nicht ausdrücklich freigegeben. Die unveränderte
   Texturfunktion reproduziert das im kontrollierten Host. Sie wird auch durch
   den Vorbereitungs-Timer aufgerufen, dessen Callback den Fehler nicht abfängt.
   Der Layer ist während des Spiels bei aktivierter Kampfvielfalt eingebunden.
   Das kann einen globalen Spielfehler/Pause auslösen; ein automatischer Reload
   oder der beobachtete iPhone-Abbruch ist damit nicht nachgewiesen. Spätere
   Korrektur: klarer Fehlerrückgabepfad und vollständige temporäre Freigabe,
   kontrollierter Umgang mit nicht verfügbaren Texturen auch im Timer.

3. **Boss-Karten: Unvollständige Freigabe bei Erfolg und Fehlern.**
   `bossArtwork.ts` setzt die sichtbare Waffen-Arbeitsfläche zwar auf null,
   ruft aber `disposeBossWeapons` nicht auf. Deshalb wird die zusätzliche interne
   Basisfläche selbst im Erfolgsfall nicht ausdrücklich freigegeben. Im Test mit
   Auflösung 256 ist dies eine weitere 256 × 160-Fläche. Bei fehlendem Kontext,
   fehlgeschlagenem Readback oder leerer Grafik bleiben drei bis vier temporäre
   beziehungsweise unvollständige Flächen ohne Freigabe. Außerdem ignoriert der
   Loader `false` von `drawBossWeapons` und meldet eine Karte trotz fehlender
   Waffenzeichnung erfolgreich. Spätere Korrektur: Renderer vollständig entsorgen,
   alle temporären Flächen in `finally` behandeln und Zeichenerfolg prüfen.

4. **Schiffskarten: Fehlerpfade umgehen die Freigabe der Arbeitsfläche.**
   `shipArtwork.ts` gibt die große Quellfläche nur ganz am erfolgreichen Ende
   frei. Kontext-null, Readback-Ausnahmen, leere Grafik oder ein fehlender
   Ausgabekontext umgehen das. Alle vier Pfade wurden mit dem tatsächlichen
   Loader ausgeführt; ein oder zwei nicht fertiggestellte Flächen bleiben ohne
   ausdrückliche Freigabe. Spätere Korrektur: Quellfläche unabhängig vom Ausgang
   freigeben, nur die erfolgreiche Ausgabe an den bestehenden Cache übertragen.

5. **Boss-Texturen: Laufende Ladungen werden bei Cache-Verdrängung dupliziert.**
   `bossWeaponTextures.ts` begrenzt eine gemeinsame Map aus laufenden und fertigen
   Ladungen auf zwei Einträge. Die Anforderung A → B → C → A vor Abschluss der
   ersten Ladung erstellt vier Image-Objekte für drei unterschiedliche URLs;
   das zweite A teilt das erste Promise nicht. Das ist kontrolliert belegt.
   Schnelles Kartenblättern oder überlappende Vorbereitungen können dadurch
   zusätzliche Bild-/Dekodierarbeit erzeugen. Browser-Caching kann doppelte
   Netzwerkübertragungen verhindern; diese sind nicht behauptet. Spätere
   Korrektur: aktive Ladungen separat zusammenführen, fertigen Cache begrenzt
   halten und fehlgeschlagene Einträge weiterhin nur nach Identität entfernen.

Die Befunde 1 und 2 betreffen unmittelbar Spiel-Komponenten und sollten zuerst
behandelt werden. 3 und 4 betreffen Sammlung/Karten beziehungsweise normale
Kartenbelohnungen. Admin-Testläufe überspringen solche Belohnungskarten; diese
Helfer sind deshalb kein belegter Auslöser des bisherigen Admin-Abbruchs.

## Nachweis und Grenzen

`frontend/scripts/auditAdditionalResourceFailures.mjs` bündelt die tatsächlichen
TypeScript-Module des veröffentlichten Stands. Ein kontrollierter Canvas-/Image-
Host löst die benannten Kontext-, Zeichen-, Readback- und Parallel-Ladepfade aus.
Die unveränderte private Felsen-Texturfunktion wird separat aus ihrer Quelldatei
ausgeführt. Die Ergebnisse stehen in `additional-resource-audit.json`.

Ausführen im Verzeichnis `frontend`:

```sh
CRYPTOID_ADDITIONAL_RESOURCE_REPORT=../docs/testnet-audio-heat-release-20261020/additional-resource-audit.json node scripts/auditAdditionalResourceFailures.mjs
```

Dies ist ein Befund-Audit des unveränderten Codes, keine Behauptung bestandener
Korrekturtests. Der Host hält Referenzen absichtlich zur Freigabeprüfung fest.
Ein echter Browser kann solche Objekte durch Garbage Collection zurückgewinnen.
Fehlende ausdrückliche Freigabe beweist weder dauerhafte Speicherbindung noch
einen tatsächlich aufgetretenen iPhone-Kontextfehler. Es gibt weiterhin keinen
Nachweis der nativen/GPU-/Prozess-Speichermenge oder der Whitescreen-Ursache.

Die 48 Material-Cache-Einträge und die konstanten Audio-Puffer aus dem Bericht
werden nicht allein wegen ihrer Größe als Fehler gewertet. Die Galerie-Kopien
sind beabsichtigte Bildausgaben; fehlendes manuelles Nullsetzen beim Unmount
allein belegt keinen Leak. An Bildqualität, Zeichnungen, Audio, Timing,
Spielregeln, HUD, Konten und Spielständen wurde in diesem Audit nichts geändert.
