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

Die deklarierten Laufzeit-/Entwicklungsabhängigkeiten und das gesamte `yarn.lock`
sind zwischen den ausgewählten Ständen ebenfalls unverändert; Unterschiede in
`package.json` betreffen Testaufrufe. Die lokale Installation löste allerdings
neuere zulässige Versionen auf (React 19.3.1, Vite 7.3.7), während das Lockfile
React 19.2.4/Vite 7.3.1 nennt und die CI tatsächlich Vite 7.3.1 ausgibt. Deshalb
werden lokale und CI-Builds nicht als bibliotheksidentisch bezeichnet. Historisch
ausgelieferte vollständige Paketgraphen sind damit nicht rückwirkend bewiesen.
Es wurde keine Abhängigkeit im Repository geändert und kein Bibliothekswechsel
als Absturzursache behauptet.
[Abhängigkeitsinventar](evidence/dependency-inventory.json).

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
- **20 neue Regressionstests** lokal bestanden: 11 zur belastbaren Berichtszuordnung,
  vier gegen echte Ressourcen-/Schleifenmodule mit kontrollierten Hosts und fünf
  für die korrekte Annahme bzw. Ablehnung der nativen Testergebnisse. Die ersten
  15 wurden zusätzlich in der Mess-CI bestanden; die fünf Offline-Auswertungsfälle
  sind auch in die folgenden Quellen-Gates aufgenommen.
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

Die vollständigen Ergebnisse sind unten dokumentiert. Ein bestandener Linux-Lauf
ist weiterhin keine bestätigte Reparatur auf den Smartphones des Besitzers.

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

## Abgeschlossene native Prüfrunde und neue Speicherspur

Messquelle **4766b3f784babdbd0ece5204d6853d05f441a43f**, Actions
[41334157317](https://github.com/19Trojan69/cryptoid-evolution/actions/runs/41334157317).
Der Quellen-Job besteht 564 Fälle (539 vorhandene Release-Fälle, 15 neue Kern- und
Auswertungsfälle und zehn vorhandene CSS-Fälle), Übersetzungen, TypeScript und Vite.
Die fünf später ergänzten Offline-Auswertungsfälle bestehen separat lokal.

| Native Linux-Bedingung | Kurzer kompletter Ablauf | Tatsächlich gemessene aktive Langzeit | Abschlussschritte |
| --- | --- | --- | --- |
| Chromium, Originaldarstellung | Bestanden | 20:00,003 | Drei Ein-/Ausstiege, Pause, Waffenmenü und normaler Bericht bestanden |
| Chromium, vorhandener Mini-Start-Kandidat | Bestanden | 20:00,000 | Drei Ein-/Ausstiege, Pause, Waffenmenü und normaler Bericht bestanden |
| WebKit, vorhandener Mini-Start-Kandidat | Bestanden | 20:00,932 | Drei Ein-/Ausstiege, Pause, Waffenmenü und normaler Bericht bestanden |
| WebKit, Originaldarstellung | Nicht bestanden: anfängliche Beobachtungslücke | Nicht gestartet | Kein vollständiger Ablauf behauptet |

Die Gesamt-CI bleibt **failure**, nicht grün. Die fehlgeschlagene Original-WebKit-
Bedingung bleibt ein offener Befund. In den drei vollständigen Langzeitläufen gab
es keinen vom Test erfassten Dokumentwechsel, unerwarteten Pausenstatus,
JavaScript-Fehler oder Renderer-Crash. Native weiße Pixel und physische Geräte
wurden dabei nicht gemessen. Die Spieluhren wurden nicht beschleunigt.

**Ein neuer konkreter Untersuchungsschwerpunkt ist der gemessene Speicheranstieg.**
Die ersten und letzten 60 aktiven Sekunden der langen Läufe liefern folgende
Medianwerte des extern gelesenen Linux-Browser-Nachfahren-PSS:

| Bedingung | Erste 60 s | Letzte 60 s |
| --- | ---: | ---: |
| Chromium Original | 463,1 MiB | 818,9 MiB |
| Chromium Mini-Start | 371,6 MiB | 396,1 MiB |
| WebKit Mini-Start | 946,7 MiB | 1.090,9 MiB |

Beim Original-Chromium-Lauf steigt auch der Median später Zeitfenster weiter
(Minute 5 etwa 640,4 MiB, Minute 10 etwa 764,3 MiB). Gleichzeitig bleiben die
beobachteten Teilressourcen klein: maximal drei Effekt-Quellbilder, zwei
Effekt-Texturen, etwa 1,01 MiB gezählter Effekt-Cache und 46 Audiopuffer. In allen
drei langen Läufen wird kein Audio-Uhrstillstand gezählt. Diese Aussagen betreffen
nur die tatsächlich gelesenen Zähler; sie sind keine Gesamt-Speicherbilanz.

Das ist **kein Nachweis eines unbeschränkten Lecks oder der Smartphone-Ursache**.
Unseeded Szenen, verschiedene Grafikbedingungen, Browser-/Betriebssystem-Caches,
ausstehende Speicherbereinigung und nicht erfasste Besitzer bleiben möglich.
Die beiden Chromium-Läufe erreichen jeweils 428 Reaktor-Volleys, WebKit 411;
damit wird weder gleiche Renderarbeit noch ein isolierter Wirkungsgrad des
Mini-Start-Guards belegt. Der reduzierte Kandidat enthält bereits mehrere frühere
Grafik-Transformationen. Der PSS-Unterschied darf deshalb keinem einzelnen Guard
zugeschrieben werden. Linux-PSS ist keine physische iPhone-/Android-/GPU-Messung.

**Nächste priorisierte technische Arbeit:** Den Anstieg nach dem Aufwärmen im
Originalzustand reproduzieren und über konkrete Besitzer zuordnen: tatsächliche
CSS-Animationsregistrierungen/DOM, JavaScript-Retention nach manuell pausierter
Messung und anschließendes Home-Cleanup, Bild-/Canvas- und native Renderressourcen.
Dabei die bereits vorhandenen sechsminütigen Heap-/Subsystembelege weiterverwenden;
keine erzwungene Speicherbereinigung im aktiven Spiel. Die anfängliche WebKit-
Lücke getrennt auf Diagnosebeobachtung bzw. tatsächliche Blockade prüfen. Erst
ein reproduzierter Besitz-/Freigabefehler rechtfertigt einen Runtime-Patch.
Ein weiterer langer Smartphone-Lauf ist für diese nächste technische Analyse
noch nicht erforderlich.

Die unmittelbare Fortsetzung ist unter
[Speicherbesitzer und Freigabegrenzen](../memory-retention-attribution-20261101/README.de.md)
dokumentiert. Sie prüft die Originalszene mit bestehenden Besitzerzählern und
schweren Speicheraufnahmen erst nach Pause beziehungsweise bestätigtem Home-
Ausstieg. Die oben aufgeführten ursprünglichen Messungen und der rote WebKit-
Startkontrollfall bleiben davon getrennte, unveränderte Belege.

Alle vier ursprünglichen ZIP-Digests wurden gegen GitHub und ihre ZIP-Integrität
geprüft. Die sieben vollständigen synthetischen JSON-Ergebnisse bleiben verlustfrei
komprimiert in [native-captures.json.gz](evidence/native-captures.json.gz) erhalten;
keine Besitzerberichte sind enthalten. [Manifest](evidence/native-evidence-manifest.json)
und [Zusammenfassung](evidence/native-results.json) bleiben reproduzierbar.
Der Offline-Verifier prüft Digests, genaue Quelle/Baum, alle vier Bedingungen,
Duplikate, aktive Dauer, drei UI-Lebenszyklen und den normalen Endbericht. Kurze
und fehlgeschlagene Versuche werden nicht in Langzeit-Erfolge umgedeutet.

Es gibt keinen neuen Spiel-Patch, keine neue Geräte-URL und keine Veröffentlichung.
Öffentliches Spiel, gespeicherter Fortschritt und eingefrorene Geräte-Zweige
werden durch diese Arbeit nicht geändert.

## Reproduktion

```bash
node --experimental-strip-types --test verification/systematic-stability-20261101/reportAnalysis.test.mjs verification/systematic-stability-20261101/lifetimeStress.test.mjs frontend/src/lib/cssFramePacing.test.mjs
node --test verification/systematic-stability-20261101/evidence/nativeSummary.test.mjs
node verification/systematic-stability-20261101/evidence/verifyNativeEvidence.mjs
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
