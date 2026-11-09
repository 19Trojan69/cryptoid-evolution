import { arcadeBaseWords } from "./galaxyArcadeBaseWords";
import { pointsPerDock } from "./galaxyArcadeDocking";
import { germanMissionCopy } from "./galaxyArcadeGermanCopy";
import { type ArcadeLocale } from "./galaxyArcadeLanguages";
import { pointsPerBoostDodge, pointsPerVortexPass } from "./galaxyArcadeManeuvers";
import { arcadeMedalConfiguration } from "./galaxyArcadeMedals";
import { localizedMissionInstruction, localizedMissionTitle } from "./galaxyArcadeMissionLanguages";
import { arcadeSurvivalCopy } from "./galaxyArcadeSurvival";

export type { ArcadeLocale } from "./galaxyArcadeLanguages";
export const arcadeLocales = Object.keys(arcadeBaseWords) as ArcadeLocale[];

export function arcadeLocale(language: string | null): ArcadeLocale {
  const base = language?.trim().toLowerCase().split(/[-_]/)[0];
  return arcadeLocales.find(locale => locale === base) ?? "en";
}

const terms = [
  "cyan", "goldShard", "shards", "chains", "magnet", "core", "clear", "second", "life", "front",
  "vortex", "boostDodge", "safePass", "dock", "ring", "center", "wide", "narrow", "streak", "hit",
  "allyHit", "intercept", "decoyHit", "cleanDefense", "rescue", "lost", "kill", "hull", "block", "ammo",
  "freighter", "base", "cargo", "sound", "phase", "hold", "out", "impulses", "oxygen", "goal",
] as const;
type Term = typeof terms[number];
const termRows: Record<ArcadeLocale, string> = {
  en: "Cyan Shard|Gold Shard|Shards collected|Full four-Shard chains|Shards pulled by the magnet|Recovered cores|Objectives cleared|Survival second|Remaining life at clear|Meteor fronts avoided|Complete vortex passages|Successful boost dodges|Safe corridor passes|Successful dockings|Rings passed|Centered passes|Wide gate|Narrow gate|Centered passes in a row|Targets hit|Friendly hit|Missiles intercepted|Decoy hit|Objectives cleared without hitting decoys|Capsules rescued|Capsule lost|Enemies destroyed|Remaining freighter hull at clear|Shots blocked|Ammo|Freighters|Rescue base|On board|Sound|Gate|Hold position|Fly out|Thruster pulses|Oxygen|Target",
  de: "Cyan-Shard|Gold-Shard|Gesammelte Shards|Vollständige Viererketten|Mit dem Magneten gesammelte Shards|Geborgene Kerne|Erfüllte Aufträge|Überlebte Sekunde|Verbleibendes Leben bei Abschluss|Gemiedene Meteorfronten|Vollständige Wirbelpassagen|Gelungene Schub-Ausweichmanöver|Sichere Engstellenpassagen|Erfolgreiche Andockmanöver|Durchflogene Ringe|Mittige Durchflüge|Breites Tor|Schmales Tor|Mittige Durchflüge in Folge|Getroffene Ziele|Freundtreffer|Abgefangene Raketen|Täuschkörpertreffer|Aufträge ohne Täuschkörpertreffer|Gerettete Kapseln|Verlorene Kapsel|Abschüsse|Frachterschutz bei Abschluss|Abgefangene Schüsse|Munition|Frachter|Rettungsbasis|An Bord|Ton|Tor|Position halten|Hinausfliegen|Steuerimpulse|Sauerstoff|Ziel",
  es: "Shard cian|Shard dorado|Shards recogidos|Cadenas completas de cuatro Shards|Shards atraídos por el imán|Núcleos recuperados|Objetivos cumplidos|Segundo de supervivencia|Vida restante al completar|Frentes de meteoros evitados|Pasos completos por el vórtice|Esquivas con impulso|Pasos por el corredor seguro|Acoplamientos logrados|Anillos atravesados|Pasos por el centro|Puerta ancha|Puerta estrecha|Pasos centrados seguidos|Blancos acertados|Impacto aliado|Misiles interceptados|Impacto en señuelo|Objetivos cumplidos sin acertar señuelos|Cápsulas rescatadas|Cápsula perdida|Enemigos destruidos|Blindaje restante del carguero al completar|Disparos bloqueados|Munición|Cargueros|Base de rescate|A bordo|Sonido|Puerta|Mantén la posición|Sal volando|Impulsos|Oxígeno|Objetivo",
  fr: "Shard cyan|Shard doré|Shards ramassés|Chaînes de quatre Shards complètes|Shards attirés par l’aimant|Noyaux récupérés|Objectifs atteints|Seconde de survie|Vie restante à la réussite|Fronts de météores évités|Traversées complètes du vortex|Esquives avec impulsion|Passages dans le couloir sûr|Amarrages réussis|Anneaux franchis|Passages au centre|Porte large|Porte étroite|Passages au centre de suite|Cibles touchées|Tir allié|Missiles interceptés|Leurre touché|Objectifs atteints sans toucher de leurre|Capsules sauvées|Capsule perdue|Ennemis détruits|Blindage du cargo restant à la réussite|Tirs bloqués|Munitions|Cargos|Base de secours|À bord|Son|Porte|Gardez la position|Sortez|Impulsions|Oxygène|Objectif",
  pt: "Shard ciano|Shard dourado|Shards recolhidos|Sequências completas de quatro Shards|Shards atraídos pelo íman|Núcleos recuperados|Objetivos concluídos|Segundo de sobrevivência|Vida restante ao concluir|Frentes de meteoros evitadas|Travessias completas do vórtice|Esquivas com impulso|Travessias no corredor seguro|Acoplagens bem-sucedidas|Anéis atravessados|Passagens pelo centro|Porta larga|Porta estreita|Passagens centradas seguidas|Alvos atingidos|Acerto num aliado|Mísseis intercetados|Acerto num engodo|Objetivos concluídos sem atingir engodos|Cápsulas resgatadas|Cápsula perdida|Inimigos destruídos|Blindagem do cargueiro restante ao concluir|Disparos bloqueados|Munições|Cargueiros|Base de resgate|A bordo|Som|Porta|Mantém a posição|Sai a voar|Impulsos|Oxigénio|Objetivo",
  it: "Shard ciano|Shard dorato|Shard raccolti|Catene complete di quattro Shard|Shard attratti dal magnete|Nuclei recuperati|Obiettivi completati|Secondo di sopravvivenza|Vita rimasta al completamento|Fronti di meteore evitati|Passaggi completi nel vortice|Schivate con spinta|Passaggi nel corridoio sicuro|Attracchi riusciti|Anelli attraversati|Passaggi al centro|Varco largo|Varco stretto|Passaggi al centro consecutivi|Bersagli colpiti|Colpo su un alleato|Missili intercettati|Esca colpita|Obiettivi completati senza colpire esche|Capsule salvate|Capsula persa|Nemici distrutti|Corazza dei cargo rimasta al completamento|Colpi bloccati|Munizioni|Cargo|Base di soccorso|A bordo|Audio|Varco|Mantieni la posizione|Esci in volo|Impulsi|Ossigeno|Obiettivo",
  pl: "Turkusowy Shard|Złoty Shard|Zebrane Shardy|Pełne łańcuchy czterech Shardów|Shardy przyciągnięte magnesem|Odzyskane rdzenie|Wykonane cele|Sekunda przetrwania|Życie pozostałe po wykonaniu celu|Ominięte fronty meteorów|Pełne przeloty przez wir|Udane uniki z przyspieszeniem|Przeloty bezpiecznym korytarzem|Udane dokowania|Pokonane pierścienie|Przeloty środkiem|Szeroka brama|Wąska brama|Kolejne przeloty środkiem|Trafione cele|Trafienie sojusznika|Przechwycone pociski|Trafienie wabika|Cele wykonane bez trafienia wabików|Uratowane kapsuły|Utracona kapsuła|Zniszczeni wrogowie|Pancerz frachtowców pozostały po wykonaniu celu|Zablokowane strzały|Amunicja|Frachtowce|Baza ratunkowa|Na pokładzie|Dźwięk|Brama|Utrzymaj pozycję|Wyleć|Impulsy napędu|Tlen|Cel",
  tr: "Camgöbeği Shard|Altın Shard|Toplanan Shard’lar|Tamamlanan dörtlü Shard zincirleri|Mıknatısla çekilen Shard’lar|Kurtarılan çekirdekler|Tamamlanan hedefler|Hayatta kalınan saniye|Görev bitiminde kalan can|Atlatılan meteor cepheleri|Tam girdap geçişleri|Başarılı itki kaçışları|Güvenli koridor geçişleri|Başarılı kenetlenmeler|Geçilen halkalar|Merkezden geçişler|Geniş geçit|Dar geçit|Ardışık merkezden geçişler|Vurulan hedefler|Dost isabeti|Önlenen füzeler|Sahte hedef isabeti|Sahte hedefi vurmadan tamamlanan hedefler|Kurtarılan kapsüller|Kaybedilen kapsül|Yok edilen düşmanlar|Görev bitiminde kalan yük gemisi zırhı|Engellenen atışlar|Cephane|Yük gemileri|Kurtarma üssü|Gemide|Ses|Geçit|Konumu koru|Dışarı uç|İtki darbeleri|Oksijen|Hedef",
  ru: "Бирюзовый осколок|Золотой осколок|Собранные осколки|Полные цепочки из четырёх осколков|Осколки, притянутые магнитом|Собранные ядра|Выполненные задачи|Секунда выживания|Оставшаяся жизнь при успехе|Обойдённые фронты метеоров|Полные проходы через вихрь|Уклонения с ускорением|Проходы по безопасному коридору|Успешные стыковки|Пройденные кольца|Проходы по центру|Широкие ворота|Узкие ворота|Проходы по центру подряд|Поражённые цели|Попадание по союзнику|Перехваченные ракеты|Попадание по ложной цели|Задачи без попаданий по ложным целям|Спасённые капсулы|Потерянная капсула|Уничтоженные противники|Оставшаяся броня грузовых судов при успехе|Заблокированные выстрелы|Боезапас|Грузовые суда|Спасательная база|На борту|Звук|Ворота|Удерживай позицию|Вылети наружу|Импульсы тяги|Кислород|Цель",
  hr: "Cijan Shard|Zlatni Shard|Prikupljeni Shardovi|Potpuni lanci od četiri Sharda|Shardovi privučeni magnetom|Prikupljene jezgre|Ispunjeni ciljevi|Sekunda preživljavanja|Preostali život pri uspjehu|Izbjegnute meteorske fronte|Potpuni prolazi kroz vrtlog|Uspješna izbjegavanja potiskom|Prolazi sigurnim koridorom|Uspješna pristajanja|Proletjeli prstenovi|Prolazi kroz sredinu|Široki prolaz|Uski prolaz|Uzastopni prolazi kroz sredinu|Pogođene mete|Pogodak saveznika|Presretnute rakete|Pogodak mamca|Ciljevi ispunjeni bez pogodaka mamaca|Spašene kapsule|Izgubljena kapsula|Uništeni protivnici|Preostali oklop teretnjaka pri uspjehu|Blokirani hici|Streljivo|Teretnjaci|Spasilačka baza|Na brodu|Zvuk|Prolaz|Zadrži položaj|Izleti van|Impulsi potiska|Kisik|Cilj",
  cs: "Azurový Shard|Zlatý Shard|Nasbírané Shardy|Úplné řetězce čtyř Shardů|Shardy přitažené magnetem|Získaná jádra|Splněné cíle|Sekunda přežití|Zbývající život po splnění cíle|Obletěné meteorické fronty|Úplné průlety vírem|Úspěšné úhyby se zrychlením|Průlety bezpečným koridorem|Úspěšná dokování|Proletěné kruhy|Průlety středem|Široká brána|Úzká brána|Průlety středem za sebou|Zasažené cíle|Zásah spojence|Zachycené rakety|Zásah návnady|Cíle splněné bez zásahu návnady|Zachráněné kapsle|Ztracená kapsle|Zničení nepřátelé|Zbývající pancíř nákladních lodí po splnění cíle|Zablokované střely|Munice|Nákladní lodě|Záchranná základna|Na palubě|Zvuk|Brána|Drž polohu|Vyleť ven|Impulzy pohonu|Kyslík|Cíl",
  sk: "Azúrový Shard|Zlatý Shard|Zozbierané Shardy|Úplné reťazce štyroch Shardov|Shardy pritiahnuté magnetom|Získané jadrá|Splnené ciele|Sekunda prežitia|Zostávajúci život po splnení cieľa|Obídené meteorické fronty|Úplné prelety vírom|Úspešné úhyby so zrýchlením|Prelety bezpečným koridorom|Úspešné dokovania|Preletené kruhy|Prelety stredom|Široká brána|Úzka brána|Prelety stredom za sebou|Zasiahnuté ciele|Zásah spojenca|Zachytené rakety|Zásah návnady|Ciele splnené bez zásahu návnady|Zachránené kapsuly|Stratená kapsula|Zničení nepriatelia|Zostávajúci pancier nákladných lodí po splnení cieľa|Zablokované strely|Munícia|Nákladné lode|Záchranná základňa|Na palube|Zvuk|Brána|Drž polohu|Vyleť von|Impulzy pohonu|Kyslík|Cieľ",
  hu: "Ciánszínű Shard|Arany Shard|Begyűjtött Shardok|Teljes négyes Shard-láncok|Mágnessel begyűjtött Shardok|Begyűjtött magok|Teljesített célok|Túlélt másodperc|Megmaradt élet siker esetén|Elkerült meteorfrontok|Teljes átrepülések az örvényen|Sikeres kitérések gyorsítással|Átrepülések a biztonságos folyosón|Sikeres dokkolások|Átrepült gyűrűk|Középen átrepülések|Széles kapu|Keskeny kapu|Egymást követő középső átrepülések|Eltalált célpontok|Szövetséges találat|Elfogott rakéták|Csaléktalálat|Teljesített célok csaléktalálat nélkül|Kimentett kapszulák|Elvesztett kapszula|Megsemmisített ellenfelek|Megmaradt teherszállító-páncél siker esetén|Hárított lövések|Lőszer|Teherszállítók|Mentőbázis|A fedélzeten|Hang|Kapu|Tartsd a pozíciót|Repülj ki|Hajtóműimpulzusok|Oxigén|Cél",
  ro: "Shard turcoaz|Shard auriu|Sharduri colectate|Lanțuri complete de patru Sharduri|Sharduri atrase de magnet|Nuclee recuperate|Obiective îndeplinite|Secundă de supraviețuire|Viață rămasă la finalizarea obiectivului|Fronturi de meteoriți evitate|Traversări complete ale vortexului|Eschive reușite cu propulsie|Traversări prin culoarul sigur|Andocări reușite|Inele traversate|Treceri prin centru|Poartă largă|Poartă îngustă|Treceri consecutive prin centru|Ținte lovite|Aliat lovit|Rachete interceptate|Momeală lovită|Obiective îndeplinite fără lovirea momelilor|Capsule salvate|Capsulă pierdută|Inamici distruși|Blindajul rămas al cargourilor la finalizare|Focuri blocate|Muniție|Cargouri|Bază de salvare|La bord|Sunet|Poartă|Menține poziția|Zboară afară|Impulsuri de propulsie|Oxigen|Obiectiv",
  sr: "Цијан Shard|Златни Shard|Сакупљени Shard-ови|Потпуни ланци од четири Shard-а|Shard-ови привучени магнетом|Сакупљена језгра|Испуњени циљеви|Секунда преживљавања|Преостали живот по испуњењу циља|Избегнути метеорски фронтови|Потпуни пролет кроз вртлог|Успешна избегавања потиском|Пролети безбедним коридором|Успешна пристајања|Пролетани прстенови|Пролети кроз средину|Широки пролаз|Уски пролаз|Узастопни пролети кроз средину|Погођене мете|Погодак савезника|Пресретнуте ракете|Погодак мамца|Циљеви испуњени без погодака мамаца|Спасене капсуле|Изгубљена капсула|Уништени противници|Преостали оклоп теретњака по испуњењу циља|Блокирани хици|Муниција|Теретњаци|Спасилачка база|На броду|Звук|Пролаз|Задржи положај|Излети напоље|Импулси потиска|Кисеоник|Циљ",
  uk: "Бірюзовий уламок|Золотий уламок|Зібрані уламки|Повні ланцюжки з чотирьох уламків|Уламки, притягнуті магнітом|Зібрані ядра|Виконані завдання|Секунда виживання|Життя, що лишилося після успіху|Оминуті метеорні фронти|Повні прольоти крізь вихор|Вдалі ухилення з прискоренням|Прольоти безпечним коридором|Успішні стикування|Пройдені кільця|Прольоти через центр|Широкий прохід|Вузький прохід|Послідовні прольоти через центр|Уражені цілі|Влучання в союзника|Перехоплені ракети|Влучання в хибну ціль|Завдання без влучань у хибні цілі|Врятовані капсули|Втрачена капсула|Знищені супротивники|Залишок броні вантажних суден після успіху|Заблоковані постріли|Боєзапас|Вантажні судна|Рятувальна база|На борту|Звук|Прохід|Тримай позицію|Вилети назовні|Імпульси тяги|Кисень|Ціль",
  th: "ชาร์ดสีฟ้า|ชาร์ดสีทอง|ชาร์ดที่เก็บได้|ชุดชาร์ดสี่ชิ้นที่เก็บครบ|ชาร์ดที่ดูดด้วยแม่เหล็ก|แกนที่เก็บได้|เป้าหมายที่สำเร็จ|วินาทีที่อยู่รอด|ชีวิตที่เหลือเมื่อผ่านด่าน|แนวอุกกาบาตที่หลบได้|รอบที่บินเข้าและออกจากวังวนครบ|การหลบด้วยแรงเร่งที่สำเร็จ|การบินผ่านช่องทางปลอดภัย|การเทียบยานที่สำเร็จ|วงแหวนที่บินผ่าน|การบินผ่านตรงกลาง|ช่องกว้าง|ช่องแคบ|การบินผ่านตรงกลางต่อเนื่อง|เป้าที่ถูกยิง|ยิงฝ่ายเดียวกัน|จรวดที่สกัดได้|ยิงเป้าลวง|เป้าหมายที่สำเร็จโดยไม่ยิงเป้าลวง|แคปซูลที่ช่วยได้|แคปซูลที่สูญหาย|ศัตรูที่ทำลาย|เกราะยานขนส่งที่เหลือเมื่อผ่านด่าน|กระสุนที่ป้องกันได้|กระสุน|ยานขนส่ง|ฐานกู้ภัย|บนยาน|เสียง|ช่องผ่าน|รักษาตำแหน่ง|บินออก|แรงขับที่เหลือ|ออกซิเจน|เป้าหมาย",
  zh: "青色碎片|金色碎片|已收集碎片|完整的四连碎片|磁力吸取的碎片|回收的核心|已达成目标|每生存一秒|通关时剩余生命|避开的流星阵|完整穿越漩涡|成功加速闪避|安全通道通过次数|成功对接次数|穿过的能量环|居中穿越次数|宽门|窄门|连续居中穿越次数|命中的目标|误击友军|拦截的导弹|命中诱饵|未击中诱饵且完成任务|获救舱体|失去的舱体|击毁的敌人|通关时货船剩余护甲|挡下的射击|弹药|货船|救援基地|已登船|声音|通道|保持位置|飞出|推进脉冲|氧气|目标",
  vi: "Shard xanh lam|Shard vàng|Shard đã nhặt|Chuỗi bốn Shard hoàn chỉnh|Shard do nam châm hút|Lõi đã thu hồi|Mục tiêu đã hoàn thành|Giây sống sót|Mạng còn lại khi hoàn thành|Đợt thiên thạch đã tránh|Lượt đi qua xoáy hoàn chỉnh|Lượt né thành công bằng tăng tốc|Lượt qua hành lang an toàn|Lượt ghép nối thành công|Vòng đã bay qua|Lượt qua tâm vòng|Cổng rộng|Cổng hẹp|Lượt qua tâm vòng liên tiếp|Mục tiêu đã bắn trúng|Bắn trúng đồng minh|Tên lửa đã đánh chặn|Bắn trúng mồi nhử|Hoàn thành mục tiêu mà không bắn trúng mồi nhử|Khoang đã cứu|Khoang bị mất|Địch đã tiêu diệt|Giáp tàu hàng còn lại khi hoàn thành|Phát bắn đã chặn|Đạn|Tàu hàng|Căn cứ cứu hộ|Trên tàu|Âm thanh|Cổng|Giữ vị trí|Bay ra|Xung lực đẩy|Oxy|Mục tiêu",
};

export function arcadeTerms(locale: ArcadeLocale) {
  const values = termRows[locale].split("|");
  if (values.length !== terms.length) throw new Error("Invalid Arcade scoring translation row");
  return Object.fromEntries(terms.map((key, index) => [key, values[index]])) as Record<Term, string>;
}

type Award = [Term, number, string?];
const shardAwards: Award[] = [["cyan", 10], ["goldShard", 25]];
const survivalAwards: Award[] = [["second", 10], ["life", 100]];
const interceptionAwards: Award[] = [["intercept", 40], ["clear", 150]];
const rescueAwards: Award[] = [["rescue", 100], ["clear", 150]];
const escortAwards: Award[] = [["kill", 80], ["clear", 200], ["hull", 25]];
const awards: Award[][][] = [
  [shardAwards, [...shardAwards, ["chains", 40]], shardAwards, [["cyan", 10], ["core", 75]], [...shardAwards, ["clear", 200]]],
  [survivalAwards, [...survivalAwards, ["front", 60]], [["vortex", pointsPerVortexPass]], [...survivalAwards, ["boostDodge", pointsPerBoostDodge]], [...survivalAwards, ["safePass", 60]]],
  Array.from({ length: 5 }, () => [["dock", pointsPerDock]]),
  [[["ring", 50], ["center", 25]], [["ring", 50], ["center", 25]], [["ring", 80], ["center", 25]], [["wide", 40], ["narrow", 100]], [["ring", 50], ["streak", 25, " ×"]]],
  [[["hit", 50], ["clear", 150]], [["hit", 50], ["clear", 150]], [["hit", 50], ["allyHit", -100], ["clear", 150]], [["hit", 50], ["clear", 150]], [["hit", 90], ["clear", 150]]],
  [interceptionAwards, interceptionAwards, interceptionAwards, [...interceptionAwards, ["decoyHit", -20]], interceptionAwards],
  [rescueAwards, rescueAwards, [...rescueAwards, ["lost", -25]], rescueAwards, rescueAwards],
  [escortAwards, escortAwards, [...escortAwards, ["block", 15]], escortAwards, escortAwards],
];

const medalTerms: Record<string, Term> = {
  collected: "shards", chains: "chains", magnetCollected: "magnet", riskCores: "core", clear: "clear",
  elapsed: "second", frontBonus: "front", swirlPassages: "vortex", boostDodges: "boostDodge", zoneBonus: "safePass",
  docks: "dock", passed: "ring", precise: "center", riskyPasses: "narrow", bestCombo: "streak",
  hitsOnTarget: "hit", intercepted: "intercept", cleanDefense: "cleanDefense", rescued: "rescue", blocked: "block",
};
const goals: [Term, number][][][] = [
  [[], [], [], [], [["shards", 24]]],
  [[], [], [["vortex", 3]], [], []],
  [[], [], [], [["impulses", 24]], []],
  Array.from({ length: 5 }, () => [["ring", 8]]),
  [10, 10, 8, 9, 8].map((count, variant) => variant === 3 ? [["hit", count], ["ammo", 12]] : [["hit", count]]),
  [10, 14, 20, 10, 12].map((count, variant) => variant === 4 ? [["intercept", count], ["ammo", 12]] : [["intercept", count]]),
  [4, 7, 6, 4, 6].map((count, variant) => [["rescue", count], ["cargo", [1, 3, 2, 1, 2][variant]]]),
  [6, 8, 6, 8, 7].map((count, variant) => [["kill", count], ["freighter", [1, 3, 2, 2, 2][variant]]]),
];

export function arcadeStationCopy(locale: ArcadeLocale, index: number, germanName: string) {
  const game = Math.floor(index / 5);
  const variant = index % 5;
  const survival = arcadeSurvivalCopy(game + 1, variant + 1);
  const medal = arcadeMedalConfiguration(game + 1, variant + 1);
  const [originalGoal, originalScoring] = germanMissionCopy[game][variant];
  const vocabulary = arcadeTerms(locale);
  const goalDetails = goals[game][variant].map(([term, count]) => `${vocabulary[term]} ${count}`).join(" · ");
  const localizedGoal = localizedMissionInstruction(locale, game, variant);
  return {
    name: localizedMissionTitle(locale, game, variant, germanName),
    description: locale === "de" ? survival.goal ?? originalGoal
      : goalDetails ? `${localizedGoal} ${vocabulary.goal} · ${goalDetails}.` : localizedGoal,
    scoring: locale === "de" ? survival.scoring ?? originalScoring : awards[game][variant].map(([term, points, multiplier]) =>
      `${vocabulary[term]} ${points < 0 ? "−" : "+"}${Math.abs(points)}${multiplier ? multiplier + " n" : ""}`).join(" · "),
    rulesVersion: survival.rulesVersion,
    medalLabel: locale === "de" ? medal.label : vocabulary[medalTerms[medal.metric]],
    medalGoals: medal.goals,
  };
}
