# Ruhigere Kampfanzeige und Bossbelohnung

Entwurf auf veröffentlichter Basis5ca9cf7f210ec6f623649b4d5cf5f9c0b2417769, Baum1af1d9b46978e623214814df56396a101525f8bc. Derselbe Entwurf PR198, keine Veröffentlichung.

## Schussanzeigen

Während des Spiels entfallen die laufenden Schussnamen wie „Doppel“, der zusätzliche Waffentimer/-fortschrittsbalken, die doppelten Reserve-Schussfelder, die Schuss-Upgrade-Popups und die grüne Nachladebestätigung. Der bestehende Waffenknopf bleibt erreichbar; Auswahl, Auto, Vorräte, Kauf-, Fehler- und Bestätigungsinformationen bleiben im angehaltenen Waffenmenü verfügbar. Die tatsächlichen Waffentimer, Käufe, Aktivierungsbestätigungen, Bestände und Fallback-Auswahl werden nicht geändert. Schild- und andere Boostinformationen bleiben erhalten.

Nur ein wirklich abgelaufener ausgewählter gekaufter Schuss erzeugt eine Ablaufmeldung. Eingesammelte Upgrades und permanente Schiffsbewaffnung erzeugen keine. Die Meldung enthält ausschließlich den abgelaufenen Namen und „Abgelaufen“, ohne aktuellen Ersatzschuss oder Nachladestatus. Sie leuchtet rot mit zwei ruhigen nativen Pulsen in drei Sekunden. Reduzierte Bewegung deaktiviert das Pulsieren.

Die Meldung wartet auf eine bereits vorhandene normale Block-Abschlusspause: keine Gegner, keine gegnerischen Projektile und beim Beginn mindestens3000ms Restzeit. Der Spielablauf wird dafür weder angehalten noch verlängert. Ist ein Fenster zu kurz, bleibt die Meldung für ein späteres geeignetes Fenster vorgemerkt. Der tatsächliche Komponenten-Commit startet die Lesezeit; der vorhandene Playing-Schritt zählt genau3000ms herunter. Eine manuelle/technische Pause verbraucht keine Lesezeit und blendet den weiterhin montierten Status über CSS aus. Resume setzt die verbleibende Lesezeit fort. Sollte wider Erwarten wieder Kampf beginnen, wird die bereits angezeigte Meldung konsumiert. Kein neuer JS-Timer, RAF, Observer oder automatisches Resume. Der Projectile-Snapshot-Schutz bleibt erhalten; die Sicherheitsprüfung liest nur die aktuelle Projektilanzahl aus dem bestehenden Ref und kopiert kein Array.

## Formationsanzeigen und Bossherz

Die kleine zusätzliche Formationszeile blendet die Schlüssel Clear the formation, Finish this wave without a hit, Hold your combo, Perfect formation und FORMATION CLEARED aus; dadurch verschwindet auch „Formation ohne Schaden“. Zusätzlich wird Weapon Upgrade als Schusshinweis unterdrückt. Der Filter arbeitet vor der Übersetzung und gilt auch für alte wiederhergestellte Meldungen, ohne Kampfsnapshots zu ändern. Block-/Gruppenangaben, zentraler Blockabschluss, schwere-Angreifer-Warnung und die übrigen Boosthinweise bleiben erhalten.

Ein eingesammeltes Bossherz bringt bei vollen Herzen50 statt5 Shards. Bei fehlendem Herz heilt es wie bisher eines bis zur Rüstungsgrenze und bringt keine Ersatz-Shards. Einmalige Vergabe und alte bereits eingesammelte5-Shard-Belohnungen bleiben erhalten; keine Migration. Shop und Anleitung stimmen in allen19 auswählbaren Sprachen überein. Keine neuen Formations-, Score- oder übrigen Boss-/Bonusrunden-Belohnungen.

## Prüfung

- Vollständiger Frontend-Build:475 Tests, Lokalisierungsinventar, TypeScript und Vite bestanden.
- Unverändertes Backend: die zuvor bestandenen142 Tests und TypeScript bleiben der gültige Prüfstand; keine weiteren Backend-Änderungen.
- Zehn gezielte Schussmeldungsfälle verwenden die tatsächliche Ablauf-, Playing-, JSX-, Waffenknopf- und Pickup-Logik. Getestet sind Paid gegenüber Pickup/Standard, die unveränderte Fallback-/Auto-/Bestandsentscheidung, Kampf/Intro/Boss/Bonus/Status-Matrix, Mindestrestzeit2999/3000ms, Gegner/Projektile, Warten, tatsächlicher Commit, Pause/Resume, Grenze2999/3000ms, einmaliger Verbrauch und unveränderte Nachlade-Response-Zuordnung.
- Der echte Ablaufstatus wird für alle vier kaufbaren Schussstufen und19 Sprachen ausgeführt: nur abgelaufener Name, passive Statusrolle, keine Kaufaktion, kein aktueller Schuss, kein Nachladetext. Der echte Waffenknopf bleibt für Paid/Pickup/Standard in19 Sprachen bedienbar, ohne sichtbaren Schussnamen oder Zähler.
- Die drei Formationsanzeigefälle vergleichen veröffentlichte und neue JSX-Zeile:114 ausgeblendete Meldungspaare in19 Sprachen einschließlich gespeicherter Zustände;76 identische Warnungs-/Boost-Markup-Vergleiche;152 ausgeblendete abgelaufene/deaktivierte Zustände.
- Acht feste zusätzliche Controllerhunks stellen exakt den vorher geprüften PR198-Controller wieder her; die zwei Formationshunks stellen danach die gesamte veröffentlichte Quelldatei wieder her. Alte kritische Guards für Stock/Network/Watchdog, Scope und Projectile-Snapshots bleiben erhalten. Negativkontrollen erkennen zusätzliche Änderungen.
- Die sieben Boss-Pickup-Fälle prüfen Abstand, Heilung, Limits3/4/5/6,50 Bosse, Wiederholung, serialisiertes Resume, alte eingesammelte5-Shard-Werte und19 Sprachen. Echte Backend-Handler-Fixtures prüfen die50-Shard-Gutschrift über fünf Bosse und drei Rüstungen, doppelte Ereignisse, Resume, Checkpoint und Lebensobergrenzen.
- Lint: neue/geänderte kleine Laufzeitmodule und Statuskomponente null Fehler/null Warnungen; GamePage unverändert null Fehler/vier bekannte Warnungen. Shop/Anleitung/Übersetzungen ebenfalls unverändert lint-sauber. Keine zusätzliche Meldungsgruppe. Kein Backend-Lint behauptet, da die Frontend-Konfiguration die Backend-Datei ausschließt.
- Formationssimulation, Backend-Reward-/Progress-Handler und Hull-Manifest bleiben bytegleich zur veröffentlichten Basis. Keine Änderungen an Art, Audio, Käufen, Konten, Schadensregeln, echten Pausen oder White-Screen-Diagnosen. git diff --check besteht.

Die Prüfungen verwenden lokale Module, kontrollierte Komponenten-Hooks, JSX-Ausführung, React-Serverrendering und eine kontrollierte Backend-Datenbank. Die CSS-Regeln für Farbe, endliche Pulse, Pause und reduzierte Bewegung sind geprüft; kein physischer Browser-/GPU- oder Animations-Zeitmessungsnachweis. Kein vollständiger Pi-Login-/Kauf-/Kampagnentest und kein White-Screen-Fixnachweis. Die separate iPhone-Screenshot-Untersuchung und Diagnoseentwürfe194/195 bleiben offen und getrennt. Automatische Builds dieses Entwurfszweigs sind deaktiviert.
