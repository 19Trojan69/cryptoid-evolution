# Interner Vergleich direkter Gegnerschiff-Styles

Basis ist der bereitgestellte Commit `9f3bf451c01d6976ea1a50342cdec1470e2e080b`.
Der private Geräteexport vom 05.11. zeigt zuletzt 27:53,672 und danach einen
Dokumentneustart. Er benennt keine native Ursache. Die Rohdatei bleibt privat.
Kein weiterer unveränderter Handy-Dauertest, keine OS-/Versions-/Anmeldeschleife.
Die Simulatorserie bleibt beendet. Dieser Branch hat kein neues Deployment.

## Genau abgegrenzte Änderung

Die häufig wechselnden normalen Gegnerwerte Bank, Schublänge und Rumpflicht
liegen im eingefrorenen Controller als drei geerbte Custom Properties am ganzen
bewegten Gegner-Unterbaum. Der neue virtuelle Arm übergibt die identischen
bereits berechneten Werte als primitive Props an GameShipVisual. Dort werden nur
die vorhandenen Verbraucher beschrieben: transform am Visual, height an den
Triebwerken und opacity an der Reflexion. Keine neue CSS-Property-Registrierung,
kein neuer Cache, Hook, Listener, Timer, Frame oder DOM-Knoten. Ein data-Attribut
kennzeichnet den geänderten Consumer für zwei zusätzliche Reduced-Motion-Regeln.

Die Formeln stammen wörtlich aus den vorhandenen CSS-Regeln. Die zwei bestehenden
Wege zu reduzierter Bewegung bleiben auch während einer Pause wirksam. Spieler,
Bonus, Shop und andere Aufrufer behalten ohne die neuen Props ihre alten Styles.
Geschwindigkeit, Simulation, Grafikdateien, Audio, Eingaben, Preise und Uhren
werden nicht geändert. Der vorherige Mündungslicht-Helper und das Fehlerjournal
bleiben in beiden Armen gleich. Die ursprünglichen Spiel-/Journal-/Uhrquellen
und alle fünf Runtime-Bäume bleiben unverändert: Änderungen erfolgen nur im
getrennten virtuellen Build. vercel.json und sein Build-Einstieg bleiben exakt.

Die neuen primitiven Props können zusätzliche einfache Child-Renders auslösen;
die bestehenden memoisierten PaintedShip-/HullDamage-Kinder, Keys und Hooks
bleiben erhalten. Deshalb wird ein Gewinn nicht allein aus weniger geerbten
Variablen behauptet. Ein Browservergleich ist erforderlich.

## Quellenentscheidung vor der Änderung

Der gesamte eingefrorene frontend/src-Bestand wurde für die Quellenprüfung
verfügbar gemacht: 485 TS/TSX/JS/MJS/CSS-Dateien, darunter 39 CSS-Dateien.
Das bedeutet nicht, dass alle 485 Dateien vollständig semantisch abgenommen sind.
Neue Leseprüfungen betreffen Cache-/Observer-/Navigations- und Animationsstellen
sowie die tatsächlichen Verbraucher der drei Bewegungswerte.

Im passenden öffentlichen WebKit-Quellstand `b56845f9fe0bd77577734c768ceb35b14af44231`
vergleicht MutableStyleProperties bereits gleiche Property-Werte und gibt dann
unchanged zurück; CSSCustomPropertyValue/CSSVariableData vergleichen Inhalte.
Ein bloßer JavaScript-Schreibfilter wird daher nicht als gefundener Style-Leak-Fix
ausgegeben. Ein Parsing-Overhead ist dadurch nicht als null bewiesen.
Der MatchedDeclarationsCache berücksichtigt dagegen geerbte Custom-Property-Daten
und kopiert Eltern-Styles. Das motiviert die hier isolierte Verteilungsprüfung;
es beweist weiterhin weder Wachstum im iPhone noch den White-Screen-Grund.

Primärquellen:
- https://github.com/WebKit/WebKit/blob/b56845f9fe0bd77577734c768ceb35b14af44231/Source/WebCore/css/MutableStyleProperties.cpp
- https://github.com/WebKit/WebKit/blob/b56845f9fe0bd77577734c768ceb35b14af44231/Source/WebCore/css/CSSCustomPropertyValue.cpp
- https://github.com/WebKit/WebKit/blob/b56845f9fe0bd77577734c768ceb35b14af44231/Source/WebCore/css/CSSVariableData.cpp
- https://github.com/WebKit/WebKit/blob/b56845f9fe0bd77577734c768ceb35b14af44231/Source/WebCore/style/MatchedDeclarationsCache.cpp
- https://web.dev/blog/at-property-performance
- https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascading_variables/Using_custom_properties

## Vorab festgelegte interne Prüfung

Fünf reine Quell-/Treiber-Gegenbeispiele verlangen exakte Umkehrbarkeit und lehnen
fehlende/doppelte/unpassende Quellfragmente ab. Der neue Style-Helper wird streng
typgeprüft. Die vollständigen virtuellen TSX-Dateien werden syntaktisch geprüft;
dies wird nicht als neue vollständige Projekt-Typprüfung bezeichnet.

In Chromium und WebKit folgt jeweils der vorhandene kurze 60/10/10-Ablauf mit
echter Spielzeit, Pause, Waffenmenü, Home-Bestätigung und normalem Journalexport.
Alle alten Zeit-, Quellen-, Lücken- und Fehlerbedingungen bleiben erhalten.
Nur in der ersten regulären Pause prüft der neue native Consumer-Vergleich acht
Werteprofile in drei Bewegungseinstellungen. Der Prototype verwendet bereits
vorbereitete tatsächliche Schiffsknoten; alle standardisierten berechneten
Styles und Rechtecke müssen exakt gleich sein. Knotenidentitäten und native
Animationsidentitäten/-Startzeiten/-Raten werden innerhalb derselben Einstellung
verglichen. Ein Wechsel der Einstellung darf die originalen CSS-Animationen
legitim ersetzen. Das ist keine vollständige Pixel- oder Sprite-/Kampagnenabnahme.
Die zehn alten Journal-Zustands- und zwölf Fehlerfälle werden nicht wiederholt.

Erst bei Bestehen beider Engines folgen zwei Paare von jeweils 180 aktiven
Sekunden im unveränderten vorhandenen Collector. Auf jedem Runner starten frische
Browserprozesse für beide Arme, einmal Control/Candidate, einmal Candidate/Control.
Kein nativer Dump, Snapshot, GC, neues aktives DOM-Instrument oder zusätzlicher
Game-Collector wird ergänzt. Fünfsekündige externe PSS-Stichproben werden mit
den bestehenden echten Zustands-/Dokument-/Uhrprüfungen gesichert. Die letzten
60 Sekunden werden deskriptiv als min/max/mean ausgegeben; zusätzlich die Spitze.
Keine erfundene universelle MB- oder Prozentvorgabe.

Die frühere Collector-Markierung memoryComparisonEligible:false bleibt erhalten.
Das sind neue Beobachtungen mit demselben Collector in beiden Armen, keine
nachträgliche Umwertung alter Messgates und keine qualifizierte native
Hochdruck-/Langzeitmessung. Ganze Linux-Browser-Nachfahren-PSS ist kein iPhone-,
GPU- oder reiner Rendererwert. Die unabhängigen Spielszenen sind unseeded.
Ein einzelner niedrigerer Mittelwert oder überlappende Streuung begründet keinen
neuen Handy-Dauertest. Auch ein konsistenter Vorteil wäre noch kein dauerhafter
White-Screen-Fix. Ergebnisse werden erst nach tatsächlicher Ausführung ergänzt.

## Erster interner Treiberfehler bleibt ein Fehlschlag

Quelle `12847df2211bceb754bfbdef17f8b09c6fb16bb8`, CI
https://github.com/19Trojan69/cryptoid-evolution/actions/runs/42045250069:
Quellenschutz, Helper-Typprüfung, virtuelle TSX-Syntax und ursprünglicher
Gast-Build bestehen. Im ersten Chromium-Job 127306330825 scheitert anschließend
die Engine-Validierung vor dem Browser-/Spielstart. Der ältere importierte
Treiber las argv[2] und erhielt das neue Argument `flow` statt `chromium`.
Kein nativer Darstellungs-, Spiel- oder Speicher-Pass aus diesem Lauf.

Die Korrektur bindet die bereits validierte Engine ausdrücklich an den
importierten Treiber. Die neue fünfte lokale Prüfung generiert beide Treiber-
Ebenen aus echten CLI-Aufrufen, prüft ihre Syntax und die exakte Rückgewinnung
aller ursprünglichen Collectorbedingungen vor jedem Browserstart. Sie prüft
keine Hardware. Kein bestehendes Quellen-, Zeit-, Fehler- oder Darstellungs-
Kriterium wird dafür gelockert. Die eigentliche Renderer-Änderung bleibt gleich.
