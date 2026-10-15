# Cryptoid Evolution – Korrekturtest V2, 15.10.2026

**Mehrere konkrete Fehler sind korrigiert. Das gemeldete vollständige Einfrieren nach dem Boss wurde bisher nicht reproduziert und ist nicht als behoben nachgewiesen.** Der übergebene Diagnoseexport enthielt `trace: null` und `previous: null`; daraus lässt sich der damalige Stillstand nicht nachträglich rekonstruieren.

## Nachgewiesene Ursachen und Änderungen

| Befund | Nachweis | Korrektur in der privaten Vorschau |
| --- | --- | --- |
| Die Quellbild-Vorbereitung konnte bei einer Ausnahme beim Erzeugen oder Initialisieren des Canvas ein offenes Promise hinterlassen. Die serielle Färbewarteschlange wartete dann unbegrenzt. | Fehler gezielt in die ursprüngliche Implementierung injiziert: Promise blieb offen; Korrekturtests prüfen Ablehnung, Freigabe und erfolgreichen erneuten Versuch. | Canvas-Fehler schließen den Auftrag ab und entfernen den fehlerhaften Cacheeintrag. Überholte, noch nicht gestartete Aufträge werden freigegeben. Das beweist einen Stillstand der Bildvorbereitung, keinen Stillstand sämtlicher Bedienelemente. |
| Flammen konnten sichtbar werden, bevor das zugehörige Rumpfbild geladen war; ein fertig kodierter Blob war außerdem noch nicht zwingend dekodiert. | Quellpfad und Tests mit verzögerten bzw. fehlgeschlagenen Bildereignissen. | Aktuelle und bevorstehende Rümpfe werden begrenzt vorbereitet; farbige Bilder werden erst nach erfolgreichem Dekodieren verwendet. Bis zum Laden des Rumpfs wartet dessen Flamme. Auflösung, Färbung und fertig geladene Darstellung bleiben erhalten. |
| Die Boss-Kollision nutzte einen Kreis aus der Schiffsbreite. Bei breiten, flachen Bossen reichte dieser deutlich unter den sichtbaren Rumpf. | Konkreter Gegenbeweis mit Boss 30 und zulässiger Spielerposition; zusätzlich alle 50 Bosse in drei Formaten geprüft. | Die bestehende kontinuierliche Bewegungskollision verwendet beide tatsächlichen Rumpfausdehnungen. Lebende Bosse und Projektile verursachen weiterhin Schaden; ein besiegter Boss verursacht keinen Rumpfschaden. |
| Der frühe Bonus konnte allein durch den Ablauf der Zeit nahe dem Spieler entstehen. | In der bisherigen GamePage existierte ein zeitgesteuerter `safeEarlyPickup` ohne Abschuss. | Der fällige Anfangsbonus wartet auf den nächsten geeigneten tödlichen Gegnertreffer und entsteht genau am besiegten Schiff. Normale Drop-Wahrscheinlichkeiten, Limits und Boost-Laufzeiten bleiben erhalten. |
| Der bisherige Export konnte eine Datei ohne Messwerte herunterladen. | Übergebene Datei enthielt keine Messung; Testfälle decken gesperrte Storage-Zugriffe ab. | Export bevorzugt laufende und letzte Messwerte im Arbeitsspeicher und versucht lokale bzw. Sitzungsspeicherung. Ohne Daten erscheint eine klare Meldung. Der Bericht kann auch angezeigt und kopiert werden. |

Die Ursache des leeren alten Exports lässt sich nicht eindeutig auf gesperrten Speicher zurückführen. Ebenso ist nicht bewiesen, dass ein herunterfallendes Bosswrack Schaden verursachte: Im tatsächlichen Ablauf waren Boss, Gegner und Schüsse nach der Zerstörung bereits entfernt. Das Raster des gesamten erlaubten Spielerbereichs blieb während des Falls schadensfrei. Die nachgewiesene falsche Kollisionsfläche betrifft den noch lebenden Boss.

## Durchgeführte Prüfungen

- **401 automatisierte Tests bestanden**, keine fehlgeschlagen. Frontend-Build einschließlich TypeScript und Sprachprüfungen erfolgreich.
- Tatsächlicher GamePage-Ablauf: 30 Sekunden ohne tödlichen Treffer erzeugen keinen zeitgesteuerten Bonus; tödlicher Trägertreffer setzt ihn exakt an die Explosion; Einsammeln gewährt weiterhin 20 Sekunden Twin. Ein nicht tödlicher Treffer erzeugt ihn nicht.
- Bossfall, verzögerte Explosion, Warten auf das Herz, Einsammeln und Wechsel zur Bonusrunde durchlaufen. Echte Steuerungs-Handler akzeptieren danach Bewegung und entfernen beim Beenden alle installierten Listener.
- Separater Engine-Test durchläuft alle **500 Stufen, 50 Bosse und 50 Bonusrunden** bis zum Sieg. Pause, Waffenzeiten, weiterfallende Pickups und Checkpoint-Wiederherstellung bleiben geprüft.
- Langer Test der tatsächlichen GamePage-Simulation bei 390 × 844: **450 normale Stufen, 49 Bosse, 13.646 Sekunden simulierte Spielzeit** (etwa 3 Stunden 47 Minuten). Alle sieben Angriffsmuster und neun Einflugmuster beobachtet; 248.587 Frames mit Angriff und 121.478 mit Rückflug. Keine ungültigen Positionen und kein Ablaufstillstand. Nach Beenden: **0 erfasste RAF, 0 Timer, 0 Listener**.
- Zusätzlicher Lauf mit aktivierter neuer Diagnose: 60 normale Stufen und sechs Bosse, 1.543 Sekunden simuliert. Ringgrenzen 90 Messfenster/64 Ereignisse eingehalten, Daten vorhanden, vollständige Bereinigung.
- Quellenvergleich gegen den öffentlichen Stand `1c1c7f9b6c5e8ac7d41b9bf1c4b44036cc196220`: Einflug-, Angriffs- und Rückflugbewegungen, Formationen, Geschwindigkeiten, Größen, HUD und bestehende CSS-/Bild-/Audiodateien unverändert. Spiel-JSX identisch bis auf das Attribut zur Rumpfbereitschaft. Bestehender normaler Drop-Aufruf samt Wahrscheinlichkeitsparametern identisch. Die oben benannten Ausnahmen sind ausdrücklich autorisierte Korrekturen.
- Vorschaupaket enthält 262 bytegleich übernommene Originalressourcen, aktivierte Entwicklerdiagnose und Kopierexport. Keine zusätzliche Leiste im Spiel.

Die Kampagnentests beschleunigen die Zeit, erzwingen manche Abschlüsse und verwenden zusätzliche Leben bzw. erhöhte Gegnergesundheit für lange Angriffsfenster. Darstellung, tatsächliche React-Commits, Audiohardware, GPU und Pi-Host sind dabei ersetzt. Das sind keine durchgespielten Smartphone-Sitzungen.

## Performance

CPU-Zeit pro Simulationsschritt im Node-Test, Smartphone-Geometrie; **keine Browser-Framezeiten oder gemessenen Smartphone-FPS**:

| Abschnitt | Original p95 | V2 p95 |
| --- | ---: | ---: |
| Formation | 0,095 ms | 0,095 ms |
| Angriffsflug | 0,110 ms | 0,110 ms |
| Rückflug | 0,085 ms | 0,080 ms |
| Übergang | 0,025 ms | 0,025 ms |
| Bosskampf | 0,150 ms | 0,130 ms |

Diese einzelnen Läufe begründen keine messbare Beschleunigungsbehauptung. Im langen V2-Lauf lagen die erfassten Heapwerte am Anfang bei etwa 29,5 MiB und am Ende bei 30,6 MiB, ähnlich dem Original. Browser-, Bild-, Audio-, GPU- und WebView-Speicher sind damit nicht geprüft. Dauerhafte Geräteperformance und FPS vor/nach der Korrektur bleiben offen.

## Diagnose und verbleibende Unsicherheit

Zusätzlich erfasst werden Bossgesundheit, verbleibende Geschütze, Herzstatus, Übergangsuhr sowie Beginn/Ende der Bosszerstörung und der Siegesmusik. Schadensereignisse unterscheiden Bossrumpf, Gegnerrumpf und Projektil. Begrenzte Messung und Fehlerprotokolle bleiben lokal; es werden keine Konto-, Wallet- oder sonstigen sensiblen Nutzerdaten übertragen oder protokolliert. Ohne Web Storage bleibt der Bericht bis zum Schließen/Neuladen im Arbeitsspeicher verfügbar. Ein Browser-Prozessabbruch kann die zuletzt noch nicht dauerhaft gespeicherten Daten verlieren.

Doppelte Spielschleifen, anwachsende erfasste Timer/Listener, hängenbleibende Übergänge und Schaden durch das tote Wrack zeigten sich in den Simulationen nicht. Global ausgeschlossen sind sie dadurch nicht. Vollständige Eingabeblockade, unbeabsichtigte reale Navigation, JavaScript-Fehler auf dem Gerät, Speicherabbruch sowie Browser-/WebView-Neustart sind weiterhin mögliche, nicht nachgewiesene Erklärungen. Keine dieser Ursachen wird als festgestellt bezeichnet.

## Dateien dieser Korrekturrunde

- `frontend/src/pages/GamePage.tsx`, `PaintedShip.tsx`, `paintedShip.ts`, `resourceCache.ts`, `hullSourcePlan.ts`, `hullArrival.css`: begrenzte Vorbereitung und Bereitschaft, gezielte Integration.
- `frontend/src/pages/bossContact.ts`, `pickupOrigin.ts`: korrigierte Bosskontaktgeometrie und Abschussursprung des frühen Bonus.
- `frontend/src/pages/performanceDiagnostics.ts`, `diagnosticExport.ts`: begrenzte Zusatzinformationen und Export-Fallback.
- `frontend/src/pages/bossContact.test.mjs`, `bossExplosionBudget.test.mjs`, `diagnosticExport.test.mjs`, `feedbackFixes.test.mjs`, `hullReadiness.test.mjs`, `shipImageLifetime.test.mjs`: Regressionen und Fehler-Injektion.
- `frontend/checks/verifyFeedbackFixes.cjs`, `checks/run-engine.cjs`, `scripts/verifySimulationStability.cjs`, `scripts/verifyDiagnosisPreservation.cjs`: tatsächliche Ablaufprüfungen und Erhaltungsvergleich.
- `frontend/scripts/buildCrashPreview.mjs`: isoliertes V2-Menü und Export; `frontend/AGENTS.md`: dokumentierte Grenzen des autorisierten Nutzerfeedbacks.
- `docs/performance-20261015/FEEDBACK_V2.md`, `feedback-summary.json`, `feedback-preservation.json`, `feedback-engine-checks.json` und komprimierte V2-Läufe: Bericht und technische Belege. Der ursprüngliche Bericht bleibt als historischer Stand erhalten.

## Private Testvorschau und ausstehender Gerätetest

[Private Testvorschau V2](https://cryptoid-crash-diagnosis-20261015.xwsk9s27cg.chatgpt.site). Der Titel des Testmenüs muss **„Absturzdiagnose V2 · Korrekturtest 15.10.“** anzeigen. Diagnose-Branch: `codex/crash-diagnosis-20261015`; vorheriger Stand ist zusätzlich unter `backup/diagnosis-before-feedback-20261015` lokal gesichert. Keine Veröffentlichung auf dem öffentlichen Testnet oder der Spielproduktion.

Ein echter Test in Safari und im Pi Browser auf einem Smartphone steht aus; die Umgebung bietet dafür keine unterstützte Browser-Teststeuerung. Zu prüfen sind besonders mehrfache Bossabschlüsse, Beweglichkeit während/nach dem Fall, anschließende Bonusrunden, sichtbarer Träger jedes Power-ups und längere Schuss-/Angriffssequenzen. Entwicklerdiagnose zunächst eingeschaltet lassen; anschließend einen vergleichbaren Lauf ohne Diagnose prüfen. Bei erneutem Stillstand die Seite wieder öffnen und den Bericht exportieren oder kopieren, sofern der Browser dessen lokale Speicherung erlaubt. Für das bereits gemeldete Ereignis enthält die vorhandene Datei keine verwertbare Spur.
