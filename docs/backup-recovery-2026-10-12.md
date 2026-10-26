# Sicherung und Wiederherstellung – verbindliche Freigabevoraussetzung

Marc verlangt am 12. Oktober 2026 ein verfügbares Backup für den Notfall. Die Sicherungspflicht gilt vor jeder öffentlichen Veröffentlichung. Ein Backup gilt erst nach erfolgreichem Abschluss und überprüfbarem Wiederherstellungsweg als vorhanden.

## Jetzt tatsächlich gesichert

- Testnet-Code: eigener Ref `backup/testnet-20261012-1c1c7f9`, Commit `1c1c7f9b6c5e8ac7d41b9bf1c4b44036cc196220`, einschließlich aller im Git-Tree gespeicherten Originalassets.
- Mainnet-Code: eigener Ref `backup/mainnet-20261012-907d2a7`, Commit `907d2a7363345d00f0f90c54402bf04e887b64d9`.
- Aktuelle und vorherige getestete Testnet-Deployments bleiben in Vercel verfügbar. Vor einem tatsächlichen Rollback ihre Existenz erneut prüfen. Keine dauerhafte Aufbewahrung beim Hostinganbieter behaupten.
- Die Sicherungsrefs wurden neu angelegt; öffentliche Deployments und der produktive main-Branch wurden dabei nicht verändert. Sie dürfen bei Branch-Aufräumarbeiten nicht gelöscht oder weitergeschoben werden.

Git-Refs liegen beim gleichen GitHub-Anbieter wie das Repository. Sie schützen vor versehentlichem Verlust des bekannten Code-Stands, sind aber noch keine unabhängige Offsite-Kopie bei vollständigem Kontoverlust. Eine solche Kopie muss zusätzlich in einem vom Eigentümer kontrollierten sicheren Ziel aufbewahrt werden. Keine Kundendaten in Git.

## Datenbank: noch NICHT bestätigt

Das Backend verwendet MongoDB. Im Mainnet-Projekt sind sensible MONGODB_URI-Einträge vorhanden. Die öffentliche Testnet-API leitet wesentliche Konto-/Speicher-/Zahlungsabfragen an den bestehenden Backend-Service weiter; ein Backup einer beliebigen Preview-Datenbank würde die echten Spielerdaten daher nicht zuverlässig abdecken.

Es wurde nur die Konfigurations-Metadatenliste geprüft, ohne Entschlüsselung oder Ausgabe der Verbindungsdaten. Der verbundene Vercel-Zugriff bietet keinen bestätigten MongoDB-Backup-Status; keine entsprechende Datenbankintegration wird dort angezeigt. Daraus folgt NICHT, dass beim Datenbankanbieter keine Backups existieren. Frühere Einrichtungsunterlagen nennen MongoDB Atlas, Projekt 6ab5bca802812f284aa97625, Cluster cryptoid-testnet. Am 2. Oktober wurde dort Free-Tarif und Backups Inactive berichtet. Das ist ein historischer Hinweis, kein aktueller Live-Nachweis und noch keine sichere Zuordnung zur heutigen produktiven URI. Aktueller Cluster-Tarif, Sicherungsplan, letzte erfolgreiche Sicherung und letzte Wiederherstellungsprüfung sind weiterhin nicht verifiziert.

Vorhandener Verwaltungslink: https://cloud.mongodb.com/v2/6ab5bca802812f284aa97625#/overview

Keine Sicherung echter Spielerdaten wurde in diesem Arbeitsschritt erstellt oder als erfolgreich behauptet. Keine Kosten, Schlüsseländerung, Datenmigration oder Wiederherstellung ausgelöst. Für den nächsten Schritt ist Zugriff auf die tatsächliche MongoDB-Verwaltung nötig, nicht die Weitergabe einer URI oder eines Passworts im Chat.

## Vor jeder öffentlichen Freigabe

1. Live-Projekt, Netzwerk, aktuellen Commit und Deployment bestätigen; aktuellen Source-Stand in einem datierten Sicherungsref festhalten und Rückkehr-Deployment prüfen.
2. Beim tatsächlichen Datenbankanbieter eine erfolgreiche frische Sicherung bestätigen. Sie muss unmittelbar vor einer Veröffentlichung bzw. jeder Daten-/Schemaänderung vorhanden sein; regelmäßige automatische Sicherungen zusätzlich mindestens täglich vorsehen. Aufbewahrung und Kosten vor Aktivierung mit dem vorhandenen Tarif/Ziel abgleichen.
3. Das gesamte relevante Backend sichern: users, orders, Spielstände/Inventare/Belohnungen/Highscores, Community-Daten, Admin-/Sessiondaten und alle weiteren tatsächlich vorhandenen Collections samt Indizes und Netzwerkfeldern. Keine unbekannten Collections stillschweigend auslassen. Separate produktive Datenbanken einzeln abdecken.
4. Sichere Ablage, Wiederherstellungszugriff und aktuelle isolierte Restore-Prüfung nachweisen. Bei fehlenden oder veralteten Nachweisen keine öffentliche Freigabe; Code und Tests dürfen weiter vorbereitet werden.
5. Nach Release neuen Commit/Deployment dokumentieren. Fehlgeschlagene oder überfällige Backups müssen in der Betriebsüberwachung sichtbar sein; eine aktive Überwachung ist hier noch nicht eingerichtet.

## Sicherer Wiederherstellungsweg

Code-Rollback und Datenwiederherstellung getrennt entscheiden. Bei einem reinen Darstellungs-/Programmfehler zunächst den geprüften Code-Stand über das korrekte Vercel-Projekt zurückholen, solange er mit dem aktuellen Datenformat kompatibel ist. Die aktuelle Datenbank wird dabei nicht zurückgesetzt.

Eine Datenbank-Rücksetzung kann seit der Sicherung abgeschlossene Käufe und Fortschritt verlieren. Deshalb zuerst in ein isoliertes Ziel wiederherstellen: Dokumentzahlen, Indizes, Profil-/Inventardaten, Netzwerkzuordnung, Save-Sequenzen und eindeutige Zahlungs-/Belohnungs-IDs vergleichen. Reale Pi-Transaktionen, Benachrichtigungen und Reward-Replays deaktivieren. Zwischenzeitliche Käufe anhand der bestehenden Zahlungsnachweise abgleichen. Erst danach mit ausdrücklicher Freigabe einen kontrollierten Live-Wechsel planen. Niemals Mainnet-/Testnet-Datensätze vermischen oder Belohnungen durch Restore erneut vergeben.

## Anbieterabhängigkeit

MongoDB dokumentiert unterschiedliche Backup-Verfahren je Hosting/Tarif. Atlas-Backups sind für Free/M0-Cluster nicht verfügbar; dort wären z. B. korrekt geplante mongodump/mongorestore-Sicherungen in sicherem externem Speicher nötig. Bei unterstützten Tarifen sind verwaltete Snapshots und isolierte Restore-Tests vorzuziehen. Der tatsächliche Tarif dieses Spiels wurde nicht ermittelt; keine Tarifänderung ist autorisiert.

Primärquelle: https://www.mongodb.com/docs/atlas/backup-restore-cluster/

Die operationalen Regeln stehen in AGENTS.md. Maschinenlesbarer, bewusst noch unvollständiger Status: backup-inventory-2026-10-12.json.
