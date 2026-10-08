# Paket 4.1 – Audiohinweis und ruhige Schiffsbewegung

Stand: 8. Oktober 2026. Basis: Paket-4-Branch `codex/package-4-visual-hud-touch`; eigener Branch `codex/package-4-1-audio-ship-motion`. Zwei iPhone-Screenshots aus dem Paket-4-Preview zeigten einen Audiohinweis mitten im Blockabschluss und eine als Schlingern empfundene seitliche Schiffsbewegung. Der Nutzer hat die ruhige Bewegung ausdrücklich auch für Gegnerschiffe freigegeben.

## Änderungen

| Datei | Änderung / behobener Befund |
| --- | --- |
| `frontend/src/pages/GamePage.tsx` | Schwebende „Ton einschalten“-Schaltfläche und deren alle 500 ms laufendes Anzeige-Polling entfernt. Vorhandene Audio-/Musik-Wiederaufnahme bei Eingaben, Pause und Rückkehr aus dem Hintergrund bleibt bestehen. Bei regulären Gegnern wird die äußere Drehung in der Bildebene entfernt; beim Einflug entfallen zwei zusätzliche Positionsberechnungen pro Gegner und Bild sowie die daraus abgeleitete Bildebenen-Neigung. |
| `frontend/src/index.css` | Bildebenen-Drehung des Spielerschiffs entfernt; dezente perspektivische `rotateY`-Neigung bleibt für Spieler und reguläre Gegner. Unbenutzte Overlay-Stile entfernt. |
| `TODO.md` | Paket 4.1 als erledigt mit separater physischer Geräteabnahme markiert. |
| `docs/package-4-1-audio-ship-motion-2026-10-08.md` | Änderungsumfang, Prüfungen und Grenzen festgehalten. |

Musik und Effekte sind über die vorhandenen Regler im Pausenmenü erreichbar; die Musikumschaltung im Hangar bleibt unverändert. Neue sichtbare Texte sind nicht nötig, vorhandene Übersetzungen bleiben gültig. Bewegungs- und Kollisionsdaten, Speicherformat, Pi SDK, Käufe und Backend wurden nicht geändert. Boss- und Bonus-Schiffe nutzten keine entsprechende äußere Bildebenen-Drehung.

## Prüfungen

- Frontend: `npm run lint` ohne Fehler/Warnungen; alle 50 `src/pages/*.test.mjs` bestanden; `npm run build` einschließlich i18n-Test, TypeScript und Vite bestanden.
- Backend: `npm run build` bestanden, keine Backend-Änderungen.
- `git diff --check` bestanden.
- Getrenntes Testnet-Preview im Browser: Gast-Spielstart und laufendes Level 1; Spieler mit rechter und linker Pfeiltaste bewegt, `--visual-bank` wechselte das Vorzeichen und die CSS-Regel enthält nur die perspektivische `rotateY`-Neigung. Reguläre Gegner sichtbar; ihre äußere Transformation ist nur `translate(-50%, -50%)`. Kein Audio-Overlay-Button im DOM; Musik- und Effektregler im Pausenmenü vorhanden. Preview-Commit `a6462093818a0819f2cfaffb41f11ef2d2ee67db`, Deployment `dpl_3YKXR9FAmHfGKEEL5ow5czbffv27`: <https://cryptoid-evolution-testnet-k3u57hgoy-19-trojan69.vercel.app/game>.

## Offene Abnahme und Grenzen

- Auf einem realen iPhone/Safari sowie Android/Chrome und Pi Browser prüfen: schnelle Richtungswechsel, optischer Eindruck der leichten Neigung, Blockabschluss ohne Audio-Overlay, hörbare Musik/Effekte nach Sperre, App-Wechsel und Pause. Der Desktop-Browser-Preview kann iOS-Audio-Unterbrechungen nicht reproduzieren.
- Das entfernte Status-Polling hatte nur die schwebende Schaltfläche gespeist. Bei einer vom Browser blockierten Audiowiedergabe erfolgt weiterhin ein Wiederaufnahmeversuch bei Nutzergesten; die Regler zeigen die gespeicherte Lautstärke, nicht einen technischen AudioContext-Status an. Eine sichtbare Statusanzeige außerhalb des Spielfelds wäre ein gesonderter Designentscheid, falls die Geräteabnahme sie erforderlich macht.
- Der bekannte Frontend-Hauptchunk bleibt bei rund 1,72 MB minifiziert (493 KB gzip) und gehört zur separaten Performancearbeit.
- Die feste Testnet-Adresse bleibt auf dem zuletzt veröffentlichten Stabilitätspaket, da die Vercel-Connector-Berechtigung für Promotion/Alias schon bei Paket 4 fehlte. Dieses Paket liegt auf einem eigenen spielbaren Preview. Das Produktionsprojekt und `main` wurden nicht verändert.
