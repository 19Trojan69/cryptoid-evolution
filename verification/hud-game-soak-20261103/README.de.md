# Tatsächlicher Spielablauf mit genau einem HUD-Kandidaten

Der separate native Stiltest 41624042675 bestätigt die unwirksame mobile
backdrop-filter-Regel und die gezielte Korrektur in zwölf Vergleichen.
Diese Prüfung verwendet nun den bereits bestandenen vollständigen
Kontakt-/Dauer-Spieltreiber von reactor-line-load-20261103.

Das Paket und alle Spielquellen bleiben exakt auf
ac98e95166b0e2013186257904da46323840dab5. Vor dem ersten Spieleinstieg wird
pro frischem Browserdokument genau eine CSS-Regel eingefügt:
@media (max-width:700px){.game-hud{backdrop-filter:none;}}
Sie stellt dieselbe mobile Eigenschaft wie der vorbereitete Regel-Reihenfolge-
Patch her. Dateien, Assets, Musik und Spielregeln werden nicht bearbeitet.
Die Behandlung ist in jedem Ergebnis ausdrücklich markiert; dies ist kein
unbehandelter Kontrolllauf und keine Pixelgleichheitsbehauptung.

Jeder Zyklus prüft vor der Zeitmessung den tatsächlichen HUD-Wert none.
Danach bleiben die bestehenden aktiven Uhr-/Dokument-/Pausen-/Kontakt-/
Waffenmenü-/Home-/Export- und Ressourcenpunkt-Gates unverändert. Der Adapter
muss sich exakt zum bisherigen Testtreiber zurückführen lassen. Die zusätzliche
HUD-Abfrage erfolgt ausschließlich während der Einrichtung, nicht im langen
Beobachtungsloop. Keine automatische Fortsetzung, neue Spieluhr oder Aufnahme.

Je Chromium/WebKit sind zwei komplette Kurzläufe und anschließend ein
1800/10/10-Sekunden-Lauf vorgesehen. Es gelten die ursprünglichen Smartphone-
Konfigurationen und echten nativen Eingaben des vorhandenen Treibers.
Das sind Linux-Browser mit Smartphone-Konfiguration, keine physischen
Android-/iOS-Geräte und kein iPhone-Simulator.

Die Ergebnisse sind funktionale Kandidatenabdeckung. Unterschiedliche,
unseeded Rechnerläufe sind kein kausaler RAM-/GPU-Vergleich. Das separate
iOS-Simulator-Baseline-Verfahren 41625231628 bleibt unverändert und wartet
auf seinen Mac-Runner. Der White Screen ist weiterhin ungeklärt.

Es gibt keine zusätzlichen Artefakt-Uploads oder Caches. Die synthetischen
Gast-Ergebnisdateien werden begrenzt, gehasht und komprimiert über die vorhandenen
Jobprotokolle ausgegeben. Keine privaten Besitzerberichte, Konten, Zahlungen,
kostenpflichtigen Anbieter oder Vercel-Deployments.
