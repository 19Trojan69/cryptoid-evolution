# Pi-Zahlungen dokumentieren (Österreich)

Die App speichert beim Freigeben und beim bestätigten Abschließen eines Kaufs die Daten der **serverseitig abgefragten Pi Platform API** im MongoDB-Datensatz `orders`: Pi-Zahlungs-ID, Pi-Netzwerk, Betrag, Produkt-ID und Produktname, Zahlungsbeschreibung, Zeitpunkte, Wallet-Adressen und Blockchain-TXID. Der Spiel-Adminmodus erzeugt keine Käufe. Shards sind eine interne Spielwährung und erscheinen nicht als Pi-Zahlungen.

## Export

Als verifizierter Eigentümer im Spiel mit Pi anmelden → **Shop / Hangar → Progress → Pi-Zahlungen · Aufzeichnungen**. Die drei CSV-Dateien trennen **Echte Pi** (`Pi Network`), **Test-Pi** (`Pi Testnet`) und **Ungeklärt**. Der Export umfasst offene, stornierte und bestätigte Vorgänge, jeweils mit Status. Für eine Einnahmenaufstellung bestätigte Mainnet-Zeilen auswählen und offene oder stornierte Vorgänge getrennt behandeln. CSV ist UTF-8 mit Semikolon als Trennzeichen und kann in einer Tabellenkalkulation geöffnet werden.

Die Angaben zum Netzwerk stammen ausschließlich vom Pi-Server. Historische Bestellungen vor Einführung dieses Protokolls haben unter Umständen weder Netzwerk noch ursprünglichen Pi-Betrag. Sie bleiben **Ungeklärt**; sie werden nicht anhand des Hostnamens oder des aktuellen Produktpreises zu Mainnet-Zahlungen umetikettiert. Die ursprünglichen Pi-Zahlungen bzw. Wallet-Transaktionen müssen für diese Datensätze einzeln abgeglichen werden.

## Für Buchhaltung und Steuerberatung ergänzen

- Den **EUR-Gegenwert zum maßgeblichen Zeitpunkt**, die verwendete **Kursquelle und Uhrzeit** sowie die **Beleg- oder Rechnungsnummer** in einer Arbeitskopie des CSV ergänzen. Die App setzt keinen erfundenen Eurokurs ein.
- Pi-Zahlungs-IDs und TXIDs mit der App-Wallet und vorhandenen Rechnungen abgleichen. Das CSV ist ein Transaktionsnachweis aus der App, **keine Rechnung und keine Steuererklärung**. Die steuerliche Einordnung digitaler Leistungen, Umsatzsteuer und etwaige Belegpflichten gehören zur Prüfung mit der Steuerberatung.
- Den Originalexport, Belege, Quellen für die EUR-Bewertung und nötige Wallet-Nachweise geordnet aufbewahren. Für betriebliche Buchhaltungsunterlagen gilt in Österreich grundsätzlich eine Aufbewahrungsfrist von sieben Jahren; besondere Fälle können länger dauern.
- Test-Pi separat archivieren. Pi beschreibt Test-Pi als ausschließlich für Testnet-Transaktionen bestimmt und ohne Wert. Diese CSV-Zeilen dürfen nicht mit echten Pi-Einnahmen summiert werden.

Die Daten sind personenbezogen: Exporte enthalten Pi-Konto-IDs und möglicherweise Wallet-Adressen. Nur berechtigten Personen zugänglich machen.

## Quellen (Stand 29. September 2026)

- [Pi SDK: Zahlungsdaten, Netzwerk und Status](https://github.com/pi-apps/pi-platform-docs/blob/master/SDK_reference.md)
- [Pi Developer Portal: feste Testnet-/Mainnet-Zuordnung einer App](https://github.com/pi-apps/pi-platform-docs/blob/master/developer_portal.md)
- [Pi Docs: Mainnet und Testnet](https://developers.minepi.com/docs/concepts/MainVsTest)
- [BMF: Steuerliche Behandlung von Kryptowährungen](https://www.bmf.gv.at/themen/steuern/sparen-veranlagen/steuerliche-behandlung-von-kryptowaehrungen.html)
- [USP: Aufbewahrungspflicht](https://www.usp.gv.at/themen/steuern-finanzen/steuerliche-gewinnermittlung/weitere-informationen-zur-steuerlichen-gewinnermittlung/betriebliches-rechnungswesen/aufbewahrungspflicht.html)
