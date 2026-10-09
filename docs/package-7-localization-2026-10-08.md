# Paket 7 – Erweiterte Lokalisierung, geprüfter Entwurf

Status: nicht veröffentlichungsbereit. Basis ist Paket 6 (`a5f700cfb5a2f6801ca5889a15dd19d797a2c8b3`); Produktion und der stabile Testnet-Stand bleiben unverändert.

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
