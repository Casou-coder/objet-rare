const locale = (lang: string) => (lang.startsWith('fr') ? 'fr-FR' : 'en-GB');

/** Montant sobre, sans notation spéculative. */
export function formatMoney(amount: number, currency: string, lang = 'fr'): string {
  try {
    return new Intl.NumberFormat(locale(lang), { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${Math.round(amount).toLocaleString(locale(lang))} ${currency}`;
  }
}

export function formatDate(iso: string, lang = 'fr'): string {
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(locale(lang), { day: 'numeric', month: 'long', year: 'numeric' });
}

export function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at <= 0) return email;
  return `${email[0]}${'*'.repeat(Math.min(4, at - 1))}${email.slice(at)}`;
}
