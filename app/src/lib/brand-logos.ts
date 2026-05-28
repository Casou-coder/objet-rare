// Brand logos via Clearbit Logo API — returns square PNG logos on transparent background.
// Clearbit is free for small-scale usage. Falls back to null if brand unknown.
const BRAND_DOMAINS: Record<string, string> = {
  // Watches
  'rolex': 'rolex.com',
  'patek philippe': 'patek.com',
  'audemars piguet': 'audemarspiguet.com',
  'richard mille': 'richardmille.com',
  'cartier': 'cartier.com',
  'omega': 'omegawatches.com',
  'iwc': 'iwc.com',
  'jaeger-lecoultre': 'jaeger-lecoultre.com',
  'jaeger lecoultre': 'jaeger-lecoultre.com',
  'vacheron constantin': 'vacheron-constantin.com',
  'a. lange & söhne': 'alange-soehne.com',
  'breitling': 'breitling.com',
  'tag heuer': 'tagheuer.com',
  'hublot': 'hublot.com',
  'panerai': 'panerai.com',
  'tudor': 'tudorwatch.com',
  'zenith': 'zenith-watches.com',
  'blancpain': 'blancpain.com',
  'glashutte': 'glashuette-original.com',
  // Handbags & fashion
  'hermès': 'hermes.com',
  'hermes': 'hermes.com',
  'chanel': 'chanel.com',
  'louis vuitton': 'louisvuitton.com',
  'gucci': 'gucci.com',
  'prada': 'prada.com',
  'dior': 'dior.com',
  'fendi': 'fendi.com',
  'balenciaga': 'balenciaga.com',
  'bottega veneta': 'bottegaveneta.com',
  'celine': 'celine.com',
  'loewe': 'loewe.com',
  'saint laurent': 'ysl.com',
  'ysl': 'ysl.com',
  'valentino': 'valentino.com',
  'givenchy': 'givenchy.com',
  'versace': 'versace.com',
  'burberry': 'burberry.com',
  // Sneakers
  'nike': 'nike.com',
  'jordan': 'nike.com',
  'air jordan': 'nike.com',
  'adidas': 'adidas.com',
  'new balance': 'newbalance.com',
  'asics': 'asics.com',
  'puma': 'puma.com',
  'reebok': 'reebok.com',
  'vans': 'vans.com',
  'converse': 'converse.com',
  'salomon': 'salomon.com',
  'on running': 'on-running.com',
};

export function getBrandLogo(brand: string): string | null {
  const domain = BRAND_DOMAINS[brand.toLowerCase().trim()];
  if (!domain) return null;
  return `https://logo.clearbit.com/${domain}?size=400`;
}
