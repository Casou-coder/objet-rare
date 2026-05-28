import * as Print from 'expo-print';
import { categoryLabel, conditionLabel } from './labels';
import { getSignedPhotoUrl } from './photos';
import type { Item } from '@/types/database';

const movementLabel: Record<string, string> = {
  automatic: 'Automatique', manual: 'Manuel', quartz: 'Quartz', other: 'Autre',
};
const hardwareLabel: Record<string, string> = {
  gold: 'Or', silver: 'Argent', rose_gold: 'Or rose', black: 'Noir', other: 'Autre',
};
const metalLabel: Record<string, string> = {
  gold: 'Or jaune', white_gold: 'Or blanc', rose_gold: 'Or rose',
  silver: 'Argent', platinum: 'Platine', other: 'Autre',
};

function row(label: string, value: string | null | undefined): string {
  if (value == null || value === '') return '';
  return `<tr><td class="label">${label}</td><td class="value">${value}</td></tr>`;
}

function metadataRows(item: Item): string {
  const m = item.metadata as Record<string, unknown>;
  const parts: string[] = [];

  switch (item.category) {
    case 'watch':
      if (m.movement) parts.push(row('Mouvement', movementLabel[m.movement as string] ?? String(m.movement)));
      if (m.reference) parts.push(row('Référence', String(m.reference)));
      if (m.year) parts.push(row('Année', String(m.year)));
      if (m.case_size_mm) parts.push(row('Diamètre', `${m.case_size_mm} mm`));
      break;
    case 'handbag':
      if (m.material) parts.push(row('Matière', String(m.material)));
      if (m.color) parts.push(row('Couleur', String(m.color)));
      if (m.size) parts.push(row('Taille', String(m.size)));
      if (m.hardware_color) parts.push(row('Quincaillerie', hardwareLabel[m.hardware_color as string] ?? String(m.hardware_color)));
      break;
    case 'sneaker':
      if (m.size_eu) parts.push(row('Pointure EU', String(m.size_eu)));
      if (m.colorway) parts.push(row('Colorway', String(m.colorway)));
      if (m.release_year) parts.push(row('Année', String(m.release_year)));
      break;
    case 'jewelry':
      if (m.metal) parts.push(row('Métal', metalLabel[m.metal as string] ?? String(m.metal)));
      if (m.material) parts.push(row('Matière / Alliage', String(m.material)));
      if (m.stone) parts.push(row('Pierre(s)', String(m.stone)));
      if (m.weight_g) parts.push(row('Poids', `${m.weight_g} g`));
      break;
  }

  return parts.join('');
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export async function generatePassportPdf(item: Item): Promise<string> {
  const metaHtml = metadataRows(item);
  const hasAcquisition = item.purchase_date || item.purchase_price != null;
  const generatedAt = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const coverUrl = item.cover_photo_url ? await getSignedPhotoUrl(item.cover_photo_url) : null;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Georgia, 'Times New Roman', serif; color: #1A1A1A; background: #fff; }

    .header {
      padding: 32px 40px 24px;
      border-bottom: 1px solid #E5E0D5;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .brand { font-size: 22px; letter-spacing: 0.2em; text-transform: uppercase; color: #C9A84C; }
    .tagline { font-size: 10px; color: #aaa; letter-spacing: 0.12em; text-transform: uppercase; margin-top: 4px; }
    .gen-date { font-size: 10px; color: #aaa; letter-spacing: 0.1em; text-align: right; line-height: 1.6; }

    .cover { width: 100%; max-height: 320px; object-fit: contain; background: #F9F7F4; display: block; }
    .cover-placeholder { height: 48px; background: #F9F7F4; }

    .content { padding: 32px 40px 48px; }

    .category { font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #C9A84C; margin-bottom: 6px; }
    .item-name { font-size: 28px; color: #1A1A1A; line-height: 1.2; margin-bottom: 4px; font-weight: normal; }
    .item-brand { font-size: 16px; color: #888; margin-bottom: 32px; }

    .section { margin-bottom: 28px; }
    .section-title {
      font-size: 10px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #C9A84C;
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid #E5E0D5;
    }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 9px 0; border-bottom: 1px solid #F0EDE8; vertical-align: top; }
    td.label { font-size: 12px; color: #888; width: 42%; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
    td.value { font-size: 12px; color: #1A1A1A; font-weight: 600; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
    .auth { color: #16A34A; }

    .footer {
      margin-top: 40px;
      padding-top: 14px;
      border-top: 1px solid #E5E0D5;
      font-size: 10px;
      color: #bbb;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">Objet Rare</div>
      <div class="tagline">Passeport produit</div>
    </div>
    <div class="gen-date">Généré le<br>${generatedAt}</div>
  </div>

  ${coverUrl
    ? `<img class="cover" src="${coverUrl}" />`
    : `<div class="cover-placeholder"></div>`}

  <div class="content">
    <div class="category">${categoryLabel[item.category] ?? item.category}</div>
    <div class="item-name">${item.name}</div>
    <div class="item-brand">${item.brand}</div>

    <div class="section">
      <div class="section-title">Identité</div>
      <table>
        ${row('Marque', item.brand)}
        ${row('Modèle', item.model)}
        ${row('Référence', item.serial_number)}
        ${row('État', conditionLabel[item.condition] ?? item.condition)}
        <tr>
          <td class="label">Authenticité</td>
          <td class="value ${item.is_authenticated ? 'auth' : ''}">${item.is_authenticated ? 'Authentifié ✓' : 'Non vérifié'}</td>
        </tr>
      </table>
    </div>

    ${hasAcquisition ? `
    <div class="section">
      <div class="section-title">Acquisition</div>
      <table>
        ${item.purchase_date ? row("Date d'achat", formatDate(item.purchase_date)) : ''}
        ${item.purchase_price != null ? row('Prix payé', `${item.purchase_price.toLocaleString('fr-FR')} ${item.purchase_currency ?? 'EUR'}`) : ''}
      </table>
    </div>` : ''}

    ${metaHtml ? `
    <div class="section">
      <div class="section-title">Caractéristiques</div>
      <table>${metaHtml}</table>
    </div>` : ''}

    <div class="footer">
      <span>Objet Rare — Collection privée</span>
      <span>Réf. ${item.id.substring(0, 8).toUpperCase()}</span>
    </div>
  </div>
</body>
</html>`;

  const { uri } = await Print.printToFileAsync({ html, base64: false });
  return uri;
}
