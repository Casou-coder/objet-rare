// Product catalog images — only verified Wikimedia Commons URLs.
// Falls back to Clearbit brand logo for unknown models/brands.

const W = 'https://upload.wikimedia.org/wikipedia/commons/thumb';

type Entry = { keywords: string[]; url: string };

// All filenames below are verified working from Wikimedia Commons.
// Using 400px thumbnails — good quality, reasonable file size.
const CATALOG: Record<string, Entry[]> = {

  rolex: [
    { keywords: ['daytona', 'cosmograph'],
      url: `${W}/5/5b/Daytona116509.jpg/400px-Daytona116509.jpg` },
    { keywords: ['submariner'],
      url: `${W}/c/cd/Rolex-Submariner.jpg/400px-Rolex-Submariner.jpg` },
    { keywords: ['batman', 'blnr'],
      url: `${W}/3/3e/Rolex_GMT_Master_II_116710BLNR_Batman.jpg/400px-Rolex_GMT_Master_II_116710BLNR_Batman.jpg` },
    { keywords: ['pepsi', 'blro', 'gmt'],
      url: `${W}/f/f1/Rolex_GMT_Master_II.jpg/400px-Rolex_GMT_Master_II.jpg` },
    { keywords: ['datejust', 'date just'],
      url: `${W}/8/81/Rolex_Datejust_126234.jpg/400px-Rolex_Datejust_126234.jpg` },
    { keywords: ['sea-dweller', 'seadweller', 'deepsea'],
      url: `${W}/8/80/Rolex_Sea_Dweller_16600.jpg/400px-Rolex_Sea_Dweller_16600.jpg` },
    { keywords: ['explorer'],
      url: `${W}/c/cd/Rolex-Submariner.jpg/400px-Rolex-Submariner.jpg` },
  ],

  'patek philippe': [
    { keywords: ['nautilus'],
      url: `${W}/7/74/Patek-Philippe-Nautilus-5711.jpg/400px-Patek-Philippe-Nautilus-5711.jpg` },
    { keywords: ['aquanaut'],
      url: `${W}/7/74/Patek-Philippe-Nautilus-5711.jpg/400px-Patek-Philippe-Nautilus-5711.jpg` },
    { keywords: ['calatrava', 'perpetual', 'grand complication'],
      url: `${W}/4/42/Patek_Philippe_5131R-001_World_Time_in_Rose_Gold.jpg/400px-Patek_Philippe_5131R-001_World_Time_in_Rose_Gold.jpg` },
  ],

  'audemars piguet': [
    { keywords: ['offshore'],
      url: `${W}/7/7c/Royal_Oak_Offshore_watch_by_Audemars_Piguet.JPG/400px-Royal_Oak_Offshore_watch_by_Audemars_Piguet.JPG` },
    { keywords: ['royal oak', 'chronograph'],
      url: `${W}/a/aa/Audemars_2385.jpg/400px-Audemars_2385.jpg` },
  ],

  'richard mille': [
    { keywords: [],
      url: `${W}/2/28/RM_030_Automatic.jpg/400px-RM_030_Automatic.jpg` },
  ],

  cartier: [
    { keywords: ['santos'],
      url: `${W}/9/99/Cartier_Santos_1988.jpg/400px-Cartier_Santos_1988.jpg` },
    { keywords: ['tank', 'must'],
      url: `${W}/d/df/Cartier_Tank.jpg/400px-Cartier_Tank.jpg` },
  ],

  'hermès': [
    { keywords: ['birkin'],
      url: `${W}/d/db/Pink_Birkin_bag.jpg/400px-Pink_Birkin_bag.jpg` },
    { keywords: ['kelly'],
      url: `${W}/1/13/Kelly_Bag.jpg/400px-Kelly_Bag.jpg` },
    { keywords: [],
      url: `${W}/d/db/Pink_Birkin_bag.jpg/400px-Pink_Birkin_bag.jpg` },
  ],
  hermes: [
    { keywords: ['birkin'],
      url: `${W}/d/db/Pink_Birkin_bag.jpg/400px-Pink_Birkin_bag.jpg` },
    { keywords: ['kelly'],
      url: `${W}/1/13/Kelly_Bag.jpg/400px-Kelly_Bag.jpg` },
    { keywords: [],
      url: `${W}/d/db/Pink_Birkin_bag.jpg/400px-Pink_Birkin_bag.jpg` },
  ],

  chanel: [
    { keywords: ['2.55', 'flap', 'classic', 'boy', 'woc', 'wallet'],
      url: `${W}/9/9d/Chanel_2.55.jpg/400px-Chanel_2.55.jpg` },
    { keywords: [],
      url: `${W}/9/9d/Chanel_2.55.jpg/400px-Chanel_2.55.jpg` },
  ],

  nike: [
    { keywords: ['jordan 1', 'air jordan 1', 'aj1'],
      url: `${W}/2/2a/Nike_Air_Jordan_I.jpg/400px-Nike_Air_Jordan_I.jpg` },
    { keywords: ['jordan 4', 'air jordan 4', 'aj4'],
      url: `${W}/a/a5/Nike_Air_Jordan_IV.jpg/400px-Nike_Air_Jordan_IV.jpg` },
    { keywords: ['jordan 11', 'aj11', 'concord'],
      url: `${W}/c/ce/Air_Jordan_XI_%28cropped%29.jpg/400px-Air_Jordan_XI_%28cropped%29.jpg` },
    { keywords: ['panda', 'dunk low panda'],
      url: `${W}/c/c9/Panda_Nike_Dunk.jpg/400px-Panda_Nike_Dunk.jpg` },
    { keywords: ['dunk'],
      url: `${W}/1/16/Nike_dunk.jpg/400px-Nike_dunk.jpg` },
  ],

  jordan: [
    { keywords: ['1', 'retro 1'],
      url: `${W}/2/2a/Nike_Air_Jordan_I.jpg/400px-Nike_Air_Jordan_I.jpg` },
    { keywords: ['4', 'retro 4'],
      url: `${W}/a/a5/Nike_Air_Jordan_IV.jpg/400px-Nike_Air_Jordan_IV.jpg` },
    { keywords: ['11', 'retro 11'],
      url: `${W}/c/ce/Air_Jordan_XI_%28cropped%29.jpg/400px-Air_Jordan_XI_%28cropped%29.jpg` },
    { keywords: [],
      url: `${W}/2/2a/Nike_Air_Jordan_I.jpg/400px-Nike_Air_Jordan_I.jpg` },
  ],

  adidas: [
    { keywords: ['yeezy', '350', '700', '500'],
      url: `${W}/c/c8/2023_Adidas_Yeezy_Boost_350_V2_Onyx_%283%29.jpg/400px-2023_Adidas_Yeezy_Boost_350_V2_Onyx_%283%29.jpg` },
  ],
};

// Clearbit brand logo fallback
const BRAND_DOMAINS: Record<string, string> = {
  rolex: 'rolex.com',
  'patek philippe': 'patek.com',
  'audemars piguet': 'audemarspiguet.com',
  'richard mille': 'richardmille.com',
  omega: 'omegawatches.com',
  cartier: 'cartier.com',
  iwc: 'iwc.com',
  hublot: 'hublot.com',
  panerai: 'panerai.com',
  breitling: 'breitling.com',
  'tag heuer': 'tagheuer.com',
  tudor: 'tudorwatch.com',
  'hermès': 'hermes.com',
  hermes: 'hermes.com',
  chanel: 'chanel.com',
  'louis vuitton': 'louisvuitton.com',
  gucci: 'gucci.com',
  prada: 'prada.com',
  dior: 'dior.com',
  fendi: 'fendi.com',
  balenciaga: 'balenciaga.com',
  'bottega veneta': 'bottegaveneta.com',
  celine: 'celine.com',
  'saint laurent': 'ysl.com',
  ysl: 'ysl.com',
  nike: 'nike.com',
  jordan: 'nike.com',
  adidas: 'adidas.com',
  'new balance': 'newbalance.com',
  converse: 'converse.com',
  vans: 'vans.com',
  puma: 'puma.com',
};

export function getProductImage(brand: string, name: string): { url: string; isCatalog: boolean } | null {
  const key = brand.toLowerCase().trim();
  const nameLower = name.toLowerCase();
  const entries = CATALOG[key];

  if (entries?.length) {
    for (const entry of entries) {
      if (entry.keywords.length === 0 || entry.keywords.some((k) => nameLower.includes(k))) {
        return { url: entry.url, isCatalog: true };
      }
    }
  }

  const domain = BRAND_DOMAINS[key];
  if (domain) return { url: `https://logo.clearbit.com/${domain}?size=400`, isCatalog: false };

  return null;
}
