# Paket 7 – Erweiterte Lokalisierung, geprüfter Entwurf

Status: Testnet-Teststand, nicht für Mainnet freigegeben. Basis ist Paket 6 (`a5f700cfb5a2f6801ca5889a15dd19d797a2c8b3`); Produktion bleibt unverändert. Frühere Abschnitte unten beschreiben den Entwicklungsstand vor der Testnet-Umschaltung.

**Aktueller Umfang (9. Oktober):** Sichtbar und automatisch erkennbar sind `en`, `de`, `es`, `fr`, `pt`, `it`, `ru`, `zh` (vereinfacht) und `vi`. Die übrigen Sprachtexte bleiben im Quellkatalog erhalten, sind aber nicht auswählbar. Die älteren Abschnitte unten dokumentieren den vorherigen 29-Sprachen-Entwurf.

## Sprachumfang

Zusätzlich zu den bisherigen 17 Sprachen sind zwölf Profile integriert: vereinfachtes Chinesisch (`zh`), Vietnamesisch (`vi`), Indonesisch (`id`), Koreanisch (`ko`), Japanisch (`ja`), Hindi (`hi`), Bengali (`bn`), Arabisch (`ar`), Urdu (`ur`), Persisch (`fa`), Filipino (`fil`) und Swahili (`sw`). Diese Auswahl erweitert die regionale Abdeckung; sie ist keine statistisch belegte Rangliste der Pi-Network-Verbreitung und keine Behauptung, sämtliche Länder oder Landessprachen abzudecken.

110 zentrale Bedienungstexte und acht Beschreibungen der Spezialfähigkeiten pro neuer Sprache sind lokal ergänzt. Nova-/EMP-Texte entsprechen der aktuellen Spielmechanik. Acht zusätzliche Karten-/Ausstattungs- und PNG-Texte liegen für alle 28 nichtenglischen Sprachen vor. Chinesische Sammelkarten- und Boss-Kampfdaten-Texte wurden außerdem direkt ergänzt. Für die übrigen neuen Sprachen sind längere Hilfe-, Admin- und Schiffsgeschichten noch unvollständig. Der erfasste chinesische Bestand wurde inzwischen direkt vervollständigt. Die Sprachtests prüfen die neuen Kerntexte; die zusätzliche Freigabeprüfung kontrolliert den breiteren Bestand.

## Implementierter Stand

- Manuelle gespeicherte Wahl hat Vorrang vor den Browser-/Gerätesprachen; danach gilt Englisch als Fallback. Die Wahl bleibt jederzeit änderbar.
- Regionale Codes und Unterstriche werden normalisiert; `tl` wird Filipino zugeordnet. Chinesische Gerätecodes wählen das klar als vereinfacht gekennzeichnete Profil; traditionelles Chinesisch ist kein separates Paket.
- Verweigertes oder volles Browser-Storage verhindert den Sprachwechsel nicht: die Wahl bleibt für den aktuellen Tab im Speicher. Gespeichert wird ausschließlich der bestehende Sprachschlüssel.
- Dokumentsprachcode und Schreibrichtung werden aktualisiert. Arabisch, Urdu und Persisch erhalten RTL; das Spielfeld und die physischen Steuerungen behalten ihre LTR-Geometrie.
- Sammelkarten, Kartenmeldungen und Bossakten verwenden den Katalog statt einer festen Deutsch-/Englisch-Auswahl. Auch Schiffsgeschichten und Ausstattungsdaten sind an die Sprache angebunden. Bisherige boolesche DE/EN-Aufrufe der Kartendaten bleiben kompatibel.
- Direkte Admin-Texte und die übrigen erfassten direkten JSX-Texte sind an den Katalog angeschlossen. Deutsche Admin-Quelltexte zählen in Englisch erst mit expliziter Übersetzung als abgedeckt; fehlende Texte werden nicht durch eine vermeintliche englische Vollständigkeit verdeckt.
- PNG-Kartenexport übernimmt die gewählte Sprache und richtet RTL-Text rechts aus. Lange Wörter werden an Graphemgrenzen umgebrochen, damit kombinierte Zeichen, indische Schriftzeichen und verbundene Emoji nicht aufgeteilt werden.
- Schrift-Fallbacks und umbruchfähige Sprachoptionen sind vorbereitet. Tatsächliche Darstellung, RTL-Ausgabe und PNG-Export auf Mobilgeräten sind noch nicht visuell abgenommen.

## Prüfungen

- 252 Tests bestanden: 211 Spieltests und 41 Sprach-/Speicher-/Kartenprüfungen.
- Frontend-Build und ESLint bestanden. Die bekannte Warnung zum großen Hauptbundle bleibt bestehen.
- `npm run audit:i18n --prefix frontend` erfasst 1020 statische Texte und keine verbleibenden direkten JSX-Fragmente in diesem Scan. Die Bestandsaufnahme umfasst jetzt auch deutsche Admin-Texte und einzelne Boss-Geschichtsabsätze. Sie ist keine Garantie, sämtliche dynamischen Texte zu erfassen.
- Chinesisch deckt alle 1020 erfassten Einträge ab, ohne Platzhalterfehler; die übrigen elf neuen Sprachen jeweils 158. Diese Zahlen enthalten gemeinsam genutzte Namen und Aliasse. Deutsch deckt 685, die übrigen bisherigen nichtenglischen Sprachen jeweils 533 ab. Englisch deckt 864 ab; fehlende deutsche Admin-Texte sind ausdrücklich sichtbar.
- `npm run check:i18n:release --prefix frontend` muss vor der Veröffentlichung bestehen. Aktuell schlägt diese zusätzliche Prüfung wie vorgesehen fehl. Sie prüft fehlende Texte und die Erhaltung aller Platzhalter.
- Das statische Inventar hat Schema 2: fehlende Texte referenzieren die Eintrags-IDs, statt längere Geschichten pro Sprache zu duplizieren.
- Browserprüfung über eine separate Vercel-Preview durchgeführt: alle 29 Profile sichtbar; Chinesisch auswählbar und nach Neuladen erhalten (`lang=zh-Hans`, `dir=ltr`); Arabisch wechselt auf `lang=ar`, `dir=rtl`. Die RTL-Systemansicht wurde visuell geprüft. Ein Gastspiel ließ sich öffnen und pausieren; Spielfeld und Touch-Steuerung behielten bei arabischer Dokumentrichtung `ltr`. Die automatische Sprachwahl konnte anschließend wiederhergestellt werden. Die lokale Verbindung war zuvor mit `ERR_CONNECTION_REFUSED` blockiert. Physische Mobilgeräte, Pi Browser und PNG-Export bleiben offen.

## Offene Arbeit vor Veröffentlichung

Die statische Textliste befindet sich in `package-7-translation-inventory-2026-10-08.json`. Fehlende Texte müssen ergänzt werden. Danach alle Oberflächen, Platzhalter, Mechanikbeschreibungen, regionale Erkennung, Sprachwechsel, Persistenz, Textumbrüche, RTL und PNG-Export im Browser prüfen; anschließend einen vollständigen Testnet-Kandidaten erstellen.

Die Übermittlung statischer UI-, Hilfe-, Fehler- und Beschreibungstexte einschließlich fiktiver Sammelkarten-Geschichten an Google Translate wurde vom Nutzer am 8. Oktober 2026 ausdrücklich freigegeben. Die Zustimmung gilt weiterhin. Laufzeitwerte, Kontodaten, Zahlungen, Zugangsschlüssel und Quellcode sind nicht Bestandteil dieser Freigabe oder der vorgesehenen Textübermittlung.

Google hat die Testanfrage mit HTTP 429 und einer ausdrücklichen Sperre für automatisierte Anfragen abgelehnt. Ein einzelner erneuter Versuch zeigte dieselbe Sperre. Es wurde keine Übersetzung zurückgegeben; weitere Aufrufe und Umgehungen wurden nicht ausgeführt. Die vollständige Stapelübersetzung bleibt dadurch blockiert, nicht durch eine fehlende Zustimmung. Bis dahin werden sichere lokale Ergänzungen als Entwurf gesichert und nicht als vollständiges Sprachpaket veröffentlicht.

## Separate Prüfvorschau

Der Stand `2c62aaf4b4c03d988808ddf7039f36af8d6a65c5` wurde als Preview `dpl_7Hr2uCd5aoQDRA3um7duSLZ4kSSz` bereitgestellt (Vercel-Projekt `prj_BAIJH4BzLLwun36kWVEnTdx69j0q`, Ziel Preview, READY). Der feste Testnet-Link wurde nicht umgestellt. Ein kurzzeitig erzeugter, nicht benötigter Freigabelink wurde wieder widerrufen. Die Browserprüfung machte noch fehlende chinesische Startseiten-/Schnellzugriffstexte sichtbar; diese wurden anschließend lokal ergänzt.

Die aktualisierte Vorschau `dpl_84NJsBbPosPYnzvpBnMfCUpqoC1a` (`d15725e10b6c4a14c891e0665e83931fe7ac62a8`, Preview, READY) bestätigte chinesische System-/Steuerungstexte. Die Prüfung zeigte noch unterschiedliche Groß-/Kleinschreibung einiger Startseitenschlüssel sowie eine feste DE/EN-Sammelkartenbeschriftung auf der Startseite; diese wurden anschließend korrigiert. Die Karten-Schaltfläche verwendet nun den Sprachkatalog für alle 29 Sprachen.

Die abschließende Browserprüfung des Code-Stands `43cb214a46af802a8fc7759939ee0a9a47a01e2f` auf Preview `dpl_56cYtda24QKCMJnuoHNzuFzMXpQX` (READY, Preview) bestätigte die korrigierten chinesischen Startseitentexte, den Sammelkarten-Button und die Systemeinstellungen. Chinesisch blieb nach Neuladen aktiv. Die Startseite wurde visuell geprüft und mit einem Vorschaubild dokumentiert. Verifizierte URL: https://cryptoid-evolution-p3r981m9b-19-trojan69.vercel.app/ . Keine Pi-Anmeldung und keine Zahlung wurden ausgeführt. Der stabile Testnet-Link liefert weiterhin Paket 6 (Bundle `/assets/index-nYeX0mRK.js`); Paket 7 bleibt ein unvollständiger Entwurf.

## Direkte Übersetzung nach Nutzerfreigabe

Nach ausdrücklicher Freigabe der direkten Übersetzung wurden 757 weitere chinesische Einträge ergänzt: 372 Spiel-/Bedienungstexte, 152 Admin-Texte und 233 Absätze oder Titel der fiktiven Schiffsgeschichten und Bossakten. Die Formulierungen berücksichtigen den jeweiligen Kontext, einheitliche Begriffe und die tatsächliche Spielmechanik. Eigennamen bleiben unverändert. Es erfolgte keine Übermittlung an einen weiteren Übersetzungsdienst.

Der Scan hatte den technischen Sprachcode `en` aus einer bedingten Locale-Auswahl als Anzeigetext mitgezählt. Die Erfassung wurde auf tatsächliche DE/EN-Textzweige beschränkt; damit sind es 1020 statt 1021 Einträge. Chinesisch ist in diesem statischen Bestand vollständig, aber noch nicht muttersprachlich abgenommen. Dynamische oder nicht erfasste Texte können weiterhin Lücken enthalten. Die Gesamtfreigabe bleibt wegen der anderen Sprachen ausstehend; Pi Browser, physische Mobilgeräte und PNG-Export sind weiterhin offen. Build und ESLint bestanden nach der Ergänzung.

Die direkte chinesische Übersetzung wurde auf der separaten Preview `dpl_HaCbe41uAQ3NPrCY77RyYBy7PzHq` (Code `3fb6101c5abf792dfd913a12229e39a9a67962ee`, READY, Preview) im Browser geprüft. Verifizierte URL: https://cryptoid-evolution-48kxe0cev-19-trojan69.vercel.app/ . Startseite, Systemeinstellungen sowie Bedienungs- und Waffenanleitung erscheinen auf Chinesisch. Die Waffenanleitung stellt korrekt dar, dass EMP die Waffen 7 Sekunden deaktiviert, während Schiffe und Projektile weiterlaufen. Ein Vorschaubild dokumentiert die längeren Texte. Die 34 i18n-Tests und 7 Speicher-/Kartenprüfungen bestanden erneut. Diese Prüfung ist keine vollständige sprachliche oder mobile Abnahme.

## Tagesabschluss: 8. Oktober 2026

Auf Wunsch des Nutzers ist die Arbeit für heute pausiert. Auf der geprüften chinesischen Preview wurde die kostenlose Grey-Scout-Karte als Gast geöffnet, als PNG erzeugt und heruntergeladen. Das Bild zeigt chinesische Geschichte und Ausstattungsdaten ohne sichtbare Abschneidung. Keine Anmeldung oder Zahlung war erforderlich. Das bestätigt diesen Standardkartenexport im Desktopbrowser; andere Karten, RTL-Export, physische Mobilgeräte und Pi Browser bleiben offen.

139 weitere vietnamesische Anleitungs- und Kartentexte sind direkt ergänzt. Build und ESLint bestanden. Der vietnamesische Bestand ist weiterhin unvollständig und noch nicht in einer neuen Preview geprüft. Morgen zuerst Startseite/Systemtexte ergänzen, dann die weiteren fehlenden vietnamesischen Bedienungs-/Fehlertexte und Geschichten bearbeiten. Gesamtfreigabe, muttersprachliche Abnahme und echte Mobiltests bleiben offen. Offizielle Webseiten und stabiler Testnet-Stand bleiben unverändert.

## Fortsetzung: 9. Oktober 2026

60 bislang fehlende vietnamesische statische Texte für Schnellzugriff, Systemeinstellungen, Startseite, Anmeldung, Laden, Spielstand, Shop und Fehlermeldungen wurden direkt und kontextbezogen ergänzt. Die Bestandsaufnahme steigt damit rechnerisch von 298/1020 auf 358/1020, ohne geänderte Platzhalter. Die 662 weiteren Einträge bleiben offen, insbesondere Admin-Oberfläche und fiktive Schiffsgeschichten. Die vietnamesische Fassung bleibt ein Entwurf; eine neue Browser-Preview, muttersprachliche Prüfung und physische Mobiltests stehen noch aus. Produktion, `main` und der stabile Testnet-Link bleiben unverändert.

Weitere 89 vietnamesische Spiel-, Speicher-, Waffen-, Fortschritts- und Kauftexte wurden direkt ergänzt. Der erfasste Bestand steigt auf 447/1020; 573 Einträge bleiben offen. Der Paketbericht wurde vollständig aus dem vorherigen Commit wiederhergestellt, nachdem der vorausgehende Schreibvorgang dessen älteren Inhalt verdrängt hatte. Noch kein neuer Build, Browser- oder Mobiltest für diesen Zwischenstand.

## Fortlaufende Übersetzung: 9. Oktober 2026

Weitere 339 vietnamesische Einträge für die gesamte übrige erfasste Oberfläche einschließlich Administratoransicht, Testnet-/Mainnet-Hinweise, Bedienung, Speichern und Status wurden direkt ergänzt. Der statische Bestand steht bei 786/1020; 234 fiktive Geschichten- und Kartentexte bleiben. Platzhalter wurden verglichen; Build, Browser und muttersprachliche Abnahme für diese Erweiterung stehen noch aus. Keine Änderung an Produktion oder stabilem Testnet.

### Vietnamesischer statischer Bestand

Alle 234 zuletzt fehlenden fiktiven Schiffsgeschichten, Bossakten, Kartenbeschreibungen und Titel wurden direkt auf Vietnamesisch ergänzt. Damit sind 1020/1020 statisch erfasste Einträge vorhanden; Platzhalter und Schlüssel sind vollständig abgeglichen. Die Texte benötigen noch eine sprachliche Prüfung durch Muttersprachler sowie Browser- und Gerätekontrollen. Andere neue Sprachen und ältere Sprachlücken bleiben für die Gesamtfreigabe offen.

### Englische Admin-Texte

Alle 156 zuvor fehlenden deutschen Quelltexte der Administratoransicht besitzen jetzt eine explizite englische Übersetzung. Auch identische Begriffe wie Block und Level sind ausdrücklich hinterlegt. Der englische statische Bestand steht damit bei 1020/1020. Die anderen bestehenden und neuen Sprachen sind weiterhin unvollständig; die Freigabeprüfung bleibt gesperrt.

### Indonesische Bedienungstexte

247 weitere kurze Spiel-, Einstellungs-, Status-, Speicher- und Shoptexte wurden direkt auf Indonesisch ergänzt. Der erfasste Bestand steigt auf 408/1020; 612 Einträge fehlen noch. Platzhalter wurden abgeglichen. Der Entwurf bleibt von Produktion und stabilem Testnet getrennt.

### Buildprüfung des Fortsetzungsstands

Nach Korrektur eines fehlenden Trennzeichens im vietnamesischen Katalog und Initialisierung des englischen Katalogs bestand der Code-Stand `5432155d2a27c4c5c3496876f49195fd15f112dc` in GitHub Actions alle 34 Sprachtests, den TypeScript-/Vite-Build und den statischen Sprachscan. Der Scan meldete 1020 Texte, 0 direkte JSX-Fragmente, Englisch/Chinesisch/Vietnamesisch je 1020 und Indonesisch 408. Die drei gegenüber der direkten Eintragszählung zusätzlichen indonesischen Texte werden durch Katalogaliase abgedeckt. Die diagnostische Workflow-Datei wurde danach entfernt. Eine separate Vercel-Preview dieses Code-Stands erreichte READY. Die globale Freigabeprüfung ist weiterhin nicht erfüllt; 16.010 statische Übersetzungen fehlen in den übrigen Sprachen. Muttersprachliche und physische Geräteprüfungen stehen aus.

## Reduzierter Sprachumfang und Gerätewahl: 9. Oktober 2026

Nach der geänderten Vorgabe stehen neun Sprachen im Auswahlmenü: Englisch, Deutsch, Spanisch, Französisch, Portugiesisch, Italienisch, Russisch, vereinfachtes Chinesisch und Vietnamesisch. Die Auswahl ist eine pragmatische Begrenzung auf bisherige zentrale Sprachen und die vollständig erfassten chinesischen und vietnamesischen Pakete; sie ist keine belegte Nutzungsrangliste der Pi-Spieler. Andere bereits geschriebene Übersetzungen, darunter die indonesischen, bleiben im Katalog und können später erneut aktiviert werden.

Ohne manuelle Auswahl wird bei jedem Start die bevorzugte Gerätesprache aus `navigator.languages` geprüft. Regionale Varianten wie `es-MX`, `fr-CA` oder `pt-BR` verwenden das passende vorhandene Sprachpaket. Wenn die erste Gerätesprache nicht unterstützt wird, folgt die nächste; danach Englisch. `zh-Hans` und `zh-CN` verwenden vereinfachtes Chinesisch. `zh-Hant`, `zh-TW`, `zh-HK` und `zh-MO` fallen auf eine weitere unterstützte Gerätesprache oder Englisch zurück, da kein traditionell-chinesisches Paket vorhanden ist. Eine gespeicherte manuelle Wahl hat weiterhin Vorrang, bis „Automatisch“ gewählt wird. Alte gespeicherte Codes außerhalb der sichtbaren Auswahl werden wie automatische Wahl behandelt.

Der statische Freigabebestand zählt weiterhin 1020 Texte, aber nur die neun aktiven Sprachen: Englisch, Chinesisch und Vietnamesisch je 1020; Deutsch 685; Spanisch, Französisch, Portugiesisch, Italienisch und Russisch je 533. Es fehlen damit 2770 aktive Übersetzungen. Die Freigabeprüfung bleibt gesperrt; insbesondere Geschichten, Admin und längere Beschreibungen der bisherigen Sprachen benötigen Nacharbeit. Gesicherte Übersetzungen anderer Sprachen werden durch die Eingrenzung nicht gelöscht. Physische Geräte- und Pi-Browser-Abnahme stehen weiterhin aus.

## Testnet-Teststand: 9. Oktober 2026

Nach ausdrücklichem Nutzerwunsch wurde die READY-Preview `dpl_GnrnaqbCsZMUKkLo2xigPjFGb3hc` des Code-Commits `754e4e49fa217e80bbef967cfca9c55903facd06` auf den festen Testnet-Link https://cryptoid-evolution-testnet.vercel.app gelegt. Die Zuordnung wurde anschließend über Vercel erneut gelesen und zeigt auf genau dieses Deployment. Beide Produktionsadressen zeigen weiter auf `dpl_CgXqLk1XMPs4DycKYZrUNvGPBT12` (Commit `1871557dec332161cfdb0c90bc4d29022632bda6`). Der PR bleibt Entwurf; es gab keinen Merge.

Vor der Umschaltung geprüft: Vercel-Build READY; neun auswählbare Sprachen mit automatischer Gerätewahl; statischer Bestand ohne direkten JSX-Text und ohne ungültige Platzhalter; branchgebundene Preview-Variable `CRYPTOID_TESTNET_BACKEND=local`. Der Paket-7-Diff enthält keine Backend-Dateien; der unveränderte Gateway erzwingt im Preview-Testnet `x-cryptoid-app-network: testnet`. Die 2770 fehlenden aktiven Übersetzungen bleiben bekannt, deshalb ist dies ein Teststand und keine Sprachfreigabe für Mainnet. Anmeldung, Zahlung, muttersprachliche Abnahme und physische Mobil-/Pi-Browser-Prüfung wurden bei dieser Umschaltung nicht durchgeführt. Eine direkte HTTP-Prüfung der geschützten Preview war über den vorhandenen Vercel-Connector mit 403 nicht möglich; die Alias- und Buildprüfung sind davon getrennte Nachweise.

### Deutsche Sammlung und Kampfdaten

101 zuvor fehlende deutsche Texte für Sammlung, Bossakten, Ausrüstung, Kartenexport und Demo-Aufgaben wurden direkt übersetzt. Der deutsche statische Bestand steigt von 685 auf 786 von 1020. Eigennamen und der Platzhalter `{countdown}` bleiben erhalten. Weitere 234 deutsche Geschichten- und Aktenabsätze sowie 2435 Einträge in Spanisch, Französisch, Portugiesisch, Italienisch und Russisch bleiben offen; die Produktionsfreigabe ist weiterhin gesperrt.

### Sammlung und Bossakten in weiteren Sprachen

Je 98 bisher fehlende erfasste Texte für Karten, Boss-Kampfdaten und zugehörige Bedienung wurden direkt für Französisch, Portugiesisch, Italienisch und Russisch ergänzt. Die bereits gesicherten spanischen 98 Einträge sind im selben Oberflächenbereich. Jede dieser fünf Sprachen steht nun rechnerisch bei 631/1020, Deutsch bei 786/1020. Insgesamt bleiben 2179 statische Texte, vor allem Admin-Ansichten und fiktive Geschichten. Platzhalter wurden beim Eintragen verglichen; Browser- und muttersprachliche Prüfung stehen noch aus. Keine Produktionsfreigabe.

### Spanische Admin-Oberfläche

155 fehlende Texte der Eigentümer- und Zugriffsstatistikansicht sind direkt auf Spanisch ergänzt. Zahlungshinweise, Kontoabgrenzung, datensparsame Nutzungsstatistik und Bestätigungen wurden mit unveränderten Platzhaltern übertragen. Spanisch steht nun bei 786/1020; 234 fiktive Geschichten fehlen. Der gesamte aktive Restbestand sinkt auf 2024. Mainnet bleibt unverändert.

### Französische und portugiesische Admin-Texte

Je 155 Texte der Eigentümer- und Zugriffsstatistikansicht wurden direkt auf Französisch und Portugiesisch ergänzt. Platzhalter, Netzwerkgrenzen, Kaufhinweise und Zeitangaben wurden beim Eintragen abgeglichen. Beide Sprachen stehen nun wie Spanisch bei 786/1020; insgesamt fehlen 1714 erfasste Texte. Produktion bleibt auf dem bisherigen Stand.

### Italienische und russische Admin-Texte

Auch für Italienisch und Russisch wurden je 155 Admin-Texte direkt ergänzt. Damit sind die erfassten Admin- und Sammlungsoberflächen der fünf Sprachen abgedeckt. Für Deutsch, Spanisch, Französisch, Portugiesisch, Italienisch und Russisch verbleiben jeweils 234 fiktive Geschichten- und Bossakten-Texte, zusammen 1404. Die Produktionsfreigabe bleibt gesperrt, bis diese übersetzt und die vollständige Prüfung bestanden sind.

### Deutsche Schiffsgeschichten, erster Block

75 der 234 noch offenen deutschen Geschichts- und Bossakten-Texte sind kontextbezogen übertragen. Namen und Spielmechanik bleiben erhalten; der erfasste deutsche Stand erreicht 861/1020. Insgesamt sind 1329 statische Texte offen. Der letzte Code-Stand vor diesen Geschichten (`bf850cc1`) erreichte einen READY-Preview-Build. Browser- und muttersprachliche Prüfung bleiben ausstehend.

### Deutscher statischer Bestand vollständig

Alle 234 bislang offenen deutschen Schiffs- und Bossgeschichten sind direkt ergänzt. Zusammen mit den bereits übersetzten Bedienungs- und Admin-Texten erreicht Deutsch 1020/1020 erfasste Einträge. Platzhalter und Eigennamen wurden abgeglichen; die Geschichte bleibt ausdrücklich Fiktion und verleiht keine Spielmechanik. Noch offen sind je 234 Geschichten auf Spanisch, Französisch, Portugiesisch, Italienisch und Russisch, insgesamt 1170 Texte. Eine vollständige Browser- und muttersprachliche Abnahme steht aus.

### Spanische Geschichten, erster Block

100 der 234 spanischen Schiffs- und Bossgeschichten wurden direkt übertragen. Der statische spanische Bestand erreicht 886/1020; insgesamt verbleiben 1070 Texte. Der vollständige deutsche Stand `fee6f89d` hat den Preview-Build bestanden. Produktionsdomain und fester Testnet-Link bleiben auf ihren bisher zugewiesenen Deployments.

### Spanische Geschichten vollständig

Alle 234 spanischen Schiffs- und Bossgeschichten sind direkt übersetzt. Der statische spanische Katalog erreicht 1020/1020; für Französisch, Portugiesisch, Italienisch und Russisch fehlen jeweils 234 Lore-Texte (insgesamt 936). Die Freigabeprüfung und Laufzeittests folgen.

## Freigabeumfang und spätere Übersetzungen (9. Oktober 2026)

Der Nutzer hat den Umfang geändert: Die vollständig vorhandenen Sprachen `en`, `de`, `es`, `zh` (vereinfacht) und `vi` werden jetzt fertiggestellt und zur Freigabe geprüft. Gerät/Browser wählt eine davon automatisch; eine gespeicherte manuelle Auswahl hat Vorrang. Für nicht unterstützte Gerätesprachen gilt Englisch. `fr`, `pt`, `it` und `ru` werden vorerst nicht angeboten; ihre bisherigen Übersetzungen bleiben erhalten. Ihre restlichen 936 Geschichten sind für Ende nächster Woche (Freitag, 16. Oktober 2026, Europe/Vienna) zurückgestellt. 75 bereits direkt verfasste französische Entwürfe sind in `package-7-deferred-french-lore-2026-10-09.json` gesichert und noch nicht in den Laufzeitkatalog eingebunden.

Der Release-Scan prüft die fünf angebotenen Sprachen vollständig. Das statische Inventar enthält je 1020/1020 Texte, keine fehlenden Platzhalter und keine unübersetzten JSX-Fragmente. Diese Bestandsaufnahme ersetzt keine Browser-, Geräte- oder Pi-Zahlungsprüfung. Frühere Abschnitte beschreiben den neunsprachigen Zwischenstand und sind historisch.
