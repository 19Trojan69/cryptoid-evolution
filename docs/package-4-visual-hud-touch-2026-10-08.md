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
- Separater Vercel-Preview-Build im Testnet-Projekt (`6147841c3a66bfb635f189d4cf49127ee752ffcf`) ist READY und im Chrome-Gastmodus spielbar: Spielstart, HUD, Spieler- und Gegnerdarstellung, Waffenmenü und 3–2–1-Rückkehr geprüft. Die Spielfläche meldet `touch-action: none`; sechs Gegner mit unveränderter Trefferlogik konnten sichtbar geladen werden. Ein physischer Touchtest und tatsächlicher Block-/Bossübergang waren in dieser Browserprüfung nicht verfügbar.
- Testnet-Preview: <https://cryptoid-evolution-testnet-o6df4um3x-19-trojan69.vercel.app/game>. Die feste Testnet-Adresse zeigt weiter das Lint-Stabilitätspaket. Promotion des Previews wurde mit 422 abgewiesen; Produktion-Deployment im *separaten Testnet-Projekt* und Alias-Zuordnung wurden mit 403 verweigert. Das Produktionsprojekt `cryptoid-evolution` zeigt weiter auf `main` (`1871557dec332161cfdb0c90bc4d29022632bda6`).

## Offene Abnahme und Risiken

- Doppeltipp-Verhalten auf einem physischen iPhone, im Pi Browser und auf Android prüfen. Ein Betriebssystem-Zoom aus Bedienungshilfen kann durch Webcode nicht zuverlässig unterbunden werden. Falls das die Ursache ist, die Bedienung dokumentieren statt die Zugänglichkeit der ganzen Seite zu sperren.
- Warnung und Würfel während realer Block-/Bossübergänge sowie Schiffs- und HUD-Abstände bei schmalen/kurzen Bildschirmen prüfen. Browser-Preview ersetzt keinen physischen Geräte- und Langzeittest.
- Die Browserkonsole meldete nach längerer Sitzung Pi-SDK-Messaging-Timeouts außerhalb des Pi Browsers. Spiel und Waffenmenü blieben bedienbar; die Ursache gehört in eine gesonderte Pi-Browser-Abnahme.
- Der bereits bekannte Haupt-JavaScript-Chunk von rund 1,72 MB bleibt unverändert und ist als separate Performancearbeit vorgemerkt.
