# Kern-Notangriff nach Zerstörung aller Bossgeschütze

Testbranch, 4. Oktober 2026. Noch keine Produktionsfreigabe.

Nach Zerstörung des letzten Geschützes bleibt der Rumpf durch einen Kernangriff gefährlich. Geschütze regenerieren nicht; ihre bisherigen einmaligen Extrapunkte und Trefferpunkte bleiben unverändert. Der erste Impuls kommt erst nach 1,8 Sekunden sichtbarer Warnung. Ein leuchtender Kern markiert den Ursprung; die Warnung steht unter dem Geschützzähler. Der vorhandene Impulssound begleitet den Schuss.

Bosse 1–10 feuern einzelne, beim Abschuss ausgerichtete Impulse. Bosse 11–30 wechseln zwischen Einzelimpuls und Zweierfächer, Bosse 31–50 zwischen Einzelimpuls und Viererfächer. Fächer haben eine Lücke in der Mitte. Die Geschwindigkeit steigt von 0,12 auf höchstens 0,15 Pixel/ms; der Folgeabstand sinkt von 2,8 auf 2,212 Sekunden. Das bestehende gemeinsame Geschosslimit mit Begleitschiffen gilt weiter und kann einen Fächer verkleinern. Es gibt keine nachträgliche Zielverfolgung.

Pause, EMP, Einflug und Tod unterbinden den Angriff beziehungsweise seine Uhr. Warnzeit und Salvennummer werden im Boss-Kampfstand gespeichert und serverseitig auf zulässige Zahlen geprüft. Alte Kampfstände ohne Kernzustand erhalten beim ersten Aktivieren die volle Warnzeit. Die Funktion gilt auch für fortgesetzte alte Missionen; deren Gruppenpläne bleiben unverändert.

Spielanleitung und Warnung sind in allen 17 Spielsprachen vorhanden. Tests: sieben gezielte Tests erfolgreich (alle 50 Kerne sowie bestehende Geschützzerstörung für 392 Geschütze), Frontend-Build einschließlich Übersetzungsprüfung und Backend-Build erfolgreich. Lokale Browserprüfung mit echten API-Handlern und isoliertem In-Memory-Konto bestätigt das Wiederherstellen des Kerns bei Boss 1 und 50. Keine echte Pi-/Datenbank- oder Geräte-Balanceprüfung. Die visuelle Smartphone-Kontrolle führte zur Korrektur des Warntext-Abstands.
