# White-Screen-Ursachen: Quellenabgleich vom 05.11.2026

Ausgangspunkt ist der unveränderte ausgelieferte Spielbaum von
`b092f6462a623c3ad2c12e634963028d462c5fcf`. Dieser Zwischenstand ist eine
gezielte Quellenprüfung, keine vollständige Abnahme aller Module und kein
nachgewiesener Fix. Die überprüften lokalen Quelldateien werden mit ihren
originalen Git-Blob-IDs im beiliegenden Quellenverzeichnis benannt.

Der Arbeitsauftrag bleibt: keine Änderung an Spielmechanik, Grafik, Ton,
Steuerung oder Geschwindigkeit. Nach der ausdrücklichen Rückmeldung des
Besitzers liegt der Schwerpunkt auf belegbaren Fehlerstellen und passenden
dokumentierten Browserursachen. Kein weiterer unveränderter Handy-Dauertest
und kein weiterer nativer CI-Lauf allein zum Ausbau der Messumgebung.

## Konkreter Abgleich

| Ursache | Tatsächlicher Befund in den geprüften Quellen | Folgerung |
| --- | --- | --- |
| Canvas-Backing-Stores | `paintedShip.ts` gibt den temporären 240×240-Lesecanvas im `finally` mit Breite/Höhe 0 frei. `CanvasEffects.tsx` besitzt begrenzte Caches, Abbau und einen wiederverwendeten Canvas. `renderResolution.ts` begrenzt dessen Skalierung auf 1. | Die häufig empfohlene Canvas-Freigabe ist bereits vorhanden. Die Zähler erfassen nicht den gesamten Browser-/GPU-Speicher. |
| Wiederholte Bilddekodierung | Farbige Schiffshüllen verwenden bereits feste PNG-URLs, einen seriellen Vorbereitungspfad und keinen zusätzlichen expliziten `decode()`-Aufruf. Die Quellbilder sind auf acht Cacheeinträge begrenzt; vorbereitete Varianten haben eine eigene Begrenzung. | Diese älteren Reparaturvorschläge nicht unverändert wiederholen. Interne Decoder-/Grafik-Caches bleiben damit nicht automatisch gemessen oder bewiesen begrenzt. |
| Bekannte ImageBitmap-Lecks | Die hier geprüften Hüllen-/Effektpfade verwenden HTMLImageElement und Canvas2D, keine ImageBitmap-Erzeugung. | WebKit-Bug 295618 ist API- und versionsspezifisch. Ein blindes `ImageBitmap.close()` ist hier keine passende Reparatur. Diese Aussage ist auf die geprüften Pfade begrenzt. |
| WebGL-Resize-Leck | Die geprüften Renderer verwenden Canvas2D sowie DOM/SVG. | Das WebGL-Depth-/Stencil-Problem aus Bug 232122 ist ohne passenden Aufrufpfad keine Ursache für dieses Spiel. |
| Audioquellen und Graphen | `GameAudio` hält einen Effektkontext; Samples werden begrenzt parallel geladen. Stimmen werden verfolgt, bei Ende getrennt und bei Pause beendet. `close()` leert Caches und schließt den Kontext. Musik und Karten besitzen getrennte Kontexte mit eigenen Aufräumpfaden. | Kein Beleg für unbeschränkt neu erzeugte Effektkontexte in diesen Pfaden. Diagnose-PCM ist kein vollständiger nativer Audio-Speicherwert. |
| AudioWorklet-Regression | Die geprüften Audioquellen verwenden BufferSource/Oscillator/MediaElement und keinen AudioWorklet. | Ein AudioWorklet-spezifischer WebKit-Bericht ist kein direkt passender Fix. |
| RAF-/DOM-Ansammlung | Gemeinsamer Frame-Scheduler entfernt abgearbeitete Callbacks. Projektilpräsentation entfernt nicht mehr vorhandene Schüsse aus DOM und Map. Sternenaufhellung hat eine begrenzte Timerkette mit Cleanup. | In diesen geprüften Besitzverhältnissen kein nachgewiesenes unbegrenztes Wachstum. Andere Module oder native Animationsobjekte sind dadurch nicht freigeprüft. |
| CSS/SVG-/Compositor-Speicher | Das Spiel nutzt weiterhin SVG-Bilder, Masken, Filter, Schatten und Animationen. Der ausgelieferte Diagnose-Build verteilt Boss-Stile bereits direkt und deaktiviert den mobilen HUD-Backdrop. | Native Grafikflächen bleiben eine offene Klasse. Den bereits erfolglos getesteten HUD-Eingriff nicht erneut als neue Lösung anbieten. GTK/WPE/Skia-Bug 327701 ist kein Nachweis für Apples oder Androids Renderer. |
| Automatischer Reload / Router | Im geprüften HTML-Startschutz hängt `location.reload()` an einem Benutzerklick. Die Diagnose-App setzt die Route einmal beim Start eines neuen Dokuments zurück und mountet keine neue Spielszene automatisch. | Die Menü-Rückkehr nach einem neuen Dokument ist eine Folge des Neustarts und kein Beleg dafür, dass der Menücode den ursprünglichen Abbruch verursacht hat. Kein vollständiger Ausschluss sämtlicher Navigation. |
| Anmeldung / Netzwerk | Die bereitgestellte Diagnose ersetzt Authentifizierung und Transport ausdrücklich durch den isolierten Gastpfad; reale Konten, Käufe und Backend fehlen. | Pi-Anmeldung allein erklärt die bereits gemeldeten Abbrüche dieses Gaststands nicht. Der native Pi-Browser-Host bleibt von diesem Ausschluss unberührt. |
| Spielmodus / Spiel-Overlay | Apple dokumentiert automatischen Spielmodus bei unterstützten Spielen und die App-Freigabe über `LSSupportsGameMode` in der nativen `Info.plist`. | Die Vercel-Webseite kann die native Konfiguration der installierten Pi-Browser-App nicht ändern. Das Overlay ist keine belegte White-Screen-Reparatur. Kein App-Umbau oder neuer Login dafür. |

## Passende Primärquellen und ihre Grenzen

- Apple Spielmodus: https://support.apple.com/de-de/105118
- Apple App-Konfiguration: https://developer.apple.com/documentation/bundleresources/information-property-list/lssupportsgamemode
- Apple WWDC25, Systemmodi und weiterhin nötige Ressourcenverwaltung: https://developer.apple.com/videos/play/wwdc2025/209/
- WebKit Canvas-Backing-Store/GC, historischer Bericht: https://bugs.webkit.org/show_bug.cgi?id=195325
- WebKit WebGL-Resize/Depth-Stencil, anderer API-Pfad: https://bugs.webkit.org/show_bug.cgi?id=232122
- WebKit ImageBitmap-Regression, API-/versionsspezifisch: https://bugs.webkit.org/show_bug.cgi?id=295618
- WebKit AudioWorklet-Bericht, anderer Audio-Pfad: https://bugs.webkit.org/show_bug.cgi?id=303421
- WebKit GTK/WPE/Skia-Backdrop-Fehler, anderer Grafik-Backend: https://bugs.webkit.org/show_bug.cgi?id=327701
- Chrome Speicherdiagnose, OS-Footprint und JS-Heap auseinanderhalten: https://developer.chrome.com/docs/devtools/memory-problems

Ein historischer oder plattformspezifischer Browserbericht wird erst mit
passendem API-Pfad, Version und Verhalten zu einem konkreten Reparaturansatz.
Keiner dieser Links allein beweist die Ursache des Besitzer-White-Screens.

## Bereits gestartete kurze Speicherqualifizierung: abgeschlossen, nicht bestanden

Quelle `13039345b00dfb8f6a0b270298133ba5898f4841`, Baum
`91ef23bbc9097f172bb3a0f5d6b86fa0bb630454`,
[CI 41982882604](https://github.com/19Trojan69/cryptoid-evolution/actions/runs/41982882604).
Linux-Job `127096805094` besteht 18 Auswertungsprüfungen und den ursprünglichen
Gast-Build. Nativer Job `127097152880` endet insgesamt mit failure.

Der bestehende native Spiel-/Pausen-/Waffenmenü-/Ausstiegs-/Berichtsablauf
besteht tatsächlich: ein XCTest, null Fehler; elf Beobachtungen, ein Dokument,
keine WebContent-Termination, normale Schlussuhr ended bei
`39261.99999999999` ms. Stoppuhr, Kurzbericht und kritische Schlussuhr sind
vollständig identisch; `criticalMatchesLatestStopwatch:true`. Kein gespeichertes
error/unhandledrejection-Ereignis in diesem kurzen Lauf. Das ist weder ein
physischer Handytest noch ein Fehlerfreiheitsbeweis.

Die getrennte RSS-Abnahme liefert **null Messpunkte**. Das Verzeichnis des
App-Datencontainers nach Vorinstallation und das nach XCTest-Installation
unterscheiden sich im gesicherten Original. Der Sampler wurde auf den ersten
Container angesetzt. Die leere Reihe qualifiziert damit weder Prozesszuordnung
noch RSS-Zugriff. Das ist ein Fehler der Messanordnung, kein belegter Spielabsturz
und kein Grund für eine weitere unveränderte Wiederholung. Kein langer Verlauf
wird daraus gestartet.

Originalartefakt `13394922260`: 146595 ZIP-Bytes, SHA256
`628dca187885ef9c6870e589d10a5de6c6124d6142180fd65f83290348de2842`,
Git-Blob `fa65ed0015ef64e24e7033f99c19438071d6b03a`.
Originalarchive, normale Berichtsdaten und getrennte Auswertung liegen unter
`../native-webview-probe-20261105/evidence/memory-41982882604/`.
Der vorhandene vollständige Pilotvertrag und 16 Befehls-Log-Digests wurden
unabhängig gegen diese Originaldaten geprüft. Die gesamte Speicherabnahme
bleibt ausdrücklich fehlgeschlagen.

## Arbeitsstand

Keine neue Änderung am ausgelieferten Spiel und kein Deployment. Der nächste
Korrekturkandidat braucht eine konkrete fehlerhafte Ressourcenlebensdauer oder
eine reproduzierbare Darstellungs-/Navigationsstelle. Native Filter-/SVG-/Bild-
und Browserflächen sind mit den bisherigen Cachezählern nicht ausreichend
beurteilt. Der fehlende Spielmodus, geringe JS-Zähler oder der bestandene kurze
UI-Ablauf erlauben keine Behauptung, die historische Ursache sei gefunden oder
behoben.


## Fortsetzung nach „weiter bitte“

Die zusätzliche kleine Animations-Entfernungsprobe wurde lokal vorbereitet,
startete aber weder Chromium noch WebKit: Die zu diesem lokalen Playwright-Paket
gehörenden Browserprogramme sind nicht installiert. Der unveränderte Fehlerstand
liegt unter results/animation-retention.json. Kein Testfall lief; kein Pass und
keine Speicherbeobachtung werden daraus behauptet. Keine neue Browserinstallation
oder CI-Serie für diesen Pfad. Die stärkere bereits vorhandene Lebensdauer-Serie
vom 01.11.2026 hält nach Home null aktive Animationen und Registrierungen fest;
sie bleibt als älterer Linux-Befund eingeordnet.

Beim Nachprüfen der leeren nativen RSS-Reihe wurde der konkrete Datencontainer-
Wechsel nachgewiesen. Deshalb wird ausschließlich dieser externe Dateizugriff
korrigiert und einmal kurz qualifiziert. Frische Quelle/Laufkennung/Dokument,
maximales Ankeralter, eindeutiger Prozess und zwei fortschreitende Anker bleiben
harte Bedingungen. Zwei Dateisystem-Gegenbeispiele ergänzen die 18 vorhandenen
Auswertungsprüfungen. Der native UI-Test hält nur einen bestehenden aktiven
Beobachtungspunkt acht Sekunden länger. Kein Spielpatch und kein Handytest.

Auch für ein über den Home-Bildschirm installiertes Webspiel wurde keine
belastbare dokumentierte Apple-Freigabe des Spielmodus über das Webmanifest
gefunden. Die dokumentierte native Info.plist-Freigabe wird nicht als
versteckter HTML-Schalter ausgegeben.
