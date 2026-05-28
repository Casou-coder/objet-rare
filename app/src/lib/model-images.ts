const W = 'https://upload.wikimedia.org/wikipedia/commons/thumb';

type ModelEntry = { keywords: string[]; url: string };

// Keyed by brand name lowercase. Keywords matched against item name (lowercase).
// Sources: Wikimedia Commons (Creative Commons licenses — free for commercial use with attribution).
// To extend: add entries here; the first matching keyword wins, the first entry is the brand fallback.
const IMAGES: Record<string, ModelEntry[]> = {

  // ─── Watches ────────────────────────────────────────────────────────────────

  rolex: [
    {
      keywords: ['daytona', 'cosmograph'],
      url: `${W}/5/5b/Daytona116509.jpg/250px-Daytona116509.jpg`,
    },
    {
      keywords: ['submariner'],
      url: `${W}/c/cd/Rolex-Submariner.jpg/250px-Rolex-Submariner.jpg`,
    },
    {
      keywords: ['batman', 'blnr'],
      url: `${W}/3/3e/Rolex_GMT_Master_II_116710BLNR_Batman.jpg/250px-Rolex_GMT_Master_II_116710BLNR_Batman.jpg`,
    },
    {
      keywords: ['pepsi', 'blro', 'gmt'],
      url: `${W}/f/f1/Rolex_GMT_Master_II.jpg/250px-Rolex_GMT_Master_II.jpg`,
    },
    {
      keywords: ['datejust', 'day-date', 'day date'],
      url: `${W}/8/81/Rolex_Datejust_126234.jpg/250px-Rolex_Datejust_126234.jpg`,
    },
    {
      keywords: ['sea-dweller', 'sea dweller', 'deepsea'],
      url: `${W}/8/80/Rolex_Sea_Dweller_16600.jpg/250px-Rolex_Sea_Dweller_16600.jpg`,
    },
    {
      keywords: ['explorer'],
      url: `${W}/c/cd/Rolex-Submariner.jpg/250px-Rolex-Submariner.jpg`,
    },
  ],

  'patek philippe': [
    {
      keywords: ['nautilus'],
      url: `${W}/7/74/Patek-Philippe-Nautilus-5711.jpg/250px-Patek-Philippe-Nautilus-5711.jpg`,
    },
    {
      keywords: ['aquanaut'],
      url: `${W}/7/74/Patek-Philippe-Nautilus-5711.jpg/250px-Patek-Philippe-Nautilus-5711.jpg`,
    },
    {
      keywords: ['calatrava', 'perpetual', 'annual', 'calendar'],
      url: `${W}/4/42/Patek_Philippe_5131R-001_World_Time_in_Rose_Gold.jpg/250px-Patek_Philippe_5131R-001_World_Time_in_Rose_Gold.jpg`,
    },
  ],

  'audemars piguet': [
    {
      keywords: ['offshore'],
      url: `${W}/7/7c/Royal_Oak_Offshore_watch_by_Audemars_Piguet.JPG/250px-Royal_Oak_Offshore_watch_by_Audemars_Piguet.JPG`,
    },
    {
      keywords: ['royal oak', 'chronograph'],
      url: `${W}/a/aa/Audemars_2385.jpg/250px-Audemars_2385.jpg`,
    },
  ],

  'richard mille': [
    {
      keywords: ['rm 067', 'rm 67', 'extra flat', 'extra-flat'],
      url: `${W}/b/bc/RM_67-01_Automatic_Extra_Plat.jpg/250px-RM_67-01_Automatic_Extra_Plat.jpg`,
    },
    {
      // Generic RM fallback — skeleton dial is the signature look
      keywords: ['rm'],
      url: `${W}/2/28/RM_030_Automatic.jpg/250px-RM_030_Automatic.jpg`,
    },
  ],

  cartier: [
    {
      keywords: ['santos'],
      url: `${W}/9/99/Cartier_Santos_1988.jpg/250px-Cartier_Santos_1988.jpg`,
    },
    {
      keywords: ['tank', 'must'],
      url: `${W}/d/df/Cartier_Tank.jpg/250px-Cartier_Tank.jpg`,
    },
    {
      keywords: ['love bracelet', 'love'],
      url: `${W}/9/99/Cartier_Santos_1988.jpg/250px-Cartier_Santos_1988.jpg`,
    },
  ],

  // ─── Handbags ────────────────────────────────────────────────────────────────

  'hermès': [
    {
      keywords: ['birkin'],
      url: `${W}/d/db/Pink_Birkin_bag.jpg/250px-Pink_Birkin_bag.jpg`,
    },
    {
      keywords: ['kelly'],
      url: `${W}/1/13/Kelly_Bag.jpg/250px-Kelly_Bag.jpg`,
    },
  ],
  hermes: [
    {
      keywords: ['birkin'],
      url: `${W}/d/db/Pink_Birkin_bag.jpg/250px-Pink_Birkin_bag.jpg`,
    },
    {
      keywords: ['kelly'],
      url: `${W}/1/13/Kelly_Bag.jpg/250px-Kelly_Bag.jpg`,
    },
  ],

  chanel: [
    {
      keywords: ['flap', '2.55', 'boy', 'woc', 'wallet'],
      url: `${W}/9/9d/Chanel_2.55.jpg/250px-Chanel_2.55.jpg`,
    },
  ],

  // ─── Sneakers ────────────────────────────────────────────────────────────────

  nike: [
    {
      keywords: ['jordan 1', 'air jordan 1', 'aj1'],
      url: `${W}/2/2a/Nike_Air_Jordan_I.jpg/250px-Nike_Air_Jordan_I.jpg`,
    },
    {
      keywords: ['jordan 4', 'air jordan 4', 'aj4'],
      url: `${W}/a/a5/Nike_Air_Jordan_IV.jpg/250px-Nike_Air_Jordan_IV.jpg`,
    },
    {
      keywords: ['jordan 11', 'air jordan 11', 'concord', 'aj11'],
      url: `${W}/c/ce/Air_Jordan_XI_%28cropped%29.jpg/250px-Air_Jordan_XI_%28cropped%29.jpg`,
    },
    {
      keywords: ['dunk low panda', 'panda'],
      url: `${W}/c/c9/Panda_Nike_Dunk.jpg/250px-Panda_Nike_Dunk.jpg`,
    },
    {
      keywords: ['dunk'],
      url: `${W}/1/16/Nike_dunk.jpg/250px-Nike_dunk.jpg`,
    },
  ],

  adidas: [
    {
      keywords: ['yeezy', '350', 'boost'],
      url: `${W}/c/c8/2023_Adidas_Yeezy_Boost_350_V2_Onyx_%283%29.jpg/250px-2023_Adidas_Yeezy_Boost_350_V2_Onyx_%283%29.jpg`,
    },
  ],
};

export function getModelImage(brand: string, modelName: string): string | null {
  const key = brand.toLowerCase().trim();
  const modelLower = modelName.toLowerCase();

  const entries = IMAGES[key];
  if (!entries?.length) return null;

  for (const entry of entries) {
    if (entry.keywords.some((k) => modelLower.includes(k))) return entry.url;
  }

  return entries[0]?.url ?? null;
}
