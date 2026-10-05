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
