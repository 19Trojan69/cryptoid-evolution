const sources = ["Admin Testnet: earn Shards for all 20 ships. Paid items use Test-Pi only.", "Buy the Standard ship first.", "Defeat each boss to unlock its card."];
const entries: Record<string, string[]> = {
  "de": [
    "Admin-Testnet: Alle 20 Schiffe kosten erspielte Shards. Kaufgegenstände nur mit Test-Pi.",
    "Kaufe zuerst das Standard-Schiff.",
    "Besiege den jeweiligen Boss, um seine Karte freizuschalten."
  ],
  "es": [
    "Testnet de administrador: consigue Shards para las 20 naves. Las compras usan solo Test-Pi.",
    "Compra primero la nave Standard.",
    "Derrota a cada jefe para desbloquear su carta."
  ],
  "fr": [
    "Testnet administrateur : gagne des Shards pour les 20 vaisseaux. Achats uniquement en Test-Pi.",
    "Achète d’abord le vaisseau Standard.",
    "Bats chaque boss pour débloquer sa carte."
  ],
  "pt": [
    "Testnet do administrador: ganha Shards para as 20 naves. Compras apenas com Test-Pi.",
    "Compra primeiro a nave Standard.",
    "Derrota cada chefe para desbloquear a sua carta."
  ],
  "it": [
    "Testnet amministratore: guadagna Shards per tutte le 20 navi. Acquisti solo con Test-Pi.",
    "Acquista prima la nave Standard.",
    "Sconfiggi ogni boss per sbloccare la sua carta."
  ],
  "pl": [
    "Testnet administratora: zdobywaj Shards na wszystkie 20 statków. Zakupy tylko za Test-Pi.",
    "Najpierw kup statek Standard.",
    "Pokonaj każdego bossa, aby odblokować jego kartę."
  ],
  "tr": [
    "Yönetici Testnet: 20 geminin tamamı için Shards kazan. Satın alımlar yalnızca Test-Pi ile yapılır.",
    "Önce Standard gemiyi satın al.",
    "Kartını açmak için ilgili bossu yen."
  ],
  "ru": [
    "Testnet администратора: зарабатывай Shards для всех 20 кораблей. Покупки только за Test-Pi.",
    "Сначала купи корабль Standard.",
    "Победи каждого босса, чтобы открыть его карту."
  ],
  "hr": [
    "Administratorski Testnet: zaradi Shards za svih 20 brodova. Kupnje samo uz Test-Pi.",
    "Prvo kupi brod Standard.",
    "Pobijedi svakog bossa za otključavanje njegove karte."
  ],
  "cs": [
    "Administrátorský Testnet: získávej Shards pro všech 20 lodí. Nákupy pouze za Test-Pi.",
    "Nejprve kup loď Standard.",
    "Poraz každého bosse a odemkni jeho kartu."
  ],
  "sk": [
    "Administrátorský Testnet: získavaj Shards pre všetkých 20 lodí. Nákupy iba za Test-Pi.",
    "Najprv kúp loď Standard.",
    "Poraz každého bossa a odomkni jeho kartu."
  ],
  "hu": [
    "Adminisztrátori Testnet: szerezz Shards egységeket mind a 20 hajóhoz. Vásárlás csak Test-Pi használatával.",
    "Először vedd meg a Standard hajót.",
    "Győzd le az adott főellenséget a kártyájának feloldásához."
  ],
  "ro": [
    "Testnet administrator: câștigă Shards pentru toate cele 20 de nave. Cumpărături doar cu Test-Pi.",
    "Cumpără mai întâi nava Standard.",
    "Învinge fiecare boss pentru a-i debloca cartea."
  ],
  "sr": [
    "Администраторски Testnet: заради Shards за свих 20 бродова. Куповине само уз Test-Pi.",
    "Прво купи брод Standard.",
    "Победи сваког боса да откључаш његову карту."
  ],
  "uk": [
    "Testnet адміністратора: заробляй Shards для всіх 20 кораблів. Покупки лише за Test-Pi.",
    "Спочатку придбай корабель Standard.",
    "Переможи кожного боса, щоб відкрити його картку."
  ],
  "th": [
    "Testnet ผู้ดูแล: เล่นสะสม Shards เพื่อซื้อยานทั้ง 20 ลำ ไอเทมแบบชำระเงินใช้ Test-Pi เท่านั้น",
    "ซื้อยาน Standard ก่อน",
    "เอาชนะบอสแต่ละตัวเพื่อปลดล็อกการ์ดของบอสนั้น"
  ],
  "zh": [
    "管理员测试网：通过游戏赚取碎片购买全部20艘飞船。付费物品仅使用Test-Pi。",
    "请先购买标准型飞船。",
    "击败对应首领以解锁其卡片。"
  ],
  "vi": [
    "Testnet quản trị: kiếm Shards để mua đủ 20 tàu. Vật phẩm trả phí chỉ dùng Test-Pi.",
    "Hãy mua tàu Standard trước.",
    "Đánh bại từng trùm để mở khóa thẻ của trùm đó."
  ]
};
export const ownerTestnetTranslations = Object.fromEntries(Object.entries(entries).map(([locale, values]) => [locale, Object.fromEntries(sources.map((source, i) => [source, values[i]]))]));
