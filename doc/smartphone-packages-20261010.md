# Cryptoid Evolution – Smartphone-Pakete und Prüfstand

Stand: 10. Oktober 2026. Freigabe dieser Bearbeitung: Testnet.

Die Menüführung und die mobile Darstellung wurden überarbeitet. Paket 1 war bereits freigegeben; die Pakete 2–5 sind umgesetzt. Paket 6 ist technisch umgesetzt, seine Abnahme auf echten Geräten bleibt offen. Eine vollständige Hardware-Abnahme oder garantierte Bildrate wird mit dieser Freigabe nicht behauptet.

## Bearbeitungspakete

| Paket | Derzeitiger Zustand | Prüfung / verbleibender Punkt |
|---|---|---|
| 1 – HUD und Touch-Flächen | Größere HUD-Beschriftungen und Steuerflächen; konsistente Blockanzeige; größere Farb- und Mengenwahl. Bereits im Ausgangsstand enthalten. | Vorheriger Paket-1-Build und Regressionstests; aktuelle Spielansicht geladen. Echte Daumenbedienung weiterhin in Geräteabnahme. |
| 2 – Startseite und Menüführung | Hangar und Schiff-Shop direkt im Schnellzugriff; zuletzt geöffnete Gruppe bleibt erhalten. Browser-Zurück und Escape schließen den obersten Dialog. Fokus bleibt in modalen Menüs und kehrt zum Auslöser zurück. | Shop-Zurück, verschachtelte Sprachauswahl, Profil-Rückkehr und Escape geprüft. Tastaturumlauf im Pausemenü geprüft. |
| 3 – Schiff-Shop und Hangar | Suche, Besitzfilter und Filter für mit Shards verfügbare Schiffe. Getrennte Besitzanzeige für Stufe und Farbe. Preis außerhalb der Kaufaktion; vollständiger Preis und Variante im zugänglichen Buttonnamen. Kaufsperre vor geplantem Pi-Preis. Beschreibung und Kaufregeln aufklappbar. Hangar-Aufrüstung öffnet gezielt die passende Shop-Stufe. | Filter liefern 20 Schiffe insgesamt, 10 freigegebene Standardtypen und im geprüften Gastbestand einen eigenen Typ. Leerer Suchtreffer und Filterrücksetzung geprüft. Aufrüstung zeigt fehlenden Stufenbesitz und Kaufsperre. Preise, Bestand und Kaufregeln bleiben durch Regressionstests abgesichert. |
| 4 – Pause und Waffenmenü | Deutlicher Fortsetzen-Button; Wiederaufnahme über den vorhandenen 3–2–1-Countdown. Einspaltiges Waffenmenü auf schmalen Ansichten; erklärende Texte aufklappbar. Aktionsleiste bleibt vollständig im sichtbaren Bereich unter dem HUD. Größere Rückkehr- und Aktualisieren-Flächen. | Pause, Öffnen per Klick, Rückkehr und Countdown geprüft. Waffenleiste in sieben CSS-Größen geprüft. Echte Pi-Käufe, bezahlte Aktivierungen und Kontowiederaufnahme werden im Geräte-/Kontotest abgenommen. |
| 5 – Gestaltung und ergänzende Menüs | Gemeinsame Nachtblau-/Champagner-Flächen mit klaren Auswahl- und Fokuszuständen. Größere Bedienelemente; mobile Eingabeschrift mit 16 px. Rangliste priorisiert Hauptwerte und klappt Missionsdetails auf. Profil und Rangliste erhalten Wiederholungsaktionen bei Ladefehlern. Sammlung behält beim Zurückgehen ihre Scrollposition. | Öffentliche Rangliste, öffentliches Profil, Sammlung, Sprachauswahl und Systemmenü geprüft. Scrollposition nach Rückkehr aus der letzten Bosskarte wiederhergestellt. Anmeldung, eigenes Profil bearbeiten/speichern und lange angemeldete Nutzernamen bleiben im Kontotest. |
| 6 – Geräte, Vollbild und Leistung | Menüs reagieren auf Visual-Viewport-Höhe und -Versatz; Safe-Area-Abstände bleiben berücksichtigt. Abgewiesenes Vollbild erhält im Systemmenü eine verständliche Rückmeldung. Betriebssystem-Einstellung für reduzierte Bewegung wird respektiert. Schiffsmaterial wird erst bei näherkommender Vorschau geladen. Spielcode wird erst beim Öffnen der Spielroute geladen. | Technische Tests bestanden; echte iPhone-, Android-, iPad- und Pi-Browser-Abnahme offen. Kein belastbarer FPS-, Akku- oder Tastaturtest auf echter Hardware möglich. |

## Ausgeführte technische Prüfungen

- Frontend-Build einschließlich TypeScript, zwölf i18n-Prüfungen und Freigabegate für Englisch, Deutsch, Spanisch, Chinesisch und Vietnamesisch bestanden.
- 285 Frontend-Regressionstests bestanden, einschließlich Schiffskauf-/Ausrüstungsregeln, Gameplay, Waffen, Bonus-/Bosslogik und der neuen Viewport-/Bewegungseinstellungsprüfungen.
- Backend-Build und fünf Prüfungen für Zahlungspolitik und getrennte Zahlungsaufzeichnungen bestanden. Diese Prüfungen lösen keine echten Zahlungen aus.
- ESLint für neue Navigation, Viewport-Anbindung, Schiffsvorschau, Übersetzungen und die berührten Einstellungs-/Schnellzugriff-Komponenten bestanden. Kein behaupteter vollständiger Altbestand-Lint.
- Schiffsvorschau im Browser geladen: Bild vollständig, Materialdarstellung vorhanden, Bereitschaftszustand korrekt.
- Öffentlicher Profilaufruf aus der Rangliste und Browser-Zurück erhalten die zugrunde liegende Rangliste.
- Tab und Shift+Tab bleiben im Pause-Dialog; Fortsetzen aus Pause und Waffenmenü zeigt den Countdown.
- Browser-verweigertes Vollbild zeigt die deutsche Statusmeldung. Vollbild ist im eingebetteten Prüffenster absichtlich gesperrt.

## Layoutprüfung

Die echte Testnet-App wurde in einem gleich-originigen Prüffenster mit folgenden **CSS-Ansichtsgrößen** geprüft:

| Ansichtsgröße | Verwendung |
|---|---|
| 320 × 568 | Kleine Smartphone-Ansicht |
| 360 × 800 | Schmale Android-Ansicht |
| 375 × 667 | Kleine iPhone-Ansicht |
| 390 × 844 | Mittlere Smartphone-Ansicht |
| 430 × 932 | Große Smartphone-Ansicht |
| 852 × 393 | Querformat |
| 800 × 1100 | Tablet-Ansicht |

Startseite, Schnellzugriff, Schiff-Shop, Hangar, Pause und Waffenmenü wurden in allen sieben Größen gemessen. In den geprüften sichtbaren Bedienelementen dieser Ansichten gab es nach den Korrekturen keinen seitlichen Seitenüberlauf und keine gemessene Bedienfläche unter 48 px. Die Waffen-Aktionsleiste endet jeweils innerhalb der Ansicht, auch bei 320 × 568 und im Querformat.

Zusätzlich geprüft: Sammlung in vier Größen, Sprachauswahl bei 320 px, Systemmenü bei 320 px, öffentliches Pilotenprofil bei 390 px. Die Rangliste wurde im endgültigen Freigabestand in allen sieben Größen erneut gemessen: kein seitlicher Überlauf und keine sichtbare Bedienfläche unter 48 px.

Das Prüffenster emuliert keine Touch-Hardware, Bildschirmtastatur, Notch, Geräteskalierung, Pi-Browser-Version, GPU oder Akkulast. Die Messung berücksichtigt sichtbare Elemente der aktuellen Ansicht; sie ersetzt keine Prüfung sämtlicher Datenbestände und Zustände.

## Leistung und noch sinnvolle Verbesserungen

Der Vergleich innerhalb dieser Bearbeitung reduziert das anfängliche JavaScript-Bundle von rund **812,56 KB auf 764,13 KB gzip**. Der Spielcode liegt separat bei rund **50,17 KB gzip** und wird beim Spielstart geladen. Die Haupt-CSS-Datei sinkt durch das getrennte Laden der Spielstile von rund 88,29 KB auf 85,67 KB gzip. Dies ist eine Verbesserung der Startlast, keine gemessene FPS-Steigerung. Das Hauptbundle bleibt groß und erzeugt weiterhin die Vite-Größenwarnung.

Weiteres Verbesserungspotenzial:

1. Die folgenden echten Geräte- und Kontotests abschließen, bevor die Smartphone-Abnahme als vollständig bezeichnet wird.
2. Bei gemessenen Startproblemen auf schwachen Android-Geräten weitere selten genutzte Menübereiche und große gemeinsame Datenmodule getrennt laden.
3. Die weiterhin teilweise übersetzten 14 zusätzlichen Sprachen vollständig redaktionell prüfen. Alle 19 Sprachen bleiben auswählbar; die fünf Freigabesprachen sind vollständig, andere behalten ihren bestehenden englischen Fallback.
4. Reale Spielsitzungen und Nutzerfeedback zur Informationsdichte auswerten, besonders bei Waffenbeständen, langen Profilnamen und langen Menütexten.

## Noch offene Geräteabnahme

| Test | iPhone / Safari | Android / Chrome | Pi Browser | iPad / Safari |
|---|---|---|---|---|
| Hoch-/Querformat, Notch und Home-Indikator | Offen | Offen | Offen | Offen |
| Bildschirmtastatur in Suche, Profil und Feedback | Offen | Offen | Offen | Offen |
| Daumensteuerung mit gleichzeitiger Power-up-Aktion | Offen | Offen | Offen | Offen |
| Vollbild / installierte App / Rückkehr aus Hintergrund | Offen | Offen | Offen | Offen |
| Mindestens eine komplette Mission mit Boss und Bonus | Offen | Offen | Offen | Offen |
| Mehrere Minuten Spielzeit: Bildrate, Temperatur, Akku | Offen | Offen | Offen | Offen |
| Pi-Anmeldung, Konto speichern/fortsetzen, bestätigter Bestand | Offen | Offen | Offen | Offen |

Für jede Abnahme Gerät, Betriebssystem, Browser-/Pi-Browser-Version, Ansichtsrichtung und Auffälligkeiten protokollieren. Besonders prüfen: Android-Zurück in verschachtelten Dialogen, Profil mit langem Namen, Suche mit sichtbarer Tastatur, veränderte Browserleisten, Übergang Block → Boss → Bonus und Bedienbarkeit bei realen Waffenbeständen.

## Freigabe und Nachvollziehbarkeit

Testnet: https://cryptoid-evolution-testnet.vercel.app/

Layoutprüfung: https://cryptoid-evolution-testnet.vercel.app/mobile-layout-check.html

Umsetzung und Prüfung: Pull Request 148 – https://github.com/19Trojan69/cryptoid-evolution/pull/148

Veröffentlichter Code-Commit: `580df7d5bed70c097409d842ecec192d89706789`.

Vercel-Deployment: `dpl_5HaJaKDQMwSr72gRt7x1KtbzvSFo`, Status READY, Preview/Testnet. Der feste Testnet-Link wurde diesem Deployment zugewiesen und anschließend geprüft.

Die frühere Smartphone-Bestandsaufnahme bleibt als historische Ausgangsbewertung gültig; dieser Bericht beschreibt den nachbearbeiteten Stand.
