# Paket 2 – Waffen und Power-ups

Stand: 8. Oktober 2026. Basis: `codex/package-1-stability` (`861f9fe`). Nur Paket 2; `main` und die Produktion wurden nicht verändert.

## Änderungen und Dateien

| Bereich | Dateien | Ergebnis |
| --- | --- | --- |
| Waffenmenü und Layer | `frontend/src/pages/GamePage.tsx`, `MissionWeaponShop.tsx`, `WeaponTutorial.tsx`, `weaponTutorial.css`, `weaponSelection.css`, `frontend/src/index.css` | Seitlicher Waffen-Tab, einfahrendes durchsichtiges Menü, Schiff vor UI, bedienbare Buttons und lokalisierte Überschrift. |
| Nachladen und Waffenwechsel | `GamePage.tsx`, `weaponAutoReload.ts`, `gameAudio.ts` | Kein blockierender Reload-Dialog; kurzer rahmenloser Hinweis und kurzer Ton. Fallback nutzt aktive laufende Waffen, sonst Standardschuss. Die bestehende serverseitige Aktivierung behält Run-ID, Request-ID, Testnet-Beschränkung und Bestandsprüfung. |
| Freie Power-ups und Save | `powerUps.ts`, `GamePage.tsx`, `backend/src/combatCheckpoint.ts` | Höchstens eine Ausgabe je Typ und Level; 6,5 % frühe Dropchance, bis 10 % in späteren Levels. Die Typ-Historie überdauert Combat-Checkpoint/Continue und wird beim nächsten Level zurückgesetzt. Ältere Checkpoints bleiben lesbar; bei bereits erzeugten Drops werden weitere freie Drops bis zum nächsten Level konservativ ausgesetzt. |
| Texte | `GameGuide.tsx`, `MissionWeaponShop.tsx`, `WeaponTutorial.tsx`, `frontend/src/locales/catalog.ts`, `package2.ts` | Anleitung und Shop erklären Menü, Fallback, Nachladen und die Level-Grenze in allen 17 unterstützten Sprachen. |
| Nachweise | `TODO.md`, `frontend/src/pages/powerUps.test.mjs`, `weaponAutoReload.test.mjs`, `backend/src/handlers/progress.test.mjs`, diese Datei | Projekttodo und gezielte Regressionstests. |

## Prüfungen

- Frontend-Build inklusive TypeScript und Sprachprüfung erfolgreich; 50 Frontend-Testdateien bestanden.
- Backend-Build erfolgreich; 47 Backend-Testdateien bestanden, einschließlich Checkpoint/Bestands-/Payment-Tests. Die lokalen HTTP-Testports benötigen eine Umgebung mit Loopback-Berechtigung.
- Lint: 14 Fehler und 16 Warnungen, exakt dieselbe Zahl mit derselben installierten Version auf dem unveränderten Paket-1-Basiscommit. Keine neue Lint-Meldung.
- Chromium 390 × 844 und 1280 × 800: Waffen-Tab öffnen, einfahrendes Menü, sichtbares Schiff vor der Oberfläche, Menü schließen und 3–2–1-Countdown geprüft. Die live autorisierte Pi-Kaufaktivierung wurde nicht mit einer echten Transaktion ausgeführt; Bestands-/Idempotenzpfad ist automatisiert abgedeckt.

## Offenes

- Physische Android-/iPhone-/Pi-Browser-Abnahme und längerer Test eines tatsächlichen kostenpflichtigen Test-Pi-Reloads.
- Im lokalen Gast-Browser trat die vorhandene Konsolenmeldung `Pi is not defined` auf, ohne den Spielstart zu verhindern. Diese Integrationsmeldung separat prüfen.
- Die bekannte große JS-Ausgabe und bestehende Lint-Schulden bleiben eigene Aufgaben.
