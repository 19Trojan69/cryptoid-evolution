# Cryptoid Evolution – Entwicklungsstand vom 26. September 2026

## Übernommener Stand

Ausgangspunkt dieses Arbeitsschritts: `main` bei Commit `3c715bdbc08e0c7ee3494070941b53db50b91379`.

Bereits vor diesem Arbeitsschritt vorhanden:

- `601769c`: mehrsprachiges Systemmenü.
- `a193677`: erweiterte Boss-Zerstörung.
- `3c715bd`: überarbeitetes HUD mit getrennten Bezeichnungen für Waffenstufe und Spiellevel.
- Schwierigkeitskurve bis Level 500; drei interne Runden je Spiellevel und anschließender Boss.

Diese Änderungen wurden nicht erneut implementiert oder zurückgesetzt.

## Dieser Arbeitsschritt

Die optionalen Vollbild-Aufrufe sind gegen fehlende Browser-APIs, abgelehnte Promises und unmittelbar geworfene Fehler abgesichert. Der native Methodenempfänger und die direkte Ausführung innerhalb des Benutzerereignisses bleiben erhalten. Fehler beim Verlassen des Vollbildmodus dürfen den nachfolgenden Aufrufer nicht abbrechen.

Neu hinzugefügt wurden 14 Vollbild-Tests und sechs Regressionstests für die vorhandene Progressionslogik. Sie prüfen alle 500 Schwierigkeitsstufen, gleichmäßige Steigerung und Sicherheitsgrenzen, Gegner-Zusatztreffer, Runden-/Boss-Zuordnung, Nummerierung über Level 500 hinaus sowie Boss-Einflug und Schussintervalle bei mehreren Bildschirmbreiten.

Keine Änderung an Spielbalance, HUD-Layout, Schiffen, Eigentum, Shard-Guthaben, Pi-Preisen, Zahlungen oder Spielstandspeicherung.

## Tatsächlich geprüfter Umfang

Die lokal geprüften Ausgangsdateien wurden per Git-Blob-SHA mit den abgerufenen GitHub-Dateien abgeglichen.

Unter Node.js 22.16.0: **20 Tests bestanden, 0 fehlgeschlagen**. Vor der Vollbildkorrektur schlugen vier der neuen Vollbild-Tests fehl. Die vier verwendeten TypeScript-Module bestanden außerdem eine isolierte strenge Typprüfung.

Ausführung ab `frontend`:

```sh
node --experimental-strip-types --test src/pages/gameFullscreen.test.mjs src/pages/progressionRegression.test.mjs
```

Dies sind Logiktests mit simulierten Browser-APIs, kein vollständig durchgespielter 500-Level-Lauf. Ein vollständiger Frontend-Build, sämtliche bestehenden Tests, eine visuelle Prüfung auf echten Mobilgeräten sowie Pi-Anmeldung und Testzahlungen wurden in diesem Arbeitsschritt nicht durchgeführt.

## Noch nicht als erledigt behandeln

- Die gewünschte allmählich wachsende Gegnerzahl ist noch nicht umgesetzt: `formationLayout` verwendet weiterhin sechs Plätze auf schmalen und fünfzehn auf breiteren Spielfeldern. Die vorhandene Schwierigkeitskurve allein ändert diese Anzahl nicht.
- Die Abschaffung des Shard-Kaufsystems und die Festlegung fairer Pi-Preise bleiben ein eigener Arbeitsschritt. Bestehendes Eigentum und Guthaben nicht ohne Migrationsregel verändern.
- Neue bezahlte Speicherfunktionen oder automatische Löschungen wurden nicht aktiviert.
- Das neue HUD, längere Übersetzungen und die Boss-Zerstörung brauchen weiterhin eine gemeinsame visuelle Prüfung auf Mobilgeräten.

Bei Widersprüchen zwischen älteren Roadmap-Abschnitten und neueren ausdrücklichen Nutzerentscheidungen gelten die neueren Entscheidungen. Nicht aus historischen Roadmap-Texten ableiten, dass alte Coins, Shards oder permanente Waffen erneut eingebaut werden sollen.
