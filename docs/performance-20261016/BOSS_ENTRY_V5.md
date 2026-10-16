# V5 – gezielte Bossstart-Messung

V5 ist eine genauere private Diagnose, **keine nachgewiesene Lösung des Safari-
Abbruchs**. Ausgangsstand ist `b86ed7d6d51af805e7706c6ec301a9e6fd3393b8`;
Backup `backup/diagnosis-v4-before-entry-probes-20261016`. Testnet und Produktion
bleiben unverändert. Keine Änderung an HUD, Größen, Flugbahnen, Geschwindigkeit,
Power-up-/Schusslogik, Sounds, CSS oder Originalressourcen.

## Grundlage

Die gerettete V4-Spur endet um 10:01:11 Uhr Vienna in `normal/SECTOR_CLEAR`, interne
Stufe 39, vor dem nächsten Boss bei 40. Kein bestätigtes Fehler-/Home-Ereignis am
Ende; der eigentliche Bossstart fehlt. Safari ist vom Nutzer bestätigt, ein weißer
Bildschirm ausdrücklich unsicher. Es werden keine falschen Ursachen aus der
Erinnerung oder fehlenden Fehlerereignissen abgeleitet.

Die bisherige Zehn-Sekunden-Sicherung kann die kritische Phase verpassen. Der
erfasste Rumpfcache ist kein Gesamt-/GPU-/WebView-Speicherzähler. Prüfung der
Originalbilder: Waffenatlas von Bossmodell 3 = 2048 × 362, Modell 4 = 2048 × 966.
Eine einfache RGBA-Schätzung ergibt 2,83 bzw. 7,55 MiB; das ist keine gemessene
Speicherbelegung auf dem iPhone und beweist keine Speicherursache. Der konkrete
Waffenbildcache ist bereits auf zwei Einträge begrenzt.

## Ergänzte Messpunkte

- Sofortige Sicherung beim Beginn des letzten normalen Clear vor einem Boss sowie
  bei Boss-Phasenwechseln; gewöhnliche Fenster behalten den bisherigen Takt.
- `boss-model-start` und `boss-model-ready` unmittelbar um die unveränderte
  Bossmodellerzeugung, mit dem neuen internen Stufenkontext.
- `boss-texture-start`, `boss-texture-ready`, `boss-texture-error`: echte Ereignisse
  des vorhandenen Image-Laders, ohne weitere Bilder, Requests oder Decode-Aufrufe.
  Geladene Atlasmaße und Bossmodell-ID werden als Zahlen erfasst.
- `boss-canvas-first-draw` nach erstmaliger Rückkehr der vorhandenen Zeichenroutine
  je montiertem Bossmodell, mit Canvasmaßen; `boss-canvas-release` nach Bereinigung.
  Diese Markierung beweist keine sichtbare GPU-Ausgabe und keine vollständige
  Pixel-/Dekodierungsmessung. Wiederholte Frames erzeugen kein zusätzliches Ereignis.
- `audioBufferBytes`: aus Länge und Kanalzahl der vorhandenen Effekt-Audiopuffer
  berechnete PCM-Größe; Lesen nur im ohnehin aktiven Entwickler-Runtime-Sampling.
  Keine Änderung des Audioablaufs; gestreamte Musik und Browserinternes sind ausgeschlossen.

Der optionale Ressourcenabonnent hält weder Bilder noch Canvas-/Audioobjekte fest,
besitzt keine Timer und wird beim Ende der Entwicklerprobe entfernt. Fehler im
Empfänger beeinflussen den Bildlader nicht. Die zusätzlichen Ereignisse gehen
über dieselbe begrenzte, zusammenfassende Sicherung mit Positivliste. Keine neuen
Identitätsdaten, URLs oder Fehlermeldungstexte werden übertragen.

Ein abrupt beendeter Prozess kann weiterhin letzte ungesendete Daten verlieren.
Sofortiges Anstoßen eines Prüfpunkts ist keine synchrone Serverbestätigung.

## Prüfungen

- **415 Tests bestanden**, 0 fehlgeschlagen/übersprungen. Frontend-Build mit
  TypeScript und Sprachprüfungen erfolgreich.
- Neue Regressionen: kritische Prüfpunkte werden unmittelbar persistiert und
  überschreiben nicht den vorherigen Phasenkontext; Bild-Promise/-URL bleibt
  gemeinsam genutzt, Größen werden protokolliert; fehlerhafter Abonnent blockiert
  den echten Bildlader nicht; neue Felder überleben die Datenschutz-Positivliste.
- Quellenvergleich gegen öffentlichen Ausgangspunkt besteht: übriges JSX,
  Mechanik und aktive Originaldarstellung bleiben erhalten. Neue Simulationseinträge
  sind ausschließlich Messaufrufe. Canvas-Zeichenroutine selbst unverändert.
- Vergleich aller 50 Bossansichten besteht weiterhin: Rumpf-/Canvasbesitz beim Fall
  bleibt erhalten, Host-Bäume gleich, vollständige Bereinigung. Wie V4 verwendet
  dieser Vergleich Präsentationsstubs, keine Safari-/GPU-Messung.
- Tatsächliche GamePage-Simulation: 450 normale Stufen, 49 Bosse, 13.646,316
  simulierte Sekunden; Zustandshash exakt wie V4:
  `2168c6035edd5e762b404e8c4568d73a89c41b78d940de51ac8a4d3849a2c398`.
  Ende mit 0 erfassten RAF/Timern/Listenern.
- Diagnose an: 60 normale Stufen und 6 Bosse, 1.513,544 Sekunden; vollständige
  Bereinigung. Simulationen ersetzen Darstellung/Hardware-Audio/Konto-APIs und
  erzwingen Abschlüsse bzw. zusätzliche Leben; sie beweisen keine Geräte-Stabilität.
- 262 Originalressourcen der Vorschau bytegleich.
- Echter authentifizierter HTTPS-Test: neue Boss-Texturmarkierung und Maße
  gespeichert und unabhängig wieder abgerufen; veraltete Revision geschützt,
  unbekannte Felder entfernt, QA-Daten nicht im Nutzerbericht. Ohne Anmeldung
  bleibt Diagnosezugriff HTTP 401. Root-HTML und Bundle entsprechen exakt dem Build.
- React-Prüfung: stabiler Ref für einmalige Zeichenmarkierung, kein neuer
  Renderzustand, unveränderte Effektabhängigkeiten, Abonnenten-/Canvasbereinigung,
  keine zusätzlichen Game Loops, Browserlistener oder Timer.

## Vorschau und nächster kurzer Test

[Private V5](https://cryptoid-crash-diagnosis-20261015.xwsk9s27cg.chatgpt.site)
mit Menükennung **„Absturzdiagnose V5 · Bossstart-Messung 16.10.“**.
Startpunkt ist jetzt 39; zusätzlich sind 31 und 40 auswählbar. Dies betrifft nur
das private Testmenü. Ein kurzer Safari-Test von 39 in Boss 40 untersucht genau
den zuletzt betroffenen Übergang. Ein direkter Start bei 40 kann bei Bedarf den
frischen Bossstart vom vorhergehenden normalen Kampf unterscheiden.

Offen bleiben Ursache des echten Abbruchs, Gerätedurchlauf, Pi Browser und eine
gemessene FPS-Verbesserung. Es wird keine weitere Absturzfreiheit behauptet.

Private Site-Version 5, Quelle `7d0e077cca2479f579ca6956627d13db153cb8e0`,
Deployment `appgdep_6ad1e6b0dc4c8191abb29009c85f477e`, Status `succeeded`.

Geändert: `GamePage.tsx`, `BossWeaponsView.tsx`, `bossWeaponTextures.ts`,
`bossResourceDiagnostics.ts`/Test, `gameAudio.ts` (nur lesender Diagnosegetter),
`performanceDiagnostics.ts`/Test, `traceBackupFormat.ts`, `remoteTraceBackup.ts`,
privater Diagnosedienst, Vorschau-/Prüfskripte und Dokumentation. Schema/Migrationen
bleiben unverändert; bestehende Sicherungen bleiben abrufbar.
