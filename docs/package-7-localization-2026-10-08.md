# Paket 7 – Erweiterte Lokalisierung, geprüfter Entwurf

Status: nicht veröffentlichungsbereit. Basis ist Paket 6 (`a5f700cfb5a2f6801ca5889a15dd19d797a2c8b3`); Produktion und der stabile Testnet-Stand bleiben unverändert.

## Sprachumfang

Zusätzlich zu den bisherigen 17 Sprachen sind zwölf Profile vorbereitet: vereinfachtes Chinesisch (`zh`), Vietnamesisch (`vi`), Indonesisch (`id`), Koreanisch (`ko`), Japanisch (`ja`), Hindi (`hi`), Bengali (`bn`), Arabisch (`ar`), Urdu (`ur`), Persisch (`fa`), Filipino (`fil`) und Swahili (`sw`). Diese Auswahl erweitert die regionale Abdeckung; sie ist keine statistisch belegte Rangliste der Pi-Network-Verbreitung und keine Behauptung, sämtliche Länder oder Landessprachen abzudecken.

110 zentrale Bedienungstexte und acht Beschreibungen der Spezialfähigkeiten pro neuer Sprache sind lokal ergänzt. Nova-/EMP-Texte entsprechen der aktuellen Spielmechanik. Längere Hilfe-, Admin-, Sammelkarten- und Beschreibungstexte bleiben offen; Englisch ist dort der vorhandene Fallback.

## Implementierter Stand

- Manuelle gespeicherte Wahl hat Vorrang vor den Browser-/Gerätesprachen; danach gilt Englisch als Fallback. Die Wahl bleibt jederzeit änderbar.
- Regionale Codes und Unterstriche werden normalisiert; `tl` wird Filipino zugeordnet. Chinesische Gerätecodes wählen das klar als vereinfacht gekennzeichnete Profil; traditionelles Chinesisch ist kein separates Paket.
- Verweigertes oder volles Browser-Storage verhindert den Sprachwechsel nicht: die Wahl bleibt für den aktuellen Tab im Speicher. Gespeichert wird ausschließlich der bestehende Sprachschlüssel.
- Dokumentsprachcode und Schreibrichtung werden aktualisiert. Arabisch, Urdu und Persisch erhalten RTL; das Spielfeld und die physischen Steuerungen behalten ihre LTR-Geometrie.
- Schrift-Fallbacks und umbruchfähige Sprachoptionen sind vorbereitet. Die tatsächliche Darstellung auf Mobilgeräten ist noch nicht abgenommen.

## Prüfungen

- 249 Tests bestanden: 211 Spieltests und 38 Sprach-/Speichertests.
- Frontend-Build und ESLint bestanden. Die bekannte Warnung zum großen Hauptbundle bleibt bestehen.
- `npm run audit:i18n --prefix frontend` erfasst 904 statische Texte und 152 noch nicht über den Sprachkatalog angebundene UI-Fragmente. Der Bericht ist eine statische Bestandsaufnahme, keine Garantie, sämtliche dynamischen Texte zu erfassen.
- Die zwölf neuen Kataloge decken jeweils 144 von 776 erfassten englischen Schlüsseln ab, einschließlich gemeinsam genutzter Einträge/Aliasse. Die alten nichtenglischen Kataloge decken 519 ab. Die bisherigen Sprachtests prüfen bei neuen Sprachen ausdrücklich nur die vorbereiteten Kerntexte.
- `npm run check:i18n:release --prefix frontend` muss vor der Veröffentlichung bestehen. Aktuell schlägt diese zusätzliche Freigabeprüfung wie vorgesehen fehl.
- Visuelle Browserprüfung noch offen: der Cloud-Prüfbrowser erreicht den lokalen Entwicklungsserver nicht (`ERR_CONNECTION_REFUSED`). Keine erfolgreiche Layout- oder Pi-Browser-Abnahme behauptet.

## Offene Arbeit vor Veröffentlichung

Die statische Textliste befindet sich in `package-7-translation-inventory-2026-10-08.json`. Fehlende Texte müssen ergänzt und noch direkte Texte an den Katalog angeschlossen werden. Danach Platzhalter, Mechanikbeschreibungen, regionale Erkennung, Sprachwechsel, Persistenz, Textumbrüche und RTL im Browser prüfen; anschließend einen vollständigen Testnet-Kandidaten erstellen.

Eine angefragte Stapelübersetzung über Google Translate wurde von der automatischen Freigabeprüfung abgelehnt, weil die Übermittlung interner Texte des privaten Repositories an diesen Anbieter nicht ausdrücklich autorisiert war. Weitere externe Übersetzungsaufrufe wurden nicht ausgeführt. Eine mögliche Freigabe umfasst ausschließlich statische Menü-, Hilfe-, Fehler-, Admin-Bedienungs- und Beschreibungstexte, einschließlich fiktiver Sammelkarten-Geschichten, mit Platzhaltern. Laufzeitwerte, Kontodaten, Zahlungen, Zugangsschlüssel und Quellcode sind nicht Bestandteil dieser Textübermittlung.
