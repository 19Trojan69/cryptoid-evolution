# Fortsetzungsstand – Boss-Hitzespuren ohne aktive Bildmaske

Ausgangspunkt bleibt die Übergabe 336eafef und der Besitzer-Abbruch bei **08:36** mit Hitzespuren an/Reflexion aus. Die vier bisherigen Besitzer-Vergleiche und deren feste Zweige/Adressen sind unverändert. Ursache und dauerhafte Behebung des White Screens bleiben offen.

## Tatsächlich erstellter Kandidat

Die Quellprüfung von HullDamage.tsx, BossHullView.tsx, hullFires.ts und index.css zeigt eine bossgroße Bildmaske über den transformierten Hotspots mit radialen Farbverläufen. Boss-Hitzespuren sind bereits statisch und auf höchstens acht Stellen begrenzt. Kleine Trefferexplosionen sind separate Geschwister außerhalb der Maske. Daraus folgt kein bewiesener Speicher-/Grafik-/Temperaturmechanismus.

Der neue private Kandidat lässt originale Hotspots sichtbar und setzt nur für die Boss-Hitzespuren `mask-image` und `-webkit-mask-image` auf `none !important`. Reflexion bleibt aus. Originale Komponenten, Inline-Maskenstile, Hotspot-Positionen/Schlüssel/Farbverläufe, Grenzen/Overflow und kleine Trefferexplosionen bleiben. An transparenten Rumpfbereichen kann die sichtbare Begrenzung abweichen; das ist ein Bestätigungskandidat, keine endgültige Grafikentscheidung.

- Laufzeit-Commit: **67dabc714907be6d3ae99ccf9ebeab170eb34b06**
- Laufzeit-Baum: **72de7664d3ef9dcd21ddd407b081bb647885f4f7**
- Fester Geräte-Zweig: `codex/boss2-boss-heat-unmasked-device-20261030`
- Arbeits-/Nachweiszweig: `codex/boss2-boss-heat-unmasked-20261030`
- Geschützte Adresse: https://cryptoid-evolution-testnet-7j8dw88r8-19-trojan69.vercel.app/
- Banner: **MASKENKANDIDAT: Boss-Hitzespuren an; ohne Bildmaske**
- Preview: `dpl_76aTHkCGXNDHMCT5CtBnukrGEfw1`, Ready in 45 Sekunden, Standard Protection/Require Log In, keine Custom-Domain-Zuweisung.

Spätere Nachweis-Commits auf dem Arbeitszweig sind nicht der getestete Laufzeitstand. Geräte-Zweig und Adresse nicht nachträglich verschieben. Originale Frontend-/Backend-/API-/Assets-/private-preview-Bäume bleiben identisch. Alle bisherigen Vereinfachungen, BossWeaponsView-Ausschluss und Filter-/Reaktor-/Explosions-Canvas-Abschaltungen bleiben. Spieltempo, Uhren, Balance, Einfingersteuerung, manuelles Fortsetzen und Audio bleiben unverändert. Keine öffentliche Testnet-/Mainnet-Veröffentlichung, echte Accounts/Käufe/Spielstände/Ranglisten oder automatische Übertragung.

## Tatsächlich abgeschlossene Prüfung

GitHub Actions **41089492243** besteht: zwölf Quell-/Komponentenprüfungen, ursprüngliche Quellbaum-Prüfsummen, TypeScript-Vorprüfung und vier kurze Browserläufe (Originalmaske/Kandidat jeweils Chromium/WebKit). Sichtbare Hotspots, wirksame Maskenentfernung, identische Boss-/Layoutmaße, Original-Hintergrund, Bewegung/Salven, synthetische Steuerung, Waffenmenü, Pause/Fortsetzen und zugeordneter Endbericht wurden geprüft. Das sind Desktop-Läufe mit emulierter Smartphone-Ansicht.

Die tatsächlich ausgelieferte Version lief im Cloud-Chromium des Assistenten bis zum normalen Ausstieg bei **01:10**. Pause bei 01:08 blieb stehen, explizites Fortsetzen und Wiederherstellung der letzten Zeit nach Neuladen bestehen. Bei 01:06 waren fünf originale Hotspots sichtbar, aktive Standardmaske `none`, Reflexion aus. Bericht/Commit/Baum/Kandidatenkennung stimmen überein; Vollaufzeichnung aus, Testschutz an, fullSession:null. Ein begrenzter `stalled`-Zustand bleibt dokumentiert; kein beobachteter White Screen/ungewollter technischer Pausenbildschirm. **01:10 ist kein Besitzer-Ergebnis und kein Smartphone-Stabilitätsnachweis.**

Der erste Actions-Lauf 41088919802 ist ausgeschlossen: Das neue Prüfskript scrollte vor einem emulierten Antippen nicht zum Vorbereitungsbutton und öffnete kein Spiel. Nur das Prüfskript wurde korrigiert. Eine zunächst von automatischer Freigabeprüfung abgelehnte Vercel-Zweigauswahl wurde vor Erstellung mit dem angezeigten Arbeitszweig/identischen geprüften Commit abgeglichen; danach wurde genau die oben genannte Preview erstellt.

Nachweise und Konsistenzprüfung: README.md, results.json, verifyEvidence.mjs und evidence/ in diesem Verzeichnis. Rohe Besitzerberichte und der rohe Assistentenbericht sind nicht ins Repository übertragen. Öffentliche Testnet-Produktion bleibt dpl_239zEifRV84KCpbyHumnuHmSGm9T/ce07354, Schutz unverändert.

**Für diesen Kandidaten liegt noch kein Besitzer-Smartphone-Ergebnis vor; kein neuer Smartphone-Lauf wird hier als offen oder erledigt unterstellt.** Der Kandidat ist jetzt geprüft und verfügbar. Erst ein tatsächliches neues Besitzer-Ergebnis erlaubt die weitere Bewertung; keine erfolgreiche Maskenentfernung im Desktop als Behebung des White Screens ausgeben.
