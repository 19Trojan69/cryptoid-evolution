# Übergangsbewegung und lokale Geschützblitze – Testnet veröffentlicht

Aktuell: https://cryptoid-evolution-testnet.vercel.app/
READY dpl_7GPUCjpJA9gNEmiLk8biHvPCeSva
Commit c638241f82570d1c8d30bcfe1b25f5a06b69bcf4
Baum 5f9ec8a24b782a266cbbbe649b04c7d0ae578dd6
Branch codex/transition-motion-20261106

Kleine Bossgeschütze schreiben nicht mehr den Ganzschiff-Mündungslichtwert.
Ihre vorhandenen lokalen Canvas-Mündungsblitze und Sounds bleiben erhalten.
Der vorher veröffentlichte lokale Reaktor-Farbblitz und die Reaktor-/Türtreffer bleiben.

Die dekorativen Blockchainwürfel werden nicht mehr zusammen mit Kampf-
Einschlagseffekten pausiert und drehen sich auch im Abschlussübergang.
Die einzelne Binärreihe läuft jetzt nach rechts, die fünf Formation-Reihen
abwechselnd links/rechts/links/rechts/links. Vorhandene Dauern und CSS-
Keyframes werden benutzt. Keine neue JS-Schleife, kein Timer, Canvas oder Asset.
Bestehende reduzierte Bewegung hält die Würfel weiterhin still; echte
Kampf-Effekte behalten ihre Pausierung.

CI42191513341: Jobs127804421338(WebKit),127804421784(Chromium) und
127804421641(504 Tests, TypeScript, Vite) bestehen.
Native Prüfungen bestätigen laufende Würfel vor manueller Zeitinspektion,
unterschiedliche Rotationsmatrizen, Binär-Laufrichtungen, Kampf-Pause
und reduzierte Bewegung. Keine physische Smartphone-/White-Screen-Abnahme.

Öffentlich ohne Authentifizierung geprüft: Home200, richtige Commit-/Baumkennung
und geänderte Bewegungsregeln im ausgelieferten CSS.
Assets: /assets/index-DOHsW_hd.js, /assets/GamePage-Ddt4gdQa.js,
/assets/index-CwFJyjPn.css.

Produktion bleibt dpl_6N3FdS9XGXasCWrpMksngxCPNPRk/ce073547, main unverändert.
Rückfall: vorheriges Testnet dpl_HXX57EN88Qto9j84RPhmYt4HFLx6/199ef598.
Auto-Git-Deployment des Arbeitsbranches gesperrt; kein Merge oder Schutzabbau.
Gesamtspeichervorteil und White-Screen-Behebung bleiben unbewiesen.
