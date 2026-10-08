# Paket 4.2 – Menüebenen, Audiopause und Schiffsvergleich

Stand: 8. Oktober 2026. Basis: `codex/package-4-1-audio-ship-motion`; eigener Branch `codex/package-4-2-menu-audio`. Die iPhone-Aufnahmen zeigen ein Spielerschiff samt Schild vor den Karten im geöffneten Waffenmenü sowie ein kleineres, anders aussehendes Schiff im Pi Browser als im separaten Preview. Zusätzlich wurde gelegentlich hängen gebliebene Musik bei Waffen- oder Pausemenüs gemeldet.

## Änderungen und Befunde

| Datei | Änderung / Befund |
| --- | --- |
| `frontend/src/pages/GamePage.tsx` | Das Schiff wird bei pausierter Mission hinter vollständigen Dialogen ausgeblendet und während des 3–2–1-Wiedereinstiegs wieder angezeigt. Musik wird beim Öffnen von Waffenmenü, Pause und Heimkehrfrage sofort pausiert. Allgemeine Audio-Wiederanlaufversuche aus Eingaben starten im pausierten oder ausgeblendeten Spiel keine Musik. Bewusstes Fortsetzen startet den Versuch in derselben Nutzergeste, was für mobile Browser relevant ist. |
| `frontend/src/index.css` | Vollständige Dialoge erhalten eine höhere Ebene als das während des Spiels vor seitlichen Steuerelementen platzierte Schiff; die pausierte Schiffsdarstellung ist unsichtbar. |
| `frontend/src/pages/weaponSelection.css` | Die spezifische Waffenmenü-Ebene wird auf 40 statt 30 angehoben und liegt somit vor dem Schiff mit Ebene 32. |
| `TODO.md` | Paket 4.2, Geräteabnahme und unterschiedliche Veröffentlichungsstände ergänzt. |
| `docs/package-4-2-menu-audio-2026-10-08.md` | Fehlerbild, Änderungen, Tests und offene Abnahme festgehalten. |

Die Fassungen erklären einen Teil des Vergleichs: Die Vergrößerung aus Paket 4 und die Bewegungsänderung aus Paket 4.1 lagen zur Zeit der iPhone-Aufnahmen nur in eigenen Previews. Nach diesem Paket wurden sie zusammen mit Paket 4.2 auf der festen Testnet-Adresse veröffentlicht. Die Pi-Browser-/Produktionsadresse bleibt auf der früheren Fassung. Auch die Schiffsauswahl kann zwischen Testnet-/Preview-Origin und Pi-Browser-Origin abweichen, insbesondere bei lokalem Gastspielstand oder unterschiedlichen Netzwerken. Die Aufnahmen zeigen verschiedene Shard-Bestände. Das ist ein Hinweis auf unterschiedliche Spielstände, kein Beweis für die genaue Ursache der Schiffsauswahl. Eine Prüfung mit demselben Konto, Netzwerk und Build auf dem Gerät steht aus. Es werden keine Speicherwerte oder Kaufdaten zusammengeführt oder verändert.

Es wurden keine neuen sichtbaren Texte eingeführt und keine Spielmechaniken, Trefferflächen, Schiffsassets, Save-Formate, Pi-SDK-, MongoDB- oder Payment-Wege geändert. Die vorhandenen Texte und Übersetzungen zur Pause und Waffenwahl passen weiterhin.

## Prüfungen

- Frontend: `npm run lint` ohne Fehler oder Warnungen; alle 50 `src/pages/*.test.mjs` bestanden; `npm run build` einschließlich i18n, TypeScript und Vite bestanden.
- Backend: `npm run build` bestanden; Backend unverändert.
- `git diff --check` bestanden.
- Im separaten Vercel-Preview wurde ein Gastlauf gestartet. Im Waffenmenü war das Schiff nicht mehr vor den Karten sichtbar; beim Fortsetzen erschien es wieder während des Countdowns und im Spiel. Im Pausemenü blieb das Schiff ausgeblendet und die Regler waren erreichbar. Die endgültige CSS-Ebene des Waffenmenüs wurde auf 40 gegenüber Schiff 32 angehoben.
- Deployment `dpl_6Nv6tR8m2QCLgn5tuWbBDhZm9wMN` mit Commit `c71fc1b9bef08db0c678364fff0fd31ffa44405b` erreichte `READY`. Die Alias-Zuordnung von `cryptoid-evolution-testnet.vercel.app` wurde auf genau dieses Deployment geändert und anschließend erneut ausgelesen. Unter der festen Testnet-Adresse wurde ein Gastlauf einschließlich geöffnetem Waffenmenü mit unsichtbarem Schiff und Ebene 40 geprüft. Die Produktionsadresse zeigte weiterhin Commit `1871557dec332161cfdb0c90bc4d29022632bda6` aus `main`.

## Geräteabnahme und Grenzen

- Auf iPhone im Pi Browser und möglichst Android die Menüebenen, hörbare Musikpause, Fortsetzung, wiederholtes schnelles Öffnen/Schließen sowie App-Wechsel prüfen. Ein Desktop-Browser kann das gelegentliche iOS-Audioverhalten und die tatsächliche akustische Ausgabe nicht vollständig nachstellen. Der gefundene Retry-Wettlauf ist behoben; falls Musik weiterhin hörbar hängen bleibt, braucht es einen konkreten Gerätefall.
- Schiffsgrafik und Größe erst zwischen derselben Version und derselben Auswahl/Konto- und Netzwerkumgebung vergleichen. Die feste Testnet-Adresse zeigt nun Paket 4.2; der Pi Browser nutzt weiterhin die frühere Produktionsfassung.
- Der bekannte große Frontend-JavaScript-Chunk bleibt Teil der vorgemerkten Performancearbeit. Produktion und `main` bleiben unverändert.
