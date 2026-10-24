# WebKit-Spielablauf: Diagnose-Luecke im Pruefwerkzeug geschlossen

Stand 24. Oktober 2026: **Pruefwerkzeug ergaenzt und lokal getestet, keine neue
Spiel-Runtime-Korrektur und keine Veroeffentlichung.** Der konkrete Grund der
historischen kalten WebKit-Pause bleibt unbekannt. Er wurde hier nicht erfasst.

## Ausgangspunkt

Weiterarbeit auf `codex/white-screen-startup-recovery-20261023`, gesicherter
Ausgangscommit `23bb102c672bae89d7514a1b2e920a9a7cffea8e`, Tree
`a5b762d1f4fcd6387987a644ea71e2c38a766489`. Enthaltene gepruefte Runtime:
`d84a4447e3318f06d4f28ccf7178adee28224295`.

Die vorherigen Anweisungen und Nachweise in `frontend/AGENTS.md`, den Startup-,
Idle-Display-, IDB-Callback- und Static-Hull-Dokumenten bleiben gueltig. Keine
Rendering-Experimente wurden wieder aufgenommen. Die gespeicherte kalte
WebKit-Probe endet nach Home/Play mit einem durch `.pause-settings-overlay`
blockierten Pause-Klick. Ihr JSON enthaelt weder Diagnoseeintraege noch ein Bild
dieses Zustands. Das bisherige `finally` schliesst den Kontext ohne diese Erfassung.
Das erklaert eine Luecke im Pruefwerkzeug, nicht den Ausloeser der Spielpause.

## Umsetzung

`frontend/scripts/startupLifecycleEvidence.mjs` liest ausschliesslich den
bestehenden Schluessel `cryptoid_game_diagnostics_v1`. Es erfasst hoechstens 20
technische Eintraege mit erlaubten Feldern, Zeitstempel, Dokumentbeginn,
Sichtbarkeit, Spiel-Pausenattribut, Dialogtext und -geometrie sowie das Element,
das am Mittelpunkt des Pause-Knopfs tatsaechlich getroffen wuerde. Historische,
vor dem Ablauf liegende, zukuenftige und nicht als Unterbrechung definierte
Eintraege werden nicht als aktuelle Unterbrechungsgruende ausgegeben. Ein
fehlender Eintrag bleibt fehlend; daraus wird kein `loop-stall` erfunden.

Der bestehende `verifyStartupRecovery.mjs` erfasst Zustand vor Play, vor Pause,
nach der angeforderten Pause, nach Resume und auf Home. Eine unerwartete Pause
oder eine aufgezeichnete technische Unterbrechung fuehrt zum Fehlschlag, nicht
zu automatischem Resume. Fehler werden vor `context.close()` zusammen mit einem
weiteren Zustandsversuch und einem nativen Screenshot-Versuch erfasst. Der
JSON-Bericht wird vor dem Browserabbau geschrieben. Fehlende/gesperrte/defekte
Diagnosen, Erfassungs-Timeouts und gescheiterte Screenshots bleiben unterscheidbar.
`startupPassed` und `gameLifecyclePassed` werden getrennt gefuehrt.

Die Beobachtung ist ausschliesslich lokales Testwerkzeug. Keine Imports in die
Anwendung, keine Speicher-Schreibzugriffe des Sammlers, keine neuen Spieltimer,
kein automatisches Fortsetzen, kein erzwungener Klick und kein Absenken des
Stillstandsschutzes. Der unveraenderte Spielcode behaelt strikt >2500 ms und den
bestehenden 500-ms-Prueftakt. Die zusaetzlichen Zustandsabfragen haben Messaufwand;
sie sind keine FPS-, Speicher- oder Langlauf-Abnahme. Zustand und Screenshot
werden nacheinander aufgenommen, nicht atomar.

## Tatsächlich ausgefuehrte Pruefungen und Grenzen

- 20 neue Node-Tests bestanden, null Fehler und null Skips. Sie fuehren den
  tatsaechlichen Sammler in einem kontrollierten Dokumentmodell und seine
  Fehlerpfade mit kontrollierten Page-Objekten aus. Die letzte Pruefung prueft
  die Integration strukturell im echten Pruefskript. Das ist kein nativer Spieltest.
- Syntaxpruefung aller vier betroffenen JavaScript-Pruefdateien bestanden.
- Der native Chromium-Versuch (144.0.7559.96) scheitert schon bei Navigation zur
  lokalen synthetischen Testseite: `net::ERR_BLOCKED_BY_ADMINISTRATOR`.
  **Null abgeschlossene native Testfaelle, keine neuen Bildschirmnachweise.**
  Diese Sperre wurde nicht ueber andere URLs, Browserflags oder Dateizugriffe
  umgangen. Die synthetische Fixture prueft ohnehin nur das Pruefwerkzeug,
  nicht Cryptoid-Spielablauf oder historische White Screens.
- Fuer das lokal installierte Playwright-Paket fehlt die WebKit-Executable.
  Der vollstaendige Checkout konnte wegen fehlender GitHub-DNS-Aufloesung im
  Container nicht wiederhergestellt werden. Relevante Textdateien wurden ueber
  den GitHub-Connector gelesen; Original-Verifier und package.json wurden lokal
  gegen ihre exakten Git-Blob-Pruefsummen abgeglichen.
- Kein neuer vollstaendiger Produktionsbuild, keine neue Projekt-TypeScript-
  oder ESLint-Abnahme und kein neuer WPE-Spielablauf werden behauptet. Die
  bisherigen 131 Build-Tests und 14 nativen Startfaelle gehoeren ausschliesslich
  zum zuvor dokumentierten Stand. Die neuen Tests sind dem bestehenden
  `test:startup-recovery`-Build-Gate hinzugefuegt, aber der gesamte Build lief hier
  nicht erneut.

## Fortsetzung und Schutzgrenzen

In einer fuer den vorhandenen nativen Testhost geeigneten Umgebung den echten
Produktionsbuild mit Originalschriften und `CRYPTOID_STARTUP_ROUTE_FLOW=1`
ausfuehren. Zuerst `lifecycleSamples`, `failure.stage`, `recordedInterruptions`,
`diagnostics.state` und `failureScreenshot` auswerten. Bei einem erneuten
blockierten Pause-Klick ist der Grund nur dann konkret aufgezeichnet, wenn ein
entsprechender aktueller Diagnoseeintrag vorhanden ist. Der sichtbare Dialog
allein ist kein Beleg fuer einen Loop-Stall. Keine Wiederholungs-Kampagne,
Kaeufe, geloeschten Browserdaten oder neuen OS-Berichte vom Eigentuemer verlangen.

Alle Aenderungen betreffen Pruefskripte, den Testbefehl und diese Nachweise.
`frontend/src`, `frontend/index.html`, Grafiken, HUD, Audio, Physik, Timing,
Schwierigkeit, Spielstaende, Kaeufe und Backend sind unberuehrt. Automatisches
Deployment bleibt fuer den bestehenden Zweig deaktiviert. Kein Merge, keine
Veroeffentlichung und keine Bewegung fester Release-/Rollbackreferenzen.

Die historischen iPhone-White-Screens, ihre konkrete Speicherursache, der
kalte WebKit-Pausegrund und der Langzeit-Stabilitaetsnachweis bleiben offen.
