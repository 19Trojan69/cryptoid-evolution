# Ausschließlich Testnet: geprüfte Sockeloptimierung veröffentlichen

Der Besitzer hat die Veröffentlichung zuerst auf Testnet ausdrücklich angefordert.
Basis ist das tatsächlich öffentliche Testnet-Deployment
dpl_239zEifRV84KCpbyHumnuHmSGm9T mit Commit
ce073547cf573375d141bf846f70e294138dbd73, Baum
494b543c9522317811acbf3eaf538393654f03e8.

Nur der bereits geprüfte Renderer aus9d044e0231d40b7df60d1090e47c7148f9be80f7
wird als Laufzeitänderung übernommen, SHA256
d69a597407f07c7c8f9f0e93e1b5993efb8222e91642a609dc04e318e201d28e.
Bossmanifest, Geschützdaten und Hitzemodul sind zwischen öffentlicher Basis und
geprüftem Kandidaten Git-Blob-identisch. Die übrigen Frontend-Dateien sowie
Backend/API/Assets/private-preview bleiben exakt die öffentliche Basis.
Die regulären Buildbefehle, API-Funktionen, Redirects und Rewrites bleiben.
In vercel.json kommt ausschließlich die Autodeploy-Sperre für diesen Branch
hinzu. Main und das Projekt cryptoid-evolution werden nicht geändert.

Ziel: Team team_KzJmtl0QyoYZAOu5RQKsAR2i, Projekt
prj_JpvzU9ZS8bFkn9jZgE51Gct8TZpF / cryptoid-evolution-testnet.
Die technische Production-Umgebung dieses Testnet-Projekts ist erforderlich,
damit die bestehenden Testnet-Einstellungen und reguläre App verwendet werden.
Dies ist keine Freigabe für das separate Produktionsprojekt.

Rollback: Das bisherige READY-Testnet-Deployment und der unveränderte main-Ref
auf ce073547cf573375d141bf846f70e294138dbd73 bleiben erhalten.
Produktionsprojekt vorher: dpl_6N3FdS9XGXasCWrpMksngxCPNPRk, ebenfalls ce073547.

Release-CI prüft den tatsächlichen öffentlichen Integrationsstand mit allen
bisherigen Frontend-Release-Tests, TypeScript, Vite, striktem Quellvergleich
und den2100RGBA-Vergleichen/9Lebensdauerfällen. Erst bei bestandener CI wird
die reguläre App im bestehenden Testnet-Projekt gebaut und freigegeben.
Keine Pi-Anmeldung, Zahlung, Speicherstandsänderung, Diagnosefreigabe oder
Schutzabsenkung ist Teil dieser Veröffentlichung.

Die Einsparung betrifft ausschließlich zusätzliche Sockel-Rasterflächen unter
Chromium, keine belegte Gesamtspeicher- oder iPhone-White-Screen-Behebung.
WebKit behält seine ursprüngliche Ausgabe.

Die anschließend gewünschte Änderung der Boss-Treffer (Reaktor einschließlich
Türen, Geschütze unverändert, Rumpfeinschläge ohne Reaktorschaden) ist ausdrücklich
ein nachfolgender Arbeitsschritt und nicht Bestandteil dieses Releases.
