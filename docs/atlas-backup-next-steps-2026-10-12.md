# Atlas: überprüfter Bestand und noch fehlender Backupnachweis

## Ergebnis vom 12. Oktober 2026

Der neu verbundene Atlas-Zugriff bestätigt ein Projekt und einen Cluster: Projekt `6ab5bca802812f284aa97625`, `cryptoid-testnet`, FREE/M0, AWS EU_CENTRAL_1, MongoDB 8.0.34. Die einzige Anwendungsdatenbank ist `demo-app`. Sie enthält users, orders, feedback_posts, feedback_votes, admin_access, usage_hourly und user_sessions: sieben Collections, keine Views, 20 Indizes. Die Momentaufnahme der Datenbankstatistik meldet 9.102 Dokumente, 77.301.671 Byte unkomprimierte Daten, 21.286.912 Byte belegte Collection-Speicherung und 1.384.448 Byte Indizes. Zahlen können sich im Betrieb ändern. Die frühere Angabe von etwa 22 MB bezeichnet Speicher, nicht die unkomprimierte Dumpgröße.

Alle sieben Indexabfragen waren nach zwei erfolgreichen Wiederholungen vollständig. Die Erweiterung liefert Indexnamen und Schlüssel, aber keinen vollständigen Nachweis aller Indexoptionen wie unique, sparse, partialFilterExpression oder TTL. Die tatsächlichen Dump-Metadaten müssen diese Optionen abdecken. Die Indizes enthalten getrennte Testnet-/Mainnet-Scorefelder und Zahlungs-Netzwerkfelder; beide Netzwerke müssen erhalten bleiben.

Das passt zum dokumentierten Backend und dessen Standarddatenbank `demo-app`. Es ist noch kein unabhängiger Abgleich mit Host und Datenbank der tatsächlich verwendeten, geheimen Live-Verbindung. Ein Name wie `cryptoid-testnet` beweist keine ausschließliche Testnet-Nutzung. Die öffentliche Testnet-API nutzt wesentliche Dienste des Mainnet-Backends.

**Kein Datenbankbackup wurde erstellt, kein Restore ausgeführt und keine Veröffentlichung vorgenommen.** Alle Atlas-Operationen waren lesend. Keine Kundendokumente oder Zugangsdaten wurden gelesen, kein Tarif, Datenbankbenutzer oder Netzwerkzugriff geändert. Sanitisiertes Inventar: `atlas-backup-verification-2026-10-12.json`.

## Technische Grenze des verbundenen Zugangs

Die verfügbaren Atlas-Werkzeuge können Metadaten und Datenabfragen ausführen, aber keinen vollständigen BSON-Dump in einen geschützten Speicher exportieren und keinen nativen Backupjob auslösen. Abfragen einzelner Dokumente über Chat-Werkzeuge sind kein geeigneter Ersatz für ein vollständiges, konsistentes und vertrauliches Backup.

Atlas bietet für M0 keine regulären Atlas-Backups. MongoDB empfiehlt mongodump/mongorestore. M0 unterstützt weder mongodump --oplog noch mongorestore --oplogReplay. Ein Dump bei weiterlaufenden Schreibzugriffen ist deshalb kein bestätigtes konsistentes Backup. Für den kostenfreien Weg ist ein kontrolliertes Zeitfenster ohne sämtliche Schreibzugriffe erforderlich, einschließlich laufender Requests, Zahlungsrückmeldungen, Sitzungs-/Usage-Schreibvorgänge und serverseitiger TTL-Löschungen. Stabile Zähler allein beweisen keine Konsistenz. Eine Live-Sperre oder Änderung von TTL-Indizes wurde nicht vorgenommen.

## Konkreter kostenfreier Ablauf auf einem privaten Verwaltungsrechner

1. Den tatsächlich verwendeten Backend-Host und Datenbanknamen privat in der Betreiberkonfiguration mit Atlas abgleichen. Keine URI, Passwörter oder Kundendaten in Chat/Git kopieren.
2. Einen privaten Verwaltungsrechner mit kompatiblen aktuellen MongoDB Database Tools, MongoDB Server 8.0, mongosh und GnuPG bereitstellen. Einen geprüften Empfänger-Schlüssel und eine dauerhaft kontrollierte verschlüsselte Ablage festlegen. Wiederherstellungsschlüssel getrennt aufbewahren. In dieser Agent-Umgebung fehlen mongodump, mongorestore, mongod und mongosh; die Plugin-Verbindung stellt keine CLI-Zugangsdaten bereit.
3. Ein ausdrücklich vereinbartes Wartungsfenster und eine überprüfbare Unterbindung aller Schreibquellen planen. Die bisherige Autorisierung für Analyse/Backup beinhaltet keine unangekündigte Unterbrechung des öffentlichen Spiels. TTL und anstehende Zahlungsrückmeldungen gesondert berücksichtigen. Ohne belegbare Schreibruhe oder ein anderes vom Anbieter unterstütztes konsistentes Verfahren den Dump als unbestätigt kennzeichnen und nicht zur Releasefreigabe verwenden.
4. Während der bestätigten Schreibruhe alle tatsächlich vorhandenen Anwendungs-Collections samt vollständigen Metadaten erfassen. Keine Auswahl nur bekannter Collections. Dump über einen geschützten Prozess direkt in Verschlüsselung leiten; Fehler beider Prozesse prüfen. Keine Passwörter in CLI-Argumenten, Shell-History oder Logs. Ein privates Tools-Konfigurationsfile beziehungsweise eine interaktive Passwortabfrage verwenden. Nur ein geprüfter erfolgreicher Exit beider Prozesse, abgeschlossenes verschlüsseltes Archiv, Prüfsumme, Zeitfenster und Wiederherstellungszugriff bilden einen abgeschlossenen Backupnachweis.
5. Das Archiv in eine neue lokale MongoDB 8.0-Instanz auf ausschließlich 127.0.0.1 wiederherstellen. Eigenes leeres Datenverzeichnis, eigener Port, keine Verbindung zum Spielbackend und keine Anwendung starten. TTL-Monitor im isolierten Ziel deaktivieren, damit Session-/Usage-Dokumente vor dem Vergleich nicht automatisch verschwinden. Kein --drop und niemals die Live-URI als Restoreziel verwenden.
6. Alle Collectionnamen, Dokumentzahlen, vollständigen Indexdefinitionen und BSON-Inhalte gegen den während der Schreibruhe erhobenen Quellbestand vergleichen. Dazu dokumentreihenfolgeunabhängige, intern gehaltene Inhaltsprüfsummen verwenden; keine Dokumente exportieren oder veröffentlichen. Netzwerkzuordnung, Save-Sequenzen, Zahlungs- und Belohnungsidentitäten unverändert nachweisen. Datenbankstatistik oder erfolgreiche Restore-Ausgabe allein reicht nicht.
7. Einen sanitisierten Nachweis mit Backup-ID/Dateiprüfsumme, Abschlusszeit, vollständiger Abdeckung, Aufbewahrung, kontrolliertem Speicher, Restore-Ziel und Vergleichsergebnis dokumentieren. Private Archive, Logs und Schlüssel bleiben außerhalb des Repositorys. Erst dann kann eine gesonderte ausdrückliche Testnet-Veröffentlichung und der 30–60-Minuten-Gerätetest folgen.

Dieser Ablauf ist vorbereitet, nicht ausgeführt. Ein verwalteter bezahlter Tarif könnte andere Backupverfahren ermöglichen, wurde aber weder bestellt noch als zwingend vorausgesetzt. Eine bezahlte Umstellung erfordert ausdrückliche Zustimmung.

## Quellen

- https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/ — M0-Backup- und oplog-Beschränkungen.
- https://www.mongodb.com/docs/manual/tutorial/backup-and-restore-tools/ — konsistenter Dump durch oplog oder vollständiges Stoppen der Schreibzugriffe.
- https://www.mongodb.com/docs/database-tools/mongodump/ — BSON-Export und geschützte Konfiguration.

Der bestehende Auditstand bleibt Draft-PR 160. Der ursprüngliche iPhone-/Pi-Browser-Abbruch ist weiterhin nicht reproduziert und seine Behebung nicht nachgewiesen. Die bestätigten Codekorrekturen und bestandenen Tests sind keine Behauptung garantierter mobiler Stabilität.
