# Paket 5 – Score, Rangliste und eigener Admin-Reset

Stand: 8. Oktober 2026. Sauberer Ausgangspunkt `codex/package-4-3-collision-hit-feedback`, separater Branch `codex/package-5-score-leaderboard-admin`. `main` und die Produktionsversion bleiben unverändert.

## Umsetzung und Dateien

| Dateien | Änderung |
| --- | --- |
| `backend/src/scoreRules.ts`, `backend/src/handlers/leaderboard.ts` | Neue netzwerkbezogene Felder `careerScoreByNetwork` und `bestRunByNetwork`. Verifiziertes Run-Ende erhöht Career Score einmalig in demselben atomaren Update, das den Run abschließt. Best Run speichert Score und das aus dem aktiven Run abgeleitete Level. Top 100 sortiert standardmäßig nach Career Score. Vorhandene V1/V2-Rekorde bleiben in den bisherigen Ansichten erhalten; ein alter V2-Bestwert ohne gespeichertes Level wird mit unbekanntem Level angezeigt. |
| `backend/src/index.ts` | Sortierindizes für beide Netzwerk-Karrierelisten. Keine Datenmigration und kein Eingriff in Spielerinventar. |
| `backend/src/handlers/admin.ts` | Admin-Reset nach bestehender Eigentümerprüfung. Erfordert das aktuelle Netzwerk, den exakt eingegebenen Pi-Namen und explizite Bestätigung. Blockiert bei aktivem Run; setzt nur Score-Felder des eigenen UID im aktuellen Netzwerk zurück. |
| `frontend/src/pages/Shop.tsx`, `frontend/src/pages/GameGuide.tsx`, `frontend/src/index.css` | Neue Karriere-Ansicht der Top 100, Best Run und Run-Level neben Profillevel, historische Listen erreichbar, Fortschrittstexte und mobile Tabellen angepasst. |
| `frontend/src/pages/AdminPage.tsx`, `frontend/src/pages/admin.css` | Eigene Rekorde anzeigen, Netzwerk und Konto sichtbar machen, Rücksetzen mit Eingabe plus Checkbox; mobile Bedienung. |
| `frontend/src/locales/package5.ts`, `frontend/src/locales/catalog.ts` | Neue Beschriftungen und Mechanikerklärungen für alle 17 aktuell unterstützten Sprachen. |
| `backend/src/handlers/progress.test.mjs`, `backend/src/handlers/careerLeaderboard.test.mjs`, `backend/src/handlers/scoreReset.test.mjs`, `backend/src/scoreRules.test.mjs` | Testfälle für atomare Einmalgutschrift, Netzwerktrennung, historisches Best, Rangfolge, Run- versus Profillevel, Besitzerprüfung und Reset ohne Verlust von Inventar/anderen Nutzern. |

## Regeln und Kompatibilität

- Nur beim bestätigten Game Over oder vollständigen Kampagnensieg wird ein Run als abgeschlossen gewertet. Zwischenstände verändern den Career Score nicht. Ein Run kann durch eine wiederholte Anfrage nicht doppelt zählen. Fortsetzen übernimmt den bisherigen Score; bei späterem Abschluss zählt der gesamte zusammenhängende Lauf einmal. Der Server prüft weiterhin Lauf-ID, Dauer/Plausibilität, zugehörigen Spielstand, aktives Netzwerk und atomaren Versionswechsel. Dies schützt gegen einfache Wiederholungs- und Farmingversuche; eine vollständig serverautoritativ simulierte Spielrunde besteht bisher nicht.
- Historische Career-Summen können aus bisherigen Maximalwerten nicht zuverlässig rekonstruiert werden. Career Score beginnt deshalb für bestehende Konten bei null; der alte Bestwert bleibt in den bisherigen Ranglisten und, falls V2, als Best-Run-Fallback erhalten. Ein früher nicht gespeichertes Run-Level wird als „—“ angezeigt und nicht aus dem aktuellen Profillevel geraten.
- Der Reset betrifft kein `playerByNetwork`, keine Shards, Käufe, Spielstände, Rewards, Pi-Daten oder fremde Nutzer. Der alte globale V1-Archivwert ist nicht sicher einem Netzwerk zuordenbar und bleibt deshalb erhalten.

## Prüfungen

- Frontend: 50 Seitentestdateien und i18n-Test bestanden; TypeScript/Vite-Build und ESLint erfolgreich.
- Backend: TypeScript-Build und vollständige Suite mit 52 Tests erfolgreich, einschließlich vorhandener Admin-/Payment-/Progress-Regressionen. Lokale HTTP-Integrationstests wurden mit Loopback-Freigabe ausgeführt.
- `git diff --check` bestanden. Keine Änderungen an Pi-SDK- oder Payment-Code. Der bekannte große JS-Chunk ist weiterhin eine getrennte Performanceaufgabe.

## Freigabeblock für Testnet

`api/index.ts` leitet im Testnet **alle** `/api`-Routen an den gegenwärtigen Produktions-Backend-Dienst weiter. Dessen Commit enthält die neuen Endpunkte und Score-Felder noch nicht. Das separate Testnet-Projekt hat keinen eigenen MongoDB-Zugang konfiguriert. Eine bloße Frontend-Alias-Umschaltung würde eine scheinbar spielbare, aber inkonsistente Rangliste veröffentlichen. Daher keine Aktualisierung der festen Testnet-Adresse und kein Produktionsrelease. Für einen echten Ende-zu-Ende-Test benötigt Paket 5 einen geprüften separaten Backend-Staging-Pfad mit verifizierter Authentifizierung und Erhalt des bestehenden Testnet-Spielstands; erst danach dürfen Tests mit realem Konto und Geräten sowie die Testnet-Freigabe folgen.
