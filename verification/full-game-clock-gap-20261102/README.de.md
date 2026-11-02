# Vollständiger Gast-Spielablauf: Frame- und Stoppuhr-Lücken trennen

Fortsetzung des gesicherten Stands `36a8ec46`. Der aktuelle direkte Boss-Style-
Kandidat hat bereits den isolierten dynamischen Komponentenvergleich in beiden
Engines bestanden. Sämtliche älteren gescheiterten Zeitlücken-/Speicherbelege
bleiben erhalten; keine Beobachtung wird nachträglich korrigiert.

## Konkrete offene Frage

Die alten WebKit-Kurzläufe scheiterten an mindestens einer Stoppuhr-
Beobachtungslücke, während die letzte Szene `playing` und keine technische Pause
meldete. Daraus folgt weder ein nachgewiesener Spielstillstand noch ein rein
fehlerhafter Test. Wir erfassen jetzt zwei voneinander getrennte Messspuren.

## Begrenzte zusätzliche Beobachtung

Nur der isolierte Gast-Builder erhält unter dem expliziten Argument
`--clock-probe` drei exakt rückwärts wiederherstellbare Controller-Einfügungen:
lokaler skalarer Zähler, ein Aufruf am vorhandenen nativen `step` vor seinen
Simulations-Substeps sowie Freigabe in dessen bestehendem Cleanup. Der Zähler
speichert Callback-Anzahl, vorhandenen nativen Zeitstempel, größten beobachteten
Frame-Abstand eines laufenden Callbacks und höchstens 16 Abstände über
250 ms. Ein separater Generationswert verhindert das Vermischen neu angelegter
Loop-Instanzen. Keine Instanz-, DOM-, Grafik- oder State-Objekte werden gehalten.

Die bestehende diagnostische Stoppuhr erhält einen einzigen skalaren Read nach
ihrem bereits vorhandenen `clock.observe(snapshot)`. Sie verwendet denselben
schon gelesenen Snapshot und höchstens 96 Ringzeilen. Kein zusätzlicher Timer,
RAF, Listener, aktiver DOM-/Animationsscan, Profiler oder Speicher-Dump entsteht.
Die erste Runde lässt Zeitberechnung, bestehende Null-Lücken-Prüfung,
2.500-ms-Spiel-Watchdog und 500-ms-Überwachung unverändert. Die zweite Runde
korrigiert ausschließlich den unten belegten Start-/Resume-Zweig der Diagnose.
Die geänderte Diagnose-JS und ihre
unveränderte Basis erhalten getrennte Digests im tatsächlichen Build-Beleg.

Nach einem Testfehler bleibt der Lauf **fehlgeschlagen**. Ein einmaliger
begrenzter Scene-/Clock-Read wird gesichert. Vier Sekunden lang werden danach
nur die vorhandenen Clock-/Frame-Proben beobachtet, ohne Eingabe, Resume,
Zeitreset oder Neustart. Falls das Dokument nicht mehr lesbar ist, bleibt genau
diese fehlende Beobachtung erhalten.

Die Auswertung unterscheidet fortlaufende tatsächliche Spiel-Frames nach einer
Clock-Lücke, einen beobachteten langen Spiel-Frame-Abstand, eine technische Pause
und unzureichende Daten. Ein zwischenzeitlich fehlendes Intervall kann dadurch
nicht vollständig rekonstruiert werden; fehlende weiße Pixel, nativer Kill und
die Smartphone-Ursache werden nicht behauptet.

## Vorab festgelegter Ablauf

Die originalen Gastabläufe bleiben: reguläre Vorbereitung, manuelles Fortsetzen,
Boss-Intro, offener Reaktor, reale aktive Zeit, Pause/Fortsetzen, Waffenmenü,
Home-Ausstieg, zweimaliges erneutes Öffnen und normaler Bericht. Es ist der echte
Spielcontroller mit originaler Grafik und Ton in einer geschützten Boss-2-
Gastszene; kein vollständiger Kampagnen-, Konto-, Zahlungs- oder Balance-Test.
Der bestehende Testschutz bleibt ausdrücklich aktiv, die Vollaufzeichnung aus.

Zunächst laufen auf frischen Linux-Runnern zwei Kurzläufe pro Engine und
Bedingung: Chromium/WebKit, originale Kontrolle/derselbe exakt gepinnte virtuelle
direkte Boss-Style-Kandidat. Jeder Kurzlauf verlangt 60 echte aktive Sekunden,
danach zwei Remounts zu je zehn Sekunden sowie alle bisherigen UI-/Report-Gates.
Bereits eine verlorene Beobachtung, technische Pause oder fehlender Fortschritt
stoppt den Lauf. Jeder Fehlschlag und jeder Nach-Scope-Beleg wird archiviert.

Erst wenn **alle acht** Kurzläufe bestehen, starten vier Langläufe auf frischen
Runnern: eine Kontrolle und ein Kandidat je Engine, jeweils zwanzig reale aktive
Minuten mit anschließendem unverändertem UI-/Berichtablauf. Diese diagnostisch
instrumentierte Serie ersetzt weder die alte unvollständige Speicher-Kohorte
noch ihre vorab festgelegten Akzeptanzkriterien. Unseeded Zufall, Linux-PSS und
synthetischer Gast-Schutz erlauben keine physische Smartphone-Abnahme.

Spielquellen, Main, Produktion, Geräte-Referenzen und echte Konten werden nicht
geändert. Ein manueller Handytest folgt erst nach den festgelegten Browser-Gates
und einer getrennten Prüfung des tatsächlich auszuliefernden Pakets.

```bash
node --test verification/full-game-clock-gap-20261102/probe.test.mjs
node verification/local-boss-style-20261102/preflight.mjs --clock-probe
```

## Erste echte Spielrunde: Startfehler der Diagnose eingegrenzt

Quelle `ba817d0114ee2487e1488ab20a43664ac694ed7a`, Baum
`a2f1db1c7d057f429733fe7cb40f762daa897034`,
[CI 41443647086](https://github.com/19Trojan69/cryptoid-evolution/actions/runs/41443647086).
Beide Quellen-/Typ-Gates bestehen. Alle vier Chromium-Kurzläufe bestehen ihren
vollständigen 60/10/10-Sekunden-UI-Ablauf. Alle vier WebKit-Läufe scheitern an der
unveränderten Null-Lücken-Prüfung; deshalb wird die Langstufe übersprungen.
Einer der WebKit-Kandidaten hatte vorher seinen ersten 60-Sekunden-/UI-Zyklus
vollständig beendet und scheitert erst beim nächsten Mount.

In **allen vier** WebKit-Fehlschlägen steht unmittelbar vor der neuen Lücke:
Clock-Modus `running`, Spielstatus `playing`, nativer Frame-Zähler `0` und
Frame-Zeitstempel `0`. Bereits 214–289 ms später meldet die Clock eine Lücke;
weiterhin hat noch kein nativer Frame stattgefunden. Die folgenden echten
Spiel-Frames laufen weiter. Die höchsten gespeicherten laufenden Frame-Abstände
nach dem Fehler liegen bei 446–715 ms, unter dem unveränderten 2.500-ms-Watchdog.

Damit ist ein konkreter Fehler der diagnostischen Stoppuhr belegt: Ihr bisheriger
Start-/Resume-Zweig ließ `running` ohne frischen, fortgeschrittenen Frame zu.
Der nächste Sample wertete den weiterhin fehlenden Frame dann als Lücke. Der
Fehler erklärt diesen Testabbruch und wird nicht als Smartphone-White-Screen-
Ursache ausgegeben. Alle acht Rohbeobachtungen und ZIP-Digests bleiben erhalten.

Die folgende Diagnose-Korrektur wartet beim ersten Start und nach echten Pausen
auf einen frischen, fortgeschrittenen Frame. Bis dahin zählt sie keine aktive
Zeit. Sie setzt weder Spielstatus noch Zeitwerte zurück und nimmt keine echte
spätere Lücke aus der weiterhin strengen Prüfung heraus. Zwei Regressionen
bilden den beobachteten Frame-0-Verlauf und den anschließenden echten 3-Sekunden-
Beobachtungsausfall ab. Die bestehenden Clock-Regeln bleiben geprüft.

Zwei weitere Begrenzungsdetails werden korrigiert: Epoch-Werte von
`performance.timeOrigin` über einer Billion dürfen im einmaligen Fehler-Read
nicht als ungültig verworfen werden; ein erster laufender Callback mit großem
vorhandenem Frame-Abstand muss im Frame-Maximum enthalten sein. Alte Nullwerte
und Rohdaten werden nicht rückwirkend ergänzt. Die Build-Probe erhält Version 2,
aktuelle installierte Pakete und Lock-Digest werden zusätzlich aufgezeichnet.
24 direkte Clock-/Beobachter-Regressionen bestehen lokal. Die neuen acht
Kurzläufe müssen diese Korrektur anschließend unter echten Engines bestätigen.

## Zweite echte Spielrunde: alle zwölf Abläufe bestanden

Quelle `a8e407a649431c719dfee64e0ec3cf63d73de3e0`, Baum
`2780ff76231ae2f11e2ef7a25eb8c91bad41161a`,
[CI 41445407351](https://github.com/19Trojan69/cryptoid-evolution/actions/runs/41445407351).
Alle acht Kurzläufe bestehen den vollständigen 60/10/10-Sekunden-Ablauf. Erst
danach starten und bestehen alle vier Langläufe. Die erste aktive Spielzeit ist
direkt aus den unveränderten Rohbeobachtungen übernommen:

| Engine | Bedingung | Aktive Zeit im ersten Zyklus | Vollständige UI-Zyklen | Normaler Bericht |
| --- | --- | ---: | ---: | --- |
| Chromium 151.0.7922.34 | Original | 1200,000 s | 3 | bestanden |
| Chromium 151.0.7922.34 | direkte Styles | 1200,9999 s | 3 | bestanden |
| WebKit 26.5 | Original | 1200,953 s | 3 | bestanden |
| WebKit 26.5 | direkte Styles | 1200,664 s | 3 | bestanden |

Alle zwölf Läufe bestehen die strenge Null-Lücken-Prüfung, echten
Volley-Fortschritt, Pause-Freeze, manuelles Fortsetzen, Waffenmenü, Home-Ausstieg,
erneutes Öffnen sowie Freigabe von Test-Bridge und Frame-Probe. Paketversionen
und Lock-Digest stimmen innerhalb dieser zweiten Kohorte überein. Die vier alten
WebKit-Fehlschläge bleiben unverändert als Fehlschläge in demselben Archiv.
`evidence/manifest.json` enthält alle 20 Originalbeobachtungen einschließlich
Build-Belegen, vollständigen Punktlogs und geprüften ZIP-Digests.

Diese diagnostisch instrumentierten Läufe belegen den geprüften Spielfluss. Sie
ersetzen die frühere gescheiterte Speicher-Kohorte nicht; aus ihnen wird weder
ein vergleichbarer Speichergewinn noch eine Smartphone-Abnahme abgeleitet.

## Separates Paket ohne aktive Frame-/Clock-Ringe

Quelle `5acefc1aa3ea224b656a76c415da39ece0ed84f0`, Baum
`e5d838eead213cf6c1d9e9d365c4de38ef7395b8`,
[CI 41449159220](https://github.com/19Trojan69/cryptoid-evolution/actions/runs/41449159220).
Beide nativen Paketläufe bestehen alle drei 60/10/10-Sekunden-UI-Zyklen und den
normalen Bericht. Der Builder verwendet dieselben gepinnten direkten Styles und
dieselbe korrigierte Stoppuhr. Originalgrafik und Ton bleiben erhalten. Die
zusätzlichen aktiven Frame- und Clock-Ringe der Ursachenanalyse sind im
tatsächlich geschriebenen Paket ausgeschlossen. Die originalen fünf Runtime-
Bäume und der ausgeschaltete automatische Deploy bleiben geprüft.

Die beiden unveränderten Paketbeobachtungen sind getrennt unter
`package-evidence/` archiviert. Ein erfolgreicher nativer Paketlauf ersetzt keine
Prüfung des anschließend tatsächlich gehosteten Builds und keinen Gerätetest.
White Screen und native Abbruchursache bleiben offen.

## Gehosteter Stand: Zugriff zur weiteren Prüfung erforderlich

Der erste getrennte Preview-Build aus exakt `5acefc1a` scheitert am Build-Schritt
(`dpl_4GBdNjrnTdWLtyxRBs58RkwRd2Rr`, `BUILD_UTILS_SPAWN_1`). Die konkrete Ursache
ist noch nicht belegt. Die Browser-CI-Ergebnisse werden dadurch weder ersetzt
noch zu einer erfolgreichen gehosteten Abnahme umgedeutet.

Eine separate Build-Diagnose aus `dbbac540` fängt ausschließlich den Build-Fehler
ab und erzeugt eine minimale Diagnose-Datei. Diese Adresse enthält ausdrücklich
keinen spielbaren Kandidaten. Ihre Bereitschaft `READY` ist kein bestandener
Spiel-Build. Die originale Kandidatenquelle bleibt unverändert.

Die verbundene Vercel-App verweigert den Zugriff auf die Build-Ereignisse (404),
die geschützte Diagnose-Datei (403 beim Schutz-Zugriff) sowie den geschützten
Freigabelink mit dem bekannten Team (404). Eine angemeldete lokale CLI ist nicht
verfügbar. Deshalb sind weitere Prüfung, gezielte Build-Korrektur und Handy-
Freigabe bis zur Autorisierung des bestehenden Projekts/Teams offen. Kein
Schutz wurde abgeschaltet, keine Browser-Anmeldung begonnen und keine
öffentliche Stammadresse geändert. Die exakten Quellen und Zustände stehen in
`hosted-preview-status.json`; Zugangsdaten oder Freigabetokens sind nicht enthalten.

## Fortsetzung nach dem vom Eigentümer bereitgestellten Buildlog

Der konkrete ursprüngliche Abbruch ist jetzt belegt: `AssertionError: No
inherited diagnostic treatment` in Zeile 8 des Paket-Builders, unter Node
24.22.2. Der Builder lehnte schon die Anwesenheit irgendeiner `CRYPTOID_`-
Variable ab. Welcher Schlüssel oder Wert vorhanden war, ist nicht bekannt und
wurde nicht aus der Projektumgebung ausgelesen. Die npm-Warnung zu esbuild ist
nicht die hier belegte Abbruchursache.

Quelle `3d4cb0c17d1b3d91de9a9b87eb9a2761832f2efe`, Baum
`b70e43a631a3bd32a14ef73d122b81462eed876d`,
[CI 41484913176](https://github.com/19Trojan69/cryptoid-evolution/actions/runs/41484913176):
Der Builder verwirft geerbte `CRYPTOID_`-Variablen nur in seinem eigenen Prozess
und setzt danach die unveränderten sechs Paketwerte. Beide nativen 60/10/10-
Sekunden-Paketabläufe bestehen trotz absichtlich widersprüchlicher Einstellungen.
Die Vercel-Projektvariablen und Spielquellen werden nicht geändert.

Eine lokale Wiederholung des tatsächlichen Installationsbefehls belegte zudem
eine npm-Umschreibung von `frontend/yarn.lock`, die den strengen Scope-Guard
scheitern ließ. Auch `--no-save` verhinderte sie unter dem vorhandenen npm nicht.
Ein separater Installer prüft nun vor npm sämtliche Original-Runtime-Bäume,
sichert die unveränderten Yarn-Bytes, stellt ausschließlich diese Datei nach
npm wieder her und verlangt danach erneut den vollständigen Scope sowie einen
erfolgreichen npm-Abschluss. Andere Quellenänderungen bleiben Fehler.

Quelle `ce8cc4ab6630e502b796adfde082d75238c5095b`, Baum
`5cf24892e16ffbf4f3ba0ed5d939e0dd646c675e`,
[CI 41485674562](https://github.com/19Trojan69/cryptoid-evolution/actions/runs/41485674562):
Beide nativen Paketabläufe bestehen auch mit diesem identischen Installer und
den widersprüchlichen Build-Einstellungen. Die vier neuen Rohbeobachtungen,
Build-Belege, Scope-Belege und vollständigen Punktlogs beider Quellen sind
getrennt unter `environment-fix-evidence/` archiviert; alle alten Daten bleiben.
Sie bestätigen keine weitere 20-Minuten-Serie und keine Smartphone-Abnahme.

Der getrennte gehostete Versuch `dpl_5wo2k7XPFSH6Reg9dsn5KYUVHbRQ` aus exakt
`ce8cc4ab` scheitert jedoch jetzt am Installationsskript. Die verfügbare
Vercel-Meldung nennt nur dessen Exit-Code 1; die konkrete Ursache ist noch
nicht bekannt. Dieser gehostete Fehlschlag wird trotz bestandener nativer CI
als offen beibehalten. Die Handy-Preview bleibt bis zur Auswertung dieses
Installationsfehlers und erfolgreicher gehosteter Prüfung gesperrt. Keine
Produktion, Schutz- oder Kontoeinstellung wurde geändert.

## Abschließende Konfigurationskorrektur und erfolgreich gehostete Preview

Mit vom Eigentümer ausdrücklich freigegebenem Browserzugriff konnten die
vollständigen Deploy Logs des zuletzt gescheiterten Builds gelesen werden.
Der konkrete Abbruch lag vor npm in `verifyScope.mjs:20`: Der Konfigurations-
Blob war `e50f042bfc5e09ece0b058a0d03013867849fda2` statt
`e94775c2f8a435f2dcb46b65fafd34e67abdc640`. Alle fünf originalen Runtime-Pins
und deren unveränderte Arbeitsdateien hatten davor bereits bestanden.

Der abweichende Hash wurde lokal exakt mit `JSON.stringify(originalConfig) +
'\n'` reproduziert. Vercel hatte dieselben Inhalte kompakt serialisiert.
Der Guard erlaubt jetzt nur diese beiden vollständig gepinnten Byteformen.
Die tatsächliche Scope-Prüfung besteht in beiden Formaten; sieben Änderungen
an Deployment-Regeln, Output, API-Routing, Header, Framework und Commands
scheitern in beiden Formaten. Ein drittes, nicht aufgezeichnetes Format wird
weiter abgelehnt. Keine beliebige Normalisierung oder Spieländerung wurde erlaubt.

Quelle `b042c8e50ad3f05a70418ae5ee6bb4412809035b`, Baum
`921fe9212ce0ccfeaa7dc46352d3d6385c7f3fb2`,
[CI 41489185104](https://github.com/19Trojan69/cryptoid-evolution/actions/runs/41489185104):
Beide nativen Paketabläufe bestehen mit der tatsächlichen kompakten Vercel-
Darstellung während Installation und Build sowie widersprüchlichen geerbten
Umgebungswerten. Ihre ursprünglichen 60/10/10-Sekunden-Beobachtungen erweitern
das Paket-Folgearchiv auf sechs Captures aus drei getrennten Quellen.

Der neue getrennte Build `dpl_HiEfjsJYS3HTuHs3A7JkQ4Jzg7Yu` ist **READY**,
Umgebung **Preview**, Dauer 55 Sekunden. Seine tatsächlich ausgelieferten
Build-Daten bestätigen exakt Quelle/Baum, direkte Styles, Originalgrafik,
korrigierte Stoppuhr und den Ausschluss aktiver Frame-/Clock-Ringe. Style-,
Clock- und Controller-Metadaten stimmen mit beiden nativen Paket-Builds überein.
Der Live-Gast-Endpunkt liefert nur `user: null` und verweigert Admin-Zugriff.
Vorbereiten, angehaltener Einstieg und manuelles Fortsetzen wurden zusätzlich
im gehosteten Chromium-Browser geprüft. Die sichtbare Uhr lief bis `00:38`;
nach normalem Home-Ausstieg und Bestätigung blieb `00:43` gespeichert und der
Kurzbericht war im Menü verfügbar. Dies ist ein Browsercheck, kein Handytest.

Die LIVE-Build-Daten, beide Gast-Antworten und der READY-Screenshot liegen mit
Byte-Digests unter `hosted-preview-evidence/`. Der direkte Aufruf einer einzelnen
JS-Datei wurde vom Browserwerkzeug mit `net::ERR_BLOCKED_BY_CLIENT` abgelehnt;
ein unabhängiger HTTP-Bytevergleich dieser JS-Dateien wird deshalb nicht
behauptet. Ihre Build-Digests und Kopier-/Paketprüfungen bleiben getrennt belegt.

Die genaue geschützte Testadresse lautet
https://cryptoid-evolution-testnet-qj8gl2epe-19-trojan69.vercel.app/ .
Der bestehende Vercel-Zugangsschutz bleibt aktiv; es wurde kein anonymer
Freigabelink erzeugt und keine öffentliche Stammadresse geändert. Für den
Gerätetest: Pi Browser, offener Reaktor, Testschutz an, Vollaufzeichnung aus;
vorbereiten, Boss-2-Test öffnen, manuell fortsetzen, zwanzig aktive Minuten.
Nach normalem Ausstieg den Bericht sichern. Bei White Screen dieselbe Adresse
erneut öffnen und vor einem weiteren Start den letzten Bericht sichern.
Die Smartphone-Stabilität und die ursprüngliche White-Screen-Ursache bleiben
bis zu tatsächlichen Gerätedaten offen.
