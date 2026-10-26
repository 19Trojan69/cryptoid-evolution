const rows: Record<string, string[]> = {
  de: ['Ladungen', '45 Sekunden pro Ladung', 'Menge', 'Eingesammelte Waffe', 'Nicht bestätigt. Dieselbe Waffe erneut versuchen.', 'Antippen öffnet die Waffenauswahl und pausiert das Spiel. Nach der Auswahl geht es mit 3–2–1 weiter.'],
  es: ['Cargas', '45 segundos por carga', 'Cantidad', 'Arma recogida', 'Sin confirmar. Reintenta la misma arma.', 'Toca para elegir un arma y pausar. Tras elegir, continúa con 3–2–1.'],
  fr: ['Charges', '45 secondes par charge', 'Quantité', 'Arme ramassée', 'Non confirmé. Réessaie la même arme.', 'Touche pour choisir une arme et mettre en pause. Reprise après 3–2–1.'],
  pt: ['Cargas', '45 segundos por carga', 'Quantidade', 'Arma recolhida', 'Não confirmado. Tenta a mesma arma novamente.', 'Toca para escolher uma arma e pausar. Depois continua em 3–2–1.'],
  it: ['Cariche', '45 secondi per carica', 'Quantità', 'Arma raccolta', 'Non confermato. Riprova la stessa arma.', 'Tocca per scegliere un’arma e mettere in pausa. Ripresa dopo 3–2–1.'],
  pl: ['Ładunki', '45 sekund na ładunek', 'Liczba', 'Zebrana broń', 'Niepotwierdzone. Spróbuj ponownie tej samej broni.', 'Dotknij, aby wybrać broń i wstrzymać grę. Powrót po 3–2–1.'],
  tr: ['Şarjlar', 'Şarj başına 45 saniye', 'Adet', 'Toplanan silah', 'Onaylanmadı. Aynı silahı tekrar dene.', 'Silah seçip duraklatmak için dokun. Seçimden sonra 3–2–1 ile devam eder.'],
  ru: ['Заряды', '45 секунд на заряд', 'Количество', 'Подобранное оружие', 'Не подтверждено. Повтори то же оружие.', 'Нажми для выбора оружия и паузы. После выбора продолжение через 3–2–1.'],
  hr: ['Punjenja', '45 sekundi po punjenju', 'Količina', 'Prikupljeno oružje', 'Nije potvrđeno. Pokušaj isto oružje ponovno.', 'Dodirni za odabir oružja i pauzu. Nakon odabira nastavak uz 3–2–1.'],
  cs: ['Náboje', '45 sekund na náboj', 'Počet', 'Sebraná zbraň', 'Nepotvrzeno. Zkus stejnou zbraň znovu.', 'Klepnutím vyber zbraň a pozastav hru. Po výběru pokračuje za 3–2–1.'],
  sk: ['Náboje', '45 sekúnd na náboj', 'Počet', 'Zozbieraná zbraň', 'Nepotvrdené. Skús tú istú zbraň znova.', 'Ťuknutím vyber zbraň a pozastav hru. Po výbere pokračuje za 3–2–1.'],
  hu: ['Töltetek', '45 másodperc töltetenként', 'Mennyiség', 'Felvett fegyver', 'Nincs megerősítve. Próbáld újra ugyanazt a fegyvert.', 'Érintsd meg a fegyverválasztáshoz és szünethez. Kiválasztás után 3–2–1, majd folytatás.'],
  ro: ['Încărcături', '45 de secunde pe încărcătură', 'Cantitate', 'Armă colectată', 'Neconfirmat. Reîncearcă aceeași armă.', 'Atinge pentru a alege arma și a pune pauză. După alegere, continuă în 3–2–1.'],
  sr: ['Пуњења', '45 секунди по пуњењу', 'Количина', 'Прикупљено оружје', 'Није потврђено. Покушај исто оружје поново.', 'Додирни за избор оружја и паузу. После избора наставак уз 3–2–1.'],
  uk: ['Заряди', '45 секунд на заряд', 'Кількість', 'Підібрана зброя', 'Не підтверджено. Спробуй ту саму зброю знову.', 'Натисни для вибору зброї та паузи. Після вибору продовження через 3–2–1.'],
  th: ['จำนวนชุด', '45 วินาทีต่อชุด', 'จำนวน', 'อาวุธที่เก็บได้', 'ยังไม่ยืนยัน ลองอาวุธเดิมอีกครั้ง', 'แตะเพื่อเลือกอาวุธและหยุดเกมชั่วคราว หลังเลือกจะนับ 3–2–1 แล้วเล่นต่อ'],
};
const keys = ['Charges', '45 seconds per charge', 'Quantity', 'Weapon pickup', 'Not confirmed. Retry the same weapon.', 'Tap to choose a weapon and pause. Resume follows a 3–2–1 countdown.'];
export const weaponStockTranslations = Object.fromEntries(Object.entries(rows).map(([locale, row]) => [locale, Object.fromEntries(keys.map((key, i) => [key, row[i]]))]));
