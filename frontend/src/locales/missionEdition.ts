const keys = [
  '{count} editions', 'Bonus points', 'Shards saved on this device.',
  'Shards could not be saved on this device.', 'Test run · rewards are not saved.',
] as const;

const rows = {
  de: ['{count} Editionen', 'Bonuspunkte', 'Shards auf diesem Gerät gespeichert.', 'Shards konnten auf diesem Gerät nicht gespeichert werden.', 'Testlauf · Belohnungen werden nicht gespeichert.'],
  es: ['{count} ediciones', 'Puntos extra', 'Shards guardados en este dispositivo.', 'No se pudieron guardar los Shards en este dispositivo.', 'Partida de prueba · las recompensas no se guardan.'],
  fr: ['{count} éditions', 'Points bonus', 'Shards enregistrés sur cet appareil.', 'Impossible d’enregistrer les Shards sur cet appareil.', 'Partie de test · les récompenses ne sont pas enregistrées.'],
  pt: ['{count} edições', 'Pontos de bónus', 'Shards guardados neste dispositivo.', 'Não foi possível guardar os Shards neste dispositivo.', 'Partida de teste · as recompensas não são guardadas.'],
  it: ['{count} edizioni', 'Punti bonus', 'Shard salvati su questo dispositivo.', 'Impossibile salvare gli Shard su questo dispositivo.', 'Partita di prova · le ricompense non vengono salvate.'],
  pl: ['Edycje: {count}', 'Punkty bonusowe', 'Shards zapisano na tym urządzeniu.', 'Nie udało się zapisać Shards na tym urządzeniu.', 'Gra testowa · nagrody nie są zapisywane.'],
  tr: ['{count} sürüm', 'Bonus puanları', 'Shard’lar bu cihaza kaydedildi.', 'Shard’lar bu cihaza kaydedilemedi.', 'Test oyunu · ödüller kaydedilmez.'],
  ru: ['Изданий: {count}', 'Бонусные очки', 'Осколки сохранены на этом устройстве.', 'Не удалось сохранить осколки на этом устройстве.', 'Пробный запуск · награды не сохраняются.'],
  hr: ['Izdanja: {count}', 'Bonus bodovi', 'Krhotine su spremljene na ovom uređaju.', 'Krhotine nije bilo moguće spremiti na ovom uređaju.', 'Probna igra · nagrade se ne spremaju.'],
  cs: ['Počet edic: {count}', 'Bonusové body', 'Střepy byly uloženy v tomto zařízení.', 'Střepy se v tomto zařízení nepodařilo uložit.', 'Zkušební hra · odměny se neukládají.'],
  sk: ['Počet edícií: {count}', 'Bonusové body', 'Úlomky sú uložené v tomto zariadení.', 'Úlomky sa nepodarilo uložiť v tomto zariadení.', 'Skúšobná hra · odmeny sa neukladajú.'],
  hu: ['{count} kiadás', 'Bónuszpontok', 'A szilánkok mentve ezen az eszközön.', 'A szilánkokat nem sikerült menteni ezen az eszközön.', 'Próbajáték · a jutalmak nem kerülnek mentésre.'],
  ro: ['Ediții: {count}', 'Puncte bonus', 'Fragmentele au fost salvate pe acest dispozitiv.', 'Fragmentele nu au putut fi salvate pe acest dispozitiv.', 'Joc de test · recompensele nu se salvează.'],
  sr: ['Издања: {count}', 'Бонус поени', 'Крхотине су сачуване на овом уређају.', 'Крхотине није било могуће сачувати на овом уређају.', 'Пробна игра · награде се не чувају.'],
  uk: ['Видань: {count}', 'Бонусні очки', 'Уламки збережено на цьому пристрої.', 'Не вдалося зберегти уламки на цьому пристрої.', 'Пробна гра · нагороди не зберігаються.'],
  th: ['{count} รุ่น', 'คะแนนโบนัส', 'บันทึกชาร์ดบนอุปกรณ์นี้แล้ว', 'ไม่สามารถบันทึกชาร์ดบนอุปกรณ์นี้ได้', 'รอบทดสอบ · ไม่มีการบันทึกรางวัล'],
  zh: ['{count} 个版本', '奖励分数', '碎片已保存在此设备上。', '无法在此设备上保存碎片。', '测试对局 · 奖励不会保存。'],
  vi: ['{count} phiên bản', 'Điểm thưởng', 'Đã lưu mảnh vỡ trên thiết bị này.', 'Không thể lưu mảnh vỡ trên thiết bị này.', 'Lượt chơi thử · phần thưởng không được lưu.'],
} satisfies Record<string, readonly [string, string, string, string, string]>;

export const missionEditionTranslations = Object.fromEntries(Object.entries(rows).map(([locale, values]) =>
  [locale, Object.fromEntries(keys.map((key, index) => [key, values[index]]))]));
