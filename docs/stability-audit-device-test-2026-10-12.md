# Reeller iPhone-/Pi-Browser-Gerätetest: 30–60 Minuten

## Voraussetzung und Ablaufprotokoll

Dieser Test ist **vorbereitet, noch nicht durchgeführt**. Die Korrekturen dieses Audits sind noch nicht öffentlich veröffentlicht. Keine bestehende Testnet-URL als Test des neuen Branches ausgeben. Einen genehmigten Test-Build erst nach erfülltem Backupschutz verwenden; keine Live-Datenbank-Wiederherstellung oder Zahlung für einen Stabilitätstest auslösen.

Mit demselben iPhone/Pi Browser wie beim Vorfall testen. Modell, iOS-/Pi-Browser-Version, URL, eindeutige Build-ID, Startzeit mit Zeitzone, Ausgangslevel/-block, Lives, Score, Shards, aktive Waffe/Timer und letzte bestätigte Speicherung notieren. Diese Angaben bleiben beim Nutzer; keine Zugangsdaten, Pi-Tokens oder Kontokennungen in Diagnosen aufnehmen. Für Vergleiche dasselbe Gerät, dieselbe Helligkeit, Lautstärke und Verbindung verwenden; Ladezustand/Ladekabel notieren. Wärme nur als Beobachtung protokollieren.

Musik und Effekte eingeschaltet lassen. Alle üblichen HD-Grafiken, Explosionen und Schussüberlagerungen verwenden. Keine Qualitäts-, Partikel-, Paint- oder Schwierigkeitsänderung. Eigene Testprofile/Testnet verwenden; keine Mainnet-Käufe oder echten Zahlungen. Bei produktiven Konten genügt beobachtender Test der bestehenden Funktionen; keine Testbelohnungen injizieren.

## Lauf A: 30–60 Minuten ohne beschleunigte Clears

| Abschnitt | Durchführung und Erfolgskriterium |
| --- | --- |
| Erste 5 Minuten | Normal spielen, steuern und Waffen/Power-ups nutzen. HUD bleibt eine kompakte Zeile; Shards über Score mittig; keine Gegner-Positionsmarker. Formationseinflüge, ruhende Seitwärtsbewegung, Grafik und Klang direkt mit der freigegebenen Referenz vergleichen. |
| Nächste 20–35 Minuten | Mindestens 30 aufeinanderfolgende Blöcke mit allen dazwischenliegenden Boss-/Bonusabschnitten spielen. Beginn/Ende und Bossnummern notieren. Wenn 30 Blöcke in 60 Minuten nicht erreichbar sind, den durchgehenden Lauf fortsetzen oder ausdrücklich als unvollständig melden; nicht erzwungene Clears als Gerätetest zählen. |
| Meme Nebula | Block 5/9 in der echten Kampagne erreichen oder einen legitim vorhandenen gespeicherten Run fortsetzen. Dichte eigene/feindliche Projektile, mehrere Treffer/Explosionen und Formationswechsel abwarten. Mindestens zwei normale Gruppen sowie den folgenden Übergang spielen. Block/Phase vor jeder Auffälligkeit notieren. |
| Höhere Levels | Einen vorhandenen höheren Save mit demselben Gerät testen; Level/Block genau aufzeichnen. Höherer Boss einschließlich Waffen, Fall, Explosion, Herz/Belohnungsanzeige und Anschlusskampf. Die Hauptserie von 30 Blöcken dabei nicht durch künstlichen Fortschritt ersetzen. |
| Laufende Pausen | Dreimal Pause für 20–30 s, einmal mit aktiver bezahlter Waffe und Power-up. Timerwerte vorher/nachher vergleichen. Waffenmenü und Home-Abfrage öffnen, mit Abbrechen/Back schließen, bewusstes Resume verwenden. Kein ungewolltes Home, keine doppelte Countdown-/Eingabe-Reaktion. |
| Hintergrund | Während Kampf/Power-up 60 s zu anderer App wechseln; später 30–60 s Bildschirm sperren. Nach Rückkehr muss die Mission kontrolliert pausieren. Timer dürfen in der Pause nicht laufen. Erst nach Resume weitersteuern. Kein unbeabsichtigter Verlust/Neustart. |
| Netz und Speichern | Verbindung kurz unterbrechen; mindestens einen bestehenden automatischen Save abwarten. Wieder verbinden und bestehenden Retry nutzen. Nicht absichtlich so lange weiterkämpfen, dass private Daten verloren gehen. Bei `save-pressure` muss die Mission pausieren, die URL erhalten bleiben und nach bestätigtem Drain wieder fortsetzbar sein. |

Bei einer technischen Unterbrechung stehen bleiben und Zeitpunkt, letzte Anzeige, URL, sichtbaren Fehler-/Pause-Dialog und eventuell neu gestarteten Pi Browser notieren. Nicht unmittelbar mehrfach Reload/Resume auslösen. Bei wiederholtem technischen Fehler bewusst pausiert lassen; keine Behauptung erfolgreicher Behebung allein aufgrund eines kurzen neuen Starts.

## Lauf B: wiederholte Speicherung und Wiederherstellung

Fünf Zyklen, jeweils 1–2 Minuten echter Kampf, dann Pause und **bestätigte** Speicherung abwarten. Mindestens einmal während normaler Formation, einmal mit aktiven Waffentimern und einmal nach einem Boss-/Reward-Übergang. Werte und Zeitpunkt der bestätigten Speicherung notieren.

Zuerst drei reguläre Reloads mit Wiederaufnahme durchführen, anschließend zweimal Pi Browser vollständig schließen/neu öffnen und gespeicherten Run wiederaufnehmen. Nicht davon ausgehen, dass Schließen jedes Mal dieselbe Browser-/sessionStorage-Wiederherstellung erzeugt. Auch einen Reload bei offenem Pause-/Waffenmenü prüfen: `/game` darf nicht allein wegen eines alten Modal-Guards zu Home springen.

Pro Zyklus Lives/Score/Shards/Inventar/Timer mit dem **bestätigten** Save vergleichen; Belohnungen und Boss-Herz dürfen nur einmal gewährt werden. Nach erneuter Save-Wiederholung denselben Highscore-/Reward-Eintrag prüfen. Keine doppelten Käufe oder automatischen Nachkäufe erzwingen. Netzwerkgrenzen anhand vorhandener Testnet-Markierung prüfen. Ein Wiederanlauf kann auf den letzten gespeicherten Zeitpunkt zurückfallen; dies klar von doppelter Gutschrift oder Rückkehr zu Home unterscheiden.

## Lokale Diagnose auswerten

Die neue Downloadfunktion ist nur im geprüften Audit-Build verfügbar. Nach einem Lauf oder Vorfall auf **derselben Herkunft** explizit `/?cryptoid_diagnostics=download` öffnen. Dadurch wird höchstens eine lokale JSON-Datei mit maximal 20 technischen Einträgen heruntergeladen. Keine automatische Übertragung. Den Herkunftswechsel zu Mainnet vermeiden: dort liegt eine andere Browser-Speicherumgebung. Vor dem Export keine Browserdaten löschen. Ein Export öffnet die Startseite bewusst; diesen Schritt nicht als ungewollte Navigation des Vorfalls zählen.

Pi Browser kann Downloads einschränken; der Test muss dann `Download nicht verfügbar` vermerken. Falls das WebView inspizierbar ist, können die bestehenden lokalen Einträge über Safari Web Inspector gelesen werden. Keine Garantie, dass die konkrete Pi-Browser-Version diese Inspektion erlaubt; ohne Export/Inspector darf Diagnoseabdeckung nicht behauptet werden.

| Feld/Ereignis | Vorsichtige Interpretation |
| --- | --- |
| `buildId`, `sector`, `block`, `phase` | Erst prüfen, ob der getestete Build und Abschnitt stimmen. Alte Daten ohne Build bleiben `unknown`. |
| `render-error`, `route-error`, `frame-error`, `javascript-error`, `unhandled-rejection` | Technischer Fehler wurde abgefangen/beobachtet. Nur die Fehlerklasse wird gespeichert; keine rohe Nachricht oder Stack. Route-Fehler können außerhalb der neuen Präsentationsgrenze liegen. |
| `navigation`, `from`, `to`, `navigationAction` | Tatsächlicher Router-Wechsel. Ein POP allein beweist keinen Bug; bewusstes Back/Home und Test-Export berücksichtigen. |
| `visibility-hidden/visible`, `pagehide/pageshow` | Lifecycle-Beobachtungen mit Pause vergleichen. Ein normaler Hintergrundwechsel ist kein Absturz. |
| `loop-stall`, Frame-p95/Maximum | Lange Vordergrundunterbrechung, möglicherweise Rendering/CPU/Debugger/Browser-Scheduling. Kein Beweis eines GPU-/OS-Abbruchs. |
| Gegner/Geschosse/Effekte | Unterschiede am gleichen Abschnitt vergleichen. Natürliche Kampfspitzen und Cache-Aufwärmung nicht als Leak ausgeben. |
| `lastSavedAt` | Letzte bestätigte Speicherung. Null bedeutet unbekannt/keine Bestätigung, nicht automatisch Verlust. Lokale Uhrabweichung berücksichtigen. |
| `save-pressure` | Queue-/Storage-Schutzpause; vorhandenen Retry prüfen. Kein Beleg einer doppelten Belohnung. |
| `unexpected-restart` mit Hint | Hinweis auf vorher aktive Session; Reload kann denselben Hinweis liefern. Fehlender Marker oder fehlendes pagehide ist kein sicherer OS-Kill-Nachweis. |

Die 20 Einträge bilden einen begrenzten jüngsten Ausschnitt, kein vollständiges 60-Minuten-Log. Nach wichtigen Abschnitten bzw. unmittelbar nach einem Abbruch freiwillig exportieren; den dadurch bewussten Exit gesondert notieren. Geräteweite Speicher-/GPU-/Energie-Messung benötigt native Werkzeuge; JS-Heap ersetzt sie nicht. Ein Vergleich von Vor-/Nach-Build auf demselben Gerät soll Frameverteilung und Speichertrend bei gleichen Abschnitten berichten, ohne garantierte Absturzfreiheit aus einem einzelnen erfolgreichen Lauf abzuleiten.

Ergebnisformular: Build/URL; Gerät/Version; Beginn/Ende; normale Blöcke/Bosse; höherer Abschnitt/Meme 5/9; alle Pause-/Background-/Restore-Zyklen; Grafik-/Audiovergleich; bestätigte Saves; Diagnose verfügbar ja/nein; Auffälligkeit mit Uhrzeit; Originalabbruch reproduziert ja/nein; Schlussfolgerung und Messgrenzen. Unvollständige Punkte ausdrücklich offen lassen.
