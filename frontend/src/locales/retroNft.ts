import type { Locale } from './config.ts';

const en = ['HD NFT preview', '{count} HD card previews', 'Back to sticker album'] as const;

const copy: Partial<Record<Locale, readonly [string, string, string]>> = {
  de: ['HD-NFT-Vorschau', '{count} HD-Kartenvorschauen', 'Zurück zum Stickeralbum'],
  es: ['Vista previa del NFT en HD', '{count} vistas previas de cartas en HD', 'Volver al álbum de pegatinas'],
  fr: ['Aperçu du NFT en HD', '{count} aperçus de cartes en HD', 'Retour à l’album d’autocollants'],
  pt: ['Prévia do NFT em HD', '{count} prévias de cartas em HD', 'Voltar ao álbum de autocolantes'],
  it: ['Anteprima NFT in HD', '{count} anteprime di carte in HD', 'Torna all’album degli adesivi'],
  pl: ['Podgląd NFT w HD', '{count} podglądów kart w HD', 'Wróć do albumu naklejek'],
  tr: ['HD NFT önizlemesi', '{count} HD kart önizlemesi', 'Çıkartma albümüne dön'],
  ru: ['Предпросмотр NFT в HD', '{count} карточки для предпросмотра в HD', 'Назад в альбом наклеек'],
  hr: ['Pregled NFT-a u HD-u', '{count} pregleda kartica u HD-u', 'Natrag u album naljepnica'],
  cs: ['Náhled NFT v HD', '{count} náhledy karet v HD', 'Zpět do alba samolepek'],
  sk: ['Náhľad NFT v HD', '{count} náhľady kariet v HD', 'Späť do albumu nálepiek'],
  hu: ['HD NFT-előnézet', '{count} HD kártyaelőnézet', 'Vissza a matricaalbumhoz'],
  ro: ['Previzualizare NFT în HD', '{count} cărți de previzualizat în HD', 'Înapoi la albumul cu autocolante'],
  sr: ['Преглед NFT-а у HD-у', '{count} прегледа картица у HD-у', 'Назад у албум налепница'],
  uk: ['Попередній перегляд NFT у HD', '{count} картки для перегляду в HD', 'Назад до альбому наліпок'],
  th: ['ตัวอย่าง NFT แบบ HD', 'ตัวอย่างการ์ด HD {count} ใบ', 'กลับไปที่อัลบั้มสติกเกอร์'],
  zh: ['高清 NFT 预览', '{count} 张高清卡片预览', '返回贴纸图鉴'],
  vi: ['Xem trước NFT HD', '{count} thẻ HD để xem trước', 'Về album nhãn dán'],
};

export function retroNftCopy(locale: Locale) {
  const [preview, previewCount, backToAlbum] = copy[locale] ?? en;
  return { preview, previewCount, backToAlbum };
}
