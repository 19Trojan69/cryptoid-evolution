const keys = ['Collect the heart to start the bonus round.', 'Damaged turrets glow intense orange before exploding.'];
const rows: Record<string, string[]> = {
de: ['Sammle das Herz für die Bonusrunde ein.', 'Beschädigte Geschütze glühen intensiv orange, bevor sie explodieren.'],
es: ['Recoge el corazón para iniciar la ronda extra.', 'Las torretas dañadas brillan naranja intenso antes de explotar.'],
fr: ['Ramasse le cœur pour lancer le bonus.', 'Les tourelles endommagées deviennent orange incandescent avant d’exploser.'],
pt: ['Recolhe o coração para iniciar o bónus.', 'As torretas danificadas brilham em laranja intenso antes de explodir.'],
it: ['Raccogli il cuore per iniziare il bonus.', 'Le torrette danneggiate brillano di arancione intenso prima di esplodere.'],
pl: ['Zbierz serce, aby rozpocząć bonus.', 'Uszkodzone wieżyczki żarzą się intensywnie na pomarańczowo przed eksplozją.'],
tr: ['Bonusu başlatmak için kalbi topla.', 'Hasarlı taretler patlamadan önce yoğun turuncu parlar.'],
ru: ['Собери сердце, чтобы начать бонус.', 'Повреждённые турели ярко раскаляются оранжевым перед взрывом.'],
hr: ['Pokupi srce za početak bonusa.', 'Oštećene kupole snažno žare narančasto prije eksplozije.'],
cs: ['Seber srdce a spusť bonusové kolo.', 'Poškozené věže před výbuchem intenzivně žhnou oranžově.'],
sk: ['Zober srdce a spusti bonusové kolo.', 'Poškodené veže pred výbuchom intenzívne žiaria oranžovo.'],
hu: ['Vedd fel a szívet a bónuszkörhöz.', 'A sérült lövegek robbanás előtt intenzív narancssárgán izzanak.'],
ro: ['Colectează inima pentru runda bonus.', 'Turelele avariate strălucesc intens portocaliu înainte să explodeze.'],
sr: ['Покупи срце за почетак бонуса.', 'Оштећене куполе јарко сијају наранџасто пре експлозије.'],
uk: ['Збери серце, щоб почати бонус.', 'Пошкоджені турелі яскраво розжарюються помаранчевим перед вибухом.'],
th: ['เก็บหัวใจเพื่อเริ่มรอบโบนัส', 'ป้อมปืนที่เสียหายจะเรืองแสงสีส้มเข้มก่อนระเบิด'],
};
export const bossRewardTranslations = Object.fromEntries(Object.entries(rows).map(([locale, row]) => [locale, Object.fromEntries(keys.map((key, i) => [key, row[i]]))]));
