# Kurzer WebKit-Lebenszyklus: Browser, Menü, Spielszene, Ausstieg

Die erste erfolgreich abgeschlossene Messung verwendet den unveränderten Gerätekandidaten 9f3bf451. Der erste Container-Versuch scheiterte vor dem Spiel an Git-Verzeichnisbesitz; die nachfolgende eng begrenzte Korrektur und beide CI-Läufe sind im Beleg genannt. Keine Abnahmeprüfung wurde abgeschwächt.

Linux-WebKit 26.5, Playwright 1.62.1, emulierte 430 × 825 CSS-Pixel bei DPR 3. Kein physisches iPhone, kein Pi Browser. Je Phase externe Prozess-PSS-Messpunkte im Sekundenabstand, keine erzwungene GC oder Heap-Dumps. Die Mittelwerte umfassen alle klassifizierten Browser-Unterprozesse, nicht nur Spielobjekte oder GPU-Speicher.

| Phase | Browser-PSS Mittel MiB | Webprozess-PSS Mittel MiB |
|---|---:|---:|
| Leeres Dokument | 357,87 | 218,56 |
| Menü vor Vorbereitung | 466,74 | 300,87 |
| Menü nach Vorbereitung | 529,87 | 359,28 |
| Boss-Szene zunächst pausiert | 888,00 | 718,17 |
| Laufendes Originalspiel | 1089,64 | 922,50 |
| Home, vorhandene Testbrücke noch gehalten | 877,10 | 709,97 |
| Home nach Freigabe der Testbrücke | 811,43 | 644,41 |
| Nach Navigation auf about:blank | 805,94 | 638,61 |

Der größte Anstieg erfolgt im selben Webprozess PID 1009; Netzwerk- und Browserhauptprozess erklären diesen Anstieg nicht. Die Zunahme ist bereits beim Szenenaufbau deutlich. Das lenkt die weitere Zuordnung auf native Ressourcen beim Aufbau und ersten Rendern, beweist jedoch weder ein bestimmtes Speicherleck noch die physische Absturzursache. Kurze Ruhefenster beweisen keine abgeschlossene GC.

**Korrektur einer Rohdatenbeschriftung:** Die unveränderten Originaldaten nennen die letzte Phase `blank-after-document-destruction`. Tatsächlich geprüft wurden nur Navigation und neue timeOrigin. Das belegt keine Vernichtung des alten Dokuments und keinen leeren Seitencache. Aus den verbleibenden Bytes wird deshalb kein reines Spiel-Leck abgeleitet. Der anschließende gesonderte native Zuordnungslauf fügt einen echten Kontextschluss hinzu.

Regulärer Ausstieg und normaler Berichtsexport bestanden. criticalMatchesLatestStopwatch ist true; Laufkennung, Quellkennung, ended und elapsedMs stimmen vollständig überein. Ressourcenpunkt gehört zum Lauf; error und unhandledrejection wurden im normalen Test nicht aufgezeichnet. Dies ist keine Aussage über Betriebssystem-Abbruchursachen oder Fehlerfreiheit.

Kein neues Deployment, keine Änderung an Grafik, Ton, Steuerung, Spielzeit oder Runtime-Quellbäumen; Produktion und öffentliche Testnet-Ziele wurden nicht verändert. Original-ZIP und abgeleitete Prozessübersicht bleiben gemeinsam erhalten.
