# Galaxiekarte V3 – Integration und Abnahme

Stand: 10. Oktober 2026. Entwickler: Marc Wolf / 19Trojan69, Trojan Wolf Games.

Branch: `codex/galaxy-map-v3-preview-20261010`.
Basis: `codex/fleet-polish-release-20261010`, Commit
`6d148d9a03508977d334155d222b93b412c2fa49`. Diese Basis enthält die
zwischenzeitlichen Verbesserungen an Flotte, Startseite, Profil und Sprachen.
Die bestehenden offenen PRs wurden nicht zusammengeführt. Kein Merge nach
`main`, keine Promotion, keine Neuzuordnung der offiziellen Spieladressen.

## Integrierter Umfang

Native, separat geladene React-Route `/galaxy`, erreichbar über Startseite und
Schnellzugriff »Spiel & Mission«. Die Karte startet bei Level 1 unten und führt
durch zehn Regionen bis Level 500 oben. Alle 500 Levelnummern sind anklickbar.
50 Bossstationen, 100 direkt beschriftete Minispiel-Portale und zehn
Handelsstationen haben unabhängige Zugänge. Auch bei Level 10 bleiben
Levelnummer, Boss und Minispiel getrennt.

Die gesamte HTML-V3-Referenz wurde analysiert. Ihre zehn eingebetteten
Weltraumgrafiken werden als kleine JPG-Dateien wiederverwendet; Demonstrations-
Freischaltungen und simulierte Siege wurden nicht übernommen. Die Spielfläche
ist keine iframe-Integration. Nur die separate technische Layout-Prüfseite
verwendet einen iframe, um die tatsächliche Route bei verschiedenen Breiten zu
prüfen.

Animierte, kurvige Route, Portale, Sterne, Nebel, Planeten, Ringe, Wracks,
Kristalle, Energierisse und Kometen. Nicht sichtbare Regionen pausieren ihre
Animationen; größere Grafiken und Bossbilder werden erst bei Annäherung
geladen. `content-visibility` reduziert die Arbeit außerhalb des Ausschnitts.
Gespeicherte reduzierte Effekte und `prefers-reduced-motion` werden beachtet.
Die Karte besitzt einen eigenen vertikalen Scrollbereich. Die temporäre
Seitenscroll-Sperre wird beim Verlassen wieder zurückgesetzt.

Bossbilder stammen aus dem vorhandenen Hull-/Waffen-Renderer und Manifest.
Nur bestätigte `bossWins` machen sie farbig; andere erscheinen als Silhouette
ihres tatsächlichen Schiffs. Bosskarten bleiben zusätzlich an die bestehende
`cardAvailability` gebunden. Ein Kartensieg erzeugt keine Freischaltung.

Die aktuell gespeicherte Schiffsform, Farbe und tatsächlich besessene
Ausbaustufe werden angezeigt. »Zu meiner Position«, Level 1, Level 500 und
ein Level-Sprungformular stehen bereit. Schiff und Beschriftung haben einen
freien Platz neben normalen Levels beziehungsweise oberhalb mehrteiliger
Stationen. Nur ein neu bestätigter benachbarter Aufstieg kann eine kurze
Fluganimation auslösen. Beim Öffnen wird die Karriere nicht erneut abgeflogen.

Handelsstationen öffnen den vorhandenen Shop oder Hangar. Es gibt keine zweite
Besitzverwaltung, keine Preisänderungen, keine neuen Zahlungs- oder
Belohnungsendpunkte. Karten öffnen weiterhin die bestehende Sammlung.

Alle 33 neuen Kartentexte sind in allen 19 auswählbaren Sprachen vorhanden.
Manuelle Sprachwahl, Gerätesprache und bestehender Fallback bleiben erhalten;
es wurde keine weitere Sprachauswahl in der Karte eingebaut. Die Regionsnamen
sind ausschließlich Kartennamen und ersetzen keine Kampagnennamen.

## Fortschritt und Bestandsschutz

Der Kartenadapter verwendet ausschließlich GET: `/user/me`, `/progress/me`,
`/rewards/me`, `/hangar/inventory`. Er prüft die Kontoidentität und das Netzwerk.
Bei Fehlern wird kein alter Kontofortschritt als aktueller Gaststand ausgegeben.
Gäste können die Karte ohne Anmeldung betrachten. Bestehende lokale
Gastaufzeichnungen werden nur im passenden Ursprungsnetz gelesen; neue
Netzwerk-Schlüssel haben Vorrang. Es gibt keine Datenmigration durch die Karte.

Ein erreichtes Level zählt nicht automatisch als abgeschlossen. Tatsächliche
Boss-Siege und gespeicherte Blockabschlüsse werden berücksichtigt. Diese
Ableitung schreibt nichts zurück. Gameplay, Bosskämpfe, Bonusrunden,
Karrierewerte, Ranglisten, Käufe, Pi-Transaktionen, Shards, Waffen und Besitz
wurden nicht verändert. Die vorhandene Schiffsmigration des Hauptspiels bleibt
unverändert.

Minispiele bleiben vollständig »In Entwicklung«. Die vorbereitete Berechtigung
erfasst nachträglich alle abgeschlossenen Fünfer-Level. Wiederholbarkeit und
einmalige, begrenzte Belohnung je Station/Medaillenstufe sind lediglich als
künftige Regeln beschrieben. Die Vorschau startet keine Minispiele und zahlt
keine Belohnungen aus.

Für den neuen Branch wurde ausschließlich eine branchbezogene Preview-Variable
`CRYPTOID_TESTNET_BACKEND=local` angelegt. Produktionsvariablen und die
Konfiguration anderer Branches bleiben erhalten. Die bestehende Gateway-
Netztrennung und Zahlungsabwicklung werden wiederverwendet.

## Tatsächlich durchgeführte Prüfungen

| Prüfung | Ergebnis |
| --- | --- |
| Frontend-Tests einschließlich Kartentests | 285 bestanden; 14 gezielte Kartentests |
| Zahlungs-, Kauf-, Waffenbestands- und Gateway-Regressionsprüfungen | 16 bestanden; lokale isolierte Tests ohne Live-Buchungen |
| Frontend-Produktionsbuild / TypeScript | Bestanden |
| Backend-Build | Bestanden |
| Übersetzungsinventar und Release-Sprachprüfung | Bestanden; keine unübersetzten neuen JSX-Texte; alle 19 Kartenpakete vollständig |
| ESLint der neuen Kartenkomponenten | Bestanden |
| Gesamt-ESLint gegenüber Basis | 51 bereits bestehende Fehler, 0 hinzugefügte Fehler; nicht als vollständig bestandener Lintlauf ausgewiesen |
| Beide Menüzugänge im tatsächlichen Chrome-Browser | Öffnen dieselbe `/galaxy`-Route; Rückkehr zur Startseite bzw. zum Schnellzugriff geprüft |
| Stationszahlen im Browser-DOM | Exakt 500 Levels, 50 Bosse, 100 beschriftete Minispiele, 10 Handelsstationen |
| Start bei Level 1 / Level 500 erreichbar / vertikales Scrollen | Im Browser geprüft |
| Level 5 / separate Zugänge bei Level 10 | Hinweise und Bossfenster im Browser geöffnet und geschlossen |
| Alle 50 Bossstationen | Jede einzeln im Browser geöffnet; richtiger Originalname und Silhouettenstatus |
| Position und »Zu meiner Position« | Gastposition Level 1 im Browser bestätigt; Rücksprung geprüft |
| Handelsstation → bestehender Schiff-Shop | Im Browser bestätigt; keine Käufe ausgelöst |
| Smartphone-/Tablet-Geometrie | 320, 375, 390, 414 und 768 px: kein horizontaler Überlauf, keine abgeschnittenen Buttons |
| Mobile Dialoge | Boss- und Minispielhinweis bei 320 px; Schließen und Escape geprüft; langer Inhalt vertikal scrollbar |
| Schiffbewegung und Datenzugriffe | Tatsächliche React-Callbacks getestet: keine Schreibfunktionen, keine Wiederholungsflüge, reduzierte Effekte; alle 500 mobilen Schiffsplätze ohne verdeckte Levelnummer |
| Schnelles Scrollen / begrenzte aktive Regionen | Wiederholte Sprünge und PageUp im Browser; nur nahe Regionen aktiv; keine beobachteten Bedienausfälle |

## Grenzen der Abnahme

Die Breitenprüfung verwendet echtes Chrome-Rendering der Karte, keine
physischen iPhones, Android-Geräte oder den Pi Browser. Safari, reale
Touchgesten, Akkulaufzeit und gerätespezifische Bildwiederholraten benötigen
noch eine Geräteabnahme. Die Browser-Schnittstelle stellt keine verwendbare
Performance-Uhr für eine belastbare FPS-Messung bereit; es wird daher kein
FPS-Wert behauptet.

Es wurde kein bestehendes Spielerprofil angemeldet, verändert oder mit
simulierten Siegen ausgestattet. Kontodaten, bestätigte Siege und
Schiffausbaustufen sind durch isolierte Adapter-/Komponententests abgedeckt;
ein visueller Kontotest mit einem tatsächlich besiegten Boss bleibt offen.
Live-Pi-Zahlungen wurden nicht ausgelöst. Der vorhandene große Hauptbundle
verursacht weiterhin eine Vite-Größenwarnung; die Karte selbst wird separat
geladen (rund 16 KB JavaScript und 15 KB CSS vor gzip, rund 408 KB für alle
zehn Regionsgrafiken zusammen).

Die isolierten Vercel-Deployments können eine Vercel-Anmeldung erfordern.
Die Verbindung konnte keinen temporären Freigabelink erzeugen (403/404).
Die Preview selbst war im bereitgestellten Browser erreichbar. Schutzregeln
wurden nicht abgeschaltet. Veröffentlichung im offiziellen Testnet oder in
Produktion bleibt von Marc Wolfs ausdrücklicher Freigabe abhängig.

## Angelegte und geänderte Dateien

Neu: `GalaxyMap.tsx`, `GalaxySector.tsx`, `GalaxyInfoDialog.tsx`,
`GalaxyBossArt.tsx`, `galaxyModel.ts`, `galaxyData.ts`, `useGalaxyData.ts`,
`galaxyMap.css`, `galaxyEntry.css`, `galaxyMap.test.mjs`,
`locales/galaxyMap.ts`, zehn `public/galaxy/region-*.jpg`,
`public/galaxy-layout-check.html` und dieser Bericht.

Geändert: `Router.tsx`, `QuickAccessMenu.tsx`, `BlockchainIcon.tsx`,
`CinematicHome.tsx`, `Shop.tsx` (nur Navigationszugänge/Öffnungszustände),
`i18n.ts`. Keine Backend-, Katalog-, Zahlungs-, Gameplay- oder
Spielerdaten-Datei wurde geändert.

Die fertige Vorschauadresse und der Pull Request sind im Abschlussbericht
des Arbeitsauftrags verlinkt. Die technische Layout-Prüfseite ist unter
`/galaxy-layout-check.html` derselben isolierten Vorschau erreichbar.
