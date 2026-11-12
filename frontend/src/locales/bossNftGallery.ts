import type { Locale } from "./config";

export type BossNftGalleryCopy = {
  title: string;
  free: string;
  buyable: string;
  status: string;
  empty: string;
  loading: string;
  error: string;
  previous: string;
  next: string;
};

export const bossNftGalleryCopy = {
  en: {
    title: "Boss NFTs", free: "Free-to-earn NFTs", buyable: "Purchasable NFTs",
    status: "Prepared as a Mainnet ready preview.",
    empty: "Your NFTs appear here after a confirmed boss victory.",
    loading: "Loading NFTs…", error: "The gallery could not be loaded.", previous: "Previous", next: "Next",
  },
  de: {
    title: "NFT-Bosse", free: "Frei erspielbare NFTs", buyable: "Kaufbare NFTs",
    status: "Als „Mainnet ready“-Vorschau vorbereitet.",
    empty: "Hier erscheinen deine NFTs nach einem bestätigten Boss-Sieg.",
    loading: "NFTs werden geladen …", error: "Die Galerie konnte nicht geladen werden.", previous: "Zurück", next: "Weiter",
  },
  es: {
    title: "NFT de jefes", free: "NFT que puedes ganar gratis", buyable: "NFT que puedes comprar",
    status: "Vista previa preparada para Mainnet.",
    empty: "Tus NFT aparecen aquí tras una victoria confirmada contra un jefe.",
    loading: "Cargando NFT…", error: "No se pudo cargar la galería.", previous: "Anterior", next: "Siguiente",
  },
  fr: {
    title: "NFT de boss", free: "NFT à gagner gratuitement", buyable: "NFT à acheter",
    status: "Aperçu préparé pour le Mainnet.",
    empty: "Tes NFT apparaissent ici après une victoire confirmée contre un boss.",
    loading: "Chargement des NFT…", error: "Impossible de charger la galerie.", previous: "Précédent", next: "Suivant",
  },
  pt: {
    title: "NFT de bosses", free: "NFT que podes ganhar gratuitamente", buyable: "NFT para compra",
    status: "Pré-visualização preparada para a Mainnet.",
    empty: "Os teus NFT aparecem aqui após uma vitória confirmada contra um boss.",
    loading: "A carregar NFT…", error: "Não foi possível carregar a galeria.", previous: "Anterior", next: "Seguinte",
  },
  it: {
    title: "NFT dei boss", free: "NFT ottenibili gratis giocando", buyable: "NFT acquistabili",
    status: "Anteprima preparata per la Mainnet.",
    empty: "I tuoi NFT appariranno qui dopo una vittoria confermata contro un boss.",
    loading: "Caricamento degli NFT…", error: "Impossibile caricare la galleria.", previous: "Indietro", next: "Avanti",
  },
  pl: {
    title: "NFT bossów", free: "NFT do zdobycia za darmo", buyable: "NFT do kupienia",
    status: "Podgląd przygotowany z myślą o Mainnet.",
    empty: "Twoje NFT pojawią się tutaj po potwierdzonym zwycięstwie nad bossem.",
    loading: "Wczytywanie NFT…", error: "Nie udało się wczytać galerii.", previous: "Wstecz", next: "Dalej",
  },
  tr: {
    title: "Boss NFT’leri", free: "Ücretsiz kazanılabilen NFT’ler", buyable: "Satın alınabilir NFT’ler",
    status: "Mainnet için hazırlanmış önizleme.",
    empty: "Bir boss zaferi doğrulandığında NFT’lerin burada görünür.",
    loading: "NFT’ler yükleniyor…", error: "Galeri yüklenemedi.", previous: "Önceki", next: "Sonraki",
  },
  ru: {
    title: "NFT боссов", free: "NFT за победы в игре", buyable: "NFT для покупки",
    status: "Предварительный просмотр подготовлен для Mainnet.",
    empty: "Твои NFT появятся здесь после подтверждённой победы над боссом.",
    loading: "Загрузка NFT…", error: "Не удалось загрузить галерею.", previous: "Назад", next: "Далее",
  },
  hr: {
    title: "NFT-ovi šefova", free: "NFT-ovi koje možeš besplatno osvojiti", buyable: "NFT-ovi za kupnju",
    status: "Pregled pripremljen za Mainnet.",
    empty: "Tvoji NFT-ovi pojavljuju se ovdje nakon potvrđene pobjede nad šefom.",
    loading: "Učitavanje NFT-ova…", error: "Galerija se nije mogla učitati.", previous: "Prethodno", next: "Sljedeće",
  },
  cs: {
    title: "NFT bossů", free: "NFT zdarma za hraní", buyable: "NFT ke koupi",
    status: "Náhled připravený pro Mainnet.",
    empty: "Tvé NFT se zde objeví po potvrzeném vítězství nad bossem.",
    loading: "Načítání NFT…", error: "Galerii se nepodařilo načíst.", previous: "Předchozí", next: "Další",
  },
  sk: {
    title: "NFT bossov", free: "NFT získateľné hraním zadarmo", buyable: "NFT na kúpu",
    status: "Ukážka pripravená pre Mainnet.",
    empty: "Tvoje NFT sa tu zobrazia po potvrdenom víťazstve nad bossom.",
    loading: "Načítavajú sa NFT…", error: "Galériu sa nepodarilo načítať.", previous: "Predchádzajúca", next: "Ďalšia",
  },
  hu: {
    title: "Főellenségek NFT-i", free: "Ingyen megszerezhető NFT-k", buyable: "Megvásárolható NFT-k",
    status: "A Mainnetre előkészített előnézet.",
    empty: "Az NFT-id a főellenség felett aratott megerősített győzelem után jelennek meg itt.",
    loading: "NFT-k betöltése…", error: "A galériát nem sikerült betölteni.", previous: "Előző", next: "Következő",
  },
  ro: {
    title: "NFT-uri cu boși", free: "NFT-uri câștigate gratuit", buyable: "NFT-uri de cumpărat",
    status: "Previzualizare pregătită pentru Mainnet.",
    empty: "NFT-urile tale apar aici după o victorie confirmată împotriva unui boss.",
    loading: "Se încarcă NFT-urile…", error: "Galeria nu a putut fi încărcată.", previous: "Înapoi", next: "Înainte",
  },
  sr: {
    title: "NFT-ови босова", free: "NFT-ови који се бесплатно освајају", buyable: "NFT-ови за куповину",
    status: "Преглед припремљен за Mainnet.",
    empty: "Твоји NFT-ови се појављују овде након потврђене победе над босом.",
    loading: "Учитавање NFT-ова…", error: "Галерија није могла да се учита.", previous: "Претходна", next: "Следећа",
  },
  uk: {
    title: "NFT босів", free: "NFT, які можна здобути безкоштовно", buyable: "NFT для купівлі",
    status: "Попередній перегляд підготовлено для Mainnet.",
    empty: "Твої NFT з’являться тут після підтвердженої перемоги над босом.",
    loading: "Завантаження NFT…", error: "Не вдалося завантажити галерею.", previous: "Назад", next: "Далі",
  },
  th: {
    title: "NFT บอส", free: "NFT ที่เล่นรับได้ฟรี", buyable: "NFT สำหรับซื้อ",
    status: "ตัวอย่างที่เตรียมไว้สำหรับ Mainnet",
    empty: "NFT ของคุณจะแสดงที่นี่เมื่อยืนยันชัยชนะเหนือบอสแล้ว",
    loading: "กำลังโหลด NFT…", error: "ไม่สามารถโหลดแกลเลอรีได้", previous: "ก่อนหน้า", next: "ถัดไป",
  },
  zh: {
    title: "首领 NFT", free: "可免费赢取的 NFT", buyable: "可购买的 NFT",
    status: "为主网准备的预览。",
    empty: "击败首领并确认胜利后，你的 NFT 将在这里显示。",
    loading: "正在加载 NFT…", error: "无法加载图库。", previous: "上一页", next: "下一页",
  },
  vi: {
    title: "NFT trùm", free: "NFT kiếm được miễn phí khi chơi", buyable: "NFT có thể mua",
    status: "Bản xem trước được chuẩn bị cho Mainnet.",
    empty: "NFT của bạn sẽ xuất hiện ở đây sau khi chiến thắng trùm được xác nhận.",
    loading: "Đang tải NFT…", error: "Không tải được bộ sưu tập.", previous: "Trước", next: "Tiếp",
  },
} satisfies Partial<Record<Locale, BossNftGalleryCopy>>;

export const nftGalleryCopy = (locale: Locale): BossNftGalleryCopy =>
  (bossNftGalleryCopy as Partial<Record<Locale, BossNftGalleryCopy>>)[locale] ?? bossNftGalleryCopy.en;
