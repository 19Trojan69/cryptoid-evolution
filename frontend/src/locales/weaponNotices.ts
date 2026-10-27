const expiryRows: Record<string, string> = {
  "de": "abgelaufen",
  "es": "agotada",
  "fr": "expiré",
  "pt": "expirada",
  "it": "scaduta",
  "pl": "wygasła",
  "tr": "süresi doldu",
  "ru": "срок истёк",
  "hr": "isteklo",
  "cs": "vypršel čas",
  "sk": "vypršal čas",
  "hu": "lejárt",
  "ro": "expirată",
  "sr": "истекло",
  "uk": "час вичерпано",
  "th": "หมดเวลาแล้ว",
  "zh": "已到期",
  "vi": "đã hết hạn"
};
export const weaponNoticeTranslations = Object.fromEntries(Object.entries(expiryRows).map(([locale, text]) => [locale, { Expired: text }]));

const reloadRows: Record<string, [string, string]> = {
  de: ['Waffe nachgeladen', 'Nachladen nicht bestätigt'],
  es: ['Arma recargada', 'Recarga sin confirmar'],
  fr: ['Arme rechargée', 'Recharge non confirmée'],
  pt: ['Arma recarregada', 'Recarga não confirmada'],
  it: ['Arma ricaricata', 'Ricarica non confermata'],
  pl: ['Broń przeładowana', 'Przeładowanie niepotwierdzone'],
  tr: ['Silah yeniden dolduruldu', 'Dolum onaylanmadı'],
  ru: ['Оружие перезаряжено', 'Перезарядка не подтверждена'],
  hr: ['Oružje napunjeno', 'Punjenje nije potvrđeno'],
  cs: ['Zbraň nabita', 'Nabití nepotvrzeno'],
  sk: ['Zbraň nabitá', 'Nabitie nepotvrdené'],
  hu: ['Fegyver újratöltve', 'Újratöltés nincs megerősítve'],
  ro: ['Armă reîncărcată', 'Reîncărcare neconfirmată'],
  sr: ['Оружје напуњено', 'Пуњење није потврђено'],
  uk: ['Зброю перезаряджено', 'Перезаряджання не підтверджено'],
  th: ['บรรจุอาวุธแล้ว', 'ยังไม่ได้ยืนยันการบรรจุอาวุธ'],
  zh: ['武器已装填', '装填尚未确认'],
  vi: ['Đã nạp lại vũ khí', 'Chưa xác nhận nạp lại']
};
for (const [locale, [complete, failed]] of Object.entries(reloadRows)) {
  Object.assign(weaponNoticeTranslations[locale], { 'Weapon reloaded': complete, 'Reload not confirmed': failed });
}
