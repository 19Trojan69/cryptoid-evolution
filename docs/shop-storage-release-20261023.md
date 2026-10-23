# Shop-/Speicherkorrektur im Testnet veröffentlicht

Marc hat mit „stelle sie bitte ins testnet“ die Veröffentlichung ausdrücklich
freigegeben. Am 23. Oktober 2026 ist der geprüfte Laufzeitstand
`19de3e692f75a1c3e2eddf3438acc937c9dcac19`, Baum
`e7be9574df3dbf443c65ac4dea027f82499df766`, unter
https://cryptoid-evolution-testnet.vercel.app/ erreichbar.

Die Vorschau `dpl_3GTYU8MC9MJCYjseK5G99U7eXrTv` war um 08:05:17 Uhr
Europe/Vienna READY (51 Sekunden). Die anschließende Promotion baut mit der
Production-Umgebung des bestehenden Testnet-Projekts neu. Der offizielle Stand
`dpl_AsXUruYAuKRboZWFymr2cD3FkLCJ` ist um 08:08:46 Uhr READY
(55 Sekunden). Alias, Projekt und exakter Quellcommit wurden unabhängig über
den Vercel-Connector bestätigt. „Production“ bezeichnet hier ausschließlich
die offizielle Bereitstellung des Testnet-Projekts.

Der zuvor erstellte und unabhängig gelesene Rücksprungpunkt
`backup/testnet-before-shop-storage-20261023` zeigt auf `38002f0`.
Der feste Laufzeitbranch `codex/shop-storage-audit-20261023` bleibt auf
`19de3e6`. Dieser Nachweis liegt auf dem getrennten, automatisch nicht
ausgelieferten Branch `codex/shop-storage-release-record-20261023`.

Vorab bestanden 87 Build-Prüfungen, TypeScript/Vite und gezieltes Lint.
Die offizielle Adresse liefert zwölf eigene JavaScriptmodule. GamePage und
AdminPage enthalten den richtigen Commit und Baum. Zehn Prüfungen des
kompilierten Codes bestätigen Waffenwiederholung, Bestandsaktualisierung,
geschützte optionale Zahlungsdiagnose, Verbindungsfreigabe und feste
Speicherfehlerkategorien sowie die bisherigen Bildlade-/Grafikreferenzen.
Sechs originale PNGs stimmen bytegenau mit dem geprüften lokalen Build überein.
API-Root, anonyme Admin-Sperre und alle drei Ranglisten liefern dieselben
Statuscodes und Inhalts-Hashes wie unmittelbar vor der Veröffentlichung.
Die offizielle Startseite beendet den Anmelde-Ladezustand und aktiviert
SPIELEN sowie Sammelkarten.

Kauf, Pi-Login und Waffenaktivierung wurden nicht mit einem realen Konto
ausgelöst. Es wurden keine Spielstände, Konten oder Walletdaten verändert.
Das belegt die Veröffentlichung und die geprüften Fehlerpfade, nicht die
ursprüngliche Geräteursache oder eine dauerhafte Absturzbehebung. Der vom
Nutzer übermittelte Lauf endet regulär nach Level 68; die Vollaufzeichnung
bleibt als gesonderter Speicherfehler zu behandeln. Kein erneuter langer
Kampagnentest oder erneuter Kauf ist Voraussetzung für die nächste Prüfung.

Der Vercel-Connector verweigerte die Erstellung mit einem gewöhnlichen
Berechtigungsfehler (403); die CLI war nicht installiert. Daher wurde der
bereits freigegebene Dashboard-Weg verwendet. Keine Runtime-Logs und kein
Schutzumgehungszugriff. Mainnet und main bleiben unberührt.

Maschinenlesbare Nachweise: `shop-storage-release-20261023/before.json`,
`shop-storage-release-20261023/after.json`,
`shop-storage-release-20261023/release.json`.
