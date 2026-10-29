# Einfinger-Steuerung

Vorbereitet auf `codex/single-finger-controls-20261029`, Basis `ce073547`.
Während des aktiven Spiels benötigt jede Taste einen eigenen frischen primären
Tipp, nachdem die Steuerberührung beendet wurde. Ein zweiter Kontakt darf kein
Menü öffnen. Hinüberziehen und eine auf der Taste begonnene Bewegung über zwölf
CSS-Pixel aktivieren die Taste nicht; normale kleine Tippbewegungen bleiben
zulässig. Erst ein neuer gezielter Tipp öffnet das Waffenmenü und die bestehende
Pause. Gleiches gilt für Home/Pause. Tastatur-/Assistenzaktivierung und die
normalen pausierten Menüs bleiben erhalten.

Die Eingabe besitzt einen kleinen kurzlebigen Tipp-Merker und einen Click-Capture-
Handler am bestehenden Spielfeld. Die vorhandenen Bewegungs-/Release-Handler
liefern die übrigen Signale. Nach Release bleibt die normale implizite Capture-
Freigabe zulässig; Cancel, Fokusverlust und Reset verwerfen den Merker. Der alte
Touch-Fallback erhält dieselbe Regel und verhindert erneutes Scharfschalten durch
unmittelbar folgende Kompatibilitäts-Mausereignisse. Kein neuer Timer, RAF,
Speicher-/Netzwerkzugriff oder Eingabedaten-Upload. Spieluhren, Rendering,
Originalgrafik und -audio, Wirtschaft und GamePage sind unverändert.

Lokal bestanden: 35 Eingabetests, Typprüfung, Lint der beiden Laufzeitmodule und
der vollständige Frontend-Releasebuild. Die zusätzliche Prüfung nutzt echte
Browser-Ereignisweiterleitung mit dem tatsächlichen Eingabemodul, der vorhandenen
Viewport-Sperre und React-Klickdelegation. Ihre Spielsituation ist synthetisch;
Native-Multitouch kommt nur im Chromium-CDP-Lauf vor. WebKit prüft native einzelne
Tipps sowie ausdrücklich synthetische zusätzliche Kontakte. Keine dieser
Prüfungen ist eine physische iPhone-/Pi-Browser-Abnahme oder ein bestätigter
White-Screen-Fix. Die ursprüngliche JavaScript-Lücke im Gerätebericht erklärt
noch keine native Absturzursache.

Der gezielte synthetische Regressionstest scheitert erwartungsgemäß mit dem
unveränderten Release-Eingabemodul, weil dort der zusätzliche Kontrollklick
nicht am Spielfeld abgefangen wird. Der korrigierte Test besteht. Dies ist kein
reproduzierter White Screen. Browser-Ergebnisse und die separate geschützte
Vorschau werden nach Abschluss ergänzt. Keine öffentliche Veröffentlichung,
keine Übernahme der Gast-/Sperrhandler aus dem isolierten Vorschauzweig nach Main.

## Abgeschlossener Stand

Die Einfinger-Eingabe besteht auf Quellstand `8242667f` in Chromium und WebKit
(CI40823378548: 14 bzw. 9 Browser-Grenzprüfungen). 35 direkte Eingabetests und
510 Release-Prüfungen inklusive Typprüfung/Vite sind grün. Die private Variante
hat zusätzlich den bisherigen Diagnosetest, insgesamt 36 Eingabefälle, und behält
24 Isolations-/Verpackungsprüfungen sowie den instrumentierten Controller-Check.

Die tatsächliche geschützte Boss-2-Vorschau ist READY auf `79d4f24b`, Tree
`d38517c8b94fac6c1c304780987a0f88bcb16154`, Build45s:
https://cryptoid-evolution-testnet-mspthwlj1-19-trojan69.vercel.app/

Der Vorschau-Lauf CI40823387246 besteht insgesamt. Chromium prüft zusätzlich
vier native Touch-Abläufe im tatsächlichen isolierten Bosskampf, dann 30,951
aktive Sekunden und den lückenlosen Export mit139 Einträgen nach Reload.
WebKit besteht die Eingabe-Grenzprüfung; der vollständige WebKit-Spielstart wurde
in diesem Lauf nicht erneut abgenommen. Die ältere Startstörung bleibt offen.
Die vier heruntergeladenen Prüfarchive wurden gegen ihre SHA256-Digests geprüft.

Auf der tatsächlichen Vercel-Adresse bestehen außerdem Vorbereitung, manueller
Start, Hinüberziehen per Maus ohne Menüöffnung, neuer Klick zum Öffnen, regulärer
Rückweg/Countdown, fortgesetzter Kampf und Berichtsexport nach neuem Dokument.
Dieser Cloud-Prüflauf ist kein physischer Smartphone-Test. Der unveröffentlichte
Release-Kandidat ist als Draft-PR200 gesichert; die Gast-API bleibt ausschließlich
im separaten Vorschauzweig. Main und öffentliche Testnet-/Mainnet-Versionen
wurden nicht veröffentlicht oder verändert. Die vorhandene Vercel-Authentifizierung
bleibt bei Standard Protection; kein Bypasslink und keine Einstellungsänderung.

Die genauen Quellen, Prüfumfänge, verworfenen Zwischenversuche und Grenzen stehen
in [results.json](results.json). Die frühen Lade-/Klick-Prüffehler sind dort als
nicht akzeptierte Versuche aufgeführt. Ein grüner Eingabetest beweist weiterhin
keinen behobenen ursprünglichen White Screen.
