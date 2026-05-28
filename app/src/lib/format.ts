export function formatValue(n: number, symbol: string, compact: boolean): string {
  if (compact) {
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Md ${symbol}`;
    if (n >= 1_000_000)     return `${(n / 1_000_000).toLocaleString('fr-FR',     { maximumFractionDigits: 1 })} M ${symbol}`;
    if (n >= 10_000)        return `${Math.round(n / 1_000).toLocaleString('fr-FR')} k ${symbol}`;
  }
  return `${n.toLocaleString('fr-FR')} ${symbol}`;
}

export function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at <= 0) return email;
  return `${email[0]}${'*'.repeat(Math.min(4, at - 1))}${email.slice(at)}`;
}
