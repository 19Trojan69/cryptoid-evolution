import type { ArcadeLocale } from "./galaxyArcadeLanguages";

type RankNames = readonly [string, string, string, string, string, string];
type StickerText = readonly [string, string, string, string, string, string, string, string];

const names: Record<ArcadeLocale, RankNames> = {
  en: ["Copper", "Brass", "Silver", "Gold", "Platinum", "Diamond"],
  de: ["Kupfer", "Messing", "Silber", "Gold", "Platin", "Diamant"],
  es: ["Cobre", "Latón", "Plata", "Oro", "Platino", "Diamante"],
  fr: ["Cuivre", "Laiton", "Argent", "Or", "Platine", "Diamant"],
  pt: ["Cobre", "Latão", "Prata", "Ouro", "Platina", "Diamante"],
  it: ["Rame", "Ottone", "Argento", "Oro", "Platino", "Diamante"],
  pl: ["Miedź", "Mosiądz", "Srebro", "Złoto", "Platyna", "Diament"],
  tr: ["Bakır", "Pirinç", "Gümüş", "Altın", "Platin", "Elmas"],
  ru: ["Медь", "Латунь", "Серебро", "Золото", "Платина", "Алмаз"],
  hr: ["Bakar", "Mjed", "Srebro", "Zlato", "Platina", "Dijamant"],
  cs: ["Měď", "Mosaz", "Stříbro", "Zlato", "Platina", "Diamant"],
  sk: ["Meď", "Mosadz", "Striebro", "Zlato", "Platina", "Diamant"],
  hu: ["Réz", "Sárgaréz", "Ezüst", "Arany", "Platina", "Gyémánt"],
  ro: ["Cupru", "Alamă", "Argint", "Aur", "Platină", "Diamant"],
  sr: ["Бакар", "Месинг", "Сребро", "Злато", "Платина", "Дијамант"],
  uk: ["Мідь", "Латунь", "Срібло", "Золото", "Платина", "Діамант"],
  th: ["ทองแดง", "ทองเหลือง", "เงิน", "ทอง", "แพลทินัม", "เพชร"],
  zh: ["红铜", "黄铜", "白银", "黄金", "铂金", "钻石"],
  vi: ["Đồng đỏ", "Đồng thau", "Bạc", "Vàng", "Bạch kim", "Kim cương"],
};

// Rank goals, score after Diamond, new rewards, save error, album error, storage, empty album, count.
const copy: Record<ArcadeLocale, StickerText> = {
  en: ["Rank goals", "After Diamond, points still count toward your personal best.", "New stickers", "Could not save the stickers on this device.", "The sticker album is unavailable on this device.", "Stickers are stored on this device.", "Finish a run at Copper or higher to earn your first sticker.", "Collected {count} / {total}"],
  de: ["Rangziele", "Ab Diamant zählen weitere Punkte für deinen persönlichen Bestwert.", "Neue Sticker", "Die Sticker konnten auf diesem Gerät nicht gespeichert werden.", "Das Stickeralbum ist auf diesem Gerät gerade nicht verfügbar.", "Sticker werden auf diesem Gerät gespeichert.", "Beende einen Lauf mit mindestens Kupfer, um deinen ersten Sticker zu gewinnen.", "Gesammelt {count} / {total}"],
  es: ["Objetivos de rango", "Tras Diamante, los puntos siguen contando para tu récord personal.", "Nuevas pegatinas", "No se pudieron guardar las pegatinas en este dispositivo.", "El álbum no está disponible en este dispositivo.", "Las pegatinas se guardan en este dispositivo.", "Termina una partida en Cobre o superior para ganar tu primera pegatina.", "Colección {count} / {total}"],
  fr: ["Objectifs de rang", "Après Diamant, les points comptent encore pour votre record personnel.", "Nouveaux autocollants", "Impossible d’enregistrer les autocollants sur cet appareil.", "L’album est indisponible sur cet appareil.", "Les autocollants sont enregistrés sur cet appareil.", "Terminez une partie au rang Cuivre ou supérieur pour gagner votre premier autocollant.", "Collection {count} / {total}"],
  pt: ["Objetivos de nível", "Depois de Diamante, os pontos continuam a contar para o teu recorde pessoal.", "Novos autocolantes", "Não foi possível guardar os autocolantes neste dispositivo.", "O álbum está indisponível neste dispositivo.", "Os autocolantes são guardados neste dispositivo.", "Termina uma partida em Cobre ou superior para ganhares o teu primeiro autocolante.", "Coleção {count} / {total}"],
  it: ["Obiettivi di rango", "Dopo Diamante, i punti contano ancora per il tuo record personale.", "Nuovi adesivi", "Impossibile salvare gli adesivi su questo dispositivo.", "L’album non è disponibile su questo dispositivo.", "Gli adesivi sono salvati su questo dispositivo.", "Termina una partita con il rango Rame o superiore per ottenere il primo adesivo.", "Raccolti {count} / {total}"],
  pl: ["Cele rang", "Po osiągnięciu Diamentu punkty nadal liczą się do rekordu osobistego.", "Nowe naklejki", "Nie udało się zapisać naklejek na tym urządzeniu.", "Album jest niedostępny na tym urządzeniu.", "Naklejki są zapisywane na tym urządzeniu.", "Ukończ rozgrywkę w randze Miedź lub wyższej, aby zdobyć pierwszą naklejkę.", "Zebrano {count} / {total}"],
  tr: ["Rütbe hedefleri", "Elmas’tan sonra puanlar kişisel rekoruna katkı sağlamaya devam eder.", "Yeni çıkartmalar", "Çıkartmalar bu cihaza kaydedilemedi.", "Çıkartma albümü bu cihazda kullanılamıyor.", "Çıkartmalar bu cihazda saklanır.", "İlk çıkartmanı kazanmak için bir turu Bakır veya daha yüksek rütbede bitir.", "Toplanan {count} / {total}"],
  ru: ["Цели рангов", "После Алмаза очки по-прежнему идут в личный рекорд.", "Новые наклейки", "Не удалось сохранить наклейки на этом устройстве.", "Альбом недоступен на этом устройстве.", "Наклейки хранятся на этом устройстве.", "Завершите игру в ранге Медь или выше, чтобы получить первую наклейку.", "Собрано {count} / {total}"],
  hr: ["Ciljevi rangova", "Nakon Dijamanta bodovi se i dalje računaju za osobni rekord.", "Nove naljepnice", "Naljepnice nije moguće spremiti na ovom uređaju.", "Album nije dostupan na ovom uređaju.", "Naljepnice se spremaju na ovom uređaju.", "Završi igru s rangom Bakar ili višim za prvu naljepnicu.", "Prikupljeno {count} / {total}"],
  cs: ["Cíle hodností", "Po Diamantu se body dál počítají do osobního rekordu.", "Nové samolepky", "Samolepky se na tomto zařízení nepodařilo uložit.", "Album není na tomto zařízení dostupné.", "Samolepky se ukládají na tomto zařízení.", "Dokonči hru s hodností Měď nebo vyšší a získáš první samolepku.", "Nasbíráno {count} / {total}"],
  sk: ["Ciele hodností", "Po Diamante sa body naďalej počítajú do osobného rekordu.", "Nové nálepky", "Nálepky sa na tomto zariadení nepodarilo uložiť.", "Album nie je na tomto zariadení dostupný.", "Nálepky sa ukladajú na tomto zariadení.", "Dokonči hru s hodnosťou Meď alebo vyššou a získaš prvú nálepku.", "Získané {count} / {total}"],
  hu: ["Rangcélok", "A Gyémánt után a pontok továbbra is beleszámítanak az egyéni rekordodba.", "Új matricák", "A matricákat nem sikerült menteni ezen az eszközön.", "Az album nem érhető el ezen az eszközön.", "A matricákat ez az eszköz tárolja.", "Fejezz be egy játékot Réz vagy magasabb ranggal az első matricáért.", "Összegyűjtve {count} / {total}"],
  ro: ["Obiective de rang", "După Diamant, punctele contează în continuare pentru recordul personal.", "Abțibilduri noi", "Abțibildurile nu au putut fi salvate pe acest dispozitiv.", "Albumul nu este disponibil pe acest dispozitiv.", "Abțibildurile sunt stocate pe acest dispozitiv.", "Încheie o rundă cu rangul Cupru sau mai sus pentru primul abțibild.", "Colecție {count} / {total}"],
  sr: ["Циљеви рангова", "После Дијаманта бодови и даље улазе у лични рекорд.", "Нове налепнице", "Налепнице нису могле да се сачувају на овом уређају.", "Албум није доступан на овом уређају.", "Налепнице се чувају на овом уређају.", "Заврши игру с рангом Бакар или вишим за прву налепницу.", "Сакупљено {count} / {total}"],
  uk: ["Цілі рангів", "Після Діаманта бали й далі враховуються в особистому рекорді.", "Нові наліпки", "Не вдалося зберегти наліпки на цьому пристрої.", "Альбом недоступний на цьому пристрої.", "Наліпки зберігаються на цьому пристрої.", "Заверши гру в ранзі Мідь або вище, щоб отримати першу наліпку.", "Зібрано {count} / {total}"],
  th: ["เป้าหมายแต่ละอันดับ", "หลังถึงอันดับเพชร คะแนนยังนับรวมในสถิติส่วนตัว", "สติกเกอร์ใหม่", "บันทึกสติกเกอร์บนอุปกรณ์นี้ไม่สำเร็จ", "อัลบั้มสติกเกอร์ไม่พร้อมใช้งานบนอุปกรณ์นี้", "สติกเกอร์จะบันทึกบนอุปกรณ์นี้", "จบเกมที่อันดับทองแดงขึ้นไปเพื่อรับสติกเกอร์ชิ้นแรก", "สะสมแล้ว {count} / {total}"],
  zh: ["段位目标", "达到钻石后，积分仍会计入个人最高分。", "新贴纸", "无法在此设备上保存贴纸。", "此设备上的贴纸册暂不可用。", "贴纸保存在此设备上。", "以红铜或更高段位完成一局即可获得首张贴纸。", "已收集 {count} / {total}"],
  vi: ["Mục tiêu xếp hạng", "Sau Kim cương, điểm vẫn được tính vào kỷ lục cá nhân.", "Nhãn dán mới", "Không thể lưu nhãn dán trên thiết bị này.", "Album nhãn dán không khả dụng trên thiết bị này.", "Nhãn dán được lưu trên thiết bị này.", "Kết thúc lượt chơi từ hạng Đồng đỏ trở lên để nhận nhãn dán đầu tiên.", "Đã sưu tầm {count} / {total}"],
};

const freeInGameCopy: Record<ArcadeLocale, string> = {
  en: "Every sticker can be earned for free and collected in the game.",
  de: "Alle Sticker sind kostenlos erspielbar und gehören zu deiner Sammlung im Spiel.",
  es: "Todas las pegatinas se pueden ganar gratis y coleccionar en el juego.",
  fr: "Tous les autocollants peuvent être gagnés gratuitement et collectionnés dans le jeu.",
  pt: "Todos os autocolantes podem ser ganhos gratuitamente e colecionados no jogo.",
  it: "Tutti gli adesivi si possono ottenere gratis e collezionare nel gioco.",
  pl: "Wszystkie naklejki można zdobywać bezpłatnie i kolekcjonować w grze.",
  tr: "Tüm çıkartmalar ücretsiz kazanılabilir ve oyun içinde biriktirilebilir.",
  ru: "Все наклейки можно бесплатно заработать и собирать в игре.",
  hr: "Sve naljepnice možeš osvojiti besplatno i skupljati u igri.",
  cs: "Všechny samolepky lze získat zdarma a sbírat ve hře.",
  sk: "Všetky nálepky môžeš získať zadarmo a zbierať v hre.",
  hu: "Minden matrica ingyen megszerezhető és gyűjthető a játékban.",
  ro: "Toate abțibildurile pot fi câștigate gratuit și colecționate în joc.",
  sr: "Све налепнице можеш бесплатно освојити и сакупљати у игри.",
  uk: "Усі наліпки можна безкоштовно заробляти й колекціонувати в грі.",
  th: "สติกเกอร์ทุกชิ้นเล่นเพื่อรับได้ฟรีและสะสมได้ในเกม",
  zh: "所有贴纸都可以免费赢取，并在游戏内收藏。",
  vi: "Bạn có thể kiếm miễn phí và sưu tầm tất cả nhãn dán trong trò chơi.",
};

export function arcadeStickerLabels(locale: ArcadeLocale) {
  const [goals, afterDiamond, earned, saveFailed, unavailable, device, empty, collected] = copy[locale];
  const freeInGame = freeInGameCopy[locale];
  return { ranks: names[locale], goals, afterDiamond, earned, saveFailed, unavailable, device, empty, collected, freeInGame };
}

export type ArcadeStickerLabels = ReturnType<typeof arcadeStickerLabels>;
