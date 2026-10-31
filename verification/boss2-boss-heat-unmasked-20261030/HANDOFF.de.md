# Fortsetzungsstand – unveränderter Maskenkandidat im Wiederholungstest gescheitert

**Neuester Besitzer-Stand: 09:10 White Screen auf derselben Quelle 67dabc71; der längere Bestätigungsvergleich ist abgeschlossen und gescheitert. Details und vorheriger 10:56-Lauf unten. Kein bestätigter stabiler Kontrollstand.**

Ausgangspunkt bleibt die Übergabe 336eafef und der Besitzer-Abbruch bei **08:36** mit Hitzespuren an/Reflexion aus. Die vier bisherigen Besitzer-Vergleiche und deren feste Zweige/Adressen sind unverändert. Ursache und dauerhafte Behebung des White Screens bleiben offen.

**Früherer normaler Abschluss (neuer Abbruch unten):** Der Besitzer meldet ausdrücklich „Pi Browser Selbstbeendet, ganz normal ausgestiegen“. Der passende Bericht zum unveränderten Maskenkandidaten speichert **10:56 / 656318 aktive ms, Modus ended**, mit normaler Home-/Bestätigungs-/Endfolge. Das ist ein neuer Besitzer-Abschluss, kein Assistenten-Desktop-Ergebnis. Er stärkt den Verdacht auf die aktive Hitzespuren-Bildmaske oder ihre Wechselwirkung mit den Hotspots; eine dauerhafte Behebung ist damit noch nicht bewiesen.

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

## Neu abgeschlossener Besitzer-Test

- Bericht: `cryptoid-diagnose-2026-10-30T17-22-59-959Z-9100dd82.json`, 7739 Bytes, SHA-256 `06e4cce2ea0ebbd66d25004bfe3e082dd775c16f07d81d599f1ee598fcf99281`.
- Commit/Baum/Szenenkennung passen genau zum oben festgehaltenen Laufzeitstand 67dabc71 und zur sichtbaren Hitzespuren-Darstellung ohne aktive Bildmaske, Reflexion aus.
- **10:56 / 656318 aktive Millisekunden, ended**, Uhr und Kurzbericht gehören zusammen, null aufgezeichnete Lücken. Home → Pause → Bestätigungs-Overlay → beendet ist erhalten. Das vorhandene Dokument und der gespeicherte Boot begannen vor dem Lauf; letzter Sitzungsstatus inaktiv.
- Vollaufzeichnung aus, Testschutz an, fullSession:null; diese Optionen stehen im zum Lauf gehörenden Kurzbericht. Das ist kein fehlgeschlagener Vollbericht.
- 32 Ereignisse und 271 Verwerfungen/Begrenzungen; keine Absturzanzahl und keine vollständige Berührungs-/Pausengeschichte. Zwei Kontakte und Gesten-/Pointer-Abbruch sind im Ausschnitt vor dem normalen Ende vorhanden; daraus keinen Eingabeauslöser oder generellen Ausschluss von Eingabe ableiten.
- Der Besitzer bestätigt den normalen selbst gewählten Ausstieg im Pi-Browser. Er hat Wärme und White-Screen-Abwesenheit nicht zusätzlich ausdrücklich beschrieben; keine Temperaturmessung oder weitergehende Besitzer-Aussage ergänzen.
- Bereinigter Nachweis: `evidence/owner-mask-candidate-completion.json`; Rohbericht nicht im Repository. Die konfigurierten Grafikbedingungen sind über den Quellstand zugeordnet, nicht durch eine unabhängige Smartphone-DOM-Messung.

Damit ist der Vergleich enger: **Originale sichtbare Hitzespuren mit Bildmaske → 08:36-Abbruch; sichtbare Hitzespuren ohne aktive Bildmaske → 10:56 normal beendet**, jeweils Reflexion aus. Die Maskierung beziehungsweise ihre Wechselwirkung mit den transformierten Hotspots ist nun ein stärkerer Verdacht. Die einzelnen nicht vollständig kontrollierten Geräteläufe beweisen weiterhin weder den nativen Mechanismus noch einen dauerhaften Fix.

**Dieser Besitzer-Test ist abgeschlossen. Aktuell ist kein weiterer Smartphone-Test offen oder neu beauftragt.** Diese Aktualisierung ergänzt ausschließlich Nachweise auf dem Arbeitszweig; kein neuer Laufzeitstand, Testlink, Build oder Deployment. Feste Geräte-Zweige und erfolgreiche/fehlgeschlagene Adressen beibehalten. Nicht auf Grundlage dieses einzelnen Ergebnisses öffentlich veröffentlichen oder die gesamte Untersuchung wiederholen.


## Neuer Besitzer-Wiederholungslauf: dieselbe Fassung gescheitert

Besitzer: „mit whitescreen“. Bericht `cryptoid-diagnose-2026-10-31T14-06-15-474Z-6de05962.json`, 9498 Bytes, SHA-256 `70283fe07b1544419c68080b814e857296f625a91dc28d0c30ed2b2f820d433d`, passt exakt zu 67dabc714907be6d3ae99ccf9ebeab170eb34b06 / 72de7664d3ef9dcd21ddd407b081bb647885f4f7. **09:10 / 550312 aktive ms, running**, null aufgezeichnete Lücken; Uhr/Kurzbericht passen, Vollaufzeichnung aus, Testschutz an, fullSession:null. Neues home-Dokument 1124 ms nach dem laufenden Checkpoint, Boot mit `boot-after-active-session`, vorheriger Sitzungsmarker aktiv/playing. Exakte Absturzsekunde und native Ursache nicht gemessen.

Besonders belastbar ist die Laufzuordnung: Derselbe Export enthält in previous weiterhin den früheren **10:56 / 656318 ms / ended** samt passendem Kurzbericht/Home-/Bestätigungs-/Endfolge auf derselben unveränderten Quelle. Der frühere normale Abschluss bleibt gültig, aber diese Fassung ist keine bestätigte stabile Kontrollbasis und kein Fix.

Der neue Kurzbericht enthält sechs Ereignisse und null Verwerfungen: Laufstart und eine kurze Kontaktfolge bei ungefähr 01:14–01:17, danach bis zum letzten Checkpoint fast acht Minuten keine weitere aufgezeichnete Eingabe (472708 reale ms). Das beweist weder einen zeitnahen Eingabeauslöser noch eine vollständige physische Eingabegeschichte. In der neuen Nachricht wird nur White Screen gemeldet; die vorgegebene Nur-Laufenlassen-Bedingung, Wärme, Browser/Gerät oder Rückkehr werden nicht zusätzlich ausdrücklich bestätigt. Browser/iPhone bleiben vorheriger vereinbarter Kontext.

Bereinigter Nachweis: `evidence/owner-mask-candidate-repeat-failure.json`; Rohbericht nicht in Git. Die ursprünglich angestrebten 20 aktiven Minuten wurden wegen des Abbruchs nicht erreicht. **Dieser Wiederholungstest ist abgeschlossen. Kein weiterer Lauf desselben unveränderten Stands ist derzeit beauftragt.** Geräte-Zweig/Adresse bleiben eingefroren. Das Ausblenden der Reflexion und Entfernen der Hitzespurenmaske haben diesen konfigurierten Lauf nicht vor White Screen geschützt. Keine genaue Masken-/Blend-/Reflexions-/GPU-/Speicher-/WebKit-/Cache-/Temperatur-/Berührungsursache ableiten.

Gezielter nächster privater Vorschlag: nur die ursprünglichen beiden radialen Farbverläufe der statischen inneren Boss-Hitzespuren durch eine gleichmäßige orange Füllung ersetzen. Komponenten, Positionen/Schlüssel/Transformationen/Formen/Deckkraft/Grenzen, Inline-Masken/Bildvorbereitung, separate kleine Trefferexplosionen und übrige Kontrollen behalten. Hitzespurenmaske bleibt entfernt, Reflexion bleibt aus. Keine neue Canvas-Fläche, Assets, Timer/Frames oder Spieländerung. Das ist eine absichtlich vereinfachte private Darstellung und eine bisher ungeprüfte Füllungsvariable, keine bewiesene Ursache. Diese reine Nachweis-Aktualisierung baut oder testet den Vorschlag noch nicht.
