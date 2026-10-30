# Übergabeprompt – Cryptoid Evolution – 30.10.2026

Bitte setze die Arbeit an meinem Projekt **Cryptoid Evolution** am folgenden Stand fort. Diese Übergabe gilt **nach dem abgeschlossenen Hitzespuren-Test mit erneutem White Screen**, nicht vor dessen Durchführung. Bitte lies zuerst die vorhandenen Nachweise. Wiederhole abgeschlossene Untersuchungen oder identische Smartphone-Dauerläufe nur mit einem neuen, erklärten Anlass.

## Problem und Grenzen

Auf meinem iPhone 15 Pro Max kommt es nach wechselnder Spielzeit zu einem White Screen mit Rückkehr zur Diagnoseseite/Testseite. Betroffen war insbesondere der Pi-Browser; frühere Safari-Läufe scheiterten ebenfalls. Von Android wurden Abbrüche beziehungsweise unerwartete Pausen berichtet. Tablet und PC liefen in meinen bisherigen Tests stabil.

**Die Ursache ist weiter offen und der Fehler nicht nachweislich behoben.** Speicherleck, voller Cache, Überhitzung, GPU-/WebKit-Abbruch oder eine bestimmte Berührung sind keine bestätigten Ursachen. Externe Messungen zeigten bei untersuchten JavaScript-Objekten, Tonpuffern und Effekt-Caches kein starkes fortlaufendes Wachstum. Das schließt native Browser-/Grafikprobleme nicht aus. Den bereits erfolgten iOS-/Jetsam-Log-Umweg bitte nicht ohne neue passende Daten wiederholen; der alte Log belegte keinen zugeordneten Spielabbruch.

Nur getrennte geschützte Gast-Testversionen sind autorisiert. Echter Spielstand, Accounts, Käufe, Ranglisten und Live-Backend bleiben geschützt. **Keine öffentliche Testnet-/Mainnet-Veröffentlichung.** Keine Änderungen an Spieltempo, Spieluhren, Balance, Einfingersteuerung, manuellem Fortsetzen oder Audio ohne entsprechenden Auftrag. Nachträgliche Nachweise gehören auf Arbeitszweige, bereits ausgelieferte Geräte-Zweige bleiben unverändert.

## Steuerung, Uhr und Berichte

Die Einfingersteuerung bleibt: steuern → Finger heben → Waffentaste gezielt neu antippen. Darüberziehen oder zusätzliche Berührungen sollen das Waffenmenü nicht öffnen. Echte Pausen werden ausschließlich manuell fortgesetzt.

Die sichtbare Test-Stoppuhr zählt erst ab tatsächlichem Spielstart nach „Fortsetzen“, ohne Vorbereitung, Countdown und echte Pausen. Etwa jede Sekunde wird lokal gespeichert. Nach normalem Ende bleibt „Letzte Testzeit“ sichtbar; nach Abbruch muss dieselbe Adresse im selben Browser geöffnet werden. **Die letzte gesicherte Zeit ist keine sekundengenaue Absturzzeit.** Ein neuer Lauf bewahrt nur begrenzt den vorherigen.

Vollaufzeichnung war bei den hier verglichenen Besitzer-Läufen aus, Testschutz an. Die Uhr und der begrenzte Kurzbericht funktionieren trotzdem; `fullSession:null` bedeutet dabei keinen fehlgeschlagenen Vollbericht. Die Vollaufzeichnung ist keine notwendige Voraussetzung des Fehlers. Der Kurzbericht bewahrt höchstens 32 Ereignisse; `dropped` zählt Verwerfungen/Begrenzungen und ist keine Fehler- oder Absturzanzahl. Fehlende Abschlussereignisse und die ungespeicherte letzte Zeitspanne verhindern eine vollständige Berührungsrekonstruktion.

## Bisherige Eingrenzung

CSS-Filter aus, danach zusätzlich Reaktor aus, danach gewöhnliche Explosions-Canvas aus: jeweils weiterhin Besitzer-Abbrüche. Ein überschreibender HUD-Unschärfe-CSS-Fehler wurde gefunden, aber nicht als Ursache bewiesen. Die separate BossWeaponsView wurde später ebenfalls ausgeschlossen; der White Screen blieb. „Kein sichtbares Szenen-Canvas“ schließt Bildvorbereitung, Offscreen-/native Grafikpfade nicht aus.

Eine breite vereinfachte Vordergrundszene lief auf Safari **08:50** und Pi **09:15** bis zum normalen Ende ohne White Screen. Auf Safari wurden dabei zwei ungewollte Pausen beim Fingerabsetzen gemeldet. Mit wiederhergestellten Original-Hintergründen und weiter vereinfachtem Vordergrund liefen Safari **10:38** und Pi **10:01** ohne White Screen bis zum normalen Ende. Mit ursprünglicher Bossdarstellung kam im Pi-Browser wieder ein White Screen bei zuletzt gesicherten **08:57**. Eine dabei gemeldete abrutschende/hängende Berührung ist kein bewiesener Auslöser.

Die anschließenden engeren Besitzer-Vergleiche im Pi-Browser:

| Originale Boss-Reflexion | Originale Boss-Hitzespuren | Letzte Testzeit | Besitzer-Ergebnis |
|---|---|---|---|
| an | an | 08:30 | White Screen, Rückkehr zur Testseite |
| aus | aus | 10:34 | selbst normal beendet, keine Probleme/kein White Screen; auch Abrutschen und schnelle Positionswechsel funktionierten |
| an | aus | 10:00 | selbst normal beendet, keine Probleme/kein White Screen, keine wahrgenommene Erwärmung |
| aus | an | **08:36** | **White Screen, Rückkehr zur Testseite, Gerät leicht warm** |

In allen vier Bedingungen bleibt BossWeaponsView aus. Ursprüngliches Bossbild, Gesundheit, kleine Trefferexplosionen, Original-Hintergründe und Spiellogik bleiben erhalten. Andere Schiffe/Trefferdarstellungen bleiben vereinfacht; die vorausgehenden Filter-/Reaktor-/Explosions-Canvas-Abschaltungen bleiben bestehen. Bei den Maskenvergleichen werden nur die betreffenden Ebenen mit gezieltem `display:none` ausgeblendet. DOM, Maskenstile, Komponenten/Hooks und Bildvorbereitung bleiben vorhanden. Das ist keine vollständige Entfernung aller Grafikressourcen.

Die Hitzespuren sind ein **grafischer Schadenseffekt am Boss**, keine Messung der Gerätetemperatur. Bei „Reflexion an, Hitzespuren aus“ wurde mein Wort „Piper“ im Kontext als Pi-Browser verstanden; dieser Browser wurde nicht durch JSON gemessen. Den neuesten fehlgeschlagenen Lauf habe ich ausdrücklich als Pi-Browser bestätigt.

**Bewertung:** Die originale Hitzespuren-Darstellung beziehungsweise ihre Wechselwirkung mit dem Rest der Szene ist jetzt der stärkere Verdachtsbereich. Das aktuelle Scheitern setzt keine gleichzeitig sichtbare Reflexion voraus. Einzelne nicht vollständig kontrollierte Geräte-Läufe beweisen aber weder den genauen Mechanismus noch Maskierung als alleinige Ursache oder eine dauerhafte Reparatur. Leichte wahrgenommene Wärme ist kein Beleg für Überhitzung.

## Neuester Bericht – bereits geprüft

- Datei: `cryptoid-diagnose-2026-10-30T15-58-45-242Z-3f720249.json`
- Größe: **8291 Bytes**; SHA-256: `6c0f6956a8bd1c2037394c964fe65adcb7719811184cc57c4f701dd675258ac6`.
- Laufzeitstand: `2a531983e5217b14141fb8623ecb35df65d7f700`; Quellbaum: `1d100eebfbe1b661ffd6bc404980aa919229325d`.
- Szene: `flat-live-scene-original-background-original-boss-no-weapon-canvas-hidden-hull-reflection`.
- **08:36 / 516166 aktive Millisekunden**, gespeichert als `running`, null aufgezeichnete Lücken. Uhr/Kurzbericht gehören zum selben Lauf. Vollaufzeichnung aus, Testschutz an, `fullSession:null`.
- Neues Dokument auf `home`, `navigationType:navigate`, 679 ms nach dem letzten Uhr-Checkpoint; `boot-after-active-session` ist vorhanden. Das ist keine gemessene Absturz-/Wiederanlaufdauer.
- 32 erhaltene Ereignisse, 298 Verwerfungen/Begrenzungen. Letztes erhaltenes `touchstart` meldet einen Kontakt bei 514158 aktiven ms, ohne spätere gespeicherte Freigabe. Das beweist weder einen durchgehend gehaltenen Finger noch einen Eingabeauslöser. Kein normales Ende und keine Pause im begrenzten Ausschnitt; die endgültige ungespeicherte Zeitspanne ist unbekannt.
- Ich meldete: Gerät leicht warm, White Screen und Rücksetzung auf die Testseite, Pi-Browser. Mein Zusatz „sehr groß“ ist nicht eindeutig dokumentiert; eine Seitenvergrößerung/Zoom wurde nicht gemessen.

Der bereinigte Nachweis ist im Repository gespeichert: `verification/boss2-boss-heat-control-20261030/evidence/owner-heat-control-failure.json`. Der rohe Besitzerbericht wurde nicht ins Repository übertragen. Der neue Chat kann anhand des Nachweises fortsetzen; ohne die Rohdatei bitte keine darüber hinausgehenden Rohdatenbehauptungen aufstellen.

## Repository, feste Teststände und Adressen

- GitHub: **19Trojan69/cryptoid-evolution**, React/TypeScript mit Vite, keine Unity-App.
- Neuester fester Geräte-Zweig: `codex/boss2-boss-heat-device-20261030`, unverändert auf Laufzeitstand `2a531983e5217b14141fb8623ecb35df65d7f700`.
- Arbeitszweig mit nachträglichen Nachweisen und dieser Übergabe: **`codex/boss2-boss-heat-control-20261030`**. Dessen spätere Dokumentations-Commits sind nicht der getestete Laufzeitstand.
- Neuester Testlink: https://cryptoid-evolution-testnet-4icdow80e-19-trojan69.vercel.app/
- Banner: **„HITZESPURENTEST: Boss-Hitzespuren an; Reflexion bleibt aus“**.
- Vercel-Deployment: `dpl_9dayCrG66pbR5aySX68Nz1g9janQ`, Preview, Standard Protection/Vercel Authentication eingeschaltet, keine Custom-Domain-Zuweisung. Projekt `cryptoid-evolution-testnet`, Team `19-trojan69`. Git-Autodeploy ist aus.
- Nachweise: `verification/boss2-boss-heat-control-20261030/` mit README, results.json, verifyEvidence.mjs, HANDOFF.de.md und evidence/.
- Geprüfter öffentlicher Main-Stand: `ce073547cf573375d141bf846f70e294138dbd73`; keine öffentliche Änderung durch diese Testreihe.

Vorherige feste Vergleiche unverändert bewahren:

| Bedingung | Fester Laufzeit-Commit | Testadresse |
|---|---|---|
| Reflexion und Hitzespuren an; 08:30-Abbruch | `68bbf03220a868762606136308844aa24a8a2a75` | https://cryptoid-evolution-testnet-a9bb7lmx7-19-trojan69.vercel.app/ |
| Beide aus; 10:34 normal beendet | `eb018b2b5e422aaf65beb66a64c77b870b3c156e` | https://cryptoid-evolution-testnet-jnz6bue7b-19-trojan69.vercel.app/ |
| Reflexion an, Hitzespuren aus; 10:00 normal beendet | `fc688cb812395a9c3ce9e91a064a0b25406224f5` | https://cryptoid-evolution-testnet-a56q68x6e-19-trojan69.vercel.app/ |

Deren Nachweise liegen entsprechend unter `verification/boss2-boss-weapon-control-20261030/`, `boss2-boss-mask-control-20261030/` und `boss2-boss-reflection-control-20261030/`.

## Technischer Prüfstand und nächster Auftrag

Der letzte Hitzespuren-Build wurde vor Auslieferung mit elf gezielten Quell-/Komponentenprüfungen, TypeScript-Vorprüfung, identischen Original-Quellbaum-Prüfsummen und vier kurzen Chromium-/WebKit-Vergleichen geprüft: GitHub-Actions-Lauf **41077619306**. Hitzespuren an zeigte sichtbare originale Hotspots; Reflexion blieb aus. Original-Bossmaße und Spielfunktionen blieben erhalten. Diese Desktop-Prüfungen bestanden, sind aber keine Smartphone-Stabilitätsnachweise. Screenshots mit **01:17** sind vom Assistenten am Desktop, nicht von mir. Auch frühere Desktop-Beispielzeiten sind keine Besitzer-Ergebnisse.

Eine frühere einzelne unerwartete technische Pause im Assistenten-Desktoptest der Original-Bossdarstellung blieb ungeklärt; spätere Kontrollen wiederholten sie nicht. Sie darf weder als White Screen noch als bewiesener App-/Automationsfehler umgedeutet werden. Safari-Pausen und White Screens weiterhin getrennt behandeln. Keine Pausenschutzfunktion abschalten und kein automatisches Fortsetzen einbauen.

**Als Nächstes:** Lies die Vergleichsnachweise und prüfe gezielt die originale Boss-Hitzespuren-Darstellung (`HullDamage.tsx`, `.hull-heat-layer`, Maskierung, Hotspots). Leite daraus einen kleinen, begründeten privaten Reparatur-/Bestätigungskandidaten ab. Noch wurde kein solcher Kandidat gebaut oder getestet. Nicht bloß aus dem erfolgreichen Ausblenden behaupten, der Fehler sei behoben. Änderungen weiter isoliert halten und Spielverhalten sowie die genannten Schutzgrenzen bewahren. Für originale Frontend-Änderungen zuerst die dortige `AGENTS.md` lesen.

**Aktuell ist kein weiterer Smartphone-Test offen oder beauftragt.** Für diese Übergabe wurde kein neuer Laufzeitstand, Testlink oder Deployment erstellt. Einen neuen Link brauchen wir erst, wenn tatsächlich etwas geändert und geprüft wird. Browser-/Vercel-UI-Fallback war bereits ausdrücklich erlaubt, weil der Connector für das vorhandene Projekt wiederholt 404 lieferte; Schutz nicht lockern.

Bitte bestätige zuerst kurz diesen tatsächlichen Stand und arbeite anschließend gezielt daran weiter. Keine Testergebnisse erfinden, keine pauschale Ursachenbehauptung und keine erneute komplette Untersuchungsschleife.
