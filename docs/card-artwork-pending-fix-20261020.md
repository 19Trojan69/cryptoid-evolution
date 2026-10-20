# Laufende Karten-Vorbereitungen teilen

Der Owner hat am 20. Oktober 2026 um 14:05 Uhr (Europe/Vienna) die Korrektur
der zuvor genannten zwei Karten-Ladewege beauftragt. Ausgangspunkt ist der
veröffentlichte Runtime-Stand `23b9f83f2639ba836eea0e94e45ba310c9ab97d0`;
der vorhandene Audit-Zweig stand vor der Korrektur auf `f3f1f632`.

## Fehler und Korrektur

`bossArtwork.ts` und `shipArtwork.ts` speicherten auch noch laufende
Vorbereitungen nur im begrenzten Ergebnis-Cache. Wird ein solcher Eintrag
verdrängt, konnte ein erneuter Aufruf dieselbe Karte nochmals laden und
berechnen, während der erste Auftrag weiterlief.

Beide Loader teilen jetzt laufende Aufträge zusätzlich über eine separate Map.
Nach Erfolg oder Fehler wird der jeweilige Pending-Eintrag mit Identitätsprüfung
entfernt. Fehlgeschlagene Ergebnis-Einträge werden weiterhin entfernt, sodass
ein späterer Aufruf erneut versuchen kann. Erfolgreiche Ergebnisse verbleiben
ausschließlich im bisherigen begrenzten Cache oder bei ihren bestehenden Nutzern.

Die Cache-Grenzen von acht Bosskarten und zwanzig Schiffskarten bleiben gleich.
Auflösung beziehungsweise Lackierung bleiben Bestandteil des Schlüssels.
Zeichencode, Bilddateien, Arbeitsflächen-Freigabe, HUD, Spielregeln, Sounds,
Konten, Käufe, Spielstände und Ranglisten wurden nicht verändert. Es gibt keine
neue Drosselung, keinen Timer und keinen Diagnose-Sampler.

## Prüfung

Der neue Test `frontend/scripts/verifyCardArtworkPending.mjs` führt die echten
beiden Loader vor und nach der Korrektur aus. Die Negativkontrolle liest die
Originalmodule aus dem unveränderten Commit `23b9f83`.

| Kontrollierter Ladeablauf | Vorher | Korrigiert |
| --- | ---: | ---: |
| 9 Bosskarten, erste erneut angefordert, Bilder verzögert | 10 Berechnungen | 9 Berechnungen |
| 21 Schiffskarten, erste erneut angefordert, Bilder verzögert | 22 Berechnungen | 21 Berechnungen |
| 3 Durchläufe derselben 9 Bosskarten vor Ladeabschluss | 27 Berechnungen | 9 Berechnungen |
| 3 Durchläufe derselben 21 Schiffskarten vor Ladeabschluss | 63 Berechnungen | 21 Berechnungen |

Insgesamt bestehen 18 kontrollierte Fälle. Zusätzlich geprüft sind die
unveränderten fertigen Cache-Grenzen, das Entfernen abgeschlossener Pending-
Einträge, gemeinsam empfangene Ladefehler vor/nach Verdrängung, spätere
Wiederholungen, Freigabe bei Zeichenfehlern und getrennte Auflösungs-/Farbvarianten.

110 Vergleiche der echten Bilddateien im nativen CPU-Raster ergeben identische
Abmessungen, Metadaten und RGBA-Pixel: alle 50 Bosskarten bei 1200 Pixeln
Vorbereitungsauflösung sowie alle 60 Schiffseditionen.

Zwölf bestehende Karten-/Sammlungstests bestehen. Der Frontend-Release-Build
einschließlich zwölf Locale-Tests, Übersetzungsprüfung, TypeScript und Vite
besteht ebenfalls. Die bestehende Vite-Warnung zu großen JavaScript-Chunks
bleibt bestehen.

```sh
cd frontend
node scripts/verifyCardArtworkPending.mjs
node --experimental-strip-types --test src/pages/cardDownload.test.mjs src/pages/cardRevealRules.test.mjs src/pages/collectionAudit.test.mjs src/pages/collectionRules.test.mjs
npm run build
```

Für den CPU-Rastertest wird das bereits vorhandene `@napi-rs/canvas` aus der
QA-Umgebung verwendet; keine Projekt-Abhängigkeit wurde ergänzt. Alternativ
kann `CRYPTOID_NATIVE_CANVAS_MODULE` den vorhandenen Modulpfad angeben.
Maschinenlesbare Ergebnisse: `card-artwork-pending-fix-20261020.json`.

## Einordnung und Stand

Die kontrollierten Hosts messen doppelte Aufträge und ihre Lebensdauer, keinen
nativen Browser-Speicher. Der Rastervergleich ist kein physischer iPhone-Test.
Diese Korrektur belegt daher weder die Herkunft der 2,15 GB aus dem vorgelegten
SafariViewService-Jetsam-Einzelbericht noch die Ursache des Cryptoid-Whitescreens.
Die betroffene Webseite bleibt im Einzelbericht unbenannt; der Nutzer konnte
den Zeitpunkt keinem bestimmten Browser oder Spiel sicher zuordnen.

Die Korrektur ist auf dem isolierten Audit-Zweig vorbereitet und getestet.
In diesem Schritt erfolgt keine Veröffentlichung. Die vorhandene Testnet-
Freigabe `23b9f83` und sämtliche festen Release-/Rollback-Referenzen bleiben
erhalten; automatische Deployments des Audit-Zweigs bleiben deaktiviert.
