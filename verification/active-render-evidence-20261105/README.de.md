# Aktives natives Style-Profil und interne Bereinigungsauswahl

Der bestätigte aktive Chromium-Trace betrifft die unveränderte 9f3-Renderingbasis,
kein physisches Handy. Acht bekannte Fixture-Änderungen liefern 32 Style-Berechnungen
und identifizierbare DOM-Besitzer. Der endgültige aktive Trace ist vollständig,
ohne nativen Datenverlust oder Collectorüberlauf. Die vorherige längere Aufnahme
bleibt ein dokumentierter Budgetfehlschlag; ihr Teiltrace wird nicht umgewertet.

Der vollständige Trace enthält 3.957 StyleResolver-Ereignisse und ebenso viele
in UpdateLayoutTree gezählte Berechnungen. Die 19 direkt nach Pause benannten
normalen Gegnerknoten liefern 1.140 davon. Die vollständige rekursive native
parentNodeId-Zuordnung einschließlich zusätzlicher temporärer/Pseudo-Knoten
liefert 1.260, rund 31,84 Prozent. Keine beobachtete Node-ID hat mehrere Eltern.
Die globale HTML-/BODY-Zuordnung ergibt dagegen vier StyleResolver-Ereignisse.
Das sind wiederholte Arbeiten in einem etwa zweisekündigen Instrumentierungsfenster,
keine Speicheranteile, Referenzhalter oder gemessene native Allokationsursachen.

Die schmale Viewport-Selektorvariante erhält in Chromium alle 16 vollständigen
berechneten Style-/Rechteckvergleiche. Ihr vereinfachter nativer Arbeitsvergleich
verfehlt aber die eigene Kalibrierung: Schon die Kontrolle liefert keine
rootbezogenen :has-Ereignisse, beide Arme zählen acht Style-Berechnungen.
Ein Arbeits-/Speichervorteil ist daraus nicht belegt. Nicht übernommen.
WebKit ist zum Sicherungszeitpunkt noch nicht abgeschlossen; seine Abnahme
wird hier nicht behauptet. Kein automatischer unveränderter Retry.

Die vorhandene Gegner-Verbraucher-Variante 4ecdde51 hat bereits Darstellung und
normalen Ablauf in Chromium/WebKit bestanden, aber die Dreiminuten-PSS-Paare
waren uneindeutig. Deshalb läuft jetzt genau ein eigener Zehnminutenvergleich
pro Arm, ohne aktive native Instrumentierung und mit unveränderten bisherigen
Collector-/Uhr-/Exportprüfungen. Sein Ergebnis ist bei dieser Sicherung offen.
Kein nachträgliches Zusammenlegen alter und neuer Beobachtungen als Replikate.

Die drei Original-ZIPs wurden vor dem Entpacken gegen GitHub-Größe/SHA256,
ZIP-Integrität und sichere Memberpfade geprüft; Git-Blobs wurden gegen ihre
lokalen Originalbytes verifiziert. Keine geheimen Links oder Handy-Rohdateien.
Die neue CI und neue Prüfdateien sind getrennt von den unveränderten Spielquellen.
Keine Bereitstellung, Produktions-/Testnet-Änderung oder neue Handy-Testaufforderung.
