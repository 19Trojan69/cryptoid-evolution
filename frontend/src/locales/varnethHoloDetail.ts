import type { Locale } from "./config";
import type { bossNftGalleryCopy } from "./bossNftGallery";

type VarnethHoloDetailCopy = {
  details: string;
  issued: string;
  unlocked: string;
  supply: string;
  collection: string;
  requirement: string;
  pending: string;
};

export const varnethHoloDetailCopy = {
  en: {
    details: "View details", issued: "Test NFTs issued", unlocked: "Preview unlocked",
    supply: "Planned edition size", collection: "Collection", requirement: "Unlock requirement",
    pending: "Issuance in preparation",
  },
  de: {
    details: "Details ansehen", issued: "Test-NFTs ausgegeben", unlocked: "Vorschau freigeschaltet",
    supply: "Geplante Auflage", collection: "Sammlung", requirement: "Freischaltung",
    pending: "Ausgabe in Vorbereitung",
  },
  es: {
    details: "Ver detalles", issued: "NFT de prueba emitidos", unlocked: "Vista previa desbloqueada",
    supply: "Tirada prevista", collection: "Colección", requirement: "Requisito de desbloqueo",
    pending: "Emisión en preparación",
  },
  fr: {
    details: "Voir les détails", issued: "NFT de test émis", unlocked: "Aperçu débloqué",
    supply: "Tirage prévu", collection: "Collection", requirement: "Condition de déblocage",
    pending: "Émission en préparation",
  },
  pt: {
    details: "Ver detalhes", issued: "NFT de teste emitidos", unlocked: "Pré-visualização desbloqueada",
    supply: "Tiragem prevista", collection: "Coleção", requirement: "Requisito de desbloqueio",
    pending: "Emissão em preparação",
  },
  it: {
    details: "Vedi dettagli", issued: "NFT di prova emessi", unlocked: "Anteprima sbloccata",
    supply: "Tiratura prevista", collection: "Collezione", requirement: "Requisito di sblocco",
    pending: "Emissione in preparazione",
  },
  pl: {
    details: "Zobacz szczegóły", issued: "Wydane testowe NFT", unlocked: "Podgląd odblokowany",
    supply: "Planowany nakład", collection: "Kolekcja", requirement: "Warunek odblokowania",
    pending: "Wydanie w przygotowaniu",
  },
  tr: {
    details: "Ayrıntıları gör", issued: "Çıkarılan test NFT’leri", unlocked: "Önizleme açıldı",
    supply: "Planlanan adet", collection: "Koleksiyon", requirement: "Açma koşulu",
    pending: "Çıkarma işlemi hazırlanıyor",
  },
  ru: {
    details: "Подробнее", issued: "Выпущено тестовых NFT", unlocked: "Предпросмотр открыт",
    supply: "Планируемый тираж", collection: "Коллекция", requirement: "Условие открытия",
    pending: "Выпуск готовится",
  },
  hr: {
    details: "Prikaži pojedinosti", issued: "Izdani probni NFT-ovi", unlocked: "Pregled otključan",
    supply: "Planirana naklada", collection: "Kolekcija", requirement: "Uvjet otključavanja",
    pending: "Izdavanje u pripremi",
  },
  cs: {
    details: "Zobrazit podrobnosti", issued: "Vydaná testovací NFT", unlocked: "Náhled odemčen",
    supply: "Plánovaný náklad", collection: "Sbírka", requirement: "Podmínka odemčení",
    pending: "Vydání se připravuje",
  },
  sk: {
    details: "Zobraziť podrobnosti", issued: "Vydané testovacie NFT", unlocked: "Ukážka odomknutá",
    supply: "Plánovaný náklad", collection: "Zbierka", requirement: "Podmienka odomknutia",
    pending: "Vydanie sa pripravuje",
  },
  hu: {
    details: "Részletek megtekintése", issued: "Kiadott teszt NFT-k", unlocked: "Előnézet feloldva",
    supply: "Tervezett példányszám", collection: "Gyűjtemény", requirement: "Feloldási feltétel",
    pending: "A kiadás előkészítés alatt",
  },
  ro: {
    details: "Vezi detalii", issued: "NFT-uri de test emise", unlocked: "Previzualizare deblocată",
    supply: "Tiraj planificat", collection: "Colecție", requirement: "Condiție de deblocare",
    pending: "Emiterea este în pregătire",
  },
  sr: {
    details: "Прикажи детаље", issued: "Издати пробни NFT-ови", unlocked: "Преглед откључан",
    supply: "Планирани тираж", collection: "Колекција", requirement: "Услов откључавања",
    pending: "Издавање у припреми",
  },
  uk: {
    details: "Переглянути деталі", issued: "Випущено тестових NFT", unlocked: "Попередній перегляд відкрито",
    supply: "Запланований тираж", collection: "Колекція", requirement: "Умова відкриття",
    pending: "Випуск готується",
  },
  th: {
    details: "ดูรายละเอียด", issued: "NFT ทดสอบที่ออกแล้ว", unlocked: "ปลดล็อกตัวอย่างแล้ว",
    supply: "จำนวนที่วางแผนไว้", collection: "คอลเลกชัน", requirement: "เงื่อนไขการปลดล็อก",
    pending: "กำลังเตรียมออก NFT",
  },
  zh: {
    details: "查看详情", issued: "已发行的测试 NFT", unlocked: "预览已解锁",
    supply: "计划发行量", collection: "收藏系列", requirement: "解锁条件",
    pending: "正在准备发行",
  },
  vi: {
    details: "Xem chi tiết", issued: "NFT thử nghiệm đã phát hành", unlocked: "Đã mở khóa bản xem trước",
    supply: "Số lượng dự kiến", collection: "Bộ sưu tập", requirement: "Điều kiện mở khóa",
    pending: "Đang chuẩn bị phát hành",
  },
} satisfies Record<keyof typeof bossNftGalleryCopy, VarnethHoloDetailCopy>;

export const getVarnethHoloDetailCopy = (locale: Locale): VarnethHoloDetailCopy =>
  (varnethHoloDetailCopy as Partial<Record<Locale, VarnethHoloDetailCopy>>)[locale] ?? varnethHoloDetailCopy.en;
