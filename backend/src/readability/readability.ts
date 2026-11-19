import sharp from 'sharp';
import pdfParse from 'pdf-parse';

/**
 * Score de lisibilité 0–100 (BUSINESS_RULES §3.2, seuil 65), calculé côté serveur (décision T6).
 * Image : résolution, netteté (variance du laplacien), contraste (écart-type de luminance).
 * PDF : présence d'une couche texte exploitable.
 */
export interface ReadabilityResult {
  score: number;
  checks: { resolution: number; sharpness: number; contrast: number; text: number };
}

const clamp = (v: number) => Math.max(0, Math.min(100, v));
const ramp = (v: number, lo: number, hi: number) => clamp(((v - lo) / (hi - lo)) * 100);

export async function scoreImage(buffer: Buffer): Promise<ReadabilityResult> {
  const img = sharp(buffer, { failOn: 'none' }).rotate();
  const meta = await img.metadata();
  const shortSide = Math.min(meta.width ?? 0, meta.height ?? 0);
  const resolution = ramp(shortSide, 300, 1000);

  const { data, info } = await img
    .clone()
    .greyscale()
    .resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  let sum = 0;
  let sumSq = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
    sumSq += data[i] * data[i];
  }
  const n = data.length || 1;
  const mean = sum / n;
  const std = Math.sqrt(Math.max(0, sumSq / n - mean * mean));
  const contrast = ramp(std, 10, 50);

  // Variance du laplacien (netteté) + densité de contours (proxy de présence de texte)
  let lSum = 0;
  let lSumSq = 0;
  let edges = 0;
  let count = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const lap = data[i - w] + data[i + w] + data[i - 1] + data[i + 1] - 4 * data[i];
      lSum += lap;
      lSumSq += lap * lap;
      if (Math.abs(lap) > 40) edges++;
      count++;
    }
  }
  const lMean = count ? lSum / count : 0;
  const lapVar = count ? lSumSq / count - lMean * lMean : 0;
  const sharpness = ramp(Math.log10(Math.max(1, lapVar)), Math.log10(20), Math.log10(400));
  const edgeDensity = count ? edges / count : 0;
  const text = ramp(edgeDensity, 0.003, 0.03);

  const score = Math.round(0.25 * resolution + 0.35 * sharpness + 0.2 * contrast + 0.2 * text);
  return { score: clamp(score), checks: { resolution, sharpness, contrast, text } };
}

export async function scorePdf(buffer: Buffer): Promise<ReadabilityResult> {
  let chars = 0;
  try {
    const parsed = await pdfParse(buffer, { max: 3 });
    chars = parsed.text.replace(/\s+/g, '').length;
  } catch {
    chars = 0;
  }
  const text = ramp(chars, 0, 120);
  return { score: Math.round(text), checks: { resolution: 100, sharpness: 100, contrast: 100, text } };
}

export async function scoreReadability(buffer: Buffer, contentType: string): Promise<ReadabilityResult> {
  if (contentType === 'application/pdf') return scorePdf(buffer);
  try {
    return await scoreImage(buffer);
  } catch {
    return { score: 0, checks: { resolution: 0, sharpness: 0, contrast: 0, text: 0 } };
  }
}
