# Paket 7 – Erweiterte Lokalisierung, geprüfter Entwurf

Status: nicht veröffentlichungsbereit. Basis ist Paket 6 (`a5f700cfb5a2f6801ca5889a15dd19d797a2c8b3`); Produktion und der stabile Testnet-Stand bleiben unverändert.

## Sprachumfang

Zusätzlich zu den bisherigen 17 Sprachen sind zwölf Profile integriert: vereinfachtes Chinesisch (`zh`), Vietnamesisch (`vi`), Indonesisch (`id`), Koreanisch (`ko`), Japanisch (`ja`), Hindi (`hi`), Bengali (`bn`), Arabisch (`ar`), Urdu (`ur`), Persisch (`fa`), Filipino (`fil`) und Swahili (`sw`). Diese Auswahl erweitert die regionale Abdeckung; sie ist keine statistisch belegte Rangliste der Pi-Network-Verbreitung und keine Behauptung, sämtliche Länder oder Landessprachen abzudecken.

110 zentrale Bedienungstexte und acht Beschreibungen der Spezialfähigkeiten pro neuer Sprache sind lokal ergänzt. Nova-/EMP-Texte entsprechen der aktuellen Spielmechanik. Acht zusätzliche Karten-/Ausstattungs- und PNG-Texte liegen für alle 28 nichtenglischen Sprachen vor. Chinesische Sammelkarten- und Boss-Kampfdaten-Texte wurden außerdem direkt ergänzt. Längere Hilfe-, Admin- und Schiffsgeschichten sind noch unvollständig. Die Sprachtests prüfen die neuen Kerntexte; die zusätzliche Freigabeprüfung kontrolliert den breiteren Bestand.

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
- Chinesisch deckt 257 von 1020 erfassten Einträgen ab; die übrigen elf neuen Sprachen jeweils 157. Diese Zahlen enthalten gemeinsam genutzte Namen und Aliasse. Deutsch deckt 684, die übrigen bisherigen nichtenglischen Sprachen jeweils 532 ab. Englisch deckt 864 ab; fehlende deutsche Admin-Texte sind ausdrücklich sichtbar.
- `npm run check:i18n:release --prefix frontend` muss vor der Veröffentlichung bestehen. Aktuell schlägt diese zusätzliche Prüfung wie vorgesehen fehl. Sie prüft fehlende Texte und die Erhaltung aller Platzhalter.
- Das statische Inventar hat Schema 2: fehlende Texte referenzieren die Eintrags-IDs, statt längere Geschichten pro Sprache zu duplizieren.
- Browserprüfung über eine separate Vercel-Preview durchgeführt: alle 29 Profile sichtbar; Chinesisch auswählbar und nach Neuladen erhalten (`lang=zh-Hans`, `dir=ltr`); Arabisch wechselt auf `lang=ar`, `dir=rtl`. Die RTL-Systemansicht wurde visuell geprüft. Die lokale Verbindung war zuvor mit `ERR_CONNECTION_REFUSED` blockiert. Physische Mobilgeräte, Pi Browser und PNG-Export bleiben offen.

## Offene Arbeit vor Veröffentlichung

Die statische Textliste befindet sich in `package-7-translation-inventory-2026-10-08.json`. Fehlende Texte müssen ergänzt werden. Danach alle Oberflächen, Platzhalter, Mechanikbeschreibungen, regionale Erkennung, Sprachwechsel, Persistenz, Textumbrüche, RTL und PNG-Export im Browser prüfen; anschließend einen vollständigen Testnet-Kandidaten erstellen.

Die Übermittlung statischer UI-, Hilfe-, Fehler- und Beschreibungstexte einschließlich fiktiver Sammelkarten-Geschichten an Google Translate wurde vom Nutzer am 8. Oktober 2026 ausdrücklich freigegeben. Die Zustimmung gilt weiterhin. Laufzeitwerte, Kontodaten, Zahlungen, Zugangsschlüssel und Quellcode sind nicht Bestandteil dieser Freigabe oder der vorgesehenen Textübermittlung.

Google hat die Testanfrage mit HTTP 429 und einer ausdrücklichen Sperre für automatisierte Anfragen abgelehnt. Ein einzelner erneuter Versuch zeigte dieselbe Sperre. Es wurde keine Übersetzung zurückgegeben; weitere Aufrufe und Umgehungen wurden nicht ausgeführt. Die vollständige Stapelübersetzung bleibt dadurch blockiert, nicht durch eine fehlende Zustimmung. Bis dahin werden sichere lokale Ergänzungen als Entwurf gesichert und nicht als vollständiges Sprachpaket veröffentlicht.

## Separate Prüfvorschau

Der Stand `2c62aaf4b4c03d988808ddf7039f36af8d6a65c5` wurde als Preview `dpl_7Hr2uCd5aoQDRA3um7duSLZ4kSSz` bereitgestellt (Vercel-Projekt `prj_BAIJH4BzLLwun36kWVEnTdx69j0q`, Ziel Preview, READY). Der feste Testnet-Link wurde nicht umgestellt. Ein kurzzeitig erzeugter, nicht benötigter Freigabelink wurde wieder widerrufen. Die Browserprüfung machte noch fehlende chinesische Startseiten-/Schnellzugriffstexte sichtbar; diese wurden anschließend lokal ergänzt.
