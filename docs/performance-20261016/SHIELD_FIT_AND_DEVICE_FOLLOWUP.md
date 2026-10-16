# Engeres Schutzschild und fortgesetzter Gerätetest

## Rückmeldung und Änderung

Am 16. Oktober 2026 um 20:44 Europe/Vienna bestätigt der Nutzer, dass nach dem
Fortsetzen Musik und Soundeffekte wieder passen. Die Audio-Korrektur ist im
öffentlichen Testnet als `aab7267960fb9b92a40d318dd59b4a89251a4957` veröffentlicht.
Diese Rückmeldung bestätigt den getesteten Ablauf auf seinem Gerät; weitere
Geräte und beliebig lange Hintergrundunterbrechungen wurden nicht bewiesen.

Vor weiteren Tests wünscht der Nutzer das Schutzschild optisch enger am Schiff.
Gleichzeitig meldet er weiterhin Verlangsamungen des Spiels.

Die einzige Änderung am ausgeführten Spiel sind zwei CSS-Deklarationen in
`frontend/src/index.css`:

- Äußerer Schildring: `inset: -13px -16px` wird `inset: 0`.
- Innerer Schildring: `inset: -9px -12px` wird `inset: 4px`.

Bei einem mobilen Schiffselement mit 104 CSS-Pixeln schrumpft der äußere Ring
von 136 × 130 auf 104 × 104 CSS-Pixel vor der unveränderten Pulsanimation.
Je nach mobiler Bildschirmgröße sind das rund 20–25 Prozent weniger Breite.
Farben, Leuchten, Linien, Pulsdauer, Schiffsbilder, Schiffgröße, Zentrierung,
HUD und Eingabe bleiben wie zuvor. Schutzdauer, Schutzwirkung, Ladungen,
Kollisionen, Waffen und Simulation bleiben exakt unverändert.

## Prüfung

- Frontend-Releasebuild mit ausgeschalteter privater Diagnostik, TypeScript und
  Sprachprüfung erfolgreich. Der bisherige Vite-Hinweis auf große Chunks bleibt.
- 21 bestehende Tests zu Spielerkampf, Schiffsentwicklung, visueller Zentrierung
  und Power-ups bestanden, null Fehler und null übersprungene Tests.
- Der Quellenvergleich gegen den ursprünglichen Testnet-Stand besteht. Er
  erlaubt in der gesamten `index.css` ausschließlich diese zwei exakten
  Ersetzungen; alle anderen CSS-Deklarationen bleiben Teil des Vergleichs.
- Alle 60 Schiffsbilder geometrisch anhand ihrer vorhandenen Alphakanäle geprüft:
  sichtbare Hülle mit Alpha >32, unveränderte gewichtete Zentrierung, äußere
  Ringlinie und kleinste vorhandene Puls-Skalierung .96 berücksichtigt. Bei
  Elementgrößen 94, 104, 132 und 160 CSS-Pixeln bleibt jede Hülle innerhalb des
  äußeren Rings, mit mindestens 2,241 CSS-Pixeln Abstand. Daten in
  `shield-fit-geometry.json`.
- Dies ist eine geometrische Quellenprüfung, kein Nachweis echter iOS-/GPU-
  Darstellung. Ein lokaler Browser-Render war hier nicht verfügbar: Der
  Headless-Browser-Download lieferte kein gültiges Archiv. Die optische Abnahme
  erfolgt nach Veröffentlichung auf dem Gerät des Nutzers.

Reproduktion:

```sh
cd frontend
node scripts/verifyDiagnosisPreservation.cjs
node --experimental-strip-types --test src/pages/playerCombat.test.mjs src/pages/shipEvolution.test.mjs src/pages/shipVisualCenter.test.mjs src/pages/powerUps.test.mjs
cd ..
VITE_CRYPTOID_DIAGNOSTICS=0 npm run build --prefix frontend
```

Ausgangspunkt und unveränderlicher Rückfall sind der oben genannte veröffentlichte
Audio-Commit und Deployment `dpl_GcYgxExuTiT8XUDqkdWdcQx1A5pr`. Die Release-
Konfiguration bleibt identisch; automatische Git-Deployments bleiben gesperrt.
Die separate Haupt-App wird nicht geändert. Der neue Schild-Stand ist bis zur
bestätigten manuellen Veröffentlichung lediglich ein vorbereiteter Kandidat.

## Danach: die Verlangsamung am Gerät eingrenzen

Die kleinere Schildfläche ist keine nachgewiesene Behebung der Verlangsamung.
Der ausführbare GamePage-Code entspricht exakt dem Audio-Release. Die bereits
kontrolliert untersuchte 34-ms-Begrenzung bleibt erhalten: Bei RAF-Lücken über
34 ms kann weniger Spielzeit als Echtzeit verstreichen und der Schussrhythmus
sinken. Dass dieser Mechanismus im aktuellen Pi-Browser-Vorfall tatsächlich
auftritt, ist am Gerät weiterhin nicht gemessen. Er wurde hier weder durch
Entfernen der Begrenzung noch durch eine andere Waffenuhr verändert.

Nach der Schild-Veröffentlichung zunächst ein kurzer Lauf im Pi Browser mit
gleichem Schiff, gleicher Waffenstufe und ohne Rapid/Overdrive-Wechsel. Bei der
verlangsamten Stelle möglichst 15–20 Sekunden Video mit sichtbarem HUD aufnehmen:
Salvenabstand, Projektilbewegung, Gegnerbewegung, Abschnitt/Block und aktives
Schild unterscheiden. Danach denselben Abschnitt auf demselben iPhone in Safari
vergleichen. Erholung nach einem Gegnerwechsel beziehungsweise einer kurzen
Pause ebenfalls festhalten. Ein vergleichbarer schneller Abschnitt dient als
Kontrolle; verschiedene Level oder Waffen sind kein sauberer Vergleich.

Erst aus diesem Gerätevergleich lässt sich entscheiden, ob als Nächstes RAF-
Lücken/Simulationstakt, Darstellungslast, neuer Hull-Cache-Aufbau oder ein
anderer Auslöser im passenden Abschnitt gezielt instrumentiert werden muss.
Die vorhandene private Diagnose und die Messmatrix liegen im separaten
Diagnosebranch; die öffentliche Testnet-Version enthält weiterhin keine private
Teststeuerung und keine automatisch eingeschaltete Performance-Probe.
