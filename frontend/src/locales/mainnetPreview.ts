const sources = [
  "Mainnet preview",
  "Grey Scout is free. Nova Wing and Solar Lance can be bought with Shards.",
  "Full release & saved progress",
  "The base game is playable. Additional ships, Pi purchases and NFT features are in preparation. They will open after technical completion, required Pi Network approvals and activation by the developer.",
  "Mainnet progress is saved separately from Testnet and will be retained when the full version opens."
];
const entries: Record<string, string[]> = {
  "de": [
    "Mainnet-Vorschau",
    "Grey Scout ist kostenlos. Nova Wing und Solar Lance sind mit Shards kaufbar.",
    "Vollständige Freigabe & Spielstand",
    "Das Grundspiel ist spielbar. Weitere Schiffe, Pi-Käufe und NFT-Funktionen befinden sich in Vorbereitung. Die Freischaltung folgt nach technischer Fertigstellung, den erforderlichen Freigaben durch Pi Network und der Aktivierung durch den Entwickler.",
    "Mainnet-Fortschritt wird getrennt vom Testnet gespeichert und bleibt bei der vollständigen Freigabe erhalten."
  ],
  "es": [
    "Vista previa de Mainnet",
    "Grey Scout es gratis. Nova Wing y Solar Lance se pueden comprar con Shards.",
    "Lanzamiento completo y progreso guardado",
    "El juego base ya se puede jugar. Se están preparando más naves, compras con Pi y funciones NFT. Se habilitarán tras completar el desarrollo técnico, obtener las aprobaciones necesarias de Pi Network y la activación del desarrollador.",
    "El progreso de Mainnet se guarda por separado del de Testnet y se conservará al abrir la versión completa."
  ],
  "fr": [
    "Aperçu du Mainnet",
    "Grey Scout est gratuit. Nova Wing et Solar Lance s’achètent avec des Shards.",
    "Ouverture complète et progression sauvegardée",
    "Le jeu de base est jouable. D’autres vaisseaux, les achats en Pi et les fonctions NFT sont en préparation. Ils seront ouverts après finalisation technique, obtention des autorisations nécessaires de Pi Network et activation par le développeur.",
    "La progression Mainnet est sauvegardée séparément du Testnet et sera conservée à l’ouverture complète."
  ],
  "pt": [
    "Prévia da Mainnet",
    "Grey Scout é grátis. Nova Wing e Solar Lance podem ser compradas com Shards.",
    "Abertura completa e progresso guardado",
    "O jogo base já é jogável. Mais naves, compras com Pi e funções NFT estão em preparação. Serão disponibilizadas após a conclusão técnica, as aprovações necessárias da Pi Network e a ativação pelo programador.",
    "O progresso da Mainnet é guardado separadamente do Testnet e será mantido quando a versão completa abrir."
  ],
  "it": [
    "Anteprima Mainnet",
    "Grey Scout è gratuita. Nova Wing e Solar Lance si acquistano con Shards.",
    "Apertura completa e progressi salvati",
    "Il gioco base è giocabile. Altre navi, gli acquisti in Pi e le funzioni NFT sono in preparazione. Saranno disponibili dopo il completamento tecnico, le necessarie approvazioni di Pi Network e l’attivazione dello sviluppatore.",
    "I progressi Mainnet vengono salvati separatamente dal Testnet e saranno conservati all’apertura completa."
  ],
  "pl": [
    "Podgląd Mainnet",
    "Grey Scout jest darmowy. Nova Wing i Solar Lance można kupić za Shards.",
    "Pełne udostępnienie i zapis postępów",
    "Podstawowa gra jest dostępna. Kolejne statki, zakupy za Pi i funkcje NFT są w przygotowaniu. Zostaną udostępnione po ukończeniu prac technicznych, wymaganych zgodach Pi Network i aktywacji przez twórcę.",
    "Postępy w Mainnet są zapisywane oddzielnie od Testnet i zostaną zachowane po pełnym udostępnieniu gry."
  ],
  "tr": [
    "Mainnet ön izlemesi",
    "Grey Scout ücretsizdir. Nova Wing ve Solar Lance, Shards ile satın alınabilir.",
    "Tam açılış ve kayıtlı ilerleme",
    "Temel oyun oynanabilir. Ek gemiler, Pi ile satın alımlar ve NFT özellikleri hazırlanıyor. Teknik çalışmalar, gerekli Pi Network onayları ve geliştiricinin etkinleştirmesinden sonra açılacaklar.",
    "Mainnet ilerlemesi Testnet’ten ayrı kaydedilir ve tam sürüm açıldığında korunur."
  ],
  "ru": [
    "Предпросмотр Mainnet",
    "Grey Scout бесплатен. Nova Wing и Solar Lance можно купить за Shards.",
    "Полное открытие и сохранённый прогресс",
    "Основная игра доступна. Дополнительные корабли, покупки за Pi и функции NFT находятся в подготовке. Они откроются после технической готовности, необходимых разрешений Pi Network и активации разработчиком.",
    "Прогресс Mainnet сохраняется отдельно от Testnet и останется после полного открытия игры."
  ],
  "hr": [
    "Pregled Mainneta",
    "Grey Scout je besplatan. Nova Wing i Solar Lance mogu se kupiti za Shards.",
    "Puno otvaranje i spremljeni napredak",
    "Osnovna igra je dostupna. Dodatni brodovi, kupnje uz Pi i NFT funkcije su u pripremi. Otvorit će se nakon tehničkog dovršetka, potrebnih odobrenja Pi Networka i aktivacije razvojnog tima.",
    "Napredak Mainneta sprema se odvojeno od Testneta i ostaje nakon punog otvaranja igre."
  ],
  "cs": [
    "Náhled Mainnetu",
    "Grey Scout je zdarma. Nova Wing a Solar Lance lze koupit za Shards.",
    "Plné spuštění a uložený postup",
    "Základní hra je hratelná. Další lodě, nákupy za Pi a funkce NFT se připravují. Otevřou se po technickém dokončení, potřebných schváleních Pi Network a aktivaci vývojářem.",
    "Postup v Mainnetu se ukládá odděleně od Testnetu a zůstane zachován při plném spuštění."
  ],
  "sk": [
    "Ukážka Mainnetu",
    "Grey Scout je zadarmo. Nova Wing a Solar Lance sa dajú kúpiť za Shards.",
    "Plné spustenie a uložený postup",
    "Základná hra je hrateľná. Ďalšie lode, nákupy za Pi a funkcie NFT sa pripravujú. Otvoria sa po technickom dokončení, potrebných schváleniach Pi Network a aktivácii vývojárom.",
    "Postup v Mainnete sa ukladá oddelene od Testnetu a zostane zachovaný pri plnom spustení."
  ],
  "hu": [
    "Mainnet-előnézet",
    "A Grey Scout ingyenes. A Nova Wing és a Solar Lance Shards egységekért vásárolható meg.",
    "Teljes megnyitás és mentett haladás",
    "Az alapjáték játszható. További hajók, Pi-vásárlások és NFT-funkciók előkészítés alatt állnak. A technikai befejezés, a szükséges Pi Network-jóváhagyások és a fejlesztő aktiválása után nyílnak meg.",
    "A Mainnet haladása a Testnettől külön kerül mentésre, és a teljes megnyitás után is megmarad."
  ],
  "ro": [
    "Previzualizare Mainnet",
    "Grey Scout este gratuită. Nova Wing și Solar Lance pot fi cumpărate cu Shards.",
    "Deschidere completă și progres salvat",
    "Jocul de bază poate fi jucat. Alte nave, cumpărăturile cu Pi și funcțiile NFT sunt în pregătire. Vor fi deschise după finalizarea tehnică, aprobările necesare Pi Network și activarea de către dezvoltator.",
    "Progresul Mainnet este salvat separat de Testnet și va fi păstrat la deschiderea versiunii complete."
  ],
  "sr": [
    "Преглед Mainnet-а",
    "Grey Scout је бесплатан. Nova Wing и Solar Lance могу се купити за Shards.",
    "Пуно отварање и сачувани напредак",
    "Основна игра је доступна. Додатни бродови, куповине уз Pi и NFT функције су у припреми. Отвориће се након техничког завршетка, потребних одобрења Pi Network-а и активације од стране програмера.",
    "Напредак Mainnet-а чува се одвојено од Testnet-а и остаје након пуног отварања игре."
  ],
  "uk": [
    "Попередній перегляд Mainnet",
    "Grey Scout безкоштовний. Nova Wing і Solar Lance можна придбати за Shards.",
    "Повне відкриття та збережений прогрес",
    "Основна гра доступна. Додаткові кораблі, покупки за Pi та функції NFT готуються. Вони відкриються після технічного завершення, необхідних дозволів Pi Network та активації розробником.",
    "Прогрес Mainnet зберігається окремо від Testnet і залишиться після повного відкриття гри."
  ],
  "th": [
    "เวอร์ชันตัวอย่าง Mainnet",
    "Grey Scout ฟรี สามารถซื้อ Nova Wing และ Solar Lance ด้วย Shards ได้",
    "การเปิดใช้งานเต็มรูปแบบและความคืบหน้าที่บันทึกไว้",
    "เกมหลักสามารถเล่นได้แล้ว ยานเพิ่มเติม การซื้อด้วย Pi และฟีเจอร์ NFT ยังอยู่ระหว่างเตรียมการ โดยจะเปิดใช้หลังจากพัฒนาทางเทคนิคเสร็จ ได้รับการอนุมัติที่จำเป็นจาก Pi Network และผู้พัฒนาเปิดใช้งาน",
    "ความคืบหน้า Mainnet บันทึกแยกจาก Testnet และจะคงอยู่เมื่อเปิดเวอร์ชันเต็ม"
  ],
  "zh": [
    "主网预览",
    "Grey Scout免费。Nova Wing和Solar Lance可使用Shards购买。",
    "完整开放与已保存进度",
    "基础游戏已可游玩。更多飞船、Pi购买和NFT功能正在准备中，将在技术开发完成、获得Pi Network所需批准并由开发者启用后开放。",
    "主网进度与测试网分开保存，并将在完整版本开放后保留。"
  ],
  "vi": [
    "Bản xem trước Mainnet",
    "Grey Scout miễn phí. Có thể mua Nova Wing và Solar Lance bằng Shards.",
    "Mở đầy đủ và tiến trình đã lưu",
    "Trò chơi cơ bản đã có thể chơi. Các tàu bổ sung, giao dịch mua bằng Pi và tính năng NFT đang được chuẩn bị. Chúng sẽ mở sau khi hoàn tất kỹ thuật, có các phê duyệt cần thiết của Pi Network và được nhà phát triển kích hoạt.",
    "Tiến trình Mainnet được lưu riêng với Testnet và sẽ được giữ lại khi phiên bản đầy đủ mở."
  ]
};
export const mainnetPreviewTranslations = Object.fromEntries(Object.entries(entries).map(([locale, values]) => [locale, Object.fromEntries(sources.map((source, i) => [source, values[i]]))]));
