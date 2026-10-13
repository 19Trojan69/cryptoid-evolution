# Stabilitätskorrektur auf dem offiziellen Testnet-Stand — 13. Oktober 2026

## Ausgangspunkt und abgegrenzter Auftrag

Am 13. Oktober wurden die Live-Zuordnungen über Vercel geprüft:
- Testnet: cryptoid-evolution-testnet.vercel.app; READY dpl_FTwoRZ4GApix1tyJvMPV5XsPnveV; Commit 1c1c7f9b6c5e8ac7d41b9bf1c4b44036cc196220.
- Mainnet: cryptoid-evolution.vercel.app; READY dpl_4hwbUd5xYqetnh5VHfFZ7H6pxwhe; Commit 907d2a7363345d00f0f90c54402bf04e887b64d9.

Dies ist eine datierte Zuordnung, keine dauerhafte Aussage zum Live-Stand.
Der neue Branch codex/live-stability-reset-20261013 beginnt direkt bei 1c1c7f9.
Die zurückgezogenen Pakete PR 160/161 wurden nicht übernommen. Bestehende Branches,
Commits und andere Arbeitsbereiche bleiben erhalten.

Der Nutzer meldete einen erneuten Abbruch beim Start des neuen Levels nach dem
dritten Boss. Exakte URL/Build-ID dieses Abbruchs, Browserversion, Gerät,
Spieldauer und Lifecycle unmittelbar davor sind nicht bestätigt. Die Screenshots
allein beweisen diese Angaben nicht. Ursprünglicher Abbruch: weiterhin offen.

## Bestätigte Fehler und gezielte Korrekturen

1. GamePage erzeugte einen schwebenden Waffen-Pickup auch allein durch
   intro.clock >= intro.weaponDue. Ein echter, kompilierter GamePage-Test ohne
   Abschüsse schlägt auf der Ausgangsversion fehl. Dieser Timer-Pfad wurde entfernt.
   Der bestehende Abschuss-Drop ist der einzige normale Kampf-Pickup-Erzeuger;
   die künstliche Reservierung des Waffentyps für den Timer entfällt.
   Bestehende Abschusswahrscheinlichkeit, Caps, Effekte, Aufsammeln und 20-s-Timer
   bleiben erhalten. Nicht jeder Abschuss muss einen Pickup liefern. Boss-/Bonus-
   Belohnungen und gekaufte Waffen bleiben unverändert.

2. Bei Fehlern während Canvas-Erstellung/-Dimensionierung/getContext konnte der
   Image.onload-Callback außerhalb seines try-Blocks werfen. Die Bild-Promise
   blieb unaufgelöst und blockierte die serielle Schiffbild-Aufbereitung.
   Drei künstlich injizierte Host-Fehler reproduzieren dies im Original.
   Der Callback lehnt jetzt kontrolliert ab, gibt teilweise angelegte Canvas-
   Flächen frei und entfernt nur seine eigene fehlgeschlagene Cache-Promise.
   Eine spätere Anfrage kann erneut versuchen. Pixel-/Farb-/Auflösungsberechnung
   bleiben identisch. Bereits sichtbare/pinnte Verbraucher werden nicht abgebrochen.

3. Aufbereitung konnte für inzwischen unmontierte Schiffvarianten weiterlaufen.
   Noch nicht gestartete, nicht mehr gehaltene Aufträge werden vor Bild-/Canvas-/
   Blob-Allokation beendet. Der Test misst davor unnötige Allokation, danach null.
   Bedingtes Entfernen verhindert, dass ein alter Auftrag den neuen verdrängt.

4. Die Save-Outbox hatte keinen Druckindikator für dauerhafte Netzwerkstörung
   mit nicht zusammenführbaren Belohnungsbarrieren. Außerdem blieb durable nach
   einem Storage-Fehler auch nach erfolgreicher Speicherung false.
   Die bestehende Queue meldet nun Druck bei ausstehendem Inhalt und nicht
   haltbarer Speicherung, 32 Einträgen oder geschätzten 2 MiB serialisierter Daten.
   GamePage pausiert über den vorhandenen technischen Pausepfad, ohne weiteren
   Checkpoint rekursiv einzureihen und ohne Daten/Belohnungen zu verwerfen.
   Resume ist bis zur Entlastung gesperrt; erfolgreiche Persistenz setzt durable
   zurück. Das ist ein Produzenten-Schutz, kein harter Speicherallokationsdeckel.
   Backend-Idempotenz, Queue-Coalescing und Upload-Reihenfolge sind unverändert.

Diese Fehler sind technische Belege, aber keiner ist als Ursache des gemeldeten
mobilen Levelwechsel-Abbruchs nachgewiesen.

## Tests und Vorher-/Nachher-Messung

- 383 Frontend-Tests bestanden, darunter 9 neue Regressionstests; Original: 374.
- 106 Backend-Tests bestanden; Backend-Quellcode unverändert.
- Produktions-Build inklusive TypeScript/i18n bestanden; bestehende Chunkwarnung.
- Bestehender Engine-Durchlauf aller 500 Stufen mit 50 Bossen bestanden.
- Echte GamePage-Node-Simulation: 30 normale Blöcke plus drei Boss-/Bonuszyklen,
  Übergang nach dem dritten Boss und 771,764 simulierte Sekunden bestanden.
- Dichte Szene: Spitzen 6 Gegner, 82 eigene und 80 feindliche Geschosse,
  14 Effekte. Nach Stress Freigabe geprüft. Pause/Hintergrundwechsel erhalten
  aktive Timer; Checkpoint-Wiederherstellung geprüft. Nach Unmount: null
  RAFs, Timer und Listener.
- Save-Stresstest: 1000 gleichartige Checkpoints zusammengeführt; 30
  Belohnungsbarrieren erhalten; 32 Upload-Einträge nach Entlastung genau einmal.
  Storage-Verweigerung, große/restaurierte Queue und Resume separat geprüft.
- Die vier Canvas/Lifetime- sowie vier Queue/Pressure-Tests schlagen gegen
  1c1c7f9 erwartungsgemäß fehl und bestehen gegen die Korrektur.

Identischer Node-Harness, Seed 20261012, erzwungene Clears/zusätzliche Leben,
Präsentation/Audiohardware/API ersetzt. V8-Heap nach erzwungenem GC:

| Messung | Original | Korrektur |
| --- | ---: | ---: |
| erster Snapshot, Bytes | 30.714.688 | 30.680.504 |
| letzter Snapshot, Bytes | 31.192.072 | 31.196.976 |
| höchster Snapshot, Bytes | 31.376.104 | 31.412.480 |
| Gegner/eigene/feindliche Geschosse/Effekte Spitzen | 6/82/80/14 | 6/82/80/14 |
| RAFs/Timer/Listener nach Unmount | 0/0/0 | 0/0/0 |

Kein allgemeiner Heap-Rückgang belegt: die Werte sind ähnlich. Der konkrete
Allokationsgewinn betrifft abgebrochene unbenutzte Bildjobs, nicht diesen
Präsentations-stubbed Harness. Keine echte mobile Framezeit-/GPU-/Canvas-
Speichermessung verfügbar; Node-Zeit und simulierte Delta-Werte sind keine FPS.

## Erhalt von Darstellung und Mechanik

frontend/scripts/verifyLivePreservation.cjs vergleicht direkt mit 1c1c7f9.
Das komplette normale GamePage-main-Markup ist byte-identisch (SHA-256
c74faea0c427d485dc149771af8b77af307047ac91e0d195ebe4ef5c0569cc16).
CSS, öffentliche Assets, Audio-/Musikcode, Shader, Schiffgrößen, Bossansicht,
Starfield, SectorBackdrop, Sektorverwaltung, Formations-/Bewegungs-/Boss-
Funktionen, Kampfeigenschaften und Speicher-/Restore-Funktionen sind identisch.
simulate unterscheidet sich nur im ausdrücklich gewünschten Pickup-Ursprung;
step nur im Druckschutz. Schießen, Einflugzeit, Schwierigkeit, Treffererkennung
und sichtbare Aktualisierungsfrequenz wurden nicht gedrosselt.

Dies ist ein Quellcode-Erhaltungsnachweis, keine Pixel-/Klanggarantie auf realer
Hardware und keine Garantie der Absturzfreiheit.

## Offene Hypothesen und Testgrenzen

Kein echter Pi Browser/iOS-WebKit-Langzeittest erfolgt. React-Fehler außerhalb
der Scene-Boundary, POP/navigate(-1), Auth-Redirect, Reload/Browser-Recovery,
GPU-/Speicherdruck oder OS-Prozessbeendigung sind weiterhin mögliche, nicht
bewiesene Erklärungen. Wärme und fehlerfreie Serverlogs beweisen nichts.
Zwei öffentlich online stehende Builds führen nicht selbst zwei Spielschleifen
auf einem Gerät aus. Die alte private Testansicht enthält zurückgezogene
Experimente und ist kein Testnachweis für diesen neuen Branch.

## Konkreter Gerätetest vor einer Veröffentlichung

Nach isolierter Bereitstellung des exakt identifizierten neuen Builds:
1. Gerät/OS/Pi-Browser-Version, URL, Build-ID, Startzeit und Start-Level notieren;
   nur eine aktive Spielansicht, keine echten Käufe im isolierten Test.
2. 30–60 Minuten spielen, mindestens 30 Blöcke mit drei Bossen. Insbesondere den
   neuen Levelstart nach Boss drei beobachten, Meme Nebula Block 5/9 und höhere
   Levels, verschiedene Formationen, viele Geschosse/Explosionen und Power-ups.
3. Fünfmal Pause/Resume; dreimal 15–30 s Hintergrundwechsel. Mehrmals gesichert
   speichern und neu laden; Leben, Shards, Punkte und aktive Waffentimer vor/nach
   vergleichen. Kein doppelter Reward/Highscore; Wiederholung desselben Saves testen.
4. Kurz ohne Abschüsse spielen: keine neu erzeugten schwebenden Pickups.
   Danach Abschussposition und Pickup-Ursprung prüfen; vorhandene weiterfallende
   Pickups dürfen aus einem vorherigen Abschuss erhalten bleiben.
5. Bei Störung Uhrzeit, Level/Block/Phase, sichtbare Pause/Fehler/Startseite und
   vorausgegangenen Hintergrundwechsel notieren. Wenn möglich vorhandene lokale
   Diagnosen über Entwicklerwerkzeuge exportieren, ohne Konto-/Tokeninformationen.
   Kein neuer Diagnose-Download-Link oder automatischer Upload wurde eingebaut.
6. Reale Framezeiten/Speicher nur mit verfügbaren WebKit-/Gerätewerkzeugen messen;
   Vorher und Nachher auf demselben Gerät/Build-Szenario vergleichen. Fehlt dieser
   Zugriff, subjektive Ruckler separat notieren und nicht als Messwert bezeichnen.

## Backup, Rücksetzweg und Veröffentlichung

Keine Testnet-/Mainnet-Veröffentlichung und kein main-Merge vorgenommen.
Automatische Vercel-Git-Deployments dieses Entwicklungsbranches sind in
vercel.json gesperrt. Datiert erhaltene Ausgangsbasis ist 1c1c7f9 im separaten
Referenz-Worktree; live Deployment-IDs oben dokumentiert. Für Code-Rücknahme
den neuen Branch nicht mergen bzw. nach Freigabe genau auf diese Ausgangsbasis
zurückgehen; keine destruktive Wiederherstellung nötig.

Datenbankbackup, Abdeckung, Retention und isolierte Wiederherstellung weiterhin
nicht verifiziert. Vor öffentlichem Release zusätzlich einen datierten Remote-
Rücksetzref, Verfügbarkeit der alten Deployment-Artefakte, tatsächliche Datenbank
und vollständigen Backup-/Restore-Nachweis bestätigen. Ein Source-Commit oder
Gameplay-Checkpoint erfüllt diesen Schutz nicht. Ohne Nachweis kein Release.

