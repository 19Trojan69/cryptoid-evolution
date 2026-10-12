# Rückmeldung aus dem privaten Gerätetest

Der Nutzer beobachtet spontan auftauchende Power-ups und einen schrittweisen Aufbau von Erde/Schiffen. Seine neue ausdrückliche Vorgabe: Power-ups dürfen nur nach abgeschossenen Raumschiffen entstehen. Diese eng begrenzte Korrektur ist eine autorisierte Abweichung vom zuvor eingefrorenen Mechanikstand.

## Bestätigte Power-up-Ursache und Korrektur

GamePage erzeugte über safeEarlyPickup nach 18 Sekunden Spielzeit ein frühes Power-up nahe dem Spieler, unabhängig von einem Abschuss. Dieser Pfad stammt aus der genehmigten bisherigen Testnet-Grundlage und wurde durch den Stabilitätsaudit unverändert übernommen; die private Testansicht hat ihn nicht ergänzt. Der Timerpfad wurde entfernt. Die bisherige Reservierung des Waffen-Power-ups für diesen Timer wurde ebenfalls aufgehoben, damit der vorhandene Drop-Selektor weiterhin beim tatsächlichen Abschuss Waffen auswählen kann.

Der einzige neue schwebende Power-up-Spawn befindet sich nun im bestehenden Projektil-/Gegner-Trefferpfad nach einem tödlichen Treffer. Drop-Chance, Sicherheitsabstände, Ausschluss bereits benutzter Typen, aktive Höchstzahl, Fallgeschwindigkeit und Power-up-Wirkung/-Timer bleiben unverändert. Bereits vorhandene, gespeicherte oder über einen Formationswechsel mitgenommene Pickups werden erhalten, nicht als neuer Drop nochmals erzeugt. Bossherzen und Boss-Shardbelohnungen behalten ihren getrennten bestehenden Pfad.

18 gezielte Tests bestehen, einschließlich drei neuer Regressionstests: kein unabhängiger Timer-Spawn, kein Drop bei fehlendem Gegner oder nichttödlichem Treffer, tatsächlicher Drop an der Abschussposition bei tödlichem Treffer. Die Tests führen den aus GamePage extrahierten realen Trefferpfad mit isolierten Abhängigkeiten aus. Die echte GamePage-Node-Simulation besteht erneut 30 normale Blöcke plus drei Bosse mit null verbleibenden RAF/Timern/Listenern. Produktionsbuild einschließlich i18n-Prüfungen besteht. Kein mobiler Langzeitnachweis.

Die Erhalt-Prüfung nennt simulate jetzt ausdrücklich als geändert und prüft exakt nur die oben autorisierten Änderungen. Sie behauptet nicht mehr, dass diese Funktion byte-identisch ist. Normales Spiel-Markup, alle CSS-/Originalassetdateien und die übrigen geschützten Funktionen/Audioeigenschaften bleiben unverändert.

## Nachladende Erde und Schiffe: noch nicht behoben

Die Erde ist eine unveränderte 1254×1254-PNG mit etwa 2,4 MB, die beim Mounten als asynchron dekodiertes Bild geladen wird. Schiffe verwenden zunächst ihre unveränderte Quellgrafik. Erst nach Laden, Materialberechnung und Blob-Encoding wechselt der vorhandene Hook zur fertigen Materialgrafik. Materialjobs laufen im bestehenden Cache nacheinander mit einem Yield, um große gleichzeitige CPU-/Allokationsspitzen zu vermeiden.

Diese Ladepfade existieren auch im regulären Code. Die private Testadresse hat einen getrennten Browsercache; das kann den erstmaligen Download sichtbar verstärken. Das belegt weder die konkrete Netzwerk-/GPU-/CPU-Ursache auf dem Gerät noch eine ausschließlich testbedingte Verzögerung. Der Nutzerbefund wird deshalb nicht als normaler gewünschter Effekt oder bereits für Produktion behoben behandelt. Weder Grafikauflösung noch Effekte, Materialfarbe, Animation oder Renderingfrequenz wurden zur Kaschierung reduziert. Eine zuverlässige Ressourcenbereitschaft vor der Anzeige muss noch mit kaltem Cache und auf dem Gerät geprüft werden; ein früherer Unit-Test oder unveränderte Quelldateien beweisen das nicht.

Kein Testnet-/Mainnet-Release. Die öffentliche Freigabe bleibt vom echten Datenbankbackup, isolierten Restore, ausdrücklicher Freigabe und den offenen Geräteprüfungen abhängig.
