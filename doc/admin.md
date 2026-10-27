# Admin-Zentrale

Die geschützte Oberfläche liegt unter `/admin`. Nach der Pi-Anmeldung erscheint außerdem der Button **Admin-Zentrale** im Spielmenü. Jede Admin-API prüft die serverseitig verifizierte Pi-Konto-ID. Das Eigentümerkonto `19Trojan69` wird beim ersten verifizierten Login je Pi-App gebunden. Optional können `ADMIN_PI_UID` und `ADMIN_PI_TESTNET_UID` die jeweiligen IDs explizit festlegen. Mainnet und Testnet benötigen unterschiedliche Bindungen, weil Pi-App-IDs unterschiedlich sind.

## Testen

- **Raumschiffe:** alle 20 Modelle, drei Entwicklungsstufen, neun Farben, fünf Waffen und verfügbare Start-Power-ups auswählen.
- **Levels & Bosse:** Level und Block auswählen; Block, Boss oder Bonusrunde direkt starten. Zusätzlich führt jeder der 50 Boss-Buttons unmittelbar zum zugehörigen Kampf.
- **Audio & Prüfung:** einzelne Sounds und Musik abspielen, Sitzung erneut prüfen und Konfigurationsstatus ansehen.
- **Zum normalen Spiel:** Testmodus abschalten und zur Startseite zurückkehren.

Der aktuelle Spielablauf enthält 50 angezeigte Level mit neun Blocks, einem Boss und einer Bonusrunde. Die interne Schwierigkeit benutzt dafür 500 Abschnittsnummern. Admin-Läufe erscheinen als **ADMIN-TEST** und erzeugen weder Score-Runs noch Rekorde, Kontobelohnungen oder Käufe. Der Pi-Browser kann verlorene Cookies über den verifizierten Bearer-Token ersetzen; ein Test-Header allein gewährt keine Rechte.

## Normales Spielen mit vollständigem Testnet-Shop

Das verifizierte Administratorkonto kann im Testnet alle 20 Standard-Schiffe mit
erspielten Shards kaufen. Alle Waffen, Startboni, Panzerungen und Advanced-/Elite-
Upgrades sind über reguläre, bestätigte **Test-Pi-Käufe** verfügbar. Standard-
Schiff, Advanced vor Elite und verstärkter Rumpf vor Titan bleiben Voraussetzungen.
Schiffskarten setzen tatsächlichen Besitz voraus; Bosskarten den jeweiligen Sieg.
Es werden keine Schiffe, Guthaben oder Siege pauschal vergeben.

Dafür den **Testmodus beenden** und über die Startseite normal spielen bzw. den
Shop öffnen. Dieser Zugang folgt dem serverseitig verifizierten Owner-Konto;
ein zusätzliches Freischalten in der Admin-Vorschau ist nicht nötig. Käufe und
Fortschritt werden im Testnet gespeichert und nicht auf Mainnet übertragen.
Andere Spielerkonten behalten die bisherigen Angebotsgrenzen.

## Zahlungseingänge

Die Ansicht dokumentiert App-Käufe, keine vollständige private Wallet-Historie. Echte Pi, Test-Pi und alte Vorgänge ohne bestätigtes Netzwerk werden getrennt angezeigt. Netzwerk und ursprünglicher Betrag stammen aus der Pi Platform API; fehlende historische Werte werden nicht geraten. Statusfilter, Details, Seitenwechsel und CSV-Downloads sind ausschließlich dem Eigentümerkonto zugänglich.

**Mit Mainnet/Testnet abgleichen** liest bestehende Zahlungsdaten erneut. Dabei werden Zahlung, Nutzer, Produkt und Netzwerk überprüft. Der Abgleich genehmigt oder schließt keine Zahlung ab und schreibt keine Käufe gut. Der tatsächliche Wallet-Eingangszeitpunkt wird nur aus einer erfolgreichen Blockchain-Transaktion mit passender TXID übernommen. Der App-Abschluss ist ein eigenes Datum. Ist die Blockchain-Auskunft nicht verfügbar, bleibt der Eingangszeitpunkt leer und kann später erneut geprüft werden.

Für einen bestätigten Mainnet-Eingang mit Blockchain-Zeitpunkt lassen sich der belegte historische EUR/Pi-Kurs, seine Quelle und eine Belegnummer speichern. Die Oberfläche berechnet daraus den EUR-Gegenwert. Historische Kurse werden manuell eingegeben; es gibt keine automatische Kursquelle. Die CSV enthält Netzwerk, Status, Pi-Betrag, IDs, Wallet-Adressen, getrennte Zeitpunkte, Blockchain-Nachweis und die gespeicherte EUR-Bewertung. Die Oberfläche zeigt Zeiten für Wien; CSV-Zeiten sind UTC. Formelähnliche CSV-Zellen werden gegen Tabellenformeln abgesichert.

Die Zahlungseingangsübersicht aktiviert selbst keine Käufe. Die vollständige Test-Pi-Kaufoption gilt ausschließlich für das verifizierte Administratorkonto im normalen Testnet-Spiel; Mainnet-Käufe bleiben gesperrt.

## Prüfung

```sh
npm run build --prefix backend
node --test backend/src/*.test.mjs
npm run build --prefix frontend
node --experimental-strip-types --test frontend/src/pages/*.test.mjs
```

Die Backend-Tests prüfen unter anderem alle Admin-Zugriffsgrenzen, getrennte App-Bindungen, cookieunabhängige Wiederherstellung, Startkonfigurationen ohne Kontoschreibvorgänge, Netzwerkfilter, CSV-Absicherung, Blockchain-Zeitpunkte und die Voraussetzungen der EUR-Bewertung.
