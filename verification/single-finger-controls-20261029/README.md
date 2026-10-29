# Einfinger-Steuerung

Vorbereitet auf `codex/single-finger-controls-20261029`, Basis `ce073547`.
Während des aktiven Spiels benötigt jede Taste einen eigenen frischen primären
Tipp, nachdem die Steuerberührung beendet wurde. Ein zweiter Kontakt darf kein
Menü öffnen. Hinüberziehen und eine auf der Taste begonnene Bewegung über zwölf
CSS-Pixel aktivieren die Taste nicht; normale kleine Tippbewegungen bleiben
zulässig. Erst ein neuer gezielter Tipp öffnet das Waffenmenü und die bestehende
Pause. Gleiches gilt für Home/Pause. Tastatur-/Assistenzaktivierung und die
normalen pausierten Menüs bleiben erhalten.

Die Eingabe besitzt einen kleinen kurzlebigen Tipp-Merker und einen Click-Capture-
Handler am bestehenden Spielfeld. Die vorhandenen Bewegungs-/Release-Handler
liefern die übrigen Signale. Nach Release bleibt die normale implizite Capture-
Freigabe zulässig; Cancel, Fokusverlust und Reset verwerfen den Merker. Der alte
Touch-Fallback erhält dieselbe Regel und verhindert erneutes Scharfschalten durch
unmittelbar folgende Kompatibilitäts-Mausereignisse. Kein neuer Timer, RAF,
Speicher-/Netzwerkzugriff oder Eingabedaten-Upload. Spieluhren, Rendering,
Originalgrafik und -audio, Wirtschaft und GamePage sind unverändert.

Lokal bestanden: 33 Eingabetests, Typprüfung, Lint der beiden Laufzeitmodule und
der vollständige Frontend-Releasebuild. Die zusätzliche Prüfung nutzt echte
Browser-Ereignisweiterleitung mit dem tatsächlichen Eingabemodul, der vorhandenen
Viewport-Sperre und React-Klickdelegation. Ihre Spielsituation ist synthetisch;
Native-Multitouch kommt nur im Chromium-CDP-Lauf vor. WebKit prüft native einzelne
Tipps sowie ausdrücklich synthetische zusätzliche Kontakte. Keine dieser
Prüfungen ist eine physische iPhone-/Pi-Browser-Abnahme oder ein bestätigter
White-Screen-Fix. Die ursprüngliche JavaScript-Lücke im Gerätebericht erklärt
noch keine native Absturzursache.

Der gezielte synthetische Regressionstest scheitert erwartungsgemäß mit dem
unveränderten Release-Eingabemodul, weil dort der zusätzliche Kontrollklick
nicht am Spielfeld abgefangen wird. Der korrigierte Test besteht. Dies ist kein
reproduzierter White Screen. Browser-Ergebnisse und die separate geschützte
Vorschau werden nach Abschluss ergänzt. Keine öffentliche Veröffentlichung,
keine Übernahme der Gast-/Sperrhandler aus dem isolierten Vorschauzweig nach Main.
