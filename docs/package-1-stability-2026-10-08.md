# Paket 1 – Stabilitätsbericht, 8. Oktober 2026

## Stand und Umfang

Arbeitsbranch: `codex/package-1-stability`. Basis: `749d3d525615d377a9380d05e385f21955178e16` (`codex/card-artwork-centering`). Zentrale Reihenfolge und Freigaben: [`../TODO.md`](../TODO.md).

Vor dem Editieren: Remote-Branches und offene PRs geprüft, lokale Änderungen geprüft, zunächst unvollständige Git-Historie nachgeladen. Die Basis enthält `main` (`1871557`) und elf weitere Commits, darunter die späteren Karten-, Pi-Anmelde-, Waffenmenü- und Geschützleistenänderungen. Der ältere Testnet-Branch `f16ce1c` ist keine sichere Ersatzbasis für diese neueren Änderungen. Dessen eigene Audit-Historie wurde nicht überschrieben. Die vorhandenen uncommitteten Schiffsgrößenänderungen im ursprünglichen Worktree wurden nicht angefasst oder stillschweigend aufgenommen.

Architektur: React/Vite/TypeScript, zentrale ref-basierte RAF-Simulation in `GamePage.tsx` mit gedrosselten React-Paints; separate Module für Flugbahnen, Gegner-/Spielerkollisionen, Bossgeschütze/Reaktor, Shard-Belohnungen und Audio. Express/MongoDB-Endpunkte speichern versionierte, netzwerkbezogene Account-Snapshots über eine persistente Client-Outbox. Run-Shards sind kumulative Einnahmen und werden serverseitig nur als Differenz gutgeschrieben.

Ausschließlich Paket 1 umgesetzt. Paket 2–7 bleiben offen und benötigen ihre jeweilige Freigabe. Kein Merge nach main, kein Eingriff in Payments oder MongoDB-Schema, keine Produktionsveröffentlichung.

## Korrekturen

1. **Gegner/Explosion:** Die normale Feueranimation war im ersten Keyframe transparent. Der Ersatz für einen zerstörten Gegner beginnt jetzt sofort sichtbar; der vorhandene Feuer-/Trümmerablauf bleibt bestehen. Lebende Gegner werden nicht mehr wegen eines kurzzeitigen Flugs oberhalb des Spielfelds aus der Simulation gelöscht. Begleitschiffe explodieren beim Bossende statt kommentarlos zu verschwinden. Dafür gibt es keine zusätzlichen Belohnungen.
2. **Audio:** Statushinweise gleichen tatsächlichen Context-/Player-Zustand und gespeicherte Lautstärken regelmäßig ab. Ein verspätetes `play()` kann Musik nach Pause/Mute/Close nicht wieder aktivieren. Null-Lautstärke gilt nicht als blockiertes Autoplay. Im Hintergrund pausieren Spiel und Audio sofort. Es werden keine Sounds oder Lautstärkekurven aus Paket 6 geändert.
3. **Bossgeschosse:** Kontinuierlicher Segmenttest berücksichtigt Projektilweg und Spielerbewegung zwischen zwei Simulationsschritten. Laser- und Raketenlänge entsprechen dem sichtbaren Körper, ohne Glow/Abgas als Trefferzone zu zählen. Die Spielerhitbox bleibt unverändert. Geschosse verlassen die Listen an allen vier Spielfeldrändern, auch oben. Bestehende 1.500-ms-Immunität, gekaufte/gesammelte Schilde und Advanced-/Elite-Panzerung bleiben erhalten.
4. **Shard-HUD:** Vorbestand + Run-Ertrag; bei Resume wird der bereits gutgeschriebene Snapshot abgezogen, bevor aktuelle Run-Einnahmen hinzukommen. Account-Checkpoint- und Reward-Protokolle bleiben unverändert. Gäste erhalten lokal nur neu verdiente Differenzen; Missionsende schreibt diese nicht nochmals gut. Ein lokaler Speicherfehler wird als Fehler angezeigt, nicht als erfolgreiche Speicherung.
5. **Übergänge:** Spielerprojektile werden wie Gegnerprojektile beim Clear beendet. Beim Wechsel werden alte Drops, Pickup-Texte und Reward-Hinweise entfernt. Pausierte Effekte behalten ihre Zeitbasis einschließlich einer Hintergrundphase ohne RAF. Ein wiederaufgenommener besiegter Boss wartet direkt auf seine noch nicht abgeholte Herzbelohnung; eine nicht gespeicherte Zerstörungsanimation oder deren Sound wird nicht isoliert wiederholt. Die tatsächliche Spielerzerstörung läuft weiter und wird nicht durch den Pause-CSS-Selektor eingefroren.
6. **Dauerregel Texte:** Anleitung und Shop erklären nun den Gesamtbestand im HUD. Die überholte Aussage „erst am Missionsende“ wurde in allen 17 unterstützten Sprachen ersetzt (Englisch plus 16 Übersetzungen). Kein neues Sprachpaket hinzugefügt.

## Geänderte Dateien

| Dateien | Zweck |
|---|---|
| `TODO.md` | Alle sieben Pakete, Freigaben, Status und zusätzliche Befunde |
| `frontend/src/pages/GamePage.tsx` | Audioabgleich, Gesamt-Shards, Kollisionseinbindung, Clear/Resume/Pause |
| `frontend/src/pages/enemyFire.ts`, `projectileCollision.ts` | Kontinuierliche Projektilkollision und vollständiges Entfernen außerhalb des Feldes |
| `frontend/src/pages/shardEarnings.ts` | Getrennter Run-Ertrag/Gesamtbestand und idempotente Gast-Differenz |
| `frontend/src/pages/musicPlayback.ts` | Verspätete Wiedergabe nach Pause/Mute/Close verhindern |
| `frontend/src/pages/Shop.tsx` | Musikzustandsanzeige und Shard-Erklärung |
| `frontend/src/index.css` | Sofort sichtbarer Explosionsbeginn und pausierbare Effekte |
| `frontend/src/pages/GameGuide.tsx`, `frontend/src/i18n.ts`, `frontend/src/locales/catalog.ts`, `uiKeys.json` | Konsistente Erklärungen in allen vorhandenen Sprachen |
| `frontend/src/pages/package1Stability.test.mjs`, `musicPlayback.test.mjs` | Regressionen für 50 Bosse/392 Stationen, Geometrie, Shards und Audio-Rennen |
| `frontend/scripts/verifyPackage1.cjs` | Reproduzierbare Browser-/Handler-Integration ohne Live-Konten |
| `docs/package-1-stability-2026-10-08.md`, `docs/package-1-validation.json` | Prüfbericht und Ergebnisse |

## Prüfungen

- Frontend-Build einschließlich TypeScript und Übersetzungsprüfung: bestanden.
- Backend-TypeScript-Build: bestanden.
- Frontend-/Sprachtests: **219 bestanden, 0 fehlgeschlagen**.
- Backend-Tests einschließlich Progress, Rewards, Zahlungsregeln und Netzwerk-Isolation: **47 bestanden, 0 fehlgeschlagen**.
- Neue Tests prüfen alle **50 Bosse und 392 Geschützstationen**, alle sechs Geschütz-Waffentypen und die Reaktorprojektile. Bestehende Tests prüfen außerdem den Ablauf durch alle 500 Stufen und die Feuerbudgets/Ausrichtung aller Geschützläufe.
- Browser mit realer GamePage/RAF-Logik: **390×844** und **1280×800**. Gäste: 1.250 → 1.270 → Reload 1.270. Treffer, Immunität, Schildverbrauch und Panzerung; sichtbarer erster Explosions-Keyframe; Blockwechsel, Block 9 → Boss, Bosszerstörung/Herz/Karte → Bonus → nächstes Level; Spieler bleibt erhalten, keine Restgeschosse/Drops.
- Browser → echte Express-Handler → isolierter Datenspeicher → HUD: Resume 1.270 + 15 = 1.285, erneuter Save/Reload ohne Doppelgutschrift; Lebensverlust bleibt nach Reload bestehen; Resume während Boss-Clear lässt Herz abholen ohne erneuten Boss/redundante Belohnung; Hintergrundwechsel pausiert sofort.
- `git diff --check`: bestanden.
- ESLint ist **nicht grün**, aber unverändert zur unveränderten Basis: **55 Fehler, 16 Warnungen**. Keine zusätzlichen Meldungen. Bestehende Ref-/Hook-/Fast-Refresh-Befunde wurden nicht durch einen großen Nebenumbau bearbeitet.
- Vite meldet weiterhin den bestehenden großen Haupt-Bundle-Chunk (>500 kB). Kein Effektabbau zur Kaschierung.

Reproduktion (Node 24 und installierte Projektabhängigkeiten):

```sh
npm run build --prefix backend
npm run build --prefix frontend
node --experimental-strip-types --test frontend/src/pages/*.test.mjs frontend/src/i18n.test.mjs
node --experimental-strip-types --test backend/src/*.test.mjs backend/src/handlers/*.test.mjs
npm run lint --prefix frontend
PLAYWRIGHT_MODULE_PATH=/absolute/path/to/playwright CRYPTOID_CHROMIUM=/absolute/path/to/chromium node frontend/scripts/verifyPackage1.cjs
```

Die Browserprüfung nutzt ausschließlich lokal injizierte Testzugriffe; diese werden nicht in den Produktivbuild eingebaut. APIs sind an die vorhandenen echten Handler mit isolierten In-Memory-Testdaten angeschlossen. Zwischenzustände werden gezielt vorbereitet; das ist kein manuell durchgespielter 500-Level-Durchlauf.

## Grenzen und offene Punkte

- Kein physischer iPhone-/Pi-Browser-/Android-Hör- und Langzeit-Spieltest. Audio-Rennen und Zustandslogik sind automatisiert geprüft; hörbare Qualität und OS-spezifische Unterbrechungen bleiben am echten Gerät zu bestätigen.
- Kein vollständiger Langzeit-Performance-Audit; Paket 3 bleibt dafür vorgesehen. Tests belegen hier korrekte Listenbereinigung und Übergänge, keine gemessene Bildrate auf einem Nutzergerät.
- Pi-Login und echte Testzahlungen wurden nicht ausgelöst; bestehende Backend-Regressionen sind grün.
- Bereits vorhandener Unterschied: oberer Blockzähler zeigt abgeschlossene Blocks, der Abschnittstext den laufenden Block (z. B. 0/9 und Block 1/9). In der Anleitung als abgeschlossene Blocks beschrieben; nicht stillschweigend umgestaltet.
- Testnet-Veröffentlichung **blockiert/nicht ausgeführt**: Projektmetadaten lesbar, konkrete Deployment-Abfragen 404; anschließend eindeutige Vercel-Antwort **403 Forbidden – You don't have permission to list the deployment** für das bekannte Testnet-Projekt/Team. Kein Vercel-CLI-Fallback installiert. Keine Umgehung, kein unbestätigter Deploy, keine Änderung der stabilen Testnet-Domain.
- Produktion unverändert. Paket 2 nicht begonnen.
