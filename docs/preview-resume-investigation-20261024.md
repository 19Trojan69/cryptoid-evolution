# White Screen mit direkter Rueckkehr ins Spiel: Untersuchung

24. Oktober 2026. **Bericht festgehalten und lokal eingegrenzt, keine neue
Spielkorrektur und kein neues Deployment.** Basis ba5d12d / Tree31b165e,
bestehende geschuetzte Preview. Weiterarbeit auf eigenem Nachweiszweig
codex/preview-resume-investigation-20261024 mit automatischem Deployment=false.
Kein Neustart auf main. Bestehender Stabilitaetszweig ce1fb59 bleibt erhalten.

## Neuer Eigentuemerbericht

Nach kurzer Pause, Fortsetzen und weiterer Spielzeit wurde die Anzeige weiss.
Danach kam direkt wieder das Spiel mit von oben einfliegenden und als sehr
schnell beschriebenen Raumschiffen. Der Eigentuemer korrigiert ausdruecklich:
**kein Home-Bildschirm dazwischen**. Spaeter trat ein normaler Spielertod ein.
Dieser Tod erklaert den vorangehenden White Screen nicht. Auf Nachfrage ist
nicht mehr sicher, ob Punkte/Leben beim Wiedererscheinen zurueckgesetzt waren.

Das private Bild zeigt die wieder sichtbare Szene Level1/Block1 mit Gegnern,
Spielerschiff und HUD sowie Browser-/Uebersetzungsleisten. Es zeigt nicht den
weissen Zwischenzustand, keine bewegte Zeitreihe, keinen Dokumentbeginn und
keinen technischen Pausegrund. Vollstaendige URL und Browseridentitaet sind
im abgeschnittenen Adressfeld nicht gesichert. Den Uebersetzer oder Browser
nicht als Ursache zuweisen. Das Bild und private Daten werden nicht hochgeladen.

## Tatsaechliche Pruefung und Unterscheidung

Originale Appquelle frontend/src Tree66f458f157bb4d52b6ebe57f92d51b52a51451b2,
index.html, Grafik/Audio und Backend bleiben byte-identisch. Frischer privater
Build besteht151 originale und8 Isolationstests, Sprachgate, TypeScript/Vite,
1740 Rumpfbilder /95.450.326Bytes. Native Browser starten und erreichen denselben
lokalen Server mit200/local-server-ok. Alle13 Originalschriften bytegeprueft.

Chromium141 und WPE26.5 bestehen je drei getrennte lokale Original-App-Ablaufe:

1. Pause waehrend des Einflugs, unveraenderte Gegnerknoten/Positionen waehrend
   der Pause, echter Fortsetzen-Klick, originaler3-2-1-Countdown, weitere aktive
   Anzeige und ausdrueckliche abschliessende Pause.
2. Derselbe Ablauf mit Wechsel zwischen393x744 und393x628 bei Pause sowie nach
   Fortsetzen. Selbes Dokument/same game-shell, erhaltene Gegnerknoten,
   kein dokumentiertes technisches Pauseereignis oder Home-Wechsel. Native
   Pixel und Zustand nach der Aufnahme erhalten.
3. Eine **bewusst angeforderte Neuladung der aktuellen /game-Route**. Danach
   beginnt im Gastmodus eine neue Spielszene mit neuen einfliegenden Gegnern,
   ohne vorher Home zu zeigen. performance.timeOrigin aendert sich; vorhandene
   Diagnosen erfassen unexpected-restart/page-reload. Es wird kein OS-Kill
   ausgeloest und kein natuerlicher White Screen behauptet.

Damit ist die Rueckkehr ohne Home fuer sich kein Beweis, dass das alte
Spieldokument weiterlief. Beide Erklaerungen fuer den Nutzerbericht bleiben
offen: neue Seite direkt auf/game oder voruebergehend weisse Darstellung im
selben Dokument. Erneuter Einflug und als schnell wahrgenommene Bewegung sind
nicht als natuerlicher Beschleunigungsfehler reproduziert. Keine FPS-/iPhone-
oder Vollkampagnenabnahme. Die vorherigen echten WPE-loop-stalls bleiben gueltig.

## Nachgewiesener Fehler ausschliesslich im Node-Testhost

Fuenf vorhandene Kadenzfaelle scheitern zunaechst vor ihrem Ablauf: Die
Prueffixture retainPreparedHulls liefert nur release(), waehrend der echte
usePreparedGameHulls-Hook eine settled-Promise erwartet. Der echte Grafikcode
liefert diese bereits korrekt. Nur der Stub in verifySimulationStability.cjs
bekommt settled:Promise.resolve([]). Keine Aenderung des Grafik-/Spielcodes.
Die erhaltenen Vorher-Logs zeigen22bestanden/5fehlgeschlagen; danach bestehen
alle27 Scheduler-/Simulations-/Formationsfaelle. Die fuenf echten GamePage-
Kadenzfaelle bestaetigen unveraenderte Schuss-/Timer-Geschwindigkeit bei60/30/20Hz,
88ms und unregelmaessiger Lieferung, unveraenderte Positionen/Timer in Pause,
keinen Verbrauch pausierter Zeit nach Resume und hoechstens eine Publikation
pro Frame. Dieser Testhostbefund ist **keine Erklaerung des Geraetefehlers**.

Der erste neue native Verifier zaehlt eine zweite anfaengliche Home-
Historybenachrichtigung faelschlich als Home-Wechsel nach Play. Die gesicherten
Samples zeigen durchgehend/game nach Play. Die Assertion wird auf die
Benachrichtigungen nach beobachtetem Spieleintritt begrenzt. Urspruenglicher
Fehllauf bleibt als ausgeschlossener Werkzeugbefund erhalten, kein Runtime-Fix.

## Schutz und naechster Beleg

Strikt>2500ms,500ms-Waechter und ausdrueckliches Resume unveraendert.
Kein automatisches Fortsetzen, Speicherdatenloeschen, Kauf oder Eigentuemerlauf.
Keine erneute Renderer-/Cache-/Zuschnittvariante. Kein main-Merge, kein neues
Preview-/Production-Deployment, keine Testnet-/Mainnet-Aenderung. Die spielbare
Preview bleibt ba5d12d; diese Untersuchung aendert ihren Inhalt nicht.

Zur Zuordnung eines weiteren Befunds werden Dokumentidentitaet/Reloadhinweis
und vorheriger technischer Zustand benoetigt; das Foto alleine reicht nicht.
Es wird keine neue lange Wiederholung verlangt und kein behobener White Screen
behauptet. JSON/Logs und zwei native Bildschirmnachweise sichern den Stand.
