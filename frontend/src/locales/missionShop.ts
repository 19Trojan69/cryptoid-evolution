export const missionShopTranslations: Record<string, Record<string, string>> = Object.fromEntries(Object.entries({
  de: ['Waffen-Shop', 'Die Mission bleibt pausiert. Schließe den Shop und wähle dann Fortsetzen.'],
  es: ['Tienda de armas', 'La misión sigue en pausa. Cierra la tienda y elige Reanudar.'],
  fr: ['Boutique d’armes', 'La mission reste en pause. Ferme la boutique, puis choisis Reprendre.'],
  pt: ['Loja de armas', 'A missão continua em pausa. Fecha a loja e escolhe Retomar.'],
  it: ['Negozio di armi', 'La missione resta in pausa. Chiudi il negozio e scegli Riprendi.'],
  ru: ['Магазин оружия', 'Миссия остаётся на паузе. Закрой магазин и выбери Продолжить.'],
  pl: ['Sklep z bronią', 'Misja pozostaje wstrzymana. Zamknij sklep i wybierz Wznów.'],
  tr: ['Silah mağazası', 'Görev duraklatılmış kalır. Mağazayı kapatıp Devam et seçeneğini seç.'],
  ro: ['Magazin de arme', 'Misiunea rămâne în pauză. Închide magazinul și alege Continuă.'],
  hr: ['Trgovina oružjem', 'Misija ostaje pauzirana. Zatvori trgovinu i odaberi Nastavi.'],
  cs: ['Obchod se zbraněmi', 'Mise zůstává pozastavená. Zavři obchod a zvol Pokračovat.'],
  sk: ['Obchod so zbraňami', 'Misia zostáva pozastavená. Zatvor obchod a vyber Pokračovať.'],
  hu: ['Fegyverbolt', 'A küldetés szünetel. Zárd be a boltot, majd válaszd a Folytatást.'],
  sr: ['Продавница оружја', 'Мисија остаје паузирана. Затвори продавницу и изабери Настави.'],
  uk: ['Магазин зброї', 'Місія залишається на паузі. Закрий магазин і вибери Продовжити.'],
  th: ['ร้านอาวุธ', 'ภารกิจยังหยุดชั่วคราว ปิดร้านแล้วเลือกเล่นต่อ'],
}).map(([locale, row]) => [locale, { 'Weapon shop': row[0], 'The mission stays paused. Close the shop, then choose Resume.': row[1] }]));

const paymentKeys = ['Connecting to Pi…', 'Opening payment…', 'Approving payment…', 'Confirming payment…', 'Payment cancelled.'];
const paymentRows: Record<string, string[]> = {
  de: ['Pi wird verbunden…', 'Zahlung wird geöffnet…', 'Zahlung wird freigegeben…', 'Zahlung wird bestätigt…', 'Zahlung abgebrochen.'],
  es: ['Conectando con Pi…', 'Abriendo el pago…', 'Autorizando el pago…', 'Confirmando el pago…', 'Pago cancelado.'],
  fr: ['Connexion à Pi…', 'Ouverture du paiement…', 'Autorisation du paiement…', 'Confirmation du paiement…', 'Paiement annulé.'],
  pt: ['A ligar ao Pi…', 'A abrir o pagamento…', 'A autorizar o pagamento…', 'A confirmar o pagamento…', 'Pagamento cancelado.'],
  it: ['Connessione a Pi…', 'Apertura del pagamento…', 'Autorizzazione del pagamento…', 'Conferma del pagamento…', 'Pagamento annullato.'],
  ru: ['Подключение к Pi…', 'Открытие платежа…', 'Одобрение платежа…', 'Подтверждение платежа…', 'Платёж отменён.'],
  pl: ['Łączenie z Pi…', 'Otwieranie płatności…', 'Autoryzacja płatności…', 'Potwierdzanie płatności…', 'Płatność anulowana.'],
  tr: ['Pi bağlantısı kuruluyor…', 'Ödeme açılıyor…', 'Ödeme onaylanıyor…', 'Ödeme doğrulanıyor…', 'Ödeme iptal edildi.'],
  ro: ['Conectare la Pi…', 'Se deschide plata…', 'Se autorizează plata…', 'Se confirmă plata…', 'Plată anulată.'],
  hr: ['Povezivanje s Pi…', 'Otvaranje plaćanja…', 'Odobravanje plaćanja…', 'Potvrđivanje plaćanja…', 'Plaćanje otkazano.'],
  cs: ['Připojování k Pi…', 'Otevírání platby…', 'Schvalování platby…', 'Potvrzování platby…', 'Platba zrušena.'],
  sk: ['Pripájanie k Pi…', 'Otváranie platby…', 'Schvaľovanie platby…', 'Potvrdzovanie platby…', 'Platba zrušená.'],
  hu: ['Csatlakozás a Pi-hez…', 'Fizetés megnyitása…', 'Fizetés jóváhagyása…', 'Fizetés megerősítése…', 'Fizetés megszakítva.'],
  sr: ['Повезивање са Pi…', 'Отварање плаћања…', 'Одобравање плаћања…', 'Потврђивање плаћања…', 'Плаћање отказано.'],
  uk: ['Підключення до Pi…', 'Відкриття платежу…', 'Схвалення платежу…', 'Підтвердження платежу…', 'Платіж скасовано.'],
  th: ['กำลังเชื่อมต่อ Pi…', 'กำลังเปิดการชำระเงิน…', 'กำลังอนุมัติการชำระเงิน…', 'กำลังยืนยันการชำระเงิน…', 'ยกเลิกการชำระเงินแล้ว'],
};
for (const [locale, row] of Object.entries(paymentRows)) Object.assign(missionShopTranslations[locale], Object.fromEntries(paymentKeys.map((key, i) => [key, row[i]])));

const selectionKeys = ["Shop & weapons","Owned weapons first · strongest first","Unlimited","Remaining time","Not in stock","Back to game"];
const selectionRows: Record<string, string[]> = {
  "de": [
    "Shop & Waffen",
    "Vorhandene Waffen zuerst · stärkste zuerst",
    "Unbegrenzt",
    "Restlaufzeit",
    "Kein Vorrat",
    "Zurück ins Spiel"
  ],
  "es": [
    "Tienda y armas",
    "Armas disponibles primero · las más fuertes primero",
    "Ilimitado",
    "Tiempo restante",
    "Sin existencias",
    "Volver al juego"
  ],
  "fr": [
    "Boutique et armes",
    "Armes disponibles d’abord · les plus puissantes d’abord",
    "Illimité",
    "Temps restant",
    "Aucun stock",
    "Retour au jeu"
  ],
  "pt": [
    "Loja e armas",
    "Armas disponíveis primeiro · mais fortes primeiro",
    "Ilimitado",
    "Tempo restante",
    "Sem stock",
    "Voltar ao jogo"
  ],
  "it": [
    "Negozio e armi",
    "Prima le armi disponibili · dalla più potente",
    "Illimitato",
    "Tempo rimanente",
    "Nessuna carica",
    "Torna al gioco"
  ],
  "ru": [
    "Магазин и оружие",
    "Сначала доступное оружие · от сильного к слабому",
    "Без ограничений",
    "Осталось времени",
    "Нет зарядов",
    "Вернуться в игру"
  ],
  "pl": [
    "Sklep i broń",
    "Najpierw dostępna broń · od najsilniejszej",
    "Bez limitu",
    "Pozostały czas",
    "Brak zapasu",
    "Powrót do gry"
  ],
  "tr": [
    "Mağaza ve silahlar",
    "Önce mevcut silahlar · en güçlüden başlayarak",
    "Sınırsız",
    "Kalan süre",
    "Stokta yok",
    "Oyuna dön"
  ],
  "ro": [
    "Magazin și arme",
    "Armele disponibile întâi · cele mai puternice primele",
    "Nelimitat",
    "Timp rămas",
    "Fără stoc",
    "Înapoi la joc"
  ],
  "hr": [
    "Trgovina i oružje",
    "Prvo dostupno oružje · od najjačeg",
    "Neograničeno",
    "Preostalo vrijeme",
    "Nema zaliha",
    "Natrag u igru"
  ],
  "cs": [
    "Obchod a zbraně",
    "Nejprve dostupné zbraně · od nejsilnější",
    "Neomezeně",
    "Zbývající čas",
    "Žádné zásoby",
    "Zpět do hry"
  ],
  "sk": [
    "Obchod a zbrane",
    "Najprv dostupné zbrane · od najsilnejšej",
    "Neobmedzene",
    "Zostávajúci čas",
    "Žiadne zásoby",
    "Späť do hry"
  ],
  "hu": [
    "Bolt és fegyverek",
    "Először az elérhető fegyverek · a legerősebbtől",
    "Korlátlan",
    "Hátralévő idő",
    "Nincs készleten",
    "Vissza a játékba"
  ],
  "sr": [
    "Продавница и оружје",
    "Прво доступно оружје · од најјачег",
    "Неограничено",
    "Преостало време",
    "Нема залиха",
    "Назад у игру"
  ],
  "uk": [
    "Магазин і зброя",
    "Спочатку доступна зброя · від найсильнішої",
    "Необмежено",
    "Залишилося часу",
    "Немає зарядів",
    "Повернутися до гри"
  ],
  "th": [
    "ร้านค้าและอาวุธ",
    "อาวุธที่มีก่อน · เรียงจากแรงที่สุด",
    "ไม่จำกัด",
    "เวลาที่เหลือ",
    "ไม่มีในคลัง",
    "กลับเข้าเกม"
  ]
};
for (const [locale, row] of Object.entries(selectionRows)) Object.assign(missionShopTranslations[locale], Object.fromEntries(selectionKeys.map((key, i) => [key, row[i]])));

const reloadKeys = ["Auto-reload", "Auto-reload uses owned charges only. No automatic purchases.", "No reload required", "Reloading weapon…"];
const reloadRows: Record<string, string[]> = {
  "de": [
    "Auto-Reload",
    "Auto-Reload nutzt nur vorhandene Ladungen. Keine automatischen Käufe.",
    "Kein Nachladen nötig",
    "Waffe wird nachgeladen…"
  ],
  "es": [
    "Recarga automática",
    "La recarga automática solo usa cargas disponibles. Sin compras automáticas.",
    "No necesita recarga",
    "Recargando arma…"
  ],
  "fr": [
    "Recharge auto",
    "La recharge auto utilise uniquement les charges possédées. Aucun achat automatique.",
    "Aucune recharge nécessaire",
    "Recharge de l’arme…"
  ],
  "pt": [
    "Recarga automática",
    "A recarga automática só usa cargas disponíveis. Sem compras automáticas.",
    "Não requer recarga",
    "Recarregando arma…"
  ],
  "it": [
    "Ricarica automatica",
    "La ricarica automatica usa solo cariche possedute. Nessun acquisto automatico.",
    "Nessuna ricarica necessaria",
    "Ricarica arma…"
  ],
  "pl": [
    "Autoładowanie",
    "Autoładowanie zużywa tylko posiadane ładunki. Bez automatycznych zakupów.",
    "Przeładowanie zbędne",
    "Przeładowywanie broni…"
  ],
  "tr": [
    "Otomatik doldurma",
    "Otomatik doldurma yalnızca mevcut yükleri kullanır. Otomatik satın alma yapılmaz.",
    "Doldurma gerekmiyor",
    "Silah dolduruluyor…"
  ],
  "ru": [
    "Автоперезарядка",
    "Автоперезарядка использует только имеющиеся заряды. Без автоматических покупок.",
    "Перезарядка не нужна",
    "Перезарядка оружия…"
  ],
  "hr": [
    "Automatsko punjenje",
    "Automatsko punjenje koristi samo postojeća punjenja. Bez automatske kupnje.",
    "Punjenje nije potrebno",
    "Punjenje oružja…"
  ],
  "cs": [
    "Automatické nabíjení",
    "Automatické nabíjení používá pouze vlastněné náboje. Žádné automatické nákupy.",
    "Nabíjení není potřeba",
    "Nabíjení zbraně…"
  ],
  "sk": [
    "Automatické nabíjanie",
    "Automatické nabíjanie používa iba vlastnené náboje. Žiadne automatické nákupy.",
    "Nabíjanie nie je potrebné",
    "Nabíjanie zbrane…"
  ],
  "hu": [
    "Automatikus újratöltés",
    "Az automatikus újratöltés csak meglévő tölteteket használ. Nincs automatikus vásárlás.",
    "Nem kell újratölteni",
    "Fegyver újratöltése…"
  ],
  "ro": [
    "Reîncărcare automată",
    "Reîncărcarea automată folosește doar încărcăturile deținute. Fără cumpărări automate.",
    "Nu necesită reîncărcare",
    "Se reîncarcă arma…"
  ],
  "sr": [
    "Аутоматско пуњење",
    "Аутоматско пуњење користи само постојећа пуњења. Без аутоматске куповине.",
    "Пуњење није потребно",
    "Пуњење оружја…"
  ],
  "uk": [
    "Автоперезаряджання",
    "Автоперезаряджання використовує лише наявні заряди. Без автоматичних покупок.",
    "Перезаряджання не потрібне",
    "Перезаряджання зброї…"
  ],
  "th": [
    "บรรจุอัตโนมัติ",
    "บรรจุอัตโนมัติใช้เฉพาะจำนวนที่มีอยู่ ไม่มีการซื้ออัตโนมัติ",
    "ไม่ต้องบรรจุใหม่",
    "กำลังบรรจุอาวุธ…"
  ]
};
for (const [locale, row] of Object.entries(reloadRows)) Object.assign(missionShopTranslations[locale], Object.fromEntries(reloadKeys.map((key, i) => [key, row[i]])));
const reloadSwitchRows: Record<string, string[]> = {de:['Ein','Aus'],es:['Sí','No'],fr:['Oui','Non'],pt:['Ligado','Desligado'],it:['Sì','No'],pl:['Wł.','Wył.'],tr:['Açık','Kapalı'],ru:['Вкл.','Выкл.'],hr:['Uklj.','Isklj.'],cs:['Zap.','Vyp.'],sk:['Zap.','Vyp.'],hu:['Be','Ki'],ro:['Pornit','Oprit'],sr:['Укљ.','Искљ.'],uk:['Увімк.','Вимк.'],th:['เปิด','ปิด']};
for (const [locale, [on, off]] of Object.entries(reloadSwitchRows)) Object.assign(missionShopTranslations[locale], {On:on, Off:off});
