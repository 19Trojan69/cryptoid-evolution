# Paket 4 – visuelles Gameplay, HUD und mobile Bedienung

Stand: 8. Oktober 2026. Basis ist der getrennte Lint-Stabilitätsbranch; Draft-PR #135. Änderungen an Serverdaten, Käufen, Pi SDK und Spielstandformat sind nicht enthalten. Produktion wurde nicht aktualisiert.

## Änderungen und behobene Befunde

| Datei | Änderung |
| --- | --- |
| `frontend/src/index.css` | Verstärkungs- und Bosswarnung als kurze, rahmenlose Typografie in der Bildschirmmitte; reduzierte Bewegung ohne Flackern. Identische Würfelrotation mit längerer Perspektive. Größeres Spielerschiff und Höhenbegrenzung für kurze Mobilbildschirme. |
| `frontend/src/pages/BlockchainProgress.tsx` | Alle neun Würfel nutzen denselben Rotationsstil. Zugänglichkeitslabel verwendet vorhandenen übersetzten Begriff „Block“. |
| `frontend/src/pages/GamePage.tsx` | Normale Gegner und Bonusziele optisch um 10 % vergrößert; vorhandene Kollisionsradien bleiben unverändert. Vorhandene Doppeltipp-Abwehr reagiert jetzt auf den zweiten Touch bereits beim Beginn und prüft Abstand, Zeit sowie Spiel- und UI-Bereich. |
| `TODO.md` | Paketstatus, Geräteabnahme und nächstes Paket dokumentiert. |

Die Warntexte nutzen die bestehenden Sprachkataloge. Schiffspositionen, Schaden, Schild, Projektiltreffer und Speicherdaten wurden nicht verändert. Der Doppeltipp-Schutz greift nur während des laufenden Spiels außerhalb von HUD, Menüs und Buttons. Es gibt keine globale `user-scalable=no`-Sperre.

## Prüfungen

- `frontend`: ESLint ohne Fehler und Warnungen; alle 50 Spieltestdateien; i18n-Test für alle unterstützten Sprachen; TypeScript- und Vite-Build bestanden.
- `backend`: TypeScript-Build bestanden; keine Backend-Dateien geändert.
- `git diff --check` bestanden.
- Separater Vercel-Preview-Build im Testnet-Projekt gestartet; Browser-Sichtprüfung und weitere Geräteabnahme separat dokumentieren.

## Offene Abnahme und Risiken

- Doppeltipp-Verhalten auf einem physischen iPhone, im Pi Browser und auf Android prüfen. Ein Betriebssystem-Zoom aus Bedienungshilfen kann durch Webcode nicht zuverlässig unterbunden werden. Falls das die Ursache ist, die Bedienung dokumentieren statt die Zugänglichkeit der ganzen Seite zu sperren.
- Warnung und Würfel während realer Block-/Bossübergänge sowie Schiffs- und HUD-Abstände bei schmalen/kurzen Bildschirmen prüfen. Browser-Preview ersetzt keinen physischen Geräte- und Langzeittest.
- Der bereits bekannte Haupt-JavaScript-Chunk von rund 1,72 MB bleibt unverändert und ist als separate Performancearbeit vorgemerkt.
