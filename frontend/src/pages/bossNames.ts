/** Original fleet callsigns; stable ids preserve saves. Not a trademark clearance. */
export const BOSS_NAMES = [
  'Varneth', 'Korvessa', 'Drelvorn', 'Talvrek', 'Zeraveth',
  'Orvask', 'Keldrava', 'Veshkorn', 'Neravoss', 'Thalverik',
  'Skorveth', 'Azhrel', 'Dornavik', 'Velkrath', 'Irdavoss',
  'Rhazvorn', 'Kelvash', 'Othravel', 'Zarnvek', 'Vorathen',
  'Drazkell', 'Nethrava', 'Valdrek', 'Korzeth', 'Thervoss',
  'Akraveth', 'Zelkharn', 'Odravik', 'Varnokh', 'Kezravel',
  'Dravosk', 'Thalzek', 'Orvethra', 'Kelzorn', 'Vashravel',
  'Zorveth', 'Drelkash', 'Nerthavel', 'Rhazkora', 'Velzhar',
  'Korthaven', 'Azravel', 'Threvask', 'Dorzheva', 'Vezrakh',
  'Orzhaven', 'Keldroth', 'Zhavrek', 'Vorthaz', 'Drazevorn',
] as const;
export const bossName = (id: number): string => BOSS_NAMES[id - 1] || `Boss ${id}`;
