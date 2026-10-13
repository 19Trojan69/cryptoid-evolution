# Offizielles Testnet als private Referenz, 13. Oktober 2026

## Entscheidung und tatsächlicher Live-Stand

Letzte Nutzeranweisung: „Es soll ja genauso laufen, wie es aktuell im Testnet offiziell läuft.“ Die private Referenz verwendet deshalb die vollständige offizielle Frontend-Grundlage unverändert; zusätzliche private Größen-, Formations-, Bewegungsbereichs- und Timingberechnungen sind darin entfernt. Die getrennt entwickelten Stabilitätskorrekturen bleiben in Draft-PR160 erhalten. Diese Referenz ist kein neuer Behebungsnachweis für den ursprünglichen Absturz.

Aktuelle Vercel-Prüfung: https://cryptoid-evolution-testnet.vercel.app löst auf READY-Deployment **dpl_FTwoRZ4GApix1tyJvMPV5XsPnveV**, Projekt **prj_JpvzU9ZS8bFkn9jZgE51Gct8TZpF**, Commit **1c1c7f9b6c5e8ac7d41b9bf1c4b44036cc196220** auf. Die Zuordnung stammt aus dem aktuellen authentifizierten Deployment-Aufruf, nicht allein aus einem alten Bericht. Öffentliche HTML-/Spiel-/CSS-Dateien wurden zusätzlich geladen; die Haupt-CSS stimmt bytegenau mit der Referenz überein. Kein öffentlicher Deployment-, Alias-, Mainnet- oder Main-Merge-Aufruf wurde vorgenommen.

## Bestätigte Abweichung der bisherigen privaten Ansicht

Die vorherige private Ansicht enthielt responsive sichtbare Hull-Normalisierung mit Feldhöhenfaktor und eine neue Begrenzung einschließlich vollem Shield-Rand. Das entsprach dem offiziellen Code nicht und erklärt die abweichend kleinen Gegner sowie eingeschränkte Spielerfläche; es beweist keine Ursache des ursprünglichen mobilen Abbruchs. Die anschließend versuchte neue Geometrie wurde weder veröffentlicht noch als behoben behauptet. Ihre acht geänderten Dateien sind verlustfrei als `unpublished-readable-geometry.patch` gesichert; der Audit-Branch wurde nur in diesen acht bekannten Experimentdateien auf seinen vorherigen Stand zurückgebracht.

## Implementierte Referenzkorrektur

Eigener lokaler Referenzbranch `codex/official-testnet-reference-20261013` bei exakt 1c1c7f9; keine Veröffentlichung dieses GitHub-Branches. Tracked Frontend und Backend sind unverändert gegen diesen Commit. Die private Site baut daraus das echte Frontend, ohne Austausch von GamePage, Größen, Formationen, Steuerung, Feuerrhythmus, Projektiltempo, Kollisionen, Bossen, Grafik oder Audio.

Die bestehenden isolierten Transformationen betreffen nur useAuth, den Axios-Adapter und HTML-Netzwerk/Pi-SDK-Konfiguration: Gastmodus, gesperrte Konten-/API-/Zahlungsaufrufe, Testnet-Auswahl, eigener Origin und Browser-Speicher. Konten, serverbestätigte Saves, Käufe und Online-Highscores können daher in dieser Ansicht nicht geprüft werden. Kein Unverwundbarkeitsmodus oder beschleunigter Spieltimer.

Die offizielle Referenz übernimmt ausdrücklich auch die alte automatische frühe Power-up-Ausgabe. Die später genehmigte Abschuss-only-Korrektur, zusätzliche 25%-Einflugverlangsamung, größere Bossbegleiter und neuere Stabilitätskorrekturen bleiben im Draft erhalten und sind **nicht** Bestandteil dieser exakten Referenz. Gleichheit mit dem offiziellen Stand und Anwendung späterer Gameplay-Korrekturen dürfen nicht gleichzeitig behauptet werden.

464 Originaldateien aus public, einschließlich HD-Grafiken, Audio und Fonts, wurden beim Build bytegenau verglichen. Alle sechs erzeugten CSS-Hashes sind im Provenance-Nachweis enthalten; Haupt-CSS SHA256 c93f34d1220e0e84a74e17db399c91d51a23c18b07c32289124c0eeaa76b91cd ist direkt gegen HTTP geprüft. Einzeiliger Original-HUD, unsichtbare Testnet-Marker, Original-Schiffgrößen, neun Formationen/Einflugsarten, langsames Pendeln und offizielle Einflugdauern 1430/2090 ms stammen direkt aus dem geprüften Quellcode.

## Tests und Messgrenzen

- 374 Frontend-Tests, 106 Backend-Tests, jeweils null Fehler/Ausschlüsse.
- Frontend-Produktions-Build einschließlich TypeScript/i18n und Backend-TypeScript-Build erfolgreich; bestehende Warnung über große Vite-Chunks bleibt. Der erste Testlauf vor Backend-Build konnte das erwartete generierte playerSave-Modul nicht laden. Nach erfolgreichem Backend-Build wurde die gesamte Suite erneut ausgeführt und bestanden; kein fehlender Test wurde ausgelassen.
- Reale GamePage-Node-Simulation: 30 normale Blöcke, drei Bosse, 37 Gruppen, neun Einflugarten, 771,764 simulierte Sekunden; Meme Nebula 5/9 enthalten. Peaks 6 Gegner, 82 eigene/80 feindliche Geschosse und 14 Effekte im injizierten Stress. Stressobjekte freigegeben; Pause, Hintergrund, Fehlerpause und wiederholte Checkpoint-Wiederherstellung erfolgreich. Nach Unmount null RAF, Timer oder Listener.
- GC-bereinigter Node-Heap an Übergängen: 29,174–29,949 MiB; erster/letzter Punkt 29,264/29,753 MiB. Messung schließt DOM, Bilder, Audiohardware, GPU und mobilen Prozessspeicher aus. Es wurde keine Leistungsverbesserung gegenüber dem offiziellen Stand erwartet oder bewiesen, da der Spielcode identisch ist; keine behaupteten mobilen Framezeit-/FPS-Werte.
- Tatsächlicher Engine-Harness: alle 500 Stufen einschließlich 50 Bossen und Bonusrunden bis Victory; Power-up-/Pause-/Save-/Once-only-Assertions bestanden. Beide Simulationen verwenden erzwungene Clears, zusätzliche Leben und UI-/Audio-/API-Stubs und ersetzen keinen 30–60-Minuten-Gerätetest.

Kein nativer Pi Browser/WebKit, kein Geräte-Pixelvergleich und keine Audiohardware-/GPU-/Langzeitmessung in dieser Umgebung. Die erfolgreiche private Veröffentlichung prüft die Bereitstellung, nicht die mobile Laufqualität. Der ursprüngliche Rücksprung zur Startseite bleibt nicht reproduziert und nicht als sicher behoben nachgewiesen; OS-Prozessbeendigung, Reload, Navigation oder bisher nicht erfasster Render-/JS-Fehler bleiben offene Ursachen. Der vorhandene konkrete Gerätetest steht in `docs/stability-audit-device-test-2026-10-12.md`; für diese Referenz ist dort als Build 1c1c7f9 einzutragen, echte Konten-/Save-Tests benötigen ein später freigegebenes separates Testkonto.

## Private Bereitstellung, Sicherung und Rücksetzweg

https://cryptoid-stability-private-20261012.xwsk9s27cg.chatgpt.site wurde ausschließlich als bestätigte Owner-private Site aktualisiert. Native Veröffentlichung erfolgreich am 13. Oktober 2026, 06:38:16 UTC. Pushed Site-Source **ddb04a515a2f46e60cc3d353af038c6db4b53a39**, gespeicherte Version und Deployment in `deployment.json`. Der Site-Source-SHA bezeichnet den isolierten Builder/Output; der enthaltene Spielcode-Commit ist 1c1c7f9, keine Gleichsetzung dieser unterschiedlichen Identitäten.

Vorherige private Version appgprj_6acd33650fcc8191a7e718e40b8acea5~appgver_195ba74ca99c8191a5ec7aa053d8f083 sowie Audit-Code bei lokal169e3ab/remote78253f5 bleiben erhalten. Der zusätzliche lokale Code-Rücksetzpunkt `backup/readable-formations-20261013-78253f5` hält den vorherigen Audit-Stand. Referenz kann aus dem unveränderten offiziellen Commit erneut gebaut werden. Keine automatische Rücksetzung vorgenommen.

Datenbankbackup und isolierter Restore der tatsächlich verwendeten Live-Datenbank bleiben **nicht verifiziert**; siehe `docs/backup-recovery-2026-10-12.md` und Atlas-Bericht. Ein Git-Ref oder Gameplay-Checkpoint ersetzt das nicht. Keine öffentliche Testnet-/Mainnet-Veröffentlichung autorisiert oder vorgenommen.

Rohdaten: deployment.json, provenance.json, simulation.json, campaign-500.json im gleichnamigen Unterordner. Neue Referenz ersetzt nur die private Ansicht; historische Messergebnisse gelten weiterhin ausschließlich für ihren dokumentierten Build.
