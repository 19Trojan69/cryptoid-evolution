# HD-Startseite mit Erdennetz – 10. Oktober 2026

## Stand und Umfang

Lokal umgesetzt auf `codex/hd-home-network-20261010`, ausgehend von
`c6e9644f2427acd07f5a10211ccc123425342317`. Dieser Stand enthält sowohl die
Verbesserungen von `main` als auch die Profil-, Menü-, Admin-, Audio- und
Zahlungsnachweis-Änderungen der späteren Arbeitsbranches. Vorhandene Änderungen
wurden erhalten. Im Repository wurden keine `AGENTS.md` gefunden.

Diese Änderung betrifft die zuletzt freigegebene HD-Startseite. Die zusätzliche
Aufgabenliste für kompaktere Hangar-/Shop-Versionsbuttons und metallischere
Schiffsfarben ist nicht Bestandteil dieser Startseitenänderung.

**Nicht veröffentlicht:** Kein Push, keine Bereitstellung und keine Änderung an
Testnet oder Mainnet. Die bisherige lokale Arbeitskopie wurde nicht überschrieben.

## Darstellung und Verhalten

- Separate HD-Hintergrundgrafik ohne eingebrannte Texte oder Buttons;
  WebP, 1225 × 1284 Pixel, 333.498 Byte. Das kleinere Schiff ist hell in Silber/Cyan
  dargestellt. Schiffe, Sterne und Erdtextur bleiben statisch.
- Dichtes, kugelförmiges Goldnetz auf der Erde: 263 sichtbare Linienabschnitte,
  davon 217 durchgängig befahrbare Verbindungen. Die Vordergrundschiffe maskieren
  das Netz und die Ströme, sodass diese hinter den Schiffen liegen.
- Zwölf strahlende Ströme, sechs blau und sechs rot. Zufällige Weiterleitung
  bevorzugt weniger besuchte Verbindungen und verteilt die Bewegung über die
  sichtbare Erdoberfläche. Kreuzungspunkte blitzen kurz auf.
- Echte Begegnungen gegnerischer Ströme auf derselben Verbindung oder an einem
  gemeinsamen Kreuzungspunkt erzeugen einen kurzen Licht-/Funkenausbruch.
  Begegnungen gleicher Farben erzeugen keinen solchen Ausbruch.
- Canvas zeichnet höchstens 24-mal pro Sekunde, Auflösung höchstens 1024 Pixel
  breit und Pixeldichte höchstens 2. Keine React-Zustandsänderung pro Frame.
- Animation ruht bei geöffneten Dialogen, unsichtbarer Seite, außerhalb des
  sichtbaren Bereichs sowie bei gespeicherter oder systemseitig reduzierter
  Bewegung. Das statische Goldnetz bleibt sichtbar.
- Keine dauerhafte „Genesis-Sektor“-Anzeige, kein eigener Animationspause-Button
  und keine schwebenden Blockchain-Blöcke.
- Alle Beschriftungen bleiben echte, lesbare HTML-Texte. Vier neue Beschriftungen
  sind direkt in allen 19 vorhandenen Sprachen hinterlegt. Der aktuelle Dienstgrad
  verwendet die vorhandenen Rangdaten und Abzeichen; bei noch nicht geladenen
  Kontodaten wird kein Rang erfunden.
- Flexible Höhen, umbrechende Beschriftungen, vertikal erreichbarer Inhalt und
  eigene Desktop-Anordnung. Allgemeine Menü-/Spielbilder wurden nicht verändert.

## Verknüpfungen

| Element | Bestehender Ablauf |
| --- | --- |
| Schnellzugriff | Bestehendes Schnellzugriffsmenü |
| Profilbutton | Eigenes Pilotenprofil; Gäste verwenden die vorhandene Anmeldung |
| Logo | Startseite `/` |
| Spielen | Bestehender Spielstart und Route `/game` |
| Deine Karriere | Bestehender Fortschrittsdialog mit `CareerDashboard` |
| Sammelkarten | Bestehende `Collection` |
| Community | Bestehender `FeedbackHub` mit Beiträgen und Antworten |
| Nutzungsbedingungen | Bestehender `TermsDialog` |
| Lautsprecher | Bestehende Musiksteuerung und gespeicherte Musikeinstellung |
| Vollbild | Bestehende Funktion `requestGameFullscreen` |

Keine Änderungen an Backend, Datenbankschema, Migrationen, Zahlungsabläufen,
Spielständen, Ranglistenwerten oder Netzwerk-Konfiguration. Die bestehende
Admin-Versionsauswahl speichert weiterhin ihren Wert unter demselben Schlüssel.

## Prüfung

Erfolgreich:

1. `npm run build`: TypeScript, 12 Übersetzungsprüfungen, Sprach-Freigabeprüfung
   und Vite-Build. Keine unübersetzten statischen UI-Fragmente; bestehende
   vollständige Sprachpakete bestehen weiterhin ihre Freigabeprüfung.
2. 39 Komponenten-/Modell- und bestehende Regressionstests:
   `cinematicHome`, `homeNetworkModel`, `staticBackdrop`, `playerCombat`,
   `shipFleet`, `paymentEvidenceLinks`. Diese prüfen unter anderem die
   tatsächlichen Startseiten-Callbacks, Dialogzustände, Musik-Einstellung,
   bestehende Flotten-/Netzwerktrennung, sphärische Linien, kontinuierliche
   Übergänge, gegnerische Kollisionen und begrenzte Animationsdaten.
3. Die reproduzierbare 180-Sekunden-Simulation besucht alle 217 Verbindungen;
   Kollisionen verteilen sich über die Erdoberfläche.
4. ESLint der geänderten TS-/TSX-Dateien und `git diff --check`.
5. Native Bildprüfung des tatsächlichen `HomeEarthNetwork`-Renderers mit dem
   integrierten Hintergrund: Netzposition, verdeckte Linien hinter den Schiffen
   und sichtbarer gegnerischer Ausbruch. Der kurze MP4-Ausschnitt stammt aus
   derselben Simulation; es wurden keine Ausbrüche für die Vorschau inszeniert.

Der Build meldet weiterhin den bereits vorhandenen großen Haupt-JavaScript-Chunk.
Es wird hier keine auf einem realen Telefon gemessene Bildrate behauptet.

### Reproduzieren

Im Verzeichnis `frontend`:

```sh
npm run build
node --experimental-strip-types --test src/pages/cinematicHome.test.mjs src/pages/homeNetworkModel.test.mjs src/pages/staticBackdrop.test.mjs src/pages/playerCombat.test.mjs src/pages/shipFleet.test.mjs src/pages/paymentEvidenceLinks.test.mjs
node_modules/.bin/eslint src/components/Header.tsx src/pages/Shop.tsx src/pages/CinematicHome.tsx src/pages/HomeEarthNetwork.tsx src/pages/homeNetworkModel.ts src/locales/homeScreen.ts
node --experimental-strip-types scripts/verify-home-render.mjs ../doc/home-review
```

Die letzte, optionale Grafikprüfung benötigt den vorhandenen primären
Codex-Canvas-Runtime-Pfad (`CODEX_PRIMARY_RUNTIME_NODE_MODULES`) und `ffmpeg`.
Diese Werkzeuge sind keine zusätzlichen Abhängigkeiten des Spiels.

### Grenzen der Prüfung

Die Bild-/Video-Belege sind native Renderings der echten Netzkomponente, **keine
Browser-Screenshots** und kein Nachweis des vollständigen CSS-Layouts. Die
Navigation wurde mit den tatsächlichen React-Komponenten und isolierten
Host-Schnittstellen geprüft; echte Pi-Anmeldung und Serveraufrufe wurden dabei
nicht ausgeführt.

Eine echte Mobil-/Tablet-/Pi-Browser-Prüfung des vollständigen Layouts bleibt
offen. Die verfügbare [Sites-Anweisung](skill://plugin_connector_1p_689987207de08191979cf68eca2941c6/sites/SKILL.md)
schreibt für diese verwaltete Umgebung ausdrücklich vor:
„If `$control-browser` is unavailable, skip browser QA: do not start a preview
server, install a browser, or improvise another browser-control path.“
Diese Browsersteuerung war nicht verfügbar; deshalb wurde kein Ersatzbrowser
gestartet. Vor einer Bereitstellung sind unter anderem schmale und querformatige
Ansichten, lange Profilnamen, Touch-Bedienung, echte Anmeldung und Dialog-Rückwege
im Mobil-/Pi Browser zu prüfen.

## Belege

- [Netz und Schiffe](home-review/earth-network.png)
- [Sichtbarer Ausbruch](home-review/earth-network-collision.png)
- [Animationsausschnitt, knapp sechs Sekunden](home-review/earth-network-animation.mp4)
