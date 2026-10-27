const keys = ['Charge depleted', 'Weapon pickup expired', 'Switch weapon / buy charges'];
const rows: Record<string, string[]> = {
  de: ['Ladung verbraucht', 'Gesammelte Schussart abgelaufen', 'Schussart wechseln / nachkaufen'],
  es: ['Carga agotada', 'Arma recogida agotada', 'Cambiar arma / comprar cargas'],
  fr: ['Charge épuisée', 'Arme ramassée expirée', 'Changer d’arme / acheter des charges'],
  pt: ['Carga esgotada', 'Arma recolhida expirada', 'Trocar arma / comprar cargas'],
  it: ['Carica esaurita', 'Arma raccolta scaduta', 'Cambia arma / acquista cariche'],
  pl: ['Ładunek zużyty', 'Zebrana broń wygasła', 'Zmień broń / kup ładunki'],
  tr: ['Şarj tükendi', 'Toplanan silahın süresi doldu', 'Silah değiştir / şarj satın al'],
  ru: ['Заряд израсходован', 'Подобранное оружие истекло', 'Сменить оружие / купить заряды'],
  hr: ['Punjenje potrošeno', 'Prikupljeno oružje je isteklo', 'Promijeni oružje / kupi punjenja'],
  cs: ['Náboj vyčerpán', 'Sebrané zbrani vypršel čas', 'Změnit zbraň / koupit náboje'],
  sk: ['Náboj vyčerpaný', 'Zozbieranej zbrani vypršal čas', 'Zmeniť zbraň / kúpiť náboje'],
  hu: ['Töltet elfogyott', 'Felvett fegyver lejárt', 'Fegyverváltás / töltet vásárlása'],
  ro: ['Încărcătură epuizată', 'Arma colectată a expirat', 'Schimbă arma / cumpără încărcături'],
  sr: ['Пуњење потрошено', 'Прикупљено оружје је истекло', 'Промени оружје / купи пуњења'],
  uk: ['Заряд витрачено', 'Підібрана зброя вичерпала час', 'Змінити зброю / купити заряди'],
  th: ['กระสุนชุดนี้หมดแล้ว', 'อาวุธที่เก็บได้หมดเวลาแล้ว', 'เปลี่ยนอาวุธ / ซื้อกระสุนเพิ่ม'],
  zh: ['充能已耗尽', '拾取武器已到期', '切换武器 / 购买充能'],
  vi: ['Đã dùng hết lượt nạp', 'Vũ khí nhặt được đã hết hạn', 'Đổi vũ khí / mua lượt nạp'],
};
export const weaponNoticeTranslations = Object.fromEntries(Object.entries(rows).map(([locale, row]) => [locale, Object.fromEntries(keys.map((key, index) => [key, row[index]]))]));
