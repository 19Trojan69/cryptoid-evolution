# Levelerweiterung: ergänzende Prüfung am 4. Oktober 2026

## Ergebnis und Grenzen

Der Vercel-Vorschaubuild für den ersten Ausbauschritt war erfolgreich. Der Abruf der geschützten Testnet-Vorschau über die Vercel-Verbindung scheiterte mit 403 beim Erstellen eines temporären Zugangslinks. Deshalb sind die laufende Cloud-Anwendung, echte Pi-Anmeldung und die Datenbankanbindung nicht als geprüft zu bewerten. Die Produktion wird nicht umgestellt.

Beim Vergleich wurde ein Fehler in der Übernahme alter Missionen gefunden und korrigiert: Regelversion 1 behält jetzt den ursprünglichen Einflugweg und die volle Einleitung vor der zweiten Gruppe. Die kurze Verstärkungswarnung und wechselnden Einflugwege gelten nur für neue Missionen mit Regelversion 2.

## Gegnerzahl gegen die wirkliche bisherige Version

Die bisherige Version enthielt in späteren Abschnitten bereits Verstärkungen. Darum sind die neuen Zusatzgruppen nicht gleichbedeutend mit derselben prozentualen Verlängerung gegenüber dem alten Spiel.

| Interne Schritte vor dem Boss | Gegner bisher | Gegner erweitert | Änderung | Grund-Shards bisher / erweitert |
| --- | ---: | ---: | ---: | ---: |
| 1–9 | 54 | 60 | +11,1 % | 206 / 229 |
| 31–39 | 54 | 78 | +44,4 % | 207 / 299 |
| 91–99 | 66 | 84 | +27,3 % | 255 / 336 |
| 241–249 | 69 | 96 | +39,1 % | 318 / 437 |
| 491–499 | 72 | 108 | +50,0 % | 408 / 630 |

Exakte Summen der geplanten Gegner und ihrer Grundbelohnungen, ohne Kombos, Block-/Kettenboni, Boss und Bonusrunde. Keine gemessene Spielzeit und kein Shard-Ertrag pro Minute. Das Konzeptziel von 75–100 % längerer Kampfzeit in späten Bereichen ist damit weiterhin unbestätigt.

## Automatisierter Kampfvergleich

`frontend/scripts/measureLevelExpansion.cjs` vergleicht die Spielschleife des vorherigen Produktionsstands a8d2faf mit dem erweiterten Stand. Je Version wurden die Schritte 1, 9, 37, 99, 249 und 499 geprüft. Gleicher einfacher Tastatur-Testpilot, Standard-Schiff, drei Leben, Startwaffe L1, Smartphone-Format 390 × 844 und gesetzter Zufalls-Startwert. Bewegung, Treffer, Schaden und Power-up-Aufnahme erfolgen durch die echte Spielschleife. Gegner werden nicht künstlich entfernt und der Spieler ist nicht unverwundbar.

Virtuelle Zeit beschleunigt die Läufe; laufende React-Szenen-Neuzeichnungen werden unterdrückt. Deshalb liefert dieser Test keine Framerate oder Aussage über reale Geräteperformance. Zufall wird global verwendet; unterschiedliche Abläufe können danach unterschiedliche Zufallsfolgen für Drops verbrauchen.

| Schritt | Bisher: Sekunden bis Ende | Erweitert: Sekunden bis Ende | Abschluss bisher / erweitert |
| --- | ---: | ---: | --- |
| 1 | 28.1 | 28.1 | Block beendet / Block beendet |
| 9 | 26.0 | 26.0 | Spieler besiegt / Spieler besiegt |
| 37 | 28.9 | 28.9 | Spieler besiegt / Spieler besiegt |
| 99 | 58.9 | 67.1 | Spieler besiegt / Spieler besiegt |
| 249 | 51.9 | 58.6 | Spieler besiegt / Spieler besiegt |
| 499 | 40.2 | 32.0 | Spieler besiegt / Spieler besiegt |

Alle zwölf Läufe waren ohne JavaScript-Ausnahme; höchstens sechs normale Gegner waren sichtbar. Der Testpilot beendete nur Schritt 1. Die übrigen Messzeiten enden beim Tod und dürfen **nicht als Leveldauer oder als bestandenes Balancekriterium** gewertet werden. Insbesondere ist ein früherer Tod kein Beleg für ein kürzeres Level. Die L1-Ausrüstung in späten Abschnitten ist ein konservativer Belastungsfall, kein Nachweis für realistisch erspielte Ausrüstung.

Rohdaten einschließlich aktiver Kampfzeit, Leben, Shards und Drops: `doc/level-expansion-bot-results.json`. Die verlorenen Leben werden einschließlich des letzten tödlichen Treffers gezählt.

## Regression nach der Korrektur

Frontend-Produktionsbuild erfolgreich. Browserfall Schritt 99 mit Regelversion 1: zwei Gruppen, ursprünglicher Einflugweg, volle Einleitung, Pause/Neuladen und einmaliger Blockabschluss bestanden. Browserfall Schritt 499 mit Regelversion 2: drei Gruppen, kurze Warnung, Pause/Neuladen und einmaliger Blockabschluss bestanden. Keine JavaScript-Ausnahmen oder fehlgeschlagenen Test-API-Anfragen. Die mobile Pausenansicht wurde zusätzlich visuell kontrolliert.

## Noch nötig vor Produktionsfreigabe

Vergleichsläufe erfolgreicher menschlicher Spieler mit gleicher, realistisch verfügbarer Ausrüstung über ganze Neun-Block-Zyklen. Messen: aktive Kampfzeit, Zeit bis zum Boss, Leben, gesamte Shards pro Minute und Drops. Dazu iPhone/Android im echten Pi Browser, Touch-Steuerung, Pause/Hintergrundwechsel und Fortsetzen über zwei Geräte mit dem Testkonto. Die Levelzählung bleibt eine offene Produktentscheidung; die aktuelle Umsetzung hat weiterhin 50 sichtbare Zyklen mit neun Blöcken und einem Boss.
