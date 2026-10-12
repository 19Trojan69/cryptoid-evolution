// The same short in-flight prompts are used throughout the Testnet campaign.
const keys = ['Clear the formation', 'Finish this wave without a hit', 'Hold your combo', 'Heavy attacker incoming', 'FORMATION CLEARED'] as const;
const rows: Record<string, readonly string[]> = {
  de: ['Zerstöre die gesamte Formation', 'Schaffe diese Welle ohne Treffer', 'Halte deine Combo', 'Schwerer Angreifer im Anflug', 'FORMATION BESIEGT'],
  es: ['Destruye toda la formación', 'Completa esta oleada sin recibir impactos', 'Mantén tu combo', 'Atacante pesado en camino', 'FORMACIÓN DESTRUIDA'],
  zh: ['摧毁整个编队', '无伤完成这一波', '保持连击', '重型敌机来袭', '编队已清除'],
  vi: ['Tiêu diệt cả đội hình', 'Vượt đợt này mà không trúng đạn', 'Giữ chuỗi combo', 'Kẻ địch hạng nặng đang đến', 'ĐÃ DIỆT ĐỘI HÌNH'],
};
export const combatVarietyTranslations = Object.fromEntries(Object.entries(rows).map(([locale, row]) => [locale, Object.fromEntries(keys.map((key, index) => [key, row[index]]))]));
