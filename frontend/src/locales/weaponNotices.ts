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
