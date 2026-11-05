# Unnötige globale Routen-Abhängigkeit begrenzen

Im tatsächlichen Spiel war `Affected by :has()` für HTML und BODY sichtbar,
obwohl beide bereits die von GameRoute gesetzte Klasse game-viewport-locked
tragen. Die unveränderten Regeln enthalten je eine Klassenalternative und
zusätzlich :has(.game-route). Die gleiche Layoutregel ist bei vorhandener
Klasse bereits erfüllt; der globale Nachfahrentest bleibt dennoch beobachtbar.

Dieser interne Patch ergänzt ausschließlich bei den beiden Fallback-Selektoren
`:where(:not(.game-viewport-locked))`. Die Klasse bleibt unverändert maßgeblich.
Ohne Klasse bleibt der :has-Fallback erhalten. :where fügt keine Spezifität hinzu;
sämtliche Deklarationen, Geometrie-, Touch- und Scrollregeln bleiben bytegleich.
Keine Spiellogik, Events, Bilder, Audio, Animationen oder Uhr werden geändert.

Chromium und WebKit vergleichen Original und Kandidat in je 16 Fällen: zwei
Viewportgrößen, Klasse an/aus, Route vorhanden/abwesend und zusätzliche Regeln
gleicher Spezifität. Alle standardisierten berechneten Styles und Rechtecke
der vorhandenen sieben Knotentypen müssen exakt gleich sein. Kein Spielstart.

Chromium prüft außerdem in zwei frischen identischen DOMs jeweils acht
Einfügungen und acht Entfernungen mit denselben erzwungenen Style-Reads.
Native Traces trennen :has-Invalidierungen und echte Style-Berechnungen.
Die Kontrolle muss tatsächlich rootbezogene :has-Ereignisse liefern. Ein
negativer Arbeitsvergleich bleibt ein negatives Ergebnis; erfolgreiche
Darstellung allein wird nicht als Speichergewinn ausgegeben.

Die Browserprofile sind instrumentierte synthetische Arbeit, keine RAM-, FPS-
oder Telefonmessung. Ein möglicher Vorteil kann klein sein und erklärt die
früheren großen Blink-Bestände oder White Screens nicht automatisch.
Der Patch bleibt zunächst intern und wird durch diesen Ablauf nicht gebaut
oder in die bestehende Geräteversion übernommen. Runtime-Bäume und vercel.json
bleiben unverändert. Keine neue Handy-Testaufforderung.
