# Lückenlose Fortsetzung: dynamische Boss-Styles und Abbruchzustand

Arbeitszweig: `codex/style-recalc-isolation-20261102`.
Die unmittelbar vorangehende, ursprünglich noch gestagte Auswertung wurde als
lokaler Commit `b6f7277d73a1e806baafaf5876246118dfbf0d7d` gesichert. Sie enthält
sämtliche sechs Beobachtungen, unveränderte Digests und den gescheiterten zweiten
Kontrolllauf. Ihr [vollständiger Bericht](../local-boss-style-20261102/README.de.md)
und sämtliche früheren Messserien bleiben erhalten.

## Gesicherte Befunde und offene Grenzen

Im vorangehenden aktiven Vergleich liefen beide Kandidaten zwanzig Minuten;
ihre gemessenen Renderer-PSS-Spitzen lagen bei 298,2 und 309,6 MiB. Original 1
erreichte 589,2 MiB und endete regulär. Original 2 wurde nach dem letzten Sample
bei 13:22 mit unerwarteter Pause unvollständig; seine gemessene Spitze war
2.314,1 MiB. Das ist kein nachgewiesener nativer Kill oder White Screen.
Die vorab verlangte vollständige zweite Kontrolle fehlt. Der Speichervergleich
bleibt daher nicht abgenommen. Linux-PSS ist keine Smartphone-RAM-Messung.

Der getrennte pausierte Style-Vergleich ergab reproduzierbar 5 statt 95 native
Elementberechnungen je Schritt bei gleichen untersuchten Verbraucherwerten.
Die statische React-SSR-Prüfung über 1.800 Zustände und beide virtuellen
TypeScript-Konfigurationen bestehen. Die früheren WebKit-Startlücken bleiben
offen. Weder die Speicherwerte noch bestandene Quellprüfungen belegen eine
dauerhafte Behebung auf iOS, Android oder im Pi Browser.

## Neue einmalige Beobachtung nach einem Collector-Fehler

`failureObservation.mjs` ist in den Catch des bestehenden externen Collectors
eingebunden. Erst nachdem die aktive Prüfung fehlgeschlagen ist, versucht er
genau einen höchstens drei Sekunden langen Read. Er liest nur bestehende
skalare Scene-/Clock-Werte: Dokumentidentität, Sichtbarkeit/Fokus, Mount,
Status/Phase/Encounter, Technical-Pause-Flag, Salve, Frame-Alter, Laufidentität,
aktive Uhrzeit und ungemessene Zeitlücken. Es gibt keinen erneuten Versuch,
keine Profilierung, keinen neuen Seitentimer, kein Resume und keinen Eingriff
in einen normalen aktiven Messlauf. Fehlerberichte bleiben unter 4 KiB.

Ein zerstörtes Dokument oder Timeout wird ausdrücklich als fehlende Beobachtung
gesichert. Eine beobachtete technische Pause oder Zeitlücke ist noch keine
bestätigte Ursache. Keine URL, Scores, Shards, Kontaktkoordinaten, Tokens,
Kontodaten, vorherigen Läufe oder vollständigen Storage-Daten werden übernommen.
Die alte fehlgeschlagene Beobachtung wird dadurch nicht nachträglich ergänzt.

## Neuer eigenständiger React-/Browservergleich

Der Vite-Builder kompiliert beide Original-Hull-/Reactor-Quellen getrennt:
byteidentische Kontrolle und exakt denselben virtuellen direkten Style-
Kandidaten wie zuvor. Er prüft die vier tatsächlich im Compiler angekommenen
Varianten anhand ihrer Blob-Digests. Spielquellen und originales CSS bleiben
gleich; die beiden React-Bäume verwenden dieselbe installierte React-Version.
Hierfür wurde der Skill **Vercel React Best Practices** herangezogen: stabile
Komponenten auf Modulebene, unveränderte Memo-Caches und keine neuen Effekte
oder Listener im Kandidaten.

Das isolierte Komponenten-Harness verändert nur synthetische Eingabe-Props;
es startet keinen GamePage-Controller, keine Spieluhr, Authentifizierung oder
Backend-Verbindung. Für alle 50 Bosse führt es 36 aufeinanderfolgende Updates
am selben Boss-/Core-Objekt aus, insgesamt 1.800 Vergleiche. Es verlangt:

- gleiche vollständige nicht betroffene DOM-/SVG-Attribute und Referenzen;
- exakt gleiche native Höhen, Opazitäten, Füll-/Linienfarben der Verbraucher;
- aktuelle Ladung und Schub auch bei erhaltenem memoisiertem SVG;
- dieselben gemounteten Hull-, SVG-, Flammen- und Verbraucher-Knoten;
- je Modell unveränderte Fall-Darstellung und leere Darstellung ohne Boss;
- zusätzlich einen zeitlich gestarteten nativen Fall-Animationsvergleich:
  dieselben Animationsobjekte, Startzeiten und Raten nach einem React-Update;
- explizites Unmount beider Komponentenwurzeln.

Zulässige Vergleichsnormalisierung ist auf die beiden React-useId-Präfixe,
die deklarierten Style-Umverteilungen und leeres Style nach Entfernen genau
der Verbraucheropazität begrenzt. Quell-CSS mit Style-Präsenzselektor wird
abgewiesen. Entfernte Ladungsvariablen, veraltete Context-Werte, geänderte
Geometrie, Farben, Feuer-Klassen oder Verbraucherzahlen müssen scheitern.
Externe Google-Schriften werden im isolierten Test blockiert; Schrift-/Pixel-
Identität und vollständiger Spielstart werden damit nicht abgenommen.

Die neue CI enthält je einen eigenständigen Chromium- und WebKit-Job und
bewahrt auch fehlgeschlagene Beobachtungen samt Nach-Scope-Beleg. Die alte
Langserie läuft künftig nur über ausdrückliches `workflow_dispatch`; normale
Analyse-Commits führen dort nur die Quellen-Gates aus. Somit wiederholt ein
neuer Diagnose-Read nicht automatisch vier bereits abgeschlossene Langläufe.

## Tatsächlich lokal geprüft

- Sieben neue Regressionen für strenge Vergleichsregeln und begrenzte
  Fehlerbeobachtung bestehen.
- Die sechs realen früheren Belege bestehen erneut Auswertung und Digests.
- Die bisherigen fünf lokalen Fidelity-/SSR-Prüfungen bestehen, einschließlich
  1.800 vollständiger statischer Markup-Vergleiche und aller Fallzustände.
- Beide unveränderten virtuellen TypeScript-Konfigurationen bestehen.
- Der neue vollständige Vite-Komponenten-Build besteht; seine vier tatsächlich
  kompilierten Quellvarianten müssen den zuvor gemessenen Kandidaten erfüllen.
- Der Originalquellen-Scope bleibt bestanden. Kein Spiel-Runtime-Patch wurde
  übernommen oder veröffentlicht.

## Ausstehend und nächster konkreter Schritt

**Die neuen nativen Browserläufe sind noch nicht ausgeführt.** Lokal sind keine
Chromium-/WebKit-Binaries installiert. Die automatische Freigabeprüfung hat den
Push der Analyse-/Evidenz-Commits abgelehnt: Eine ausdrückliche Nutzerfreigabe
für das Hochladen in das öffentliche Repository sei nicht belegt. Der danach
über den verbundenen GitHub-Zugang geprüfte passende Besitzer, Repository-ID,
Branch und Schreibzugriff wurden nicht als Ersatz für diese Freigabe akzeptiert.
Es erfolgte kein weiterer Upload-Versuch über einen anderen Weg.

Nach ausdrücklicher Freigabe genau diese lokalen Analyse-Commits auf denselben
Analysezweig pushen und die neue Chromium-/WebKit-CI abwarten. Ergebnisse,
Fehler und Artefaktdigests sichern; keine fehlgeschlagene Bedingung entfernen
oder als Geräte-Fix umdeuten. Der neue Browservergleich ersetzt weder die alte
Startlücken-Untersuchung noch die ausstehende Smartphone-Abnahme. Vor diesen
Ergebnissen wird kein neuer manueller Geräte-Langtest angefordert.

```bash
node --test verification/memory-retention-attribution-20261101/failureObservation.test.mjs verification/local-boss-style-dynamic-20261102/validation.test.mjs
node verification/local-boss-style-dynamic-20261102/build.mjs
node verification/boss2-mini-start-control-20261101/verifyScope.mjs
# Erst mit installierter jeweiliger Engine:
node verification/local-boss-style-dynamic-20261102/run.mjs chromium
node verification/local-boss-style-dynamic-20261102/run.mjs webkit
```
