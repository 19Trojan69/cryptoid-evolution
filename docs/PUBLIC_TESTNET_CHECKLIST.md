# Cryptoid Evolution — Checkliste für die öffentliche Testnet-Beta

Die englischen Feldnamen und Einträge entsprechen dem Pi Developer Portal. Übernimm den Beschreibungstext unverändert, falls du ihn dort einträgst.

## Pi Developer Portal → General

- [ ] **App Name:** `Cryptoid Evolution`
- [ ] **Subtitle:** `Crypto Space Arcade Shooter`
- [ ] **Description (129/140 Zeichen):** `Pilot your ship through 9-block chains, defeat bosses, collect power-ups and earn Testnet rewards in this evolving space shooter.`
- [ ] **App Network:** `Pi Testnet`. Das bestehende Testnet-Projekt beibehalten; dies ist noch kein Mainnet-Start.
- [ ] **Testnet App Visibility:** Erst nach den Prüfungen unten auf `Public` stellen und die Änderung mit `Submit` speichern.

## Pi Developer Portal → Privacy / TOS

- [ ] **Privacy:** `https://cryptoid-evolution-testnet.vercel.app/privacy`
- [ ] **Terms:** `https://cryptoid-evolution-testnet.vercel.app/terms`

## Ecosystem Listing Application

- [ ] Das hochgeladene Introbild und alle drei Vorschaubilder im Portal kontrollieren.
- [ ] Kategorie `Games`, öffentlicher Entwicklername und Kontakt-E-Mail prüfen: Diese Angaben sollen so erscheinen, wie du sie den Spielern zeigen möchtest.
- [ ] **PiOS Compatible?** auf `No` belassen, solange die App die PiOS-Anforderungen nicht nachweislich erfüllt.
- [ ] Das Feld **PiNet Subdomain** für diese Beta leer lassen. PiNet-Adresse und Ecosystem Listing sind unabhängig von der Sichtbarkeit der Testnet-App.

## Vor dem Umschalten auf Public im Pi Browser testen

Die folgenden Schritte mit einem zweiten Pi-Konto auf **iPhone und Android** durchführen:

- [ ] Anmelden und das Spiel starten.
- [ ] Einen Block sowie den Ablauf über Boss und Bonusrunde abschließen.
- [ ] Ein Power-up einsammeln.
- [ ] Die App wechseln, zurückkehren und prüfen, ob das Spiel weiterläuft.
- [ ] Rewards und die Top 100 kontrollieren.
- [ ] Eine freigegebene Waffe mit Test-Pi kaufen: von der Zahlungsfreigabe bis zur Gutschrift im Spiel.
- [ ] Prüfen, dass Artikel mit `MAINNET READY` nicht gekauft werden können.
- [ ] Datenschutzerklärung und Nutzungsbedingungen über die Portal-Links und innerhalb des Spiels öffnen.
- [ ] Falls das Spiel hängen bleibt: Gerät, Browser, Uhrzeit und den letzten Handlungsschritt notieren.

## Was die Einstellung Public bewirkt

Die Vercel-Testnet-Adresse ist unabhängig von dieser Pi-Sichtbarkeitseinstellung erreichbar. `Public` ändert das Netzwerk der App nicht, aktiviert keine Mainnet-Zahlungen, vergibt keine PiNet-Adresse und genehmigt keine Aufnahme ins Ecosystem Listing.
