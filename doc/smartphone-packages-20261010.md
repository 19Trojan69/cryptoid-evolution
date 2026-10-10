# Cryptoid Evolution – Smartphone-Pakete und Prüfstand

Stand: 10. Oktober 2026, einschließlich ergänzender Menüprüfung, Schiffsvorschauen und Admin-Scroll-Korrektur. Freigabe dieser Bearbeitung: Testnet.

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
- 290 Frontend-Regressionstests bestanden, einschließlich Schiffskauf-/Ausrüstungsregeln, Gameplay, Waffen, Bonus-/Bosslogik, Viewport-/Bewegungseinstellungen und Wiederherstellung des Scrollens nach dem Schnellzugriff.
- Backend-Build und fünf Prüfungen für Zahlungspolitik und getrennte Zahlungsaufzeichnungen bestanden. Diese Prüfungen lösen keine echten Zahlungen aus.
- ESLint für neue Navigation, Viewport-Anbindung, Schiffsvorschau, Übersetzungen und die berührten Einstellungs-/Schnellzugriff-Komponenten bestanden. Die abschließende Prüfung der Vorschau-Komponenten, Menüsteuerung und des neuen Scroll-Tests ist ebenfalls erfolgreich. AdminPage enthält weiterhin drei bereits im Ausgangsstand vorhandene React-Hook-Lintfehler; die Gegenprüfung des vorherigen Stands bestätigt dieselben drei Fehler. Kein behaupteter vollständiger Altbestand-Lint.
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

## Ergänzende Menüprüfung und Schiffsvorschauen

| Bereich | Gefundener Zustand | Umsetzung und Prüfung |
|---|---|---|
| Bildübersicht | Die Themenleiste ließ im Querformat kaum Platz für den Inhalt; mobile Auswahl und Schließen waren teilweise zu klein. | Native Themenauswahl auf schmalen/niedrigen Ansichten, 48-px-Auswahl und Schließen. Im kurzen Querformat entfällt der einleitende Absatz. Alle sieben Größen geprüft: Inhalt mindestens 96 px hoch, Rückkehr innerhalb der Ansicht, kein seitlicher Überlauf. |
| Feedback | Die fünf Bewertungssterne konnten bei 320 px über ihren Rahmen hinausreichen. | Fünf Sterne mit jeweils 48 × 48 px bleiben in einer Zeile und innerhalb des Formulars. Alle sieben Größen geprüft. Beiträge wurden nicht veröffentlicht. |
| Datenschutz und ausgehende Menüwechsel | Die Menü-Historie konnte einen gleichzeitigen Routenwechsel unterbrechen; die Rückkehrfläche war kleiner als die übrigen Aktionen. | Routenwechsel zu Datenschutz, Galaxiekarte und Spiel bleiben erhalten. Datenschutz-Rückkehr mindestens 48 px hoch; vier Größen geprüft. |
| Galaxiekarte | Einige Level- und Navigationsbuttons waren nur 44 px groß. | Mindestens 48 × 48 px; abschließend alle sieben Größen ohne seitlichen Überlauf oder sichtbare zu kleine Bedienflächen geprüft. Das bestehende Schiffsporträt bleibt vollständig sichtbar. |
| Spielstart im Schnellzugriff | Der Startknopf konnte während noch laufender Sitzungsprüfung bedienbar sein, obwohl der Einstieg noch gesperrt war. | Startknopf folgt jetzt derselben Bereitschaftssperre wie die Startseite. Der deaktivierte Zustand während der Sitzungsprüfung wurde im abschließenden Testnet-Build beobachtet. Erfolgreicher Spielstart nach abgeschlossener Prüfung kontrolliert; keine Pi-Zahlung ausgelöst. |
| Shop, Hangar, Bildübersicht, Waffenvorschau und Admin-Flotte | Unterschiedliche Vorschauverfahren und transparente Bildränder ließen Schiffe klein oder versetzt wirken. | Gemeinsame Original-Porträt-Darstellung, zentrierter sichtbarer Schiffsrumpf und proportionale Einpassung ohne Abschneiden. Shop-/Hangar-Rahmen werden größer genutzt; Waffenvorschau erhält 96 px Höhe für Schiff und Schussdarstellung. Admin-Auswahl und Flottenliste verwenden dieselbe Vorschau. |

Shop und Hangar wurden jeweils in allen sieben Größen geprüft. Die fertigen Porträts liegen exakt in der Mitte ihrer Bildrahmen und vollständig innerhalb der Rahmen. Bei 390 × 844 px nutzt das Schiff beispielsweise eine Bildfläche von 234 × 157,5 px im 252 × 175,5 px großen Rahmen. In der Waffenvorschau bleibt das Schiff innerhalb seiner 68 × 68 px großen Bildfläche und des 96 px hohen Vorschau-Rahmens; die Aktionsleiste liegt in allen sieben Größen vollständig innerhalb der Ansicht.

Die Bildübersicht zeigt alle drei Entwicklungsstufen als vollständig geladene Original-Porträts. Shop-Auswahl für unterschiedliche Stufen und Gold-Lackierung wurde zusätzlich geprüft. Der bestehende Lackierungsalgorithmus, die Originalsilhouette, Transparenz und Spielgrafik bleiben erhalten; es wurden keine neuen Schiffsentwürfe erzeugt oder Original-PNGs ersetzt. Die vorhandene Sammlung und Galaxiekarte verwenden bereits denselben Porträt-Lader.

Eine zusätzliche Prüfung des tatsächlichen Porträt-Laders mit allen **60 Flottenbildern** und zwei asymmetrischen Testbildern bestätigt den Beschnitt transparenter Außenränder, zentrierte sichtbare Bildgrenzen mit weniger als 0,5 px Abweichung und mindestens 4 px Sicherheitsrand. Diese Prüfung ersetzt keine Sichtkontrolle aller Lackierungen auf allen Geräten.

**Auflösungsgrenze:** Die 60 regulären Flotten-Originale liegen mit 282 × 282 px vor. Die Darstellung nutzt diese Originaldaten; dies ist keine echte HD-Aufrüstung. Für deutlich höhere Schärfe bei größeren Ansichten werden höher aufgelöste Originaldateien benötigt. Bossgrafiken haben bereits größere Ausgangsdateien und behalten ihre bestehende Komposition.

## Admin-Bereich: Scrollen wiederhergestellt

Der Schnellzugriff und seine übergeordnete Menüsteuerung sperrten beide `document.body.style.overflow`. Beim Schließen konnte die zweite Bereinigung den bereits gesperrten Wert `hidden` wiederherstellen. Dieser Zustand wurde im bisherigen Testnet-Build im Browser reproduziert. Er konnte auch nach dem Wechsel auf andere Seiten bestehen bleiben.

Der Schnellzugriff verwendet jetzt ausschließlich die Scroll-Sperre der übergeordneten Menüsteuerung. Ein Regressionstest führt die tatsächlichen Menü- und Hook-Effekte aus und prüft die Wiederherstellung der ursprünglichen Werte `''`, `auto` und `scroll` sowie das Entfernen der Tastatur-Listener. Im korrigierten Testnet-Build wurde zusätzlich bestätigt: geöffnetes Menü sperrt den Hintergrund, der Wechsel zu Datenschutz gibt die Seitensperre wieder frei.

Der gesamte Admin-Hauptbereich ist außerdem eine eigenständige Scrollfläche mit der verfügbaren Viewport-Höhe, `overflow: auto`, Touch-Scrollen und Tastaturfokus. **Alle sieben Admin-Ansichten** liegen innerhalb dieses gemeinsamen Bereichs: Übersicht, Raumschiffe, Levels & Bosse, Zahlungseingänge, eigene Rekorde, Zugriffsstatistik sowie Audio & Prüfung. Lange Untermenüs können dadurch unabhängig von der Seitensperre scrollen. Die bestehende horizontale Scrollfläche der Nutzungstabelle bleibt erhalten. Admin-Aktionen, Navigation, Eingaben und Farbauswahl erhalten mindestens 48 px hohe Bedienflächen.

Die tatsächliche Admin-Zugangsansicht wurde in allen sieben Größen geprüft: kein seitlicher Seitenüberlauf und keine gemessene sichtbare Aktionsfläche unter 48 px. Bei 320 × 568 px ist die Scrollfläche 568 px hoch, ihr Inhalt 591 px; die Taste Ende erreicht nachweislich `scrollTop: 23`. Eine zusätzliche niedrige Ansicht mit 320 × 320 px erreicht nachweislich `scrollTop: 271` und die unteren Aktionen. Das ist eine Prüfung geringer verfügbarer Höhe, keine Emulation einer echten Bildschirmtastatur.

**Offene Prüfung:** Der Browser verfügt über kein angemeldetes, verifiziertes Eigentümerkonto. Die geschützten Admin-Untermenüs, echten Zahlungslisten und ihre Schiffsvorschauen sind anhand der Komponentenstruktur geprüft; ihre Live-Abnahme mit echten Kontodaten bleibt offen. Die Zugriffskontrolle wurde nicht umgangen und es wurden keine Zahlungsdaten verändert.

## Leistung und noch sinnvolle Verbesserungen

Der Vergleich innerhalb dieser Bearbeitung reduziert das anfängliche JavaScript-Bundle von rund **812,56 KB auf 762,48 KB gzip**. Der Spielcode liegt separat bei rund **51,11 KB gzip** und wird beim Spielstart geladen. Die Haupt-CSS-Datei sinkt durch das getrennte Laden der Spielstile von rund 88,29 KB auf 86,09 KB gzip. Dies ist eine Verbesserung der Startlast, keine gemessene FPS-Steigerung. Das Hauptbundle bleibt groß und erzeugt weiterhin die Vite-Größenwarnung.

Weiteres Verbesserungspotenzial:

1. Die folgenden echten Geräte- und Kontotests abschließen, bevor die Smartphone-Abnahme als vollständig bezeichnet wird.
2. Bei gemessenen Startproblemen auf schwachen Android-Geräten weitere selten genutzte Menübereiche und große gemeinsame Datenmodule getrennt laden.
3. Die weiterhin teilweise übersetzten 14 zusätzlichen Sprachen vollständig redaktionell prüfen. Alle 19 Sprachen bleiben auswählbar; die fünf Freigabesprachen sind vollständig, andere behalten ihren bestehenden englischen Fallback.
4. Reale Spielsitzungen und Nutzerfeedback zur Informationsdichte auswerten, besonders bei Waffenbeständen, langen Profilnamen und langen Menütexten.
5. Höher aufgelöste Flotten-Originaldateien bereitstellen und angemeldete Admin-Menüs abnehmen.
6. Die drei bestehenden Admin-Hook-Lintfehler separat bereinigen. Die Waffenlaufzeit in den Nutzungsbedingungen redaktionell mit der aktuellen Waffenanzeige abgleichen; Rechtstexte wurden in dieser Bearbeitung nicht inhaltlich verändert.

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

Umsetzung der Pakete: Pull Request 148 – https://github.com/19Trojan69/cryptoid-evolution/pull/148

Ergänzende Menüs, Original-Schiffsvorschauen und Admin-Scroll-Korrektur: Pull Request 149 – https://github.com/19Trojan69/cryptoid-evolution/pull/149

Veröffentlichter Code-Commit: `940b3229b910f00a4c03e06a22e1368c26908860`.

Vercel-Deployment: `dpl_BZvi8tDGBh1Frg2BpHRZHiDwzYzd`, Status READY, Preview/Testnet. Der feste Testnet-Link wurde diesem Deployment zugewiesen und anschließend geprüft. Production wurde durch diese ergänzende Testnet-Freigabe nicht umgestellt.

Die frühere Smartphone-Bestandsaufnahme bleibt als historische Ausgangsbewertung gültig; dieser Bericht beschreibt den nachbearbeiteten Stand.
