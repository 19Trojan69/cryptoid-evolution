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

## Ausgeführte Browserläufe und erhaltene Fehlschläge

Nach der ausdrücklichen Nutzerfreigabe wurde der Upload über den verbundenen
GitHub-Zugang abgeschlossen. Dem direkten Git-Transport fehlten Anmeldedaten.
Die API erzeugt neue Commit-Metadaten; jeder veröffentlichte Dateibaum wurde
exakt gegen den freigegebenen lokalen Baum geprüft. Die Zuordnung steht in
`evidence/upload-tree-map.json`. Es gab keine erneute Freigabeanforderung und
keine Veröffentlichung des Spiels.

| Serie | Quelle | Chromium | WebKit |
| --- | --- | --- | --- |
| Initial, CI 41438806386 | `c65a5f58` | Fehler bei Modell 8; 7 vollständig | 50 Modelle vollständig bestanden |
| Genauere Höhen-Diagnose, CI 41439376881 | `63f02c73` | Derselbe Prüffehler; Werte gesichert | 50 Modelle vollständig bestanden |
| Expliziter CSSOM-Prüfvertrag, CI 41439931929 | `d3f43caa` | Vollständig bestanden | Vollständig bestanden |

Die erste Chromium-Abweichung war eine zu strenge Annahme des neuen Testcodes
über die Dezimalschreibweise von Inline-CSS. Die zweite Serie behielt den
Fehler unverändert bei und sicherte die genauen Werte: erwartete Formel
`29.29525px`, ausgelesenes Inline-CSS `29.2952px`, tatsächlich berechnete Höhe
in **beiden** Varianten exakt `29.2812px`. Kein veralteter Schub oder
unterschiedlich gerendertes Modell wurde an dieser Stelle nachgewiesen.

Der Prüfvertrag wurde danach ausdrücklich korrigiert: Ein einzelner nicht
gemounteter Fixture-CSSOM-Parser serialisiert den aktuellen Sollwert mit
derselben Engine. Dieser kanonische String muss exakt dem aktuellen Inline-
Wert entsprechen. Die berechneten Höhen des Originals und Kandidaten müssen
weiterhin exakt gleich sein; es wird keine neue numerische Toleranz eingeführt.
Eine Regression verwendet die real beobachteten Werte und weist bereits eine
abweichende native Höhe von `29.2813px` oder einen veralteten Inline-Wert zurück.
Die Formeln und beide Spiel-Komponenten wurden dafür nicht geändert.

Die erfolgreiche Quelle ist `d3f43caaaabe238e3b112c665b4dae8844c6ee8b`, Baum
`3bf979ad49337db500dcbda508507761ae2cb798`,
[CI 41439931929](https://github.com/19Trojan69/cryptoid-evolution/actions/runs/41439931929).
Native Engines: Chromium `151.0.7922.34` und WebKit `26.5` auf Linux,
Playwright `1.62.1`. Beide verwenden React/ReactDOM `19.2.4`, Vite `7.3.1`,
TypeScript `5.9.3` und denselben gespeicherten Lock-Digest.

Je Engine bestehen 1.800 aufeinanderfolgende Zustandsvergleiche für alle
50 Modelle, 50 Fall-/50 Abwesenheitsfälle, 3.500 Prüfungen gleicher gemounteter
Knoten und ein weiterer Schub-/Ladefall vor der Animation. Hinzu kommen
66 bestätigte Erhaltungsprüfungen tatsächlich gestarteter nativer Animationen
und das explizite Unmount beider Wurzeln. Es wurden 6.950 Flammen- und
5.619 Lade-/Mündungsverbraucher geprüft. Die abgeschlossenen Quellen-Gates und
die vorherige Archiv-CI `41438806305` bestehen ebenfalls.

Alle sechs unveränderten Beobachtungen, alle sechs tatsächlichen Build-Belege,
Nach-Scope-Belege und gegen GitHub geprüften Artefakt-Digests stehen in
`evidence/`. Die zwei fehlgeschlagenen Chromium-Beobachtungen bleiben dort
als Fehlschläge erhalten. Drei zusätzliche Archiv-Regressionen verhindern
unter anderem Erfolg ohne vollständige Modelle, Animationserhalt, Unmount,
gleiche Quellen oder beide Engines. Neue Beleg-/Dokumentations-Commits starten
diesen Browservergleich nicht erneut.

## Bedeutung und nächster konkreter Schritt

**Bestanden ist die dynamische Komponenten-Darstellung des unveränderten
virtuellen Kandidaten in beiden Engines.** Die alten vollständigen Spielstart-
Lücken sind damit nicht geprüft. Dieser isolierte Test misst keinen aktiven
Speichervorteil und keinen nativen iPhone-/Android-/Pi-Browser-Abbruch.
Die vorherige unvollständige Speicher-Kohorte bleibt weiterhin nicht abgenommen;
die erfolgreichen Komponentenläufe ersetzen ihre fehlende zweite Kontrolle
nicht. Eine dauerhafte White-Screen-Behebung ist nicht bestätigt.

Die nächste gezielte aktive Eingrenzung kann den nun vorhandenen einmaligen
Abbruch-Read verwenden: Dokumentwechsel, verlorene Szene, technische Pause und
beobachtete Zeitlücke getrennt sichern. Alte Messungen dürfen dabei nicht
nachträglich ergänzt oder vermischt werden. Vor einer Geräte-Freigabe bleibt
insbesondere die Startlücke des vollständigen Spiels zu klären. Noch kein neuer
manueller Geräte-Langtest und keine Änderung an Main oder Produktion.

```bash
node --test verification/memory-retention-attribution-20261101/failureObservation.test.mjs verification/local-boss-style-dynamic-20261102/validation.test.mjs
node verification/local-boss-style-dynamic-20261102/build.mjs
node verification/boss2-mini-start-control-20261101/verifyScope.mjs
node --test verification/local-boss-style-dynamic-20261102/evidence/summary.test.mjs
node verification/local-boss-style-dynamic-20261102/evidence/verifyEvidence.mjs
# Erst mit installierter jeweiliger Engine:
node verification/local-boss-style-dynamic-20261102/run.mjs chromium
node verification/local-boss-style-dynamic-20261102/run.mjs webkit
```
