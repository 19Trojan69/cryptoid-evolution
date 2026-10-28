# Bossbelohnung und ruhigere Formationsanzeige

Entwurf auf veröffentlichter Basis5ca9cf7f210ec6f623649b4d5cf5f9c0b2417769, Baum1af1d9b46978e623214814df56396a101525f8bc. Keine Veröffentlichung.

## Verhalten

Ein eingesammeltes Bossherz bringt bei bereits vollen Herzen50 statt5 Shards. Bei fehlendem Herz heilt es wie bisher genau ein Herz bis zur Rüstungsgrenze und bringt keine Ersatz-Shards. Die Belohnung wird wie bisher nur einmal vergeben. Bereits eingesammelte alte5-Shard-Belohnungen werden nicht nachträglich erhöht; keine Migration oder Kontenänderung. Shop und Anleitung nennen50 Shards in allen19 auswählbaren Sprachen.

Die zusätzliche kleine Formationszeile blendet folgende ursprünglichen Meldungsschlüssel aus: Clear the formation, Finish this wave without a hit, Hold your combo, Perfect formation und FORMATION CLEARED. Damit verschwindet auch die deutsche Anzeige „Formation ohne Schaden“. Der Filter arbeitet vor der Übersetzung und gilt auch für alte, aus einem Kampfsnapshot wiederhergestellte Meldungen. Es wird kein Spielstand umgeschrieben.

Block-/Gruppenangaben, der zentrale Blockabschluss sowie Warnungen vor schweren Angreifern und Power-up-Hinweise bleiben erhalten. Erhaltene Hinweise verwenden denselben Statusknoten, dieselbe Position, Übersetzung und bestehende Ablaufzeit. Kein neuer Timer, Hook, Observer, RAF oder Animation. Alle Formationsabläufe, Punkte, Formationsbelohnungen, Schadensregeln, Rüstung, Kaufpreise, normalen Boss-/Bonusrunden-Belohnungen, Audio und Grafik bleiben unverändert. Einziger Spielregelwert ist weiterhin BOSS_FULL_HEART_SHARDS5 zu50; die zweite Änderung betrifft nur die Anzeige.

## Prüfung

- Vollständiger Frontend-Build:473 Tests, Lokalisierungsinventar, TypeScript und Vite bestanden.
- Backend:142 Tests und TypeScript bestanden; seit diesem geprüften Stand wurden keine Backend-Dateien geändert.
- Die7 Boss-Pickup-Fälle gehören zum regulären Build: Abstand vor Einsammeln, Heilung bei fehlendem Herz, Limits3/4/5/6,50 Bosse, Wiederholung, serialisiertes Resume, alte eingesammelte5-Shard-Zustände und Beschreibung in19 Sprachen.
- Die3 neuen Anzeigeprüfungen rendern die tatsächliche JSX-Zeile des Controllers mit React. Der exakt wiederhergestellte veröffentlichte Stand zeigt die redundanten Meldungen, der neue Stand blendet alle fünf in19 Sprachen aus. Aus gespeicherten Zuständen gelesene Meldungen werden ohne Mutation ausgeblendet. Schwere-Angreifer-Warnung und alle vier Power-up-Namen bleiben in19 Sprachen als identisches Markup einschließlich Statusrolle und Position erhalten; Ablauf und vorhandene Testnet-Bedingung bleiben wirksam.
- Zwei feste Controllerhunks (Import und Anzeigezeile) stellen die vollständige veröffentlichte GamePage-Quelldatei wieder her. Negative Kontrollen erkennen das pauschale Ausblenden aller Warnungen sowie eine zusätzliche Schadensregeländerung. Alle alten Bereichsprüfungen bleiben streng.
- Der Backend-Handler-Test prüft die50-Shard-Gutschrift über fünf Bosse und drei Rüstungskonfigurationen, doppelte Ereignisse, Resume, Checkpoint und Lebensobergrenzen mit kontrollierter Datenbank.
- Lint: Shop/Anleitung unverändert null/null, Übersetzungsdatei und neuer Anzeigehelfer null/null. GamePage vor/nachher null Fehler/vier bestehende Warnungen und keine zusätzlichen Meldungsgruppen. Die Backend-Datei ist außerhalb der Frontend-Lintkonfiguration; dort wird keine Lintabdeckung behauptet.
- combatVariety, die Backend-Reward-/Progress-Handler und das Hull-Manifest sind bytegleich zur veröffentlichten Basis. git diff --check besteht.

Die Prüfungen verwenden lokale Module, React-Serverrendering und kontrollierte Handler-Fixtures. Kein physischer Geräte-, vollständiger Pi-Login-/Kauf- oder Kampagnentest; kein White-Screen-Fixnachweis. Die separate iPhone-Screenshot-Untersuchung bleibt offen. Derselbe Entwurf PR198 enthält beide gewünschten Änderungen; automatische Builds dieses Zweigs sind deaktiviert. Diagnoseentwürfe194/195 bleiben getrennt.
