# Paket 6 – Audio-Polish

Stand: 8. Oktober 2026. Basis `a6f7dfb` (Paket 5), eigener Branch `codex/package-6-audio-polish`. Keine Änderung an `main` oder Produktionsdomain.

## Verhalten

- Normale Gegner verwenden vier eigene, kurze Energie-Schussklänge nach der tatsächlichen `shipClass`: Light (0,14 s), Medium (0,19 s), Heavy (0,26 s), Elite (0,21 s). Höhere Einzelpegel als bisher; tiefere, längere schwere Schüsse und heller modulierter Elite-Klang. Kein neuer Sound bei Gegnern, die tatsächlich keinen Schuss abgeben.
- Sechs bestehende Bosswaffenfamilien und deren drei Kalibervarianten bleiben erhalten. Leicht erhöhte Basispegel; Heavy und Siege bekommen zusätzliche Obertöne, damit der Eindruck schwerer Waffen weniger von tiefer Basswiedergabe abhängt. Rohrgröße, Feuerrate und Salvensteuerung unverändert.
- Ein eigener Gegnerwaffen-Mixbus hält die konservative Summe der synthetischen Spitzen vor dem Effektregler bei höchstens 0,62. Ausblendende Stimmen zählen bis zum tatsächlichen Ende mit. Das ist eine Grenze für den Gegnerbus, keine Garantie für den Gesamtmix einschließlich Musik und anderer Effekte.
- Spielerwaffen, Sirene, Pickups und Explosionen laufen weiter direkt über den bestehenden Effektbus mit Kompressor. Gegner begrenzen sich gegenseitig, statt Warnungen über die Gegner-Normalisierung leiser zu machen. Musik bleibt auf ihrem vorhandenen getrennten Pfad; keine neue globale Lautstärke.
- Maximal 20 aktive Gegner-/Bosswaffenstimmen, kurze Ausblendung verdrängter Stimmen, existierende Stereoortung, Effektregler, Stummschaltung und Pause. Bei fehlgeschlagenem Audio-Start wird die Stimme aus dem Mixbudget entfernt.
- 22 synthetische Audiopuffer (18 Boss + 4 Gegner) werden einmal pro AudioContext vorbereitet; keine Synthese im Schuss-/Renderpfad, keine neuen Downloads.

## Dateien

| Datei | Änderung |
|---|---|
| `frontend/src/pages/enemyWeaponSound.ts` | Vier Profile und parametrische Synthese mit begrenzter Spitze |
| `frontend/src/pages/bossWeaponSound.ts` | Phone-taugliche Obertöne für Heavy/Siege |
| `frontend/src/pages/gameAudio.ts` | Profilwahl, Pegel und separater begrenzter Gegnerbus |
| `frontend/src/pages/GamePage.tsx` | Tatsächliche Schiffsklasse beim Schuss an Audio übergeben |
| Audiotests | Geräte-Sampleraten, Unterschiedlichkeit, Wiederverwendung, Mixbudget und Warnpfad |

## Validierung

- `node --experimental-strip-types --test src/pages/*.test.mjs`: 211 bestanden.
- `npm run build`: 22 i18n-Tests, TypeScript und Vite bestanden.
- `npm run lint`: 0 Fehler / 0 Warnungen.
- `git diff --check`: bestanden.
- PCM für alle Gegnerklassen bei 22.050 / 44.100 / 48.000 / 96.000 Hz endlich, Spitzen <= 0,641, sanfte Enden, ausreichend Energie und paarweise unterschiedliche Wellenformen.
- Alle 18 Bosskalibervarianten im bestehenden Test endlich, begrenzt und verschieden.
- Simulierter dichter Mix einschließlich 45 Siege-Schüssen: 20 aktive Stimmen, Mixbudget einschließlich ausblendender Stimmen eingehalten, Alarmaufzeichnung direkt am Effektbus, Normalisierung erholt sich nach Ende/Startfehler. Stumm und Pause verhindern neue Waffenquellen.
- Kein Mechanik-/Kauf-/Score-/Spielstand-/Übersetzungsumbau. Paket-5-Backend unverändert.

## Testnet und Abnahme

Branchbezogene Preview-Konfiguration `CRYPTOID_TESTNET_BACKEND=local` wurde im Hauptprojekt ausschließlich für diesen Branch gesetzt. Dieselbe Testnet-erzwingende Gateway-Architektur wie Paket 5; Zahlungsdienst bleibt getrennt. Noch keine Alias-Umschaltung zum Zeitpunkt dieses Implementierungsnachweises.

Physische Hörabnahme mit Musik, Warnungen, Spielerwaffen und großen Salven auf iPhone, Android und im Pi Browser bleibt offen. Automatisierte Pegel-/Signalprüfungen ersetzen diese subjektive Hörabnahme nicht. Bekannte große JS-Bundle-Warnung bleibt gesonderte Performancearbeit.
