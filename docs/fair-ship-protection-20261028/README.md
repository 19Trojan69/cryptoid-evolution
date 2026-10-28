# Faire Advanced- und Elite-Stufen

Vorbereiteter Änderungsentwurf auf dem veröffentlichten Stand
`e9ca7d2f2c3afc00d42508424a3ce12fb7c9b207` (Bossanzeige, PR196).

Die bisherige unsichtbare Trefferreserve entfällt. Sie galt zuletzt bereits pro
gesamter Mission, nicht pro Leben. Ohne aktiven Schild kostet ein gegnerischer
Geschosstreffer künftig bei jeder Schiffsstufe ein Herz. Bei gleicher Rüstung
haben alle Stufen dieselben maximalen Herzen. Gekaufte Rüstung und tatsächlich
eingesammelte bzw. aktivierte gekaufte Schilde behalten ihre bisherigen Regeln.

| Stufe | Grundfeuerkraft desselben Rumpfs | Sammelradius normaler Power-ups | Versteckte Trefferreserve |
| --- | --- | --- | --- |
| Standard | 100 %, Einzelfeuer | 34 Pixel | 0 |
| Advanced | 115 %, dauerhaftes Doppelfeuer | 37,4 Pixel, +10 % | 0 |
| Elite | 130 %, dauerhaftes Doppelfeuer | 40,8 Pixel, +20 % | 0 |

Der Sammelbonus vergrößert nur den vorhandenen Kontaktbereich für normale
Power-up-Drops. Er zieht nichts an und erzeugt keine zusätzlichen Drops.
Bossherzen, die Shards-Alternative bei vollen Herzen und Bonusziele verwenden
weiter ihre unveränderten eigenen Abläufe. Schussgeometrie, Feuerrate,
Rumpfboni, zeitlich begrenzte Waffen, Auto und Nachladen bleiben unverändert.

Shop/API, Schiffskonfiguration, Spielanleitung, Sammlung und Lore erklären
dieselben Vorteile in allen 19 auswählbaren Sprachen. Die alte Trefferanzeige
und der falsche Schildimpuls einer Rumpfblockierung werden entfernt. Tatsächliche
Schilde behalten ihre vorhandene Anzeige und Wirkung.

Das optionale alte Snapshot-Feld `projectileGuard` bleibt lesbar. Ein neuer
Spielstand, das Laden eines alten Spielstands und ein Geschosstreffer liefern
dafür null; ältere gespeicherte Werte können keinen Treffer mehr abfangen.
Besitz, Farbauswahl, Voraussetzungen, Netztrennung und Zahlungsabläufe werden
nicht verändert. Im bestehenden Katalog kosten Advanced weiterhin 9,90 Pi und
Elite zusätzlich 19,90 Pi pro Rumpf; Elite setzt Advanced voraus. Die
Katalogdatei ist abgesehen von 40 Beschreibungen bytegleich zur Ausgangsversion.

## Prüfung

- Vollständiger Frontend-Build: **463 Tests bestanden**, Übersetzungsprüfung,
  TypeScript und Vite erfolgreich.
- Backend: **142 Tests bestanden**, einschließlich TypeScript-Build.
- Die tatsächlichen Geschoss- und Sammelabschnitte aus `GamePage.tsx` werden mit
  realen Kollisions-, Schadens- und Power-up-Funktionen ausgeführt. Getestet sind
  drei ungeschützte Treffer bei allen Stufen, alte Schutzwerte, echte aktive und
  inaktive Schilde, gekaufte Schilde, der unveränderte Treffer-Cooldown, kreisförmige
  Sammelgrenzen sowie einmalige Aktivierung und Abgrenzung der Stufen.
- Die echte Schiffskonfiguration wird für drei Stufen in 19 Sprachen gerendert.
- Fünf exakt begrenzte Controller-Änderungen stellen die vollständige
  veröffentlichte Quelldatei wieder her, bevor ältere Scope-Prüfungen laufen.
  Negative Kontrollen erkennen einen erzwungenen Elite-Radius und einen
  veränderten Watchdog.
- Geänderte kleinere Laufzeitmodule und Hilfsskripte bestehen Lint. Der aktuelle
  Controller behält dieselben vier Warnungen wie der gepinnte Ausgangsstand;
  Sammlung und Lore bleiben ohne Befunde. Kein vollständiges Projekt-Lint-
  Erfolgsversprechen.
- Die generierte Rumpfmanifest-Revision folgt der geänderten Quelldatei.
  Alle 1740 hinterlegten PNG-Bytegrößen bleiben gleich; Originalgrafiken,
  Malalgorithmen und Geometrie werden nicht bearbeitet.

Die Controller-Tests isolieren vorhandene Codeabschnitte; Audio, Messpunkte und
die unveränderte Waffenauswahl-Nebenwirkung werden dort ersetzt. Die UI-Prüfung
ersetzt Bilder und Zahlungsdarstellung. Das sind keine physischen Smartphone-
Tests, keine vollständige Kampagne und kein Nachweis einer White-Screen-Behebung.
Es wurden keine realen Käufe, Spielstände oder Konten verändert.

Der Arbeitsbranch `codex/fair-ship-protection-20261028` hat automatisches
Deployment deaktiviert. Dieser Entwurf enthält keine Veröffentlichung; die
separaten Diagnose- und Browserprüfungsentwürfe PR194/195 bleiben getrennt.
