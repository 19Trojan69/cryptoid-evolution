# Bossherz bei vollen Herzen: 50 Shards

Entwurf auf veröffentlichter Basis5ca9cf7f210ec6f623649b4d5cf5f9c0b2417769, Baum1af1d9b46978e623214814df56396a101525f8bc.

Die einzige Änderung an einer Laufzeitregel ist BOSS_FULL_HEART_SHARDS von5 auf50. Ein eingesammeltes Bossherz bringt bei bereits vollen Herzen nun50 Shards. Bei fehlendem Herz heilt es wie bisher genau ein Herz bis zur Rüstungsgrenze und bringt keine Ersatz-Shards. Die eingesammelte Belohnung wird wie bisher nur einmal vergeben.

Shop und Anleitung nennen50 Shards. Die neue Beschreibung ist in allen19 auswählbaren Sprachen vorhanden. Die bestehende Erfolgsanzeige verwendet bereits den tatsächlichen Shardbetrag und benötigt keine Controlleränderung. Der Boss-Pickup, die normale Bossbelohnung, Bonusrunden, Punkte, Formationstexte/-aufgaben/-belohnungen, Schadensregeln, Rüstung, Preise und gekaufte Schiffs-Upgrades bleiben unverändert. Bereits eingesammelte alte5-Shard-Belohnungen werden nicht nachträglich erhöht; keine Migration oder Kontenänderung.

## Prüfung

- Vollständiger Frontend-Build:470 Tests, Lokalisierungsinventar, TypeScript und Vite bestanden.
- Backend:142 Tests und TypeScript bestanden.
- Die bestehende Boss-Pickup-Suite ist nun Teil des regulären Builds. Sie prüft den Abstand vor dem Einsammeln, Heilung bei fehlendem Herz, die Limits3/4/5/6,50 Bosse, Wiederholung, serialisiertes Resume und alte bereits eingesammelte5-Shard-Zustände. Eine zusätzliche Prüfung bestätigt die Beschreibung in19 Sprachen.
- Der Backend-Handler-Test prüft die50-Shard-Gutschrift über fünf aufeinanderfolgende Bosse und drei Rüstungskonfigurationen, doppelte Ereignisse, Resume, Checkpoint und Lebensobergrenzen mit der bestehenden kontrollierten Datenbank. Keine tatsächlichen Konten, Käufe oder API-Sitzungen.
- Shop und Anleitung haben unter den aktuellen Werkzeugen vor/nachher jeweils null Lintfehler und null Warnungen. Die geänderte Übersetzungsdatei ist ebenfalls lint-sauber. Die Backend-Datei wird von der Frontend-Lintkonfiguration nicht erfasst; dort wird keine Lintabdeckung behauptet.
- Die vollständige Controllerdatei GamePage, combatVariety, die Backend-Reward-/Progress-Handler und das Hull-Manifest sind bytegleich zur veröffentlichten Basis. Die gemeinsame Lebensregel ist nach Rücknahme genau der Konstanten ebenfalls bytegleich. git diff --check besteht.

Die Prüfungen verwenden lokale Module und kontrollierte Handler-Fixtures. Kein physischer Geräte-, vollständiger Pi-Login-/Kauf- oder Kampagnentest; kein White-Screen-Fixnachweis. Die separate iPhone-Screenshot-Untersuchung bleibt offen. Noch nicht veröffentlicht; automatische Builds dieses Entwurfszweigs sind deaktiviert. Diagnoseentwürfe194/195 bleiben getrennt.
