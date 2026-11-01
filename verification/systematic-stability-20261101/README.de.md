# Systematische Stabilitätsanalyse – 1. November 2026

Der mobile White Screen ist weiterhin **nicht nachweislich behoben**. Diese
Fortsetzung bewahrt die bestehenden Quellstände und ergänzt reproduzierbare
Prüfungen. Sie verändert weder Spielquellen noch Spielfunktionen und veröffentlicht
keine neue Spielversion.

## Verifizierte Ausgangslage

- Öffentliches `main`: `ce073547cf573375d141bf846f70e294138dbd73`.
- Neuester Untersuchungszweig vor dieser Arbeit:
  `codex/boss2-mini-start-control-20261101` bei
  `71b253af7d101ededf9c856e9436ff7bf681f126`.
- Letzter eingefrorener Geräte-Kandidat:
  `2dc37bdb6d52ddd29bcfad9269dbb4b3f76bffcf`. Die vorhandenen Unterlagen enthalten
  dafür keinen bestätigten Smartphone-Lauf. Der letzte bestätigte White Screen
  bei gespeichert **16:02** gehört zum vorherigen `d72db0a8`, nicht zu diesem Kandidaten.
- 41 vorhandene JSON-Dateien wurden lokal gelesen. Eine ist eine bytegleiche
  Dublette: **40 eindeutige Berichte**, davon 14 vollständige, zusammenhängende
  Aufzeichnungen und 26 kurze bzw. teilweise isolierte Berichte. „Vollständig“
  bezeichnet hier die gelesene Aufzeichnung, keinen ordentlich beendeten Lauf.
- Rohberichte, Eingabehistorien, Accounts und Spielstände bleiben außerhalb von
  Git. [report-inventory.json](evidence/report-inventory.json) enthält ausschließlich
  ausgewählte technische Messwerte und SHA-256-Bezüge.

## Frühere längere Läufe und tatsächliche Unterschiede

| Quelle | Beleg aus vorhandenen Daten | Grenze der Aussage |
| --- | --- | --- |
| `0868671b` | 24:11,762 aufsummierte Simulationszeit in aufgezeichneten Messfenstern; Dokumentspanne 28:11,396 | Offene Aufzeichnung, ein Audio-Uhrstillstand; kein Beweis für 24 Minuten ununterbrochene fehlerfreie Nutzung |
| `59495ef6` | 15:11,270 aufsummierte Simulationszeit; Dokumentspanne 47:06,506 | Pausen/fehlende Messfenster und ein Audio-Uhrstillstand; Dokumentalter ist keine Spielzeit |
| `ce073547` | 11:10,171 aufsummierte Simulationszeit; Dokumentspanne 12:47,552 | Offene Aufzeichnung; kein bestätigter stabiler Referenzlauf |
| `67dabc71` | Ein normal aufgezeichneter Abschluss bei 10:56; später gleiche Quelle/Baum/Bedingung mit Rückkehrsignal bei 09:10 | Ein guter Einzelversuch begründet keine stabile Kontrollversion |
| `29011336` | Gespeicherte Stoppuhr 15:00; bestätigter White Screen in vorhandener Übergabe | Zeitpunkt ist letzter gesicherter Stand, nicht gemessener nativer Absturzzeitpunkt |
| `d72db0a8` | Gespeicherte Stoppuhr 16:02; bestätigter White Screen in vorhandener Übergabe | Abschlussprüfung kleiner Treffer war bereits aus; Ursache dadurch nicht bewiesen |

Die beiden Zeitarten in der Tabelle sind nicht direkt gleichzusetzen. Das neue
Auswertungsprogramm trennt Dokumentspanne, aufsummierte Simulationsmessfenster und
gesicherte aktive Stoppuhr. Ein fehlender End-Eintrag wird nicht automatisch als
gemessener Crash ausgegeben. Ein zeitlich zugeordnetes neues Dokument nach aktiver
Sitzung ist ein Rückkehrsignal, kein Nachweis eines Speicher-, GPU- oder OS-Fehlers.

**Acht zentrale Module sind bytegleich** zwischen `0868671b`, öffentlichem `main`,
`67dabc71`, `d72db0a8`, neuestem Geräte-Kandidaten und Analysebasis:

| Bereich | Unveränderte Quelle |
| --- | --- |
| Gemeinsame RAF-Taktung | `frontend/src/lib/frameScheduler.ts` |
| Native CSS-Animationsverwaltung | `frontend/src/lib/cssFramePacing.ts` |
| Geschützte Spielschleife | `frontend/src/pages/gameLoop.ts` |
| Effekt-Canvas | `frontend/src/pages/CanvasEffects.tsx` |
| Bonus-Canvas | `frontend/src/pages/BonusRockLayer.tsx` |
| Effekt-Audio | `frontend/src/pages/gameAudio.ts` |
| Musik-Lebenszyklus | `frontend/src/pages/musicPlayback.ts` |
| Ressourcen-Cache | `frontend/src/pages/resourceCache.ts` |

Die exakten Git-Blob-IDs stehen in
[core-version-comparison.json](evidence/core-version-comparison.json). Das beweist
Quellgleichheit, nicht identische Laufzeitbelastung: Aufrufer, Zustände, Browser und
die bereits vorhandenen privaten Build-Transformationen können sich unterscheiden.
Ein schon länger vorhandener Fehler im gemeinsamen Kern bleibt damit ausdrücklich
möglich; die längere frühere Version ist kein fehlerfreier Gegenbeweis.

`0868671b` → `ce073547` verändert 31 Dateien unter `frontend/src`, davon viele Tests
und Übersetzungen. Der Controller enthält unter anderem die bereits verlangten
Schiffs-/Trefferregeln, Beute-Radius und ruhigere Waffenmeldungen. `main` → heutige
Analysebasis verändert 17 Quelldateien vor allem für Einfingersteuerung und
begrenzte Kontakt-/Pausendiagnose. Es gibt deshalb keinen belegten Anlass, frühere
Spielfunktionen pauschal zurückzurollen. Die Grafik-Vergleiche verändern zusätzlich
den privaten Build, nicht diese gepinnten Originalmodule.

## Priorisierter Untersuchungsplan

1. **Quellen und Ergebnisse fest zuordnen.** Vor jedem Vergleich Commit, Baum,
   tatsächlich gebautes Szenario, Aufzeichnungsoption und Zeitart prüfen.
   Quelle des exportierenden Dokuments und Quelle des alten Laufs getrennt halten.
   Die gleiche fehlgeschlagene Variante nicht unverändert wieder zum Besitzer schicken.
2. **Lebensdauer im gemeinsamen Kern automatisiert prüfen.** Gemeinsame Taktung,
   Tausende Ein-/Ausbau- und Pause-/Fortsetzen-Zyklen, veraltete Callback-Abweisung,
   Ressourcenübergaben und Projektil-DOM testen. Keine neue Optimierung ohne
   reproduzierten Fehler in einem tatsächlichen Besitzpfad.
3. **Echte Browser länger beobachten.** Originaldarstellung und der vorhandene
   Mini-Start-Kandidat jeweils in Chromium und WebKit auf getrennten Linux-Runnern.
   Kurzer kompletter UI-Lauf vor 20 Minuten tatsächlich gemessener aktiver Zeit;
   anschließend manuelle Pause, Waffenmenü, bestätigter Home-Abschluss und zwei
   kurze Neueinstiege im selben Browserkontext. Fehler bleiben Fehler; kein
   automatisches Fortsetzen, keine beschleunigte Spieluhr.
4. **Nur belegte Auffälligkeiten eingrenzen.** Steigende konkrete Besitzerzähler,
   reproduzierte Cleanup-Fehler oder UI-/Callback-Grenzen einzeln prüfen. Native
   Speicherzunahme allein nicht als JavaScript-Leck oder Grafikursache bezeichnen.
   Vorhandene sechsminütige Heap- und Speicherprüfungen werden nicht als neue
   Ergebnisse wiederholt.
5. **Erst dann gezielter Gerätevergleich und Freigabe.** Automatische Linux-Tests
   können physische iOS-/Android-/Pi-Browser-Läufe nicht ersetzen. Erst eine
   begründete, intern geprüfte Änderung erfordert einen gezielten Besitzerlauf;
   ein guter Einzelversuch genügt weiterhin nicht zur Freigabe. Zieltermin bleibt
   vor dem 20. November 2026, ohne unbelegtes Stabilitätsversprechen.

## Bereits ausgeführte technische Prüfungen

- Unverändertes vollständiges Frontend: **539 Tests in 22 Testaufrufen**, alle
  bestanden; Übersetzungsprüfung, TypeScript und Vite bestanden. Die bekannte
  Warnung zu großen JavaScript-Paketen bleibt bestehen.
- **15 neue Regressionstests** bestanden: 11 zur belastbaren Berichtszuordnung,
  vier gegen echte Ressourcen-/Schleifenmodule mit kontrollierten Hosts.
- Zusätzlich zehn vorhandene CSS-Animations-Lebenszyklustests bestanden.
- Der neue Belastungstest deckt 30 **simulierte** Minuten mit drei gemeinsamen
  Taktungsnutzern ab, 2.000 Ein-/Ausbau-/Pause-/Stall-Zyklen, 10.000
  Ressourcenübergaben und 100.000 Projektil-Veröffentlichungen. Diese Hosttests
  messen weder native Prozessspeicher noch 30 Minuten physische Laufzeit.
- Bestehender Spielquellen-Pin und abgeschaltete automatische Vercel-Auslieferung
  geprüft. Beide vorbereiteten Gast-Buildbedingungen werden technisch gebaut.
- Ein erster neuer Testlauf lieferte 14/15, weil der Test bereits ausgeführte
  native Scheduler-Callbacks als neue Zustellung wiederholte. Das ist nicht der
  Browservertrag. Der Test wurde an der tatsächlich geschützten Client-Callback-
  Grenze korrigiert; **kein Spielfehler und kein Runtime-Patch** daraus abgeleitet.
- Lokale native Browserausführung ist nicht verfügbar: Die Systempaketinstallation
  scheitert an den Containerrechten; der gewöhnliche Browserdownload liefert
  unvollständige Archive. Das ist ein Testumgebungsfehler, kein Spielabsturz.

## Neue automatische Browserprüfungen

[cryptoid-systematic-stability.yml](../../.github/workflows/cryptoid-systematic-stability.yml)
enthält zuerst Quellen-/Build-Gates, dann vier unabhängige Bedingungen:
Chromium/WebKit × Originaldarstellung/vorhandener Mini-Start-Kandidat. Die beiden
Darstellungen sind unterschiedliche diagnostische Bedingungen; daraus wird kein
reiner Performance-A/B-Effekt abgeleitet. Keine Veröffentlichung, kein echtes
Konto, keine Zahlung und keine Änderung der Spiellogik ist Bestandteil dieser CI.

`verifyBrowserSoak.mjs` prüft Dokumentidentität, aktiven Spielstatus, fortlaufenden
Frame-/Volley-Fortschritt, konservative Stoppuhr, echte UI-Pause/Fortsetzen,
Waffenmenü, Home und normalen Bericht. Ein unerwarteter Stillstand oder eine
technische Pause bricht den Test ab. Während des aktiven Intervalls gibt es keine
Screenshots, erzwungene Speicherbereinigung oder Heap-Snapshots. Alle fünf Sekunden
werden bestehende Teilzähler und externer Linux-Prozessspeicher abgelesen.

Die Ergebnisse der neu gestarteten CI werden nach Abschluss hier nachgetragen.
Ein vorbereiteter oder gestarteter Job ist ausdrücklich noch kein bestandener
Browser-Langzeittest. Ein bestandener Linux-Lauf wäre weiterhin keine bestätigte
Reparatur auf den Smartphones des Besitzers.

Erster CI-Versuch `41333796043`, Quelle `250b6724`: Quellen-/Build-Gates
bestanden. Alle vier Browser-Kurzprüfungen stoppten vor der Messung, weil der neue
Prüfablauf unmittelbar nach Fortsetzen schon `boss-fight` verlangte. Tatsächlich
lief noch das unveränderte `boss-intro`. Die Prüfsteuerung wartet jetzt auf das
wirkliche Ende des Intros und den geöffneten Reaktor; Spielablauf und Pausenschutz
bleiben unverändert. Der fehlgeschlagene Versuch bleibt in
[initial-browser-gate-failure.json](evidence/initial-browser-gate-failure.json)
erhalten und zählt nicht als White-Screen-Reproduktion oder Langzeitlauf.

Zweiter CI-Versuch `41334157317`, Messquelle `4766b3f7`: Quellen-/Build-Gates
erneut bestanden. Chromium Original, Chromium Mini-Start und WebKit Mini-Start
bestehen den vollständigen kurzen Ablauf einschließlich dreier Ein-/Ausstiege und
normalem Bericht; anschließend starten ihre 20-Minuten-Messungen. WebKit Original
stoppt bereits am Start der Kurzprüfung wegen einer aufgezeichneten
Beobachtungslücke. Die letzte Beobachtung zeigt `playing`/`boss-fight`, keine
technische Pause, sichtbares Dokument, Stoppuhr `running` bei 4.016 ms und eine
Lücke; keine Volley war bis dahin fortgeschritten. Es wurde kein Langzeitintervall
gemessen. Der Fehler bleibt bestehen; die Null-Lücken-Prüfung wird nicht
abgeschwächt. Das ZIP wurde gegen den GitHub-SHA-256 geprüft und fehlerfrei gelesen.
[Bereinigter Nachweis](evidence/webkit-original-startup-gap.json).

## Reproduktion

```bash
node --experimental-strip-types --test verification/systematic-stability-20261101/reportAnalysis.test.mjs verification/systematic-stability-20261101/lifetimeStress.test.mjs frontend/src/lib/cssFramePacing.test.mjs
node verification/boss2-mini-start-control-20261101/verifyScope.mjs
npm run build --prefix frontend
```

Lokale Rohberichte werden nur lokal ausgewertet:

```bash
node verification/systematic-stability-20261101/analyzeLocalReports.mjs INPUT_DIRECTORY OUTPUT_JSON
```

Einzelne native Bedingung mit zuvor installiertem Playwright-Browser:

```bash
VERCEL_ENV=preview CRYPTOID_SOAK_CONDITION=mini-start node verification/systematic-stability-20261101/prepareSoakBuild.mjs
CRYPTOID_SOAK_ENGINE=chromium CRYPTOID_SOAK_CONDITION=mini-start CRYPTOID_SOAK_SECONDS=1200 node --experimental-strip-types verification/systematic-stability-20261101/verifyBrowserSoak.mjs
```
