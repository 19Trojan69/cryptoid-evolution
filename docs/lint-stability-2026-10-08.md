# Separates Stabilitätspaket: Lint und React-Zustände

Stand: 8. Oktober 2026. Basis: Paket 3, Remote-PR #133 (`142ab9e`), unverändertes `main` (`1871557`). Separater Branch `codex/lint-stability-2026-10-08`. Produktion bleibt unverändert.

## Befund und Korrektur

Die Paket-3-Basis hatte 14 ESLint-Fehler und 16 Warnungen. Das Paket behebt sämtliche 30 Meldungen ohne Regelabschaltung.

| Bereich | Dateien | Absicherung |
| --- | --- | --- |
| Spielschleife, Audio und Start | `GamePage.tsx` | Ein RAF und einmalige Ladeaktivierung bleiben bestehen. Aktuelle Handler für Save, Bossende und Audio werden über stabile Referenzen genutzt. Der aktuelle Schiffstyp/-farbwert wird bei Treffereffekten ausgelesen. Belohnungskarte, Bossbildvorladen und Musiklautstärke reagieren auf passende Zustandsänderungen. |
| Shop, Inventar, Sammlung | `Shop.tsx`, `MissionWeaponShop.tsx`, `Collection.tsx`, `CardReveal.tsx` | Primitive Schlüssel/UIDs statt instabiler Array-Ausdrücke; Inventarabruf als zustandsabhängiger Callback. Bestehende Versions- und Besitzerprüfung, Modal-Fokus, Export-Abbruch und Kaufbestätigung bleiben erhalten. |
| Bilder und HUD | `BossPortrait.tsx`, `ShipPortrait.tsx`, `Starfield.tsx`, `BossHealthView.tsx`, `bossHealthLayout.ts` | Porträts werden bei Asset-/Silhouettenwechsel neu instanziiert und starten unsichtbar, bis genau das neue Bild geladen wurde. Sternenflare wird bei Pause ausgehängt; Boss-Geschützleisten bleiben über primitive Layoutwerte memoisiert. |
| Entwicklungsstruktur | `Router.tsx`, `AdminLoading.tsx`, `BossWeaponsView.tsx`, `bossWeaponTextures.ts`, `bossArtwork.ts`, `SystemSettings.tsx`, `displaySettings.ts`, `EarthGlobe.tsx`, `gameAudio.ts` | Hilfsfunktionen aus Komponentenmodulen verschoben; Signaturen und gespeicherte Anzeigeeinstellungen erhalten; rein syntaktische Lint-Meldungen korrigiert. |

## Prüfungen

- `frontend/npm run lint`: 0 Fehler, 0 Warnungen.
- `frontend/npm run build`: TypeScript, i18n und Vite erfolgreich; Build meldet weiterhin den bereits vorhandenen großen JS-Chunk als Hinweis.
- Alle 50 Frontend-Spieltestdateien plus i18n-Test bestanden.
- `backend/npm run build` und alle 48 Backend-Tests bestanden, darunter Account-/Netzwerktrennung, Zahlungen, Checkpoints und Karten. Die drei HTTP-Testdateien erforderten lokalen Loopback-Zugriff; im eingeschränkten Sandboxlauf trat nur `listen EPERM` auf.
- `git diff --check`: bestanden.

## Offene Geräteprüfung

Browser-Testnet, echtes iPhone/Android und Pi-Browser mit angemeldetem Konto bleiben für visuellen Bildwechsel, Audio-Unterbrechung, Kauf und Langzeitsitzung zu prüfen. Das Paket verändert weder Datenmodell noch Pi-SDK, Payment-Handler oder MongoDB-Schema. Paket 4 wurde nicht begonnen.
