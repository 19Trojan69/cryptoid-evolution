# Native Speicheraufteilung: passive Messung bestanden, intrusive Spielprofile verworfen

Der tatsächlich abgeschlossene passive Lauf42162206740 / Job127710277915 auf87f5dc28d1cb5054c0e40420848068eb0a156e56 (Baum e1f5b13689129d6f19eb0ebc957cdf0ff62ea5a9) besteht. Drei frische originale Linux-WebKit26.5-Prozesse, jeweils drei passive Kernelabbildungen: konstante Seite, vorbereitetes Menü, aufgebaute weiterhin pausierte Spielszene. Keine Heaptrack-Injektion, kein Dateitausch und kein aktives Spielen in diesem bestandenen Lauf.

Die originale Worker-ELF hat nachweislich den unveränderten SHA256 cae96ae2b8f2668d9afab2bce22ac23d9a54f25e846909ddbc86fbcebfb2e925. Derselbe kompilierte9f3-Spielcontroller und Original-Assets bleiben erhalten. Alle Quellen-/Gast-/Buildbedingungen und der Quellenschutz nach dem Lauf bestehen.

| Beobachtung, Mittel aus je3Punkten | konstante Seite | vorbereitetes Menü | pausierte Szene |
|---|---:|---:|---:|
| gesamte klassifizierte Browser-PSS, MiB |345,693|511,847|829,363|
| Inhaltsprozess-PSS über smaps, MiB |215,201|339,860|666,032|
| private anonyme Abbildungen, MiB |74,755|174,164|422,073|
| separat ausgewiesener libc-Heap, MiB |9,063|11,941|73,060|
| WebKit-Bibliotheksabbildungen-PSS, MiB |52,121|68,313|72,220|
| LLVM-Bibliotheksabbildungen-PSS, MiB |42,387|42,654|43,078|
| Gallium-Bibliotheksabbildungen-PSS, MiB |11,001|11,574|11,699|

Der stärkste zusätzliche Bestand zwischen vorbereitetem Menü und pausierter Szene liegt in privaten anonymen Abbildungen (rund247,909MiB) und im gesonderten libc-Heap (rund61,118MiB). Das sind verschiedene frische Prozesse und kurze Zustandsfenster; keine replizierte kausale Allokationsmessung. Die Gesamtbereiche während der pausierten Szene reichen von713,182 bis893,205MiB, der Aufbau ist im kurzen Fenster nicht zwingend abgeschlossen.

Anonyme Kernelabbildungen sind keine reine JavaScript-Größe und kein Beweis eines Lecks. Dort können unterschiedliche native Nutzdaten, Allokatorbestände und Zeichenpuffer liegen. Virtuelles Size von vielen GiB ist keine tatsächlich belegte RAM-Menge. Kernel-smaps und die kurz zuvor gelesene Rollup-PSS sind nicht synchron; beide Originalwerte und Lesezeiten bleiben getrennt erhalten. Die Klassen sind nach vollständiger Kernelabbildung ermittelt, keine ununterstützten Engine-Zähler als null umgewertet.

analyze_passive.py rechnet Prozesssummen, Mappinggruppen, alle Mittelwerte und Quelldaten unabhängig aus dem unveränderten Original-ZIP nach. Die Summe der Gruppenmittel entspricht dem gesamten gemessenen Mapping-PSS-Mittel. Es werden keine rawen Mappingadressen oder vollständigen Pfade veröffentlicht.

Original passiv: Artefakt13477456945,55.793Bytes, SHA256 b1787b40d2f4d58fd575463df0524ad6a474b503d23bd3da7b31465512535985.

## Vorherige Werkzeugversuche bleiben fehlgeschlagen

-42160694419 / b8e5fe0: während der Einrichtung durch korrigierten Quellstand abgelöst, cancelled; keine Spielmessung.
-42160855021 /127706267299 /7f2627e: bekannte4-MiB-Funktion und quantitative Kontrolle mit Heaptrack1.5.0 bestehen. Der Developer-Prefix wurde nicht wirksam; die Zielprozesskontrolle scheitert auf der konstanten Seite vor irgendeinem Spielaufruf. Original-ZIP13476777136:9508Bytes, SHA256703e6a1776c3f541bb18ab1cc915da60a522b0eae09b4b36d8e23e0da70bc8f2.
-42161615860 /127708377635 /ffd0aa6: temporärer bytegleicher WPE-Workerwrapper, echter ELF-/Preload-/PID-Nachweis und konstante Seite bestehen. Der Inhaltsprozess stürzt unter dieser Instrumentierung bereits beim Navigieren zum Testmenü ab. Keine vorbereitete Menü-/Spielszene und kein historischer Handy-White-Screen-Fix aus diesem Lauf. Original-ELF ist im finally nachweislich wiederhergestellt. Das Originalarchiv4285800Bytes/SHA25665feab349fe357209bd39cd5e8059a42b1bbed4b5fcd6674dc03bd822ccf4f55 bleibt gesondert dauerhaft erhalten. Die intrusive Kette wird nicht unverändert wiederholt.

Die native leere Kontrollseite enthält bereits Grafikbibliotheks-/Mesa-Aufrufpfade. Viele native Frames sind nicht namentlich aufgelöst; daraus folgt keine vollständige Besitzerzuordnung des großen Speicherbestands. Heaptrack erfasst nicht sämtliche mmap-/GPU-Allokationen und beeinflusst die Ausführung. „Unfreigegeben am Prozessende“ wird nicht als App-Leck ausgegeben.

Die anfänglich versionsübergreifend angenommene --record-only-Option wurde anhand der realen Hilfe abgesichert. Die tatsächlich installierte Version1.5.0 unterstützt sie; der gescheiterte Browserlauf ist kein CLI-Optionsfehler. Die erste Korrektur berücksichtigt zusätzlich die gelesene ältere1.4-Quelle ohne dieses Flag. Sechs lokale Fälle decken Parser, CLI-Generationen und echte Worker-Identität gegen Profiler-Hilfsshells ab.

Kein Deployment, Merge, Aliaswechsel oder Zugriffsabbau. Originale Spiel-/Ton-/Steuerungs-/Geschwindigkeitsquellen und Vercel-Konfiguration bleiben gleich. Keine aktive Spielabnahme, keine physische Smartphone-Speichermessung und kein bestätigter White-Screen-Fix.

## Sternenflächen-Kandidat ausdrücklich verworfen

CI42163353217, Testcommit e1e97690f5f2240edb7b8b882127cf89cdc57d91, Baum5e31097e6a7243e0a71f145acc60f1c78fa4da19: Der ausschließlich im Testfixture angewandte Kandidat `clip-path:inset(-12px) border-box` wird nicht in das Spiel übernommen.

WebKit26.5 besteht56 exakte Pixelvergleiche beider originaler Sternen-SVGs in vier Ansichtsgrößen, DPR1/3 und normalen/reduzierten Bewegungszuständen. Die native logische Schätzung der beiden Zeichenflächen bleibt aber identisch bei7.400.092Bytes vor und nach dem Eingriff: kein nachgewiesener Vorteil. Chromium151 scheitert bereits im ersten Fall mit2855 abweichenden Farbkanälen und maximaler Kanalabweichung73. Keine Toleranz gelockert, keine Darstellungsänderung akzeptiert. Dies ist eine isolierte SVG-/CSS-Prüfung, keine vollständige Spielabnahme und keine Smartphone-RAM-Messung.

Originale Artefakte: WebKit13477782109 /1572Bytes /SHA2567e116b22f8e4987e55a2d646b3123d3159e4b8f32267c4e62d429de06905a4aa; Chromium13477658135 /752Bytes /SHA256f6c7dec548e34ff0d02b698e98a7d8877de51d048b38c83ee93c6bd13b5b14cc. PNG-Daten wurden nur im Testprozess verglichen; keine Screenshots gespeichert.

Das intrusive Originalprofil ist als Cryptoid_Native_Profile_20261106.zip erhalten, Library-ID libfile_207095db5bf8819182f2e55df9711c3e. Keine vollständige Allokationsbesitzerzuordnung der Spielszene möglich.
