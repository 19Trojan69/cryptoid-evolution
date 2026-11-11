type StickerMotif = {
  color: string;
  shape: string;
  details: string;
};

// The station level identifies the mission, including its variant.
export const arcadeStickerMotifs: Readonly<Partial<Record<number, StickerMotif>>> = {
  5: { // Klassischer Sammelflug
    color: '#63f0c1',
    shape: 'M27 4 44 18 38 39 24 49 12 28ZM50 14l9 9-6 12-8-7ZM6 33l8 8-6 9-5-7Z',
    details: 'm27 4 2 18-5 27M12 28l17-6 15-4m6-4 2 12 7-3M4 19h8m-4-4v8',
  },
  10: { // Shard-Ketten
    color: '#a9a6ff',
    shape: 'm11 32 10 9-10 10-9-10Zm14-11 9 8-8 9-9-8Zm13-10 8 7-7 8-8-7Zm12-8 9 7-8 8-8-7Z',
    details: 'm15 36 5-4m9-9 5-4m9-6 4-3M11 32v19m15-29v15m12-25 1 13m11-21 1 13',
  },
  15: { // Magnetfenster
    color: '#6cdeff',
    shape: 'M10 7h12v24a10 10 0 0 0 20 0V7h12v24a22 22 0 0 1-44 0Zm22 9 6 8-6 8-6-8Z',
    details: 'M10 17h12m20 0h12M30 6l2 5 2-5M6 33l-3 2m57-2 3 2m-31 9v5',
  },
  20: { // Riskante Bergung
    color: '#ffad6c',
    shape: 'M22 8h20l13 13v15L42 49H22L9 36V21ZM32 15l12 13-12 14-12-14Z',
    details: 'M32 15v27m-12-14h24M8 11l8-6m32 0 8 6M5 40l9 9m36 0 9-9',
  },
  25: { // Lieferauftrag
    color: '#efd179',
    shape: 'M8 18 31 7l25 11v24L31 53 8 42ZM22 13l26 11v9l-9 4v-9L14 17Z',
    details: 'M8 18l23 11 25-11M31 29v24m-16-18 5 5 6-8m12 9 11-5',
  },
  30: { // Freier Flug
    color: '#b9bcf1',
    shape: 'm11 12 11-6 15 4 8 12-4 14-13 9-15-4-7-13Z',
    details: 'm19 16 8-4 8 7-3 7-10 1-5-5Zm-6 16 7 2 2 7m10-8 8-4m7 8 12-7m-8 16 9-5M51 11v8m-4-4h8',
  },
  35: { // Meteorfronten
    color: '#ff9084',
    shape: 'm7 30 8-6 9 4 2 9-7 7-9-2Zm17-12 7-6 9 3 2 8-7 7-8-2Zm19-11 7-5 9 4 1 8-7 6-7-3Z',
    details: 'm15 29 6 4-4 4m12-20 7 3-2 4m14-13 7 2m-28 21 12-7m-11 18 18-12m-9 17 20-14',
  },
  40: { // Trümmerwirbel
    color: '#d5a0ff',
    shape: 'M8 38C-1 18 18 2 38 7c-16 1-25 10-20 22 2 4 6 7 11 8-10 4-17 3-21 1ZM54 12c14 13 5 36-17 39 14-7 17-18 10-27-3-4-8-6-13-5 8-6 16-8 20-7ZM27 21l10 1 6 9-7 8-10-3-3-8Z',
    details: 'm28 24 7 1 3 6-5 4m-21-24 4-4m32 38 5-4m-44 3 6 3',
  },
  45: { // Impulsantrieb
    color: '#83b7ff',
    shape: 'M6 20 37 7l19 20-19 20L6 34l15-7Zm16 3 13-6 9 10-9 10-13-6 9-4Z',
    details: 'M4 12h14M3 43h16M5 26h9m23-12 11 13-11 13m18-28 6 6m-6 23 6-6',
  },
  50: { // Enger Sektor
    color: '#ffbe76',
    shape: 'M5 5h13l11 17v12L18 51H5V5Zm54 0H46L35 22v12l11 17h13V5Z',
    details: 'm7 14 8-8m-8 18 13-13m-13 23 12-12m26-10 8-8m-12 20 15-15m-17 26 17-16m-10 24 10-10',
  },
  55: { // Ruhige Station
    color: '#88e4ed',
    shape: 'M8 11h48v13H43l-4-5H25l-4 5H8Zm0 23h13l4 5h14l4-5h13v13H8Z',
    details: 'M14 17h8m20 0h8M14 41h8m20 0h8m-18-9v-8m-4 4 4-4 4 4M5 28h10m34 0h10',
  },
  60: { // Rotierende Station
    color: '#a2b1ff',
    shape: 'm31 10 8 8 14-4 5 10-17 6 3 15-10 3-6-14-16 2-5-9 16-7 1-10Z',
    details: 'M23 5a25 25 0 0 1 31 9m-7-2 7 2-1-7M41 51a25 25 0 0 1-33-9m7 1-7-1v7m23-29 7 7-7 7-7-7Z',
  },
  65: { // Beweglicher Frachter
    color: '#ffbf82',
    shape: 'M14 17h9l6-7h17l12 12v13L46 46H29l-6-7h-9V17Z',
    details: 'M28 17h14v22H28Zm14 5h15m-15 9h15M5 15h11M2 25h9M2 32h9m-6 9h11',
  },
  70: { // Beschädigte Steuerung
    color: '#ed9ee7',
    shape: 'M8 13 22 6l9 9-9 11 9 4-9 15-14-7ZM41 8l15 6v25l-15 8-7-12 9-8-8-4Z',
    details: 'm14 20 8-6m-8 19 8 5m27-19 3 4m-7 13 6-4m-19-14 4 7-6 8m1-24 1-5m0 47 2-5',
  },
  75: { // Mehrfachauftrag
    color: '#73e4ce',
    shape: 'M5 7h23v16H5Zm31 0h23v16H36ZM20 35h24v16H20Z',
    details: 'm10 14 4 4 8-7m19 3 4 4 8-7m-27 28 5 5 7-7M16 27l16 5 16-5m-16 5v3',
  },
  80: { // Ringfolge
    color: '#6de7e9',
    shape: 'M8 30a17 22 0 1 0 34 0 17 22 0 1 0-34 0Zm6 0a11 15 0 1 1 22 0 11 15 0 1 1-22 0Z',
    details: 'M34 9c11 3 16 16 13 27-1 5-3 9-7 12m5-42c12 5 16 21 11 31M3 23l4 5-4 5m20-8 6 5-6 5',
  },
  85: { // Wandernde Ringe
    color: '#baa8ff',
    shape: 'M7 31a14 17 0 1 0 28 0 14 17 0 1 0-28 0Zm5 0a9 11 0 1 1 18 0 9 11 0 1 1-18 0Zm23-12a11 14 0 1 0 22 0 11 14 0 1 0-22 0Zm4 0a7 9 0 1 1 14 0 7 9 0 1 1-14 0Z',
    details: 'M11 10h15l-5-5m23 38h13l-5-5m5 5-5 5m-9-40h5',
  },
  90: { // Phasenringe
    color: '#83dfff',
    shape: 'M43 8A23 23 0 0 0 10 40l7-6A14 14 0 0 1 38 15ZM49 15A23 23 0 0 1 17 47l5-7A14 14 0 0 0 43 22Z',
    details: 'm44 7 8-3m-5 8 9-2M8 42l-5 3m8 2-4 5m17-25 6-5m-2 12 7-6m12-17 3-3',
  },
  95: { // Verzweigte Route
    color: '#ffa888',
    shape: 'M26 52V35L8 17V9h8l16 17L48 9h8v8L38 35v17Zm-22-46h17v6H4Zm39 0h17v6H43Z',
    details: 'M32 47V32m-5-9-9-9m19 9 9-9m-38 7 6 5m42-5-6 5',
  },
  100: { // Präzisionsserie
    color: '#ffe084',
    shape: 'M32 7a21 21 0 1 0 0 42 21 21 0 1 0 0-42Zm0 7a14 14 0 1 1 0 28 14 14 0 1 1 0-28Zm0 5 3 6 7 3-7 3-3 6-3-6-7-3 7-3Z',
    details: 'M32 3v8m0 34v8M7 28h9m32 0h9M8 10l5-5m38 0 5 5M8 46l5 5m38 0 5-5',
  },
  105: { // Zielscheiben
    color: '#ff9487',
    shape: 'M10 7h44v38H10Zm16 38h12v6H26Z',
    details: 'M32 13a13 13 0 1 0 0 26 13 13 0 1 0 0-26Zm0 6a7 7 0 1 0 0 14 7 7 0 1 0 0-14Zm0 4v6m-3-3h6M13 11h5m28 0h5',
  },
  110: { // Bewegliche Drohnen
    color: '#91b3ff',
    shape: 'm7 10 9 4h11l9-4-4 15-7 5H18l-7-5Zm23 20 9 4h11l9-4-4 15-7 5h-7l-7-5Z',
    details: 'M17 18h10v6H17Zm22 20h10v6H39ZM2 15h6M2 23h7m14 16h8m-9 7h9m16-28 10-5',
  },
  115: { // Freund oder Feind
    color: '#f2ce81',
    shape: 'M16 8 29 16v18l-13 9-12-9V16Zm32 0 12 8v18l-12 9-13-9V16Z',
    details: 'm10 26 5 5 8-10m19 0 12 12m0-12L42 33M32 13v30m-22 4h12m20 0h12',
  },
  120: { // Begrenzte Munition
    color: '#b9ccec',
    shape: 'M7 44V20l7-12 7 12v24Zm18 0V20l7-12 7 12v24Zm18 0V27l7-12 7 12v17Z',
    details: 'M7 34h14m4 0h14m4 0h14M14 20v8m18-8v8m18-1v4M5 49h54m-4-43v6m-3-3h6',
  },
  125: { // Schwachstellen
    color: '#ff91ad',
    shape: 'm8 12 15-6 6 11-9 9 5 9-6 12-11-6Zm48 0L41 6l-6 11 9 9-5 9 6 12 11-6ZM32 19l8 9-8 9-8-9Z',
    details: 'm32 22 5 6-5 6-5-6Zm-19-9 7-3m-7 31 6 3m32-31-7-3m7 31-6 3m-13-31V7m0 43v-6',
  },
  130: { // Einzelanflüge
    color: '#ff9b71',
    shape: 'M17 35 36 12l17-5-5 17-22 19Zm0 0-9-1 2-8 13-2Zm9 8 2 8 8-2 2-14Z',
    details: 'm28 26 8-9 7 7-9 8ZM9 43l-5 5m14-5-9 9M43 5h13v12m-5 17 7-7',
  },
  135: { // Geteilte Salven
    color: '#d69eff',
    shape: 'm5 9 15 2 9 10-8 7-10-10Zm54 0-15 2-9 10 8 7 10-10ZM32 29l8 13-8 10-8-10Z',
    details: 'm19 26 5 5 8 3m13-8-5 5-8 3m-2 5 2 5 2-5M9 5l8 3m38-3-8 3',
  },
  140: { // Abfangexplosionen
    color: '#ffc96a',
    shape: 'm31 5 6 14 16-8-4 15 13 7-15 5 3 13-15-7-7 9-5-14-16 4 8-12-11-9 17 1Z',
    details: 'm31 20 4 7 9 1-7 5 2 8-8-4-6 4 1-8-7-5 9-1ZM8 10l6 5m40 29 5 6m-56-1 7-4',
  },
  145: { // Täuschkörper
    color: '#85dfff',
    shape: 'm13 18 8 9-8 9-8-9Zm19 7 8 9-8 9-8-9Zm18-11 9 10-9 10-9-10Z',
    details: 'M4 18a36 36 0 0 1 56-5M5 41a37 37 0 0 0 54-2M13 22v10m-4-5h8m37-7-8 8m0-8 8 8',
  },
  150: { // Begrenzte Abwehr
    color: '#73ebd3',
    shape: 'M7 32h50v16H7Zm14 0v-8l11-14 11 14v8Z',
    details: 'M13 38h6v5h-6Zm12 0h6v5h-6Zm12 0h6v5h-6Zm12 0h3m-20-14V12M9 14l8 6m38-6-8 6',
  },
  155: { // Einzelrettung
    color: '#8cf2ba',
    shape: 'M23 8h18l10 12v18L40 48H24L13 38V20Z',
    details: 'M23 17h18v12H23Zm9 15v11m-6-6h12M5 18v-7h10m34 0h10v7M5 38v7h10m34 0h10v-7',
  },
  160: { // Begrenzte Kapazität
    color: '#ecc789',
    shape: 'M7 11h50v32H7Zm6 6v20h38V17Zm4 4h13v12H17Zm17 0h13v12H34Z',
    details: 'M20 24h7m-7 5h7m13-6v8m-4-4h8M17 48h30m-35-4-5 7m45-7 5 7',
  },
  165: { // Sauerstoffknappheit
    color: '#ffc192',
    shape: 'M19 7h12v8l6 7v24H13V22l6-7Zm25 13h11v26H44Z',
    details: 'M19 11h12m-13 16h14m-14 5h14m-14 5h14m16 5h3m-7-17h11m-11 5h11m-11 5h11M46 13l4-6 4 6',
  },
  170: { // Gefährliche Rückkehr
    color: '#ff98b5',
    shape: 'M7 37h50v11H7Zm18-21 7-8 7 8-4 5v12h-6V21Z',
    details: 'm4 12 8 5-7 4m47-9 8 5-7 4M12 44l6-7m5 7 6-7m5 7 6-7m5 7 6-7m-19-14v-6',
  },
  175: { // Wandernde Rettungszone
    color: '#b3ed9b',
    shape: 'M13 32 32 19l19 13-6 14H19Zm15-3h8v4h4v7h-4v4h-8v-4h-4v-7h4Z',
    details: 'M22 15a15 15 0 0 1 20 0M17 10a23 23 0 0 1 30 0M5 33h7m40 0h7m-50-4-4 4 4 4m46-8 4 4-4 4',
  },
  180: { // Ein Transporter
    color: '#a4b7ff',
    shape: 'M24 9h16l10 10v19l-8 8H22l-8-8V19Z',
    details: 'M24 19h16v18H24Zm-5 3h5m16 0h5m-26 8h5m16 0h5M4 34l4-8 4 8m40 0 4-8 4 8M29 50h6',
  },
  185: { // Mehrere Frachter
    color: '#c7a6ff',
    shape: 'M23 5h18l4 8v11l-4 5H23l-4-5V13ZM5 28h16l4 7v10l-4 5H5l-4-5V35Zm38 0h16l4 7v10l-4 5H43l-4-5V35Z',
    details: 'M27 12h10v9H27ZM9 34h8v9H9Zm38 0h8v9h-8ZM32 32v9m-4-4 4 4 4-4',
  },
  190: { // Schildbegleitung
    color: '#67eeec',
    shape: 'M32 5 53 12v17c0 11-9 18-21 23-12-5-21-12-21-23V12Zm0 11-9 7v13h18V23Z',
    details: 'm32 11 15 5v13c0 8-6 13-15 17-9-4-15-9-15-17V16Zm-3 14h6v7h-6ZM6 22v10m52-10v10',
  },
  195: { // Hinterhalt
    color: '#ff839e',
    shape: 'M25 14h14l6 8v15l-6 7H25l-6-7V22ZM3 16l15 11L3 38l4-11Zm58 0L46 27l15 11-4-11Z',
    details: 'M29 22h6v14h-6ZM5 9l12 8m30 0 12-8M6 47l11-8m30 0 11 8m-26-35V5',
  },
  200: { // Beschädigter Konvoi
    color: '#ffb78a',
    shape: 'M9 15h15l6-8h19l8 9v12l-9 3 3 6-10 12H24L9 39Z',
    details: 'M16 22h12v13H16Zm16-5h14m-4 1-7 11 8 3-5 10m18-8 5 1m-9 9 5 4m-49-3 6 4',
  },
};
