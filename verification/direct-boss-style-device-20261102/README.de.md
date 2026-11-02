# Getrennter Geräte-Kandidat: direkte Boss-Styles

Basis ist der tatsächliche native Spielvergleich
`a8e407a649431c719dfee64e0ec3cf63d73de3e0`. Der getrennte Paket-Zweig enthält
dieselben exakt gepinnten virtuellen BossHull-/BossReactor-Änderungen und die
korrigierte konservative Diagnose-Stoppuhr. Originalgrafik, Ton, Spielcontroller,
echte Pausen und manuelles Fortsetzen bleiben erhalten. Die zusätzlichen
aktiven Frame-/Clock-Ringbeobachter der Ursachenanalyse sind in diesem Paket
ausgeschlossen; der Builder prüft auch die tatsächlich geschriebenen JS-Dateien.

Der unveränderte Gastmodus sperrt Anmeldung, echte Konten, Käufe, Rangliste und
Backend. Der bestehende optionale Testschutz und der vorbereitete Boss-2-Einstieg
bleiben sichtbar erklärt. Es ist eine getrennte geschützte Testadresse mit eigenem
lokalem Bericht, keine Spielveröffentlichung auf den öffentlichen Stammadressen.
Automatische Vercel-Deployments bleiben ausgeschaltet.

Ein eigener Scope-Guard prüft die fünf vollständigen Original-Runtime-Bäume und
stellt den ganzen ursprünglichen Vercel-Config-Blob nach exakt einer bekannten
Build-Command-Ersetzung wieder her. Er ersetzt oder schwächt die alten Guards
im Analysezweig nicht ab. Zwei native Kurzläufe prüfen das tatsächliche minimale
Paket einschließlich aller drei Ein-/Ausstiege und des normalen Berichts.

Vor einem Geräte-Einsatz müssen zusätzlich die beiden Kandidaten-Langläufe der
getrennten Analyse-CI 41445407351 bestehen. Alle Kontroll-Ergebnisse bleiben
erhalten; ein fehlgeschlagener Lauf wird nicht in einen Erfolg umgedeutet.
Physische Smartphone-Stabilität und eine behobene White-Screen-Ursache sind
noch nicht bestätigt.
