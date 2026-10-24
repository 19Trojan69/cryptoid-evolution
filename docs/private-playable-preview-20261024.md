# Geschuetzte spielbare Vorschau, 24. Oktober 2026

Eigentuemerfreigabe: geschuetzte spielbare Vorschau mit festem Spielfeld ohne
Scrollversatz; tablet/PC Vollbild beim Spielen-Klick, Home darf Browserleiste
behalten. Basis ist ce1fb59 auf dem bestehenden Stabilitaetszweig, nicht main.
Neuer isolierter Zweig codex/private-playable-preview-20261024. Automatisches
Deployment bleibt aus. Nur ein manuelles Preview ist freigegeben; kein
Production-Deployment, kein Aliaswechsel, keine Mainnet-/Testnet-Aenderung.

Der vorbereitete lokale Stand 022797b/tree cfbbad war noch nicht als Remote-
Commit gesichert, als der temporaere Arbeitsordner bereinigt wurde. Die
Vorbereitung wurde aus dem gesicherten ce1fb59 rekonstruiert und erneut gebaut
und geprueft. Es wird keine Bytegleichheit mit dem verlorenen Entwurf behauptet.

## Isolation und Anzeige

Original frontend/src, index.html, Grafik/Audio und backend sind byte-identisch.
Nur in diesem Preview ersetzt Vite den Auth-Hook durch eine speicherfreie
Gastfixture. Die verpackte Seite verwendet ein lokales SDK ohne echte Anmeldung
oder Zahlungen und ein isoliertes /api ohne Datenbank, Persistenz oder externe
Anfragen. Vier synthetische Endpunkte liefern Gast/Leerlisten bzw. ignorieren
Usage; alles andere wird mit 403 abgewiesen. Original API-Entry ist nur hier
gegen den Fixture-Handler ausgetauscht. Production-Installation/Build brechen ab.

Die separate Host-CSS fixiert ausschliesslich die game-shell im dynamischen
Viewport und verhindert Dokument-Scrollen; originale HUD-/Artwork-Abmessungen
bleiben unveraendert. Der vorhandene Spielen-Klick ruft native Fullscreen direkt
in der Nutzergeste auf. Kein erzwungenes Browserrecht, kein neuer Timer oder
Spielhaken. Fullscreen ist auf unterstuetzten Hosts bestaetigt, auf anderen
Hosts nur das feste verfuegbare Spielfeld. Die originale Home-Vollbildlogik ist
unveraendert; eine Browserleiste ist auf tablet/PC nicht erforderlich entfernt.

## Erneute Pruefungen

Vollstaendiger Build: 151 originale Tests und 8 Isolationspruefungen, Sprachgate,
TypeScript/Vite bestanden; 1740 originale Rumpfbilder, 95.450.326 Bytes. Dazu
9 vorhandene Fullscreen-Tests, Vite-Konfigurationslint und diff-Pruefung bestanden.
Der lokale Build bezeichnet den Basiscommit plus geaenderten Arbeitsstand;
der manuelle Vercel-Build prueft spaeter den konkreten Remote-Commit erneut.

Native Browser starten und erreichen den lokalen HTTP-Server mit 200 und
local-server-ok. Chromium 141 und WPE-WebKit 26.5 bestehen jeweils 5 kurze
Viewportfaelle: 430x825, 390x650, 820x1180, 1180x820 und 1440x900. Nach nativer
Eingabe liegt der Scrollversatz bei 0/0 und das originale HUD/Spielerschiff im
Viewport. Chromium bestaetigt Fullscreen nach Play in allen 5 Faellen. Auf diesem
WPE-Host fehlt die Fullscreen-API. Chromium-Smartphones verwenden native
Touchbewegung, WPE-Smartphones Tap/PageDown (kein physischer iPhone-Wischbeleg).
Originalschriften: alle 13 historischen Dateien groessen-/SHA256-identisch.
Keine ungefangenen JS-Fehler, unerwarteten externen Anfragen oder HTTP-Fehler.
JSON enthaelt Diagnosezustand vor/nach Eingabe und Bildschirmaufnahme.

Diese Erfolge ersetzen weder den ersten dokumentierten WPE-Kaltstartfehler
noch den im verlorenen Entwurf beobachteten Tablet-loop-stall. Kein technisches
Pauseoverlay wird automatisch fortgesetzt. Strikt >2500ms, Prueftakt500ms.
Starttests, kurze Bedien-/Viewporttests und vollstaendige Kampagne sind getrennt.
Physischer Pi Browser auf iPhone/Tablet/PC, iPhone-Langzeitstabilitaet und die
historischen White Screens bleiben offen. Keine neue Eigentuemer-Kampagne,
kein erneuter Kauf, kein Browserdaten-Loeschen und kein OS-Bericht verlangt.

## Bereitstellungsgrenze

Bestehendes Projekt cryptoid-evolution-testnet unter Team19-trojan69 hat
Vercel Authentication / Standard Protection fuer Previews. Geschuetzten
Zugang nicht schwaechen, keine Bypasslinks oder kostenpflichtigen Optionen.
Vorherige Production: AsXUruYAuKRboZWFymr2cD3FkLCJ, Quelle19de3e6.
Die neue Preview darf diese Production/oeffentliche Domain nicht ersetzen.
Tatsaechliche URL, Deployment-ID/Quelle und Nachpruefung folgen im Receipt,
sobald der manuelle Preview-Build erfolgreich abgeschlossen und getestet ist.
