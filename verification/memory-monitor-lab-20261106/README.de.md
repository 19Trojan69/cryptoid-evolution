# Cryptoid Evolution – separates Speicherlabor

## Korrektur nach Besitzerbild IMG_5799.jpeg

Die erste Laborversion hatte trotz unveränderter aktueller Spielquellen einen abweichenden Spielmodus: shipSaveNetwork wählt ohne explizites appNetwork und ohne "testnet" im Hostnamen den Mainnet-/Legacy-Zweig. Der Labor-Builder hatte $$APP_NETWORK$$ unverändert stehen gelassen. Dadurch waren Positionsmarkierungen und der ältere Ablauf sichtbar. Die früheren Prüfungen erfassten diesen Modusunterschied nicht. labHtml setzt jetzt vor jedem Modulstart appNetwork ausdrücklich auf testnet, entsprechend den aktuellen Testnet-Spielregeln. Backend bleibt /api, der Transport strikt lokal; das bindet das Labor nicht an echte Testnet-Konten oder einen Server an. Ein Hostname allein ist kein Nachweis für gleiche Spielregeln.

Die Abnahme prüft jetzt das tatsächliche rulesMode=current, eine lebende Formation ohne jegliche formation-target-Knoten und denselben Modus in allen gespeicherten Punkten. Alte Laborberichte bleiben verfügbar und sind im Menü als frühere abweichende Fassung gekennzeichnet.

Der Monitor startet kompakt und mit 80 Prozent transparentem Hintergrund. Details/Graph bleiben per Plus verfügbar, auch dort transparenter Hintergrund ohne Blur oder zusätzliche Animation. Die mobile Kompaktansicht muss unter 145 CSS-Pixel hoch bleiben und den zentralen Reaktorkorridor frei lassen. Bytewerte bleiben neutral; ein starker Anstieg wird rot. Vergleichsbasis ist der Median der ersten drei aktiven Messpunkte nach 10 aktiven Sekunden, danach dauerhaft eingefroren. Rot bedeutet mindestens 50 Prozent und 8 MiB über dieser Basis, beim ungenauen JS-Heap 16 MiB. Das ist eine offen deklarierte relative Vergleichsmarke, keine allgemeine Normal-/Gefahrgrenze und keine Messung des gesamten RAMs. Fehlende Werte und noch fehlende Referenz lösen keine rote Bewertung aus.

Eigener Hosting-Projektwert prj_0uk2EWyJzzKfIHoLUMrDZMaJZY4W, eigener Arbeitsbranch codex/memory-monitor-lab-20261106. Das Projekt hat keine Git-Autoveröffentlichung. Testnet und Produktion werden nicht verwendet. Die gesamte frontend-Quellstruktur bleibt bytegleich mit dem zuletzt veröffentlichten d9e0897a9396dd8f1f0a9c4a9a0536aa1fb7208d (Frontend-Baum 6e0cdc1bea4b6c84972382f636fa66caf2739010).

Nur dieser externe Builder ersetzt das App-Menü, Login, Netzwerkadapter und Nutzungszählung. Der Gast startet Level 1 im normalen Ablauf oder eine vorbereitete Szene von Boss 2. Zur Auswahl stehen der Kampf mit allen Geschützen, das letzte Geschütz und der offene Reaktor bei 55 Prozent. Optionaler Schutz verhindert Spieler-Lebensverlust, nicht Bossende; Standard ist aus. Keine Käufe, Online-Scores, echten Konten, Datenbank oder Pi-Anmeldung. Das Deployment ist statisch ohne API-Funktionen. Die eigene CSP erlaubt Verbindungen nur zur eigenen Adresse; der lokale Adapter beantwortet zwei Leseanfragen und verweigert alle anderen ohne Netzverbindung.

## Kurztest am letzten Geschütz

In „Boss 2 · letztes Geschütz“ startet der Reaktor bei 100 Prozent. Nur das mittlere Geschütz bleibt aktiv und benötigt noch einen Treffer. Nach „Fortsetzen“ verarbeitet der reguläre Kampfablauf den Treffer, die Öffnung, die erste Reaktorsalve und die ersten beiden Begleitschiffe. Der Bericht speichert diese Ereignisse zusätzlich zum Fünf-Sekunden-Raster. Der React-Commit bezeichnet die Übergabe der Szene an den Browser. Der Ton-Eintrag bezeichnet die Rückkehr aus dem Audio-Aufruf. Ob das Smartphone das Bild angezeigt oder den Ton ausgegeben hat, lässt sich daraus nicht ablesen.

Ein reversibler, ganzer-Quellcode-gepinnter Build-Hook gibt ausschließlich technische Skalare heraus. Ein existierender Framecallback zählt aktive Zeit/Frames, ohne Uhr, Delta oder Ablauf zu verändern. Nicht beobachtbare Frameabstände über eine Sekunde werden separat als Lücke gezählt, nicht als präzise Spielzeit ausgegeben. Der Monitor selbst hat einen einzigen 5-Sekunden-Timer und ein Ereignis für Sichtbarkeitswechsel; Cleanup entfernt beides. Die kleine SVG-Kurve hat keine Animation oder eigene Frame-Schleife. Der Monitor verändert Messbedingungen und verursacht zusätzliche Arbeit.

## Aussagegrenzen

- Kein Browser-Gesamt-RAM auf iPhone/WebKit verfügbar. Die Anzeige sagt das ständig und zeigt keinen erfundenen Prozentwert.
- Der optionale Chromium-JS-Heap ist ein ungenauer, nicht standardisierter Teilwert; fehlend bleibt null, niemals 0 MiB. Die neue experimentelle Memory-API wird nicht periodisch aufgerufen und erzwingt keine Speicherbereinigung.
- Bildcache, Effektcache und Audio-PCM sind logische appseitige Byte-Schätzungen. DOM-Canvas-Abmessungen, Effektoberfläche und andere Kategorien können sich überlappen. Keine Summe wird als Gesamtverbrauch ausgegeben. Interne GPU-/Prozess-/Compositing-Speicher bleiben ungemessen.
- DOM und vom bestehenden Controller gehaltene Animationen werden gezählt. Cumulative configured ist eine Ereignisanzahl, kein aktiver Speicherbestand.
- 360 Punkte mit 5-Sekunden-Abstand: maximal 30 Minuten rollierender Verlauf, höchstens 512000 Zeichen lokal. Speicherfehler bleiben sichtbar und unterbrechen das Spiel nicht. Ein erzwungenes Prozessende kann die letzten bis zu fünf Sekunden oder mehr bei einer Blockade verlieren. Der letzte Punkt ist kein exakter Absturzzeitpunkt.
- Nach einem neuen Dokument erscheint zuerst das Menü mit dem letzten Bericht. Kein automatischer Neustart/Fortsetzen. Ein neuer Lauf ersetzt den alten Bericht erst nach ausdrücklicher Auswahl; manueller JSON-Download, Teilen und Berichttext sind vorhanden. Keine automatische Übertragung.

## Navigation und Hintergrundpause

Spurversion 3 protokolliert den Aufruf einer Spielnavigation direkt vor dem Wechsel und die tatsächliche Pause bei Fokusverlust, Ausblenden oder Rückkehr aus dem Hintergrund. Die Einträge enthalten einen festen Auslöser, den Spielstatus und die aktive Spielzeit. Ein Wechsel im selben Dokument bleibt über `game-monitor-stop` und dessen `historyAction` erkennbar. Ein neues Dokument im selben Tab behält den vom Browser beobachteten Einstiegspfad und Navigationstyp. Ein abrupter Prozessabbruch kann die letzten Ereignisse verlieren.

Die Browserkontrollen vergleichen einen ausgelösten Sichtbarkeitswechsel mit Fortsetzen, den bestätigten Home-Knopf und einen vollständigen Aufruf der Startseite aus einem aktiven Lauf. Der vollständige Aufruf bildet das beobachtete Dokumentmuster kontrolliert nach. Seine Ursache auf dem iPhone bleibt offen.

Bau: node verification/memory-monitor-lab-20261106/build.mjs. Deployment ausschließlich im separaten Laborprojekt; der Builder lehnt andere Vercel-Projekt-IDs ab. Native Prüfung und Bereitstellungsergebnis werden separat ergänzt. Kein physischer Handytest und kein White-Screen-Fix werden durch den Bau behauptet.

## Prüfung der Testumgebung

Erster Lauf 42226443090: Beide Menüs laden, die exakte Labelsuche bezieht aber die Optionen des umschließenden Labels mit ein. Das Auswahlfeld erhält eine explizite Beschriftung. Kein Spielablauf bestanden.

Zweiter Lauf 42226924094: Chromium erreicht den laufenden Monitor, hängt dann im Prüfer an den zwei gleichnamigen legitimen Fortsetzen-Tasten. Der Test adressiert nun die vorhandene Taste im Pausendialog. WebKit erreicht beim kalten automatischen Start nicht den aktiven Status; dieser Lauf ist fehlgeschlagen, kein neuer White-Screen-Nachweis. Die Diagnose bietet deshalb explizite Bildvorbereitung und öffnet alle drei Szenen zunächst angehalten. Die Original-Kampfuhren beginnen erst nach dem manuell angetippten Fortsetzen. Das sind andere Startbedingungen als ein kalter automatischer Gaststart und wird nicht als dessen Behebung ausgegeben. Vorbereitungs-Leases werden nach Übernahme der echten Spiel-Pins oder bei Abbruch freigegeben. Der Graph enthält zusätzlich logische Bytes der DOM-Canvas-Flächen; auch diese sind kein nativer RAM-Wert und dürfen mit anderen Bereichen überlappen.
