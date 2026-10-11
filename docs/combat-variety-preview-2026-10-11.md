# Kampfvariation und Gegneraudio – Testversion vom 11. Oktober 2026

Basis: `907d2a7363345d00f0f90c54402bf04e887b64d9` (Kampfwertabstimmung #157).
Die Änderungen gehören zunächst ausschließlich auf den Vorschau-Branch
`codex/combat-variety-preview-20261011`. Keine Zusammenführung nach main und
keine Veröffentlichung auf Produktion.

## Erhaltene Systeme

Die bestehenden Gegnerprofile, HP, Punkte, Shards, Schiffsvorteile und
Bossbudgets bleiben maßgeblich. Leben, neun Blöcke/Boss/Bonus, Inventar,
Käufe, Speicherstände und Career-/Best-Run-Berechnung wurden nicht ersetzt.
Alle neuen Projektile verwenden denselben Bewegungs-, Kollisions- und
Schadenspfad mit einem Trefferpunkt pro ungeschütztem Treffer. Der vorhandene
Schutz verhindert mehrfachen Lebensverlust bei engem Doppelkontakt.

Der aktuelle Code enthält **500 interne Stufen und 50 angezeigte Level**.
Je zehn Stufen entsprechen neun Blöcken plus Boss. Die Freischaltungen unten
nennen beide Zählweisen.

## Begrenztes Einstiegspaket

| Erster Level, Block | Einflug | Angriffe |
|---|---|---|
| 1 | Direkt von oben zum Formationsplatz | Gerade Solo-Dives |
| 2 | Von links mit kleinem Bogen | Dive und Kurve |
| 3 | Von rechts | Dive und seitlicher Angriff, längere Ruhepause |
| 4 | Von beiden Seiten | Kurve und Dive |
| 5 | Nahe dem Ziel, versetzte Spuren | Einfacher Dive, längste Ruhepause |
| 6 | Gemeinsamer Einflug von links | Seite, Kurve und S-Kurve |
| 7 | Gegenläufige Seiten | Kurve und einzelne Schleife |
| 8 | Verteilte Spuren mit flachem S-Bogen | S-Kurve und Seite |
| 9 | Beide Seiten, vorhandene Verstärkungsgruppe | Dive, Kurve und Schleife |

Formationen, Gruppenanzahl und die bestehende 650-ms-Angriffswarnung bleiben
bestehen. Einschließlich Rückflug greift höchstens ein Gegner an. Langsame
Anfänger-Schüsse und freie Ausweichwege bleiben erhalten. Die zusätzliche
Ruhezeit nach Solo-Angriffen beträgt in Block 1/3/5/7 jeweils 600/850/1000/500 ms.
Weitere Stufen übernehmen diese neue Einflug-/Angriffsfolge noch nicht.

## Früher Waffenwechsel

Nach mindestens drei besiegten Gegnern wird in den Stufen 1–9 beim nächsten
sicheren Abschuss der vorhandene Waffendrop bevorzugt, wenn er im Level noch
nicht erzeugt wurde und die Waffe nicht maximal ist. Die bisherigen
Sicherheitsabstände, maximal drei aktive Drops und der gemeinsame
Duplikat-Merker bleiben verbindlich. Bei blockiertem Ort wird der Versuch auf
einen späteren Abschuss verschoben. Andere frühe Zufallsdrops bleiben möglich.

Beim ersten Grey Scout Standard verändert dieser Drop die Waffe direkt von
Single zu Twin für 20 Sekunden. Er wird weder gekauft noch dem dauerhaften
Waffenvorrat hinzugefügt. Der bestehende Hinweis zeigt den tatsächlichen
lokalisierten Waffennamen, die Stufe und 20s für 2,4 Sekunden ohne Spielpause.
Bestehende bezahlte Waffen und Advanced-/Elite-Stufen behalten ihre Regeln.
Der Spieler muss den Drop selbst einsammeln; ein verfehlter Drop wird nicht
nochmals erzeugt.

## Schussvarianten über die gesamte Kampagne

Ein Zyklus ist ein Angriff dieses Gegners, versetzt um seinen Formationsindex.
Die Häufigkeiten gelten für einen verfügbaren, sicheren Projektilplatz.

| Klasse | Angezeigtes Level / interne Stufe | Freischaltung |
|---|---|---|
| Klein/Light | 1–50 / 1–500 | Immer einzelner gerichteter Schuss |
| Schwer/Heavy | Ab 3 / 21 | Zwei gerade Flügelgeschosse in jedem vierten Zyklus |
| Elite | Ab 6 / 51 | Doppel in jedem fünften Zyklus |
| Mittel/Medium | Ab 11 / 101 | Doppel in jedem sechsten Zyklus |
| Heavy | Ab 11 / 101 | Doppel in jedem dritten Zyklus |
| Elite | Ab 16 / 151 | Doppel in jedem dritten Zyklus |
| Heavy/Medium | Ab 26 / 251 | Heavy jeden zweiten, Medium jeden vierten Zyklus doppelt |
| Heavy | Ab 31 / 301 | Gelegentliche gerade Zweiersalve: jeder sechste Zyklus |
| Elite | Ab 36 / 351 | Gelegentliche gerade Zweiersalve: jeder achte Zyklus |

Salven ersetzen in ihrem Zyklus den sonstigen Schuss; sie kommen nicht
zusätzlich dazu. Zwischen zwei Salvenimpulsen liegen mindestens 260 ms
Spielzeit. Nach Verzögerungen werden keine aufgestauten Impulse gleichzeitig
nachgeholt. Doppelschüsse sind parallel und seitlich um 28% des jeweiligen
Rumpfradius versetzt. Ein freier Projektilplatz reduziert einen Doppelschuss
auf einen passenden Einzelschuss. Bei voller Belegung oder unsicherer Position
wird kein Schuss und kein zugehöriger Sound erzeugt. Unterhalb der oberen
Spielfeldhälfte wird nicht neu geschossen. Tiefer stehende Formationsplätze
nutzen deshalb einen früheren Zeitpunkt innerhalb ihres gewarnten Angriffs.

Die bestehenden Grenzen bleiben: höchstens fünf Gegnerprojektile auf schmalen
Displays und acht auf breiten Displays, abhängig von Stufe und bisheriger
Spielzeit oft weniger. Es werden keine zusätzlichen Feuerraten- oder
Schadensmultiplikatoren eingeführt. Light/Medium/Heavy/Elite haben Radius
4/5/6/4 px und Geschwindigkeit 100/96/88/104% der bestehenden Anfänger-/Normal-
Schussgeschwindigkeit. Schwerere Kugeln fliegen langsamer; die größere Anzahl
wird nicht zugleich durch stark erhöhten Schaden und Geschwindigkeit verstärkt.
Kleine Bossbegleiter verwenden Light-Einzelschüsse; Bossgeschütze und Reaktor
behalten ihre vorhandenen Kaliber, Salven, Warnungen und Klänge.

## Audio und sichtbarer Impuls

Die vier vorhandenen synthetischen Klassenklänge haben einen kräftigeren
Schussimpuls und zusätzliche mittlere Obertöne für kleine Lautsprecher.
Heavy klingt länger und tiefer, Medium körperreicher, Light kurz und klar,
Elite heller und energetisch. Simultane Doppelschüsse nutzen einen eigenen
kurzen, geschichteten Klang. Zeitversetzte Salven spielen den Einzelklang in
den beiden tatsächlichen Feuer-Ticks. Mündungsblitze markieren dieselben
zentralen bzw. seitlichen Ursprünge wie die Projektile.

Acht Gegnerpuffer werden einmalig vorbereitet und wiederverwendet. Gegner-
und Bosswaffen teilen weiterhin höchstens 20 aktive Audiostimmen. Auslaufende
Stimmen werden bei der Pegelberechnung mitgezählt. Die konservative
Waffen-Peak-Grenze beträgt 0,62 **auch nach dem maximalen Effektregler**;
der bestehende gemeinsame Kompressor bleibt aktiv. Effektregler, Pause und
Stummschaltung gelten auch für Doppelklänge. Die Musikregelung bleibt erhalten.

## Tatsächlich durchgeführt

- 320 Frontend-Tests bestanden (alle `src/pages/*.test.mjs` und
  `src/lib/*.test.mjs`), einschließlich neun neuen bzw. erweiterten Szenariotests.
- 46 Backend-Regeltests und 47 Handler-Tests bestanden: Speichern/Fortsetzen,
  Belohnungen, Leben, Käufe, Inventar, Career-/Best-Run und Netzwerktrennung.
- 12 Sprachtests und die vorhandene Sprachfreigabe-Prüfung bestanden.
  Es wurden keine neuen unübersetzten Textschlüssel eingeführt.
- Frontend- und Backend-Build bestanden; `git diff --check` sauber.
- Einstiegspfade und Anfluggrenzen numerisch mit 320×568, 390×844,
  768×1024, 1024×768 und 1363×936 geprüft.
- Varianten-Freischaltungen über sämtliche 500 Stufen und 120 Zyklen geprüft;
  tatsächliche Volley-Erzeugung bei 0/1/2/verfügbaren Projektilplätzen für alle
  vier Klassen und fünf Spielfeldgrößen geprüft.
- Reale Formationsplätze und Angriffspfade in frühen, mittleren und hohen
  Stufen auf erreichbare Feuerfenster geprüft. Isolierte Schüsse lassen einen
  legalen Ausweichpunkt; das ist kein Beweis menschlicher Gewinnraten.
- Grey-Scout-Single → eingesammelter Twin → Ablauf nach 20s mit den echten
  Volley-/Pickup-Funktionen geprüft; Touch-Abstand von 68 px erhalten.
- Bossübergang 9→10 und neue/alte Speicherstände geprüft; ein gespeicherter
  zweiter Salvenimpuls wiederholt den ersten nicht.
- Audio-PCM bei 22,05/44,1/48/96 kHz auf endliche Werte, saubere Enden und Peaks
  geprüft (Single ≤0,64, Double ≤0,68). Audio-Mocks prüfen Cache, Doppelklang,
  zeitliche Feuerereignisse, Pause, Stumm, 25/100%-Regler und Mischreserve.

## Noch erforderlicher echter Spieltest

Kein interaktiver Browserdurchlauf und kein physischer Smartphone-/Tablet-
Spieltest wurden durchgeführt. Die Tests oben verwenden Produktionsfunktionen,
Zahlenprüfungen und Audio-Mocks; sie messen keine echten FPS, Hörlautstärke,
Audioausgabelatenz oder subjektive Schwierigkeit.

1. Mit Grey Scout Standard ohne Käufe die ersten neun Blöcke spielen und den
   Twin-Drop aktiv einsammeln: Klarheit, Ausweichgefühl und Wechselwirkung mit
   Musik/Spielerschüssen beurteilen.
2. Angezeigte Level 3/6/11/26/31/36/50 im vorhandenen Admin-Testmodus prüfen:
   erkennbare Doppelgeschosse, getrennte Salvenimpulse und Projektilgrenzen.
3. iPhone, Xiaomi Pad 7 und Pi Browser: Touch-Schiff über dem Finger,
   Hoch-/Querformat, Audio nach Geste, 25/50/75/100%, Stumm, Pause/Fortsetzen
   und längeren Bosskampf auf reale Flüssigkeit prüfen.
4. Den Übergang Block 9→Boss→Herz→Bonusrunde im Spiel durchlaufen.

Produktion erst nach Rückmeldung zur Vorschau freigeben.
