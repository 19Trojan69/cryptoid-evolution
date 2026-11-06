# Gemeinsame aktive Zeitfenster: vermuteter Hintergrund-Speichergewinn nicht bestätigt

Lauf42157352398 ist vollständig success. Beide Jobs und alle vier frischen Browserläufe bestehen zusätzliche Zeitfensterprüfungen, die bisherigen Ablauf-/Quellen-/Fehler-/Ausstiegs-/Exportbedingungen und den Quellenschutz nach dem Build. Das ist ein bestandener Messablauf, kein positiver Speicher- oder White-Screen-Nachweis.

Quelle e1e2b0aa29a49711f98890b6a8147ab1e0f43a7c, Baum52cd5b85b77b5c212d9d3937772779ec4a689056. Dieselbe kompilierte9f3-Renderingbasis, Linux-WebKit26.5, Playwright1.62.1, identisches festes Container-Abbild,430×825 CSS-Pixel/DPR3. Zwei Paare auf zwei Runnern; innerhalb jedes Paars beide Varianten auf demselben Runner und in getrennten frischen Browserprozessen. Reihenfolge ist ausdrücklich Kontrolle/ausgeblendet beziehungsweise ausgeblendet/Kontrolle.

Die Stoppuhr wurde nicht geändert oder zurückgesetzt. Die tatsächlichen Aufnahmefenster liegen in der Kontrolle/ausgeblendet-Reihenfolge bei61.581–93.412ms beziehungsweise60.628–91.784ms. In der umgekehrten Reihenfolge liegen sie bei60.506–91.786ms (ausgeblendet) beziehungsweise60.048–93.158ms (Kontrolle). Alle sechs vorab deklarierten gemeinsamen Fünfsekundenfenster von60.000 bis90.000ms sind in jedem Arm vorhanden. Zusätzliche rein lesende Beobachtungen beim Aufwärmen und jedem aktiven Prozesspunkt sind instrumentiert und ausdrücklich markiert.

Die folgende Kennzahl mittelt die sechs unabhängigen Fünfsekunden-Binmittel gleichgewichtet; sie ist weder der unbeschnittene Mittelwert aller30 Rohpunkte noch eine neue Leistungsnorm.

| Reihenfolge | Kontrolle Gesamt-PSS MiB | Fläche ausgeblendet Gesamt-PSS MiB | ausgeblendet minus Kontrolle |
|---|---:|---:|---:|
| Kontrolle zuerst |1123,028|1071,788|-51,240|
| ausgeblendet zuerst |1061,718|1082,213|+20,495|

Im ersten Paar sind alle sechs Bin-Differenzen negativ (-58,665/-59,319/-39,867/-55,524/-42,523/-51,544 MiB), im umgekehrten Paar alle positiv (+42,929/+21,621/+25,459/+6,611/+20,765/+5,583 MiB). Ein Mittel über beide Paare würde die gegenläufigen Ergebnisse verdecken und wird nicht als Wirkungsgröße eingeführt.

Auch die separat ausgewiesenen WebKit-Inhaltsprozesse bestätigen keine gleichgerichtete Entlastung: Mittelunterschied -50,455 beziehungsweise+9,167 MiB. Menübasiswerte liegen vor der Unterdrückung bereits bei519,255/514,907 MiB im ersten Paar und506,639/523,528 MiB (Kontrolle/ausgeblendet) im anderen Paar. Keine nachträgliche Basiswertkorrektur wird zum angeblichen Nachweis gemacht.

Die aktive Spielphase ist nun zeitlich vergleichbar, aber keine identische zufällige Kampflast: Kernsalven Kontrolle6→11 / ausgeblendet15→25 beziehungsweise Kontrolle7→12 / ausgeblendet18→28. Diese Unterschiede bleiben in sämtlichen Zeitbins erhalten; sie sind weder eine FPS-Messung noch ein isolierter CPU-Wirkungsnachweis. Es wurden keine Spiel-/Animationsuhren, keine Geschwindigkeit und kein Simulationsdelta angepasst. Unterschiedliche PSS-Werte werden nicht dem bloßen Wort Hintergrund oder einer bestimmten nativen Speicherart zugeschrieben.

Die unabhängige analyze.py überprüft beide Original-ZIPs anhand ihrer Größe und SHA256 aus artifact-receipt.json, sämtliche Prozesssummen, alle vier normalen Journal-/Stoppuhr-/Ressourcenexporte, wirklich wirksame Einzelflächenunterdrückung, gleiche Quellen, vollständige60–90s-Bins und Reihenfolge. Alle120 Rohpunkte sind erhalten,112 davon liegen nach ihren gespeicherten Checkpoints im gemeinsamen Zeitfenster. Sie werden nicht nach Ergebnis ausgewählt. Native Kategorien sind vollständig erhalten; deren Gesamtwerte für den längeren instrumentierten aktiven Abschnitt werden ausdrücklich nicht als exakt zeitgleiche PSS-Bins bezeichnet.

Originalarchive:
- control-first.zip:60.144 Bytes, SHA256 dd7414a167e6e5f49ce4da0e053321215a99f7f17d7602b30d4017717ad1570d, Artefakt13475358814.
- hidden-first.zip:60.134 Bytes, SHA256506301caa5f5125e617456eeaeeea08345d69683e12641f1e30dd098355081ca, Artefakt13474598676.
Alle zwölf ursprünglichen JSON-Mitglieder bleiben unverändert. Kein privater Gerätebericht und keine signierte Downloadadresse werden veröffentlicht.

Entscheidung: Der frühere Unterschied von rund168MiB wird nicht als belastbare Einsparung beibehalten. Das Ausblenden dieser einen Fläche bleibt reine Diagnose und wird nicht übernommen. Dieser Einzelverdacht begründet keine Grafikvereinfachung, keine neue Handyversion und keinen weiteren unveränderten Besitzer-Langlauf.

Der hohe native Grundbestand bleibt zuzuordnen. Als nächster sachlicher Ansatz muss die Speicherart beziehungsweise der native Allokationspfad beim großen, bereits pausierten Szenenaufbau erfasst werden; ein weiterer bloßer Hintergrund-PSS-Vergleich reicht dafür nicht. KDEs originale Heaptrack-README wurde hierfür gelesen (Blob0dc76bbef0498fb746ee85fa6118a8fa0687e6e0): Allokationsereignisse und Aufrufpfade sind grundsätzlich erfassbar, ohne passende Symbole ist die Nutzbarkeit begrenzt. Es wurde noch kein solcher Profilinglauf eingerichtet oder gestartet; keine bereits vorhandene Werkzeugfähigkeit wird behauptet.

Kein Deployment, Merge, Aliaswechsel oder Zugriffsabbau. Veröffentlicht wurden ausschließlich externe Testdateien und synthetische Nachweise; originale Spielquellen, Assets, Ton, Steuerung, Spielzeit und Vercel-Konfiguration bleiben gleich. Keine physische Smartphone-Messung und kein bestätigter White-Screen-Fix.
