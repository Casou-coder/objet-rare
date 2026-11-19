/**
 * Statuts de preuve (BUSINESS_RULES §6) — informatifs, jamais affirmatifs.
 * Jamais « authentifié par l'application ».
 */
export type ProofStatusKey =
  | 'certificate_provided'
  | 'readability_sufficient'
  | 'readability_insufficient'
  | 'holder_detected'
  | 'holder_confirmed'
  | 'unique_id_registered'
  | 'conflict_detected';

export interface ProofInput {
  hasCertificate: boolean;
  readabilityScore: number | null;
  threshold: number;
  holderNameDetected: string | null;
  holderMatch: 'match' | 'mismatch' | 'unknown';
  hasUniqueId: boolean;
  hasOpenConflict: boolean;
}

export function deriveProofStatus(p: ProofInput): ProofStatusKey[] {
  const out: ProofStatusKey[] = [];
  if (p.hasCertificate) out.push('certificate_provided');
  if (p.readabilityScore !== null) {
    out.push(p.readabilityScore >= p.threshold ? 'readability_sufficient' : 'readability_insufficient');
  }
  if (p.holderNameDetected) out.push('holder_detected');
  if (p.holderMatch === 'match') out.push('holder_confirmed');
  if (p.hasUniqueId) out.push('unique_id_registered');
  if (p.hasOpenConflict) out.push('conflict_detected');
  return out;
}

/** Statut documentaire affiché dans Mon coffre : silence = OK (« complete » n'est pas affiché). */
export function documentStatus(p: ProofInput): 'complete' | 'missing_document' | 'unreadable' | 'conflict' {
  if (p.hasOpenConflict) return 'conflict';
  if (!p.hasCertificate) return 'missing_document';
  if (p.readabilityScore !== null && p.readabilityScore < p.threshold) return 'unreadable';
  return 'complete';
}
