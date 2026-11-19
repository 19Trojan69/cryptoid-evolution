const sources = ["Admin Testnet: earn Shards for all 20 ships. Paid items use Test-Pi only.", "Buy the Standard ship first.", "Defeat each boss to unlock its card.", "Testnet: Grey Scout is free. Nova Wing and Solar Lance can be bought with Shards. Other ship purchases are locked until Mainnet."];
const entries: Record<string, string[]> = {
  "de": [
    "Admin-Testnet: Alle 20 Schiffe kosten erspielte Shards. Kaufgegenstände nur mit Test-Pi.",
    "Kaufe zuerst das Standard-Schiff.",
    "Besiege den jeweiligen Boss, um seine Karte freizuschalten.",
    "Testnet: Grey Scout ist kostenlos. Nova Wing und Solar Lance sind mit Shards kaufbar. Weitere Schiffskäufe bleiben bis zum Mainnet gesperrt."
  ],
  "es": [
    "Testnet de administrador: consigue Shards para las 20 naves. Las compras usan solo Test-Pi.",
    "Compra primero la nave Standard.",
    "Derrota a cada jefe para desbloquear su carta.",
    "Testnet: Grey Scout es gratis. Nova Wing y Solar Lance se pueden comprar con Shards. Las demás compras de naves están bloqueadas hasta Mainnet."
  ],
  "fr": [
    "Testnet administrateur : gagne des Shards pour les 20 vaisseaux. Achats uniquement en Test-Pi.",
    "Achète d’abord le vaisseau Standard.",
    "Bats chaque boss pour débloquer sa carte.",
    "Testnet : Grey Scout est gratuit. Nova Wing et Solar Lance s’achètent avec des Shards. Les autres achats de vaisseaux restent bloqués jusqu’au Mainnet."
  ],
  "pt": [
    "Testnet do administrador: ganha Shards para as 20 naves. Compras apenas com Test-Pi.",
    "Compra primeiro a nave Standard.",
    "Derrota cada chefe para desbloquear a sua carta.",
    "Testnet: Grey Scout é grátis. Nova Wing e Solar Lance podem ser compradas com Shards. As outras compras de naves ficam bloqueadas até à Mainnet."
  ],
  "it": [
    "Testnet amministratore: guadagna Shards per tutte le 20 navi. Acquisti solo con Test-Pi.",
    "Acquista prima la nave Standard.",
    "Sconfiggi ogni boss per sbloccare la sua carta.",
    "Testnet: Grey Scout è gratuita. Nova Wing e Solar Lance si possono acquistare con Shards. Gli altri acquisti di navi restano bloccati fino alla Mainnet."
  ],
  "pl": [
    "Testnet administratora: zdobywaj Shards na wszystkie 20 statków. Zakupy tylko za Test-Pi.",
    "Najpierw kup statek Standard.",
    "Pokonaj każdego bossa, aby odblokować jego kartę.",
    "Testnet: Grey Scout jest darmowy. Nova Wing i Solar Lance można kupić za Shards. Zakupy pozostałych statków są zablokowane do Mainnet."
  ],
  "tr": [
    "Yönetici Testnet: 20 geminin tamamı için Shards kazan. Satın alımlar yalnızca Test-Pi ile yapılır.",
    "Önce Standard gemiyi satın al.",
    "Kartını açmak için ilgili bossu yen.",
    "Testnet: Grey Scout ücretsizdir. Nova Wing ve Solar Lance, Shards ile satın alınabilir. Diğer gemi satın alımları Mainnet’e kadar kilitlidir."
  ],
  "ru": [
    "Testnet администратора: зарабатывай Shards для всех 20 кораблей. Покупки только за Test-Pi.",
    "Сначала купи корабль Standard.",
    "Победи каждого босса, чтобы открыть его карту.",
    "Testnet: Grey Scout бесплатен. Nova Wing и Solar Lance можно купить за Shards. Покупка остальных кораблей заблокирована до Mainnet."
  ],
  "hr": [
    "Administratorski Testnet: zaradi Shards za svih 20 brodova. Kupnje samo uz Test-Pi.",
    "Prvo kupi brod Standard.",
    "Pobijedi svakog bossa za otključavanje njegove karte.",
    "Testnet: Grey Scout je besplatan. Nova Wing i Solar Lance mogu se kupiti za Shards. Kupnja ostalih brodova zaključana je do Mainneta."
  ],
  "cs": [
    "Administrátorský Testnet: získávej Shards pro všech 20 lodí. Nákupy pouze za Test-Pi.",
    "Nejprve kup loď Standard.",
    "Poraz každého bosse a odemkni jeho kartu.",
    "Testnet: Grey Scout je zdarma. Nova Wing a Solar Lance lze koupit za Shards. Nákup ostatních lodí je uzamčen do Mainnetu."
  ],
  "sk": [
    "Administrátorský Testnet: získavaj Shards pre všetkých 20 lodí. Nákupy iba za Test-Pi.",
    "Najprv kúp loď Standard.",
    "Poraz každého bossa a odomkni jeho kartu.",
    "Testnet: Grey Scout je zadarmo. Nova Wing a Solar Lance sa dajú kúpiť za Shards. Nákup ostatných lodí je uzamknutý do Mainnetu."
  ],
  "hu": [
    "Adminisztrátori Testnet: szerezz Shards egységeket mind a 20 hajóhoz. Vásárlás csak Test-Pi használatával.",
    "Először vedd meg a Standard hajót.",
    "Győzd le az adott főellenséget a kártyájának feloldásához.",
    "Testnet: a Grey Scout ingyenes. A Nova Wing és a Solar Lance Shards egységekért vásárolható meg. A többi hajó vásárlása a Mainnetig zárolva marad."
  ],
  "ro": [
    "Testnet administrator: câștigă Shards pentru toate cele 20 de nave. Cumpărături doar cu Test-Pi.",
    "Cumpără mai întâi nava Standard.",
    "Învinge fiecare boss pentru a-i debloca cartea.",
    "Testnet: Grey Scout este gratuită. Nova Wing și Solar Lance pot fi cumpărate cu Shards. Celelalte achiziții de nave rămân blocate până la Mainnet."
  ],
  "sr": [
    "Администраторски Testnet: заради Shards за свих 20 бродова. Куповине само уз Test-Pi.",
    "Прво купи брод Standard.",
    "Победи сваког боса да откључаш његову карту.",
    "Testnet: Grey Scout је бесплатан. Nova Wing и Solar Lance могу се купити за Shards. Куповина осталих бродова је закључана до Mainnet-а."
  ],
  "uk": [
    "Testnet адміністратора: заробляй Shards для всіх 20 кораблів. Покупки лише за Test-Pi.",
    "Спочатку придбай корабель Standard.",
    "Переможи кожного боса, щоб відкрити його картку.",
    "Testnet: Grey Scout безкоштовний. Nova Wing і Solar Lance можна придбати за Shards. Купівлю інших кораблів заблоковано до Mainnet."
  ],
  "th": [
    "Testnet ผู้ดูแล: เล่นสะสม Shards เพื่อซื้อยานทั้ง 20 ลำ ไอเทมแบบชำระเงินใช้ Test-Pi เท่านั้น",
    "ซื้อยาน Standard ก่อน",
    "เอาชนะบอสแต่ละตัวเพื่อปลดล็อกการ์ดของบอสนั้น",
    "Testnet: Grey Scout ฟรี สามารถซื้อ Nova Wing และ Solar Lance ด้วย Shards ได้ การซื้อยานลำอื่นยังถูกล็อกไว้จนกว่าจะเปิด Mainnet"
  ],
  "zh": [
    "管理员测试网：通过游戏赚取碎片购买全部20艘飞船。付费物品仅使用Test-Pi。",
    "请先购买标准型飞船。",
    "击败对应首领以解锁其卡片。",
    "测试网：Grey Scout免费。Nova Wing和Solar Lance可使用Shards购买。其他飞船的购买功能在主网开放前保持锁定。"
  ],
  "vi": [
    "Testnet quản trị: kiếm Shards để mua đủ 20 tàu. Vật phẩm trả phí chỉ dùng Test-Pi.",
    "Hãy mua tàu Standard trước.",
    "Đánh bại từng trùm để mở khóa thẻ của trùm đó.",
    "Testnet: Grey Scout miễn phí. Có thể mua Nova Wing và Solar Lance bằng Shards. Việc mua các tàu khác bị khóa cho đến Mainnet."
  ]
};
export const ownerTestnetTranslations = Object.fromEntries(Object.entries(entries).map(([locale, values]) => [locale, Object.fromEntries(sources.map((source, i) => [source, values[i]]))]));
