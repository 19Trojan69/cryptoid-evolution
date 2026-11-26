# Pi-Browser-Abnahme auf echten Geräten

Vorbereitet am 26. November 2026 für CRYPTOID EVOLUTION / Trojan Wolf Games.
**Status: Prüfplan; kein physischer Durchlauf und keine Zahlung ausgeführt.**
Dieser Plan ändert weder die gemeinsame Kauf-/NFT-Freigabepolitik noch eine
Portal-, Wallet-, KYC- oder Listingentscheidung. Vorhandene Simulationen,
Desktopansichten und erfolgreiche Builds ersetzen keinen der folgenden Fälle.

## 1. Prüfstand festhalten

Vor jedem Durchlauf die aktuelle Alias-/Deployment-/Commitzuordnung erneut
lesen. Die folgenden veröffentlichten Stände sind die Ausgangspunkte dieses
Plans; ein späterer Entwurfsbranch ist kein veröffentlichter Prüfstand.

| Umgebung | Öffentliche Adresse | Commit | Deployment |
| --- | --- | --- | --- |
| Mainnet-Vorschau | https://www.cryptoid-evolution.app/ | `bfccab8601c6441d8baab7d233fad63ce5343c00` | `dpl_GJxRBt7Q5YPTxn9WbCShfvQd4sxt` |
| Testnet | https://cryptoid-evolution-testnet.vercel.app/ | `cf6d644238d63ac3928d843165538bc13a0d67d0` | `dpl_4BwHEDi2jR34FFKJy7riTHnPiGYq` |

Die Quellhistorien sind getrennt. Testnet verwendet für Teile der Kontofunktionen
das gemeinsame Produktionsbackend; deshalb zusätzlich dessen tatsächlichen
Commit und Deployment protokollieren. Ein neues Backend verlangt eine erneute
Bewertung der davon betroffenen Geräte-/Zahlungsfälle in beiden Umgebungen.

Vier getrennte Durchläufe anlegen: iPhone/Mainnet, iPhone/Testnet,
Android/Mainnet und Android/Testnet. Ein Gerät oder Netzwerk deckt das andere
nicht ab. Ein fehlendes Androidgerät bleibt als fehlender Nachweis dokumentiert.

| Feld pro Durchlauf | Einzutragen |
| --- | --- |
| Durchlaufkennung, Prüfer, Datum und Zeitzone | Tatsächliche Werte; Zeiten mit UTC-Offset, z. B. `+07:00` in Thailand |
| App und Netzwerk im Pi-Portal | Tatsächliche Appkennung und angezeigtes Netzwerk; nicht aus dem Namen ableiten |
| URL, Frontendcommit/-deployment und gemeinsames Backend | Exakte geprüfte Zuordnung |
| Gerät, Betriebssystem und Pi-Browser-Version | Modell und vollständige Versionen |
| Verbindungsart | WLAN/Mobilfunk; Wechsel und Unterbrechungszeiten festhalten |
| Konto | Internes Prüfkürzel und autorisiert zugeordnete Pi-Identität; keine Token oder Passphrase |
| Ausgangsbestand | Shards, Schiffe, ausgewähltes Schiff, relevanter Fortschritt und letzter bestätigter Speicherpunkt |
| Ergebnis je Fall | `bestanden`, `nicht bestanden`, `nicht ausgeführt` oder `nicht anwendbar` mit Begründung |
| Beobachtung | Sichtbares Verhalten, tatsächliche Zeiten, Bestand danach und privater Belegverweis |

Für jedes Gerät die gleichen Fälle kopieren und einzeln bewerten. Eine leere
Beobachtung oder ein fehlender Fehlerbericht zählt nicht als bestanden.

## 2. Portalbelege schrittweise am Handy abgleichen

Im Pi Browser **Develop → bestehende Mainnet-App → App Configuration** öffnen.
Jeweils nur den nächsten benötigten Abschnitt aufnehmen und auswerten. API-Key-
und Geheimnisbereiche nicht öffnen oder mitfotografieren. Keine neue App oder
Wallet allein deshalb anlegen, weil ein Status noch unbekannt ist.

| Reihenfolge | Nächste Ansicht | Tatsächlich zu erfassende Aussage | Anfangsstatus |
| --- | --- | --- | --- |
| 1 | Oberer Bereich von App Configuration | Appname/-kennung, Netzwerk und sichtbare Statusanzeigen | nicht eingesehen |
| 2 | Produktionsadresse und Domainbereich derselben App | Exakte HTTPS-Adresse, Pi-Verifizierungsstatus und wörtliche Meldung | nicht eingesehen |
| 3 | Incoming-Multisig-Antrag/-Status | Genehmigt, ausstehend oder konkreter anderer Status; Meldung und Zeitpunkt | Betreiber meldete verbundene Wallet; aktueller Genehmigungsbeleg noch nicht eingesehen |
| 4 | Walletverbindung in derselben App | Tatsächlich verbundene öffentliche Empfangsadresse und Verbindungsstatus | Betreiber meldete verbundene Wallet; aktuelle Appzuordnung noch nicht eingesehen |
| 5 | Ecosystem Listing / angezeigter KYC-Bereich | Persönlicher Status, Einreichung, Rückmeldung und tatsächlich verlangte Schritte | nicht eingesehen |

Walletgenehmigung, Verbindung zur App und bestätigter Zahlungsablauf sind drei
verschiedene Belege. Vercel-Domainbestätigung und erreichbare
`validation-key.txt` ersetzen die Pi-Verifizierung nicht. Ein unbekannter Status
ist weder Ablehnung noch Nachweis eines versäumten Schritts.

Allgemeines Mainnet-Listing getrennt von Pi Next bewerten: Die allgemeine
Listingliste verlangt unter anderem ein funktionsfähiges Produkt, Entwickler-KYC,
eigenständige Marke, Pi-Anmeldung/-Transaktionen sowie notwendige Links und
Datenerhebung. NFTs stehen dort nicht als allgemeine Pflicht. Teamregistrierung,
PiNet und besondere Einreichungs-/Demounterlagen sind zusätzlich im jeweiligen
Pi-Next-Verfahren zu prüfen. Ein gespeichertes App- oder Wallet-Approval ist keine
pauschale Bestätigung von KYC, Listing oder Pi Next.

## 3. Anmeldung, Speicherung und Spielbetrieb

Vor Beginn Ausgangsbestand und bestehende Speicherstände dokumentieren. Keine
Browserdaten löschen, App neu installieren, Konten löschen oder Bestände
zurücksetzen. Für kontrollierten Spielfortschritt ein ausdrücklich dafür
vorgesehenes Konto verwenden; einen vorhandenen wertvollen Missionsstand nicht
durch einen neuen Flug überschreiben. Falls die Oberfläche dafür keinen sicheren
Weg bietet, den Fall zunächst als nicht ausgeführt markieren.

| Fall | Ablauf auf dem jeweiligen echten Gerät | Erwartetes, zu beobachtendes Ergebnis | Anfangsstatus |
| --- | --- | --- | --- |
| G01 Start und Gastansicht | Richtige URL im Pi Browser öffnen; Initialisierung abwarten, Startseite und Menüs prüfen | Bedienelemente werden nutzbar; kein dauerhafter weißer Bildschirm, kein Wechsel zur anderen Umgebung | nicht ausgeführt |
| G02 Gastbestand | Vorhandenen Gastbestand und Auswahl notieren; Seite normal verlassen und dieselbe URL erneut öffnen | Vorgesehener lokaler Bestand/Schiffsauswahl bleibt korrekt; kein unbeabsichtigter Kontobestand oder Netzwerkmix | nicht ausgeführt |
| G03 Pi-Anmeldung | Mit eigenem autorisierten Konto über den vorhandenen Pi-Login anmelden | Richtige verifizierte Kontoidentität; richtige App und Netzwerk; verständliche Fehler-/Wiederholungsmöglichkeit | nicht ausgeführt |
| G04 Kontospeicherung | Bestand und ausgewähltes verfügbares Schiff prüfen; mit erlaubtem Testkonto einen kleinen regulären Fortschritt speichern und Bestätigung abwarten | Bestätigter Stand gehört dem Konto; gewähltes Schiff wird korrekt angezeigt; keine doppelte Gutschrift | nicht ausgeführt |
| G05 Erneutes Öffnen | Nach bestätigter Speicherung Pi Browser verlassen und später zur gleichen URL zurückkehren; nötigenfalls dasselbe Konto erneut anmelden | Letzter tatsächlich bestätigter Speicherstand und Bestand richtig zugeordnet; abgelaufene Sitzung verständlich behandelt | nicht ausgeführt |
| G06 Manuelle Pause | In einem sicheren Testflug pausieren, 30 Sekunden warten, ausdrücklich fortsetzen; dreimal wiederholen | Welt/Verbrauch laufen in Pause nicht weiter; ein flüssiger Spielablauf nach Fortsetzen, keine verdoppelten Schleifen oder Musik | nicht ausgeführt |
| G07 Hintergrund und Rückkehr | Testflug pausieren; andere App 30 Sekunden nutzen und zurückkehren; danach Bildschirm 2 Minuten sperren und zurückkehren | Sichere Rückkehr ohne unbeabsichtigtes Weiterspielen; Fortsetzen bewusst möglich; Steuerung und Ton korrekt | nicht ausgeführt |
| G08 Rückkehr aus aktivem Flug | Nur mit dafür vorgesehenem Teststand aus aktivem Flug kurz in den Hintergrund wechseln und zurückkehren | Sichere Unterbrechung, keine unkontrollierten Treffer/Timer während Abwesenheit; beobachteten Wiederaufnahmestand protokollieren | nicht ausgeführt |
| G09 Speicher-/Netzwerkfehler | Außerhalb eines Zahlungsablaufs kurz Verbindung trennen; zulässigen Speicherschritt versuchen; Verbindung wiederherstellen und regulär erneut versuchen | Fehlende Bestätigung wird nicht als gespeichert ausgegeben; Wiederholung ordnet Bestand korrekt zu und schreibt nicht doppelt gut | nicht ausgeführt |
| G10 Konto-/Umgebungswechsel | Regulär abmelden, Konto-/Gastansicht und separat andere Umgebung öffnen; optional zweites ausdrücklich autorisiertes Testkonto verwenden | Keine Antworten, Bestände oder Kartenoffenlegungen des alten Kontos im neuen Kontext; kein Mainnetbestand als Testnetbestand | nicht ausgeführt |
| G11 Längerer Flug | Mit Teststand mindestens 20 Minuten spielen, einschließlich Boss-/Bonusübergang und einer Pause | Kein unerwarteter Neustart/Weißbild; Fortschritt, Audio, Steuerung und bestätigte Belohnung nachvollziehbar | nicht ausgeführt |
| G12 Gesperrte Mainnet-Angebote | Mainnet-Shop und zugehörigen Hinweis ansehen, ohne Kauf oder Umgehungsversuch | Nicht freigegebene Käufe und NFT-Ausgabe bleiben gesperrt; Vorschau/Berechtigung wird nicht als Blockchain-Eigentum dargestellt | nicht ausgeführt |

Das Betriebssystem kann Hintergrundseiten beenden. Ein kompletter Prozessneustart
ist deshalb gesondert vom normalen Pausieren zu protokollieren. Maßstab für
Wiederherstellung ist der letzte tatsächlich bestätigte Speicherpunkt; dieser
Plan verspricht keinen ungespeicherten Frame-genauen Stand nach OS-Beendigung.
Gerätedrosselung, weiße Ansicht, Tonverlust und Speicherausfall mit Zeitpunkt,
vorherigem Schritt und reproduzierbarem Ablauf dokumentieren. Vorhandene
Betreiberdiagnosen nur regulär verwenden; keine privaten Rohdaten veröffentlichen.

## 4. Zahlung: erst nach einer konkreten Autorisierung

**Alle Zahlungsfälle sind zunächst nicht ausgeführt.** Auch Test-Pi, das Öffnen
eines Zahlungsablaufs und ein absichtlich unterbrochener Kauf werden hier nicht
stillschweigend autorisiert. Vor Beginn müssen Betreiberfreigabe und tatsächliche
technische Voraussetzungen für genau den vorgesehenen Weg vorliegen.

- [ ] Tatsächliche Appkennung, Netzwerk und richtige veröffentlichte Revision festgehalten.
- [ ] Produkt-ID/-name, Variante, Menge und exakter Betrag aus dem aktuellen Katalog bestätigt.
- [ ] Ziel: tatsächlich mit dieser App verbundene öffentliche Empfangswallet abgeglichen.
- [ ] Käuferkonto und ausdrückliche Autorisierung von Produkt, Betrag, Netzwerk und Ziel vorhanden.
- [ ] Gesamtobergrenze und erlaubte Fälle/Wiederholungen festgelegt; kein automatischer erneuter Kauf nach unklarem Ausgang.
- [ ] Wirkung auf Bestand/Verbrauch und mögliche Gebühren vorab bekannt; nur dafür freigegebenes Testkonto verwenden.
- [ ] Aktueller Freigabestatus geprüft; unvollständige NFT-Leistung verhindert nach bestehender gemeinsamer Politik neue Mainnet-Käufe.

Für Mainnet ist derzeit kein freigegebener kontrollierter Zahlungs-Abnahmeweg
belegt. Die bestehende Sperre darf nicht zur Erzeugung eines Bereitschaftsnachweises
aufgehoben oder durch direkte API-Aufrufe, künstliche Belege oder einen neuen
öffentlichen Testweg umgangen werden. Zuerst muss ein zulässiger kontrollierter
Weg mit der bestehenden Freigabepolitik vereinbar sein. Bis dahin bleiben die
Mainnet-Zahlungsfälle gesperrt. Ein erfolgreicher Testnetfall beweist keinen
funktionierenden Mainnet-Zahlungsweg.

| Fall | Ablauf ausschließlich im autorisierten Umfang | Erwartetes Ergebnis und privater Nachweis | Anfangsstatus |
| --- | --- | --- | --- |
| P01 Erfolgreicher Kauf | Autorisiertes Produkt einmal über die echte UI bestellen; Betrag, Netzwerk und Ziel vor Walletbestätigung kontrollieren; regulär abschließen | Pi genehmigt und bestätigt tatsächliche Transaktion; Backendbeleg stimmt mit Konto, Produkt, Variante, Menge und Betrag überein; genau eine Leistung/Gutschrift | nicht ausgeführt |
| P02 Abbruch | Separat autorisierten Ablauf vor Zahlungsbestätigung regulär abbrechen | Verständlicher Abbruch; keine fälschliche Erfolgsanzeige und keine Leistung ohne bestätigte Zahlung; nach Wiederöffnung keine Phantomgutschrift | nicht ausgeführt |
| P03 Fehler vor Abschluss | Nur vereinbarten Störungsschritt ausführen, etwa Verbindung vor Walletbestätigung unterbrechen; danach wiederherstellen | Verständlicher offener/Fehlerstatus; kein Erfolg auf Verdacht; Zustand vor einem neuen Kauf prüfen | nicht ausgeführt |
| P04 Unterbrochene bestätigte Zahlung | Nur wenn ausdrücklich autorisiert, nach tatsächlicher Blockchainzahlung vor sichtbarer Appbestätigung Verbindung/Ansicht unterbrechen; gleiche App mit gleichem Konto erneut öffnen | Vorhandene unvollständige Zahlung über reguläre SDK-Erkennung/Wiederaufnahme prüfen; dieselbe Payment-ID abschließen, keine zweite Bestellung zur Reparatur | nicht ausgeführt |
| P05 Wiederholung/Rückkehr | Nach P01/P04 erneut öffnen und regulär anmelden; vorhandenen Beleg und Bestand vergleichen | Ein bestätigter Kauf bleibt genau einmal erfüllt; wiederholte Recovery erzeugt weder zweite Zahlung noch zweite Gutschrift | nicht ausgeführt |
| P06 Kontowechsel bei ausstehender Antwort | Nur mit freigegebenen Testkonten und autorisiertem Zahlungsszenario regulär abmelden/wechseln und alte Antwort abwarten | Kein Bestands-/Erfolgs-/Kartenupdate im anderen Konto; bestehende Zahlung bleibt ihrem verifizierten Konto zugeordnet | nicht ausgeführt |

Bei Unklarheit nach Walletbestätigung **keinen weiteren Kauf starten**. Zunächst
privat Payment-ID, Transaktionskennung, Kontozuordnung und vorhandenen Backendbeleg
lesen. Eine Fehlermeldung nach der Übertragung beweist keine gescheiterte Zahlung;
eine Erfolgsmeldung allein beweist keine bestätigte Blockchaintransaktion.
Wallets ausschließlich im Pi-eigenen vertrauten Ablauf bedienen. Keine Passphrase,
API-Schlüssel, Token oder vollständigen Diagnosedumps in Chat, Git oder Screenshots.

## 5. Belege und Abschluss

Ein Fall erhält `bestanden` erst nach tatsächlicher Ausführung und Abgleich von
Erwartung, Beobachtung und Bestand. `Nicht anwendbar` verlangt eine konkrete
Begründung und darf gesperrte oder fehlende Tests nicht verbergen. Bei Änderung
von App, Netzwerk, Schlüssel, Wallet, Eigentümerbindung oder Quellrevision die
betroffenen Nachweise neu bewerten und nötigenfalls erneut abnehmen.

Für einen Mainnet-Checkout-Bereitschaftsbeleg gilt zusätzlich der vorhandene
[Evidence-Vertrag](mainnet-evidence-contract.md). Er verlangt einen vom verifizierten
Betreiber geprüften Datensatz für die **exakte** Revision mit getrennten Wallet-
Genehmigungs-/Verbindungs- und erforderlichen Pi-App-Freigabebelegen. Die tatsächliche
End-to-End-Abnahme muss denselben vorhandenen Zahlungsbeleg zu Konto, Produkt,
Menge, Betrag, Netzwerk, Zielwallet und bestätigter Leistung zuordnen.

`checkoutAcceptance` bindet `end_to_end_u2a`, Revision, Payment-ID, Betreiber,
tatsächlichen Abnahmezeitpunkt und SHA-256 des tatsächlich aufbewahrten privaten
Abnahmebelegs. Zeitliche Reihenfolge: Zahlungsabschluss ≤ Abnahme ≤ Betreiberreview;
Review nicht in der Zukunft, Gültigkeit nach Review und höchstens 90 Tage.
Schlüssel-Fingerprint statt Rohschlüssel; Hash und offizielle URL sind allein
kein inhaltlicher Genehmigungsbeweis. Der geschützte vorhandene Verwaltungsprozess
legt erst nach echter Prüfung einen solchen Datensatz an. Dieser Plan legt keinen
an und fügt keinen HTTP-Schreibweg hinzu.

Die Bereitschaftsprüfung liest danach den bereits bestätigten Mainnet-Beleg und
den passenden Pi-Zahlungsstatus; sie erzeugt keine Testzahlung. Ein alter Beleg,
ein Desktoptest, ein erfolgreicher GET oder ein verbundener Walletstatus ersetzt
die aktuelle echte Abnahme nicht. Eine gültige Abnahme ersetzt wiederum weder
NFT-Ausgabe/-Metadatenbereitschaft noch die ausdrückliche Betreiberfreigabe.

Private Portal- und Zahlungsbelege beim autorisierten Betreiber halten; öffentlich
nur sachliche Zusammenfassung, Prüfumfang, Ergebnis und erforderliche technische
Zuordnung. Keine persönlichen Portal-/Zahlungsscreenshots in dieses Repository
aufnehmen. Erspielte Berechtigung, Reservierung und NFT-Blockchain-Eigentum bleiben
getrennte Aussagen.

## 6. Nachprüfbare Grundlagen

- [Pi App Configuration: aktualisierte Navigation](https://minepi.com/blog/developer-platform-updates/)
- [Mainnetstart: Incoming-Multisig-Genehmigung und Appverbindung](https://developers.minepi.com/docs/build-first-app/Launch)
- [Produktionsadresse, Domainverifizierung und echter U2A-Durchlauf](https://developers.minepi.com/docs/build-first-app/Production)
- [Allgemeine Mainnet-Listingkriterien](https://developers.minepi.com/docs/build-first-app/MainnetListing)
- [Zusätzliche Pi-Next-Anforderungen](https://minepi.com/pi-next/)
- [Vorhandener Evidence-Vertrag](mainnet-evidence-contract.md), [Freigabepolitik](../backend/src/mainnetRelease.ts), [Belegprüfung](../backend/src/mainnetEvidence.ts)
- [Pi-Anmeldung und reguläre SDK-Recovery](../frontend/src/hooks/useAuth.ts), [Kauf-/Abbruch-/Wiederaufnahmeablauf](../frontend/src/hooks/usePayments.ts)

Quellbezug: veröffentlichte Mainnet-Revision `bfccab8601c6441d8baab7d233fad63ce5343c00`.
Die Testnetoberfläche und deren Regeln sind bei ihrer eigenen Revision separat
abzunehmen; diese Vorlage kopiert keine Mainnetimplementierung darüber.
