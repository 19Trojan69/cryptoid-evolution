# Unveränderten Boss-Reaktor wiederverwenden

Die fortgesetzte Untersuchung findet vermeidbare React-Arbeit im Bosskampf.
`BossReactorView` erzeugt bislang bei jeder Szenenaktualisierung seinen kompletten
SVG-Elementbaum erneut, selbst während die Waffe geschlossen und unverändert ist.
Die Ausgabe bleibt dann gleich; Konstruktion und Vergleich der Zwischenobjekte
werden trotzdem wiederholt.

Die Korrektur speichert den zuletzt erzeugten SVG-Baum mit `useMemo`. Die
Abhängigkeiten sind seine tatsächlichen Darstellungswerte: Geometrie, Bild,
Material, Öffnung, Ladung, Energie, Rückstoß und Mündungsdeckkraft. Die Simulation
verändert verschachtelte Boss-Zustände direkt; ein Vergleich nur der Boss- oder
Core-Objektidentität wäre deshalb ungeeignet. Der Cache hält einen Baum je
montierter Komponente, kein Archiv früherer Frames oder Bossmodelle.

| Kontrollierter Test | Bisher | Korrektur |
|---|---:|---:|
| Neu erzeugte JSX-Elemente in 1.200 unveränderten Frames nach Erstaufbau | 85.200 | 0 |
| Exakte Vergleiche der ausgegebenen Elemente und Attribute | 4.201 | 4.201 identisch |
| Geprüfte Bosse | 50 | 50 |
| Geprüfte Feldbreiten | 320 / 430 / 820 px | gleich |

Der Test verwendet React und React Test Renderer 19.3.1 wie die vorhandene
Installation. Er prüft auch in-place veränderte Core-Daten, Öffnung, Laden,
Rückstoß, Mündungsblitz, Farbwechsel, Größen- und Bildänderung, Tod sowie erneutes
Schließen. Das SVG-Hostelement bleibt während unveränderter Updates erhalten.
Gezählt werden JSX-Erzeugungen im Reaktor, keine GPU-Operationen. Daraus folgt
keine gemessene Senkung von iPhone-Temperatur oder Prozessspeicher.

Zusätzlich bestehen 33 gezielte Schuss-, Boss-, Diagnose- und Animationstests,
12 Sprachtests und der Produktionsbuild. Die Hook-Prüfung besteht ohne Warnung;
die separate Vorschau-Prüfseite besteht den TypeScript-Check. Bekannte große
Build-Chunks bleiben bestehen. Ein sauberer Produktionsbau enthält keine der
beiden Vorschau-Prüfseiten; nach einem lokalen Vorschau-Bau wurden zuvor erzeugte
Prüfdateien vor dieser Kontrolle aus dem generierten Ausgabeordner entfernt.

Eine zusätzliche Seite wird nur in geschützten Vorschauen gebündelt. Sie stellt
die unveränderte Reaktorquelle aus `61d0a53` und die Korrektur im tatsächlichen
Browser nebeneinander dar. Der Browservergleich und seine Ergebnisse werden nach
der Bereitstellung separat festgehalten.

Reproduktion:

```sh
CRYPTOID_REQUIRE_REACTOR_FIX=1 node scripts/verifyBossReactorWork.cjs
```

Für diesen isolierten Test benötigt `CRYPTOID_SCENE_QA` ein Verzeichnis mit
`react@19.3.1` und `react-test-renderer@19.3.1`; Standard ist
`/tmp/cryptoid-reactor-qa`. Es werden keine Produktionsabhängigkeiten hinzugefügt.

Die offizielle React-Dokumentation beschreibt das Wiederverwenden unveränderter
JSX-Knoten: https://react.dev/reference/react/useMemo#memoizing-individual-jsx-nodes

Die [Whitescreen-Untersuchung](iphone-webkit-research-20261020.md) und die
[Zeitkorrektur für Schüsse](simulation-time-20261020.md) bleiben relevant.
Diese Änderung beseitigt nachgewiesene unnötige JavaScript-Arbeit. Ein konkreter
WebKit-/GPU-Abbruch auf dem betroffenen iPhone ist weiterhin nicht reproduziert
und dadurch nicht als behoben nachgewiesen.
