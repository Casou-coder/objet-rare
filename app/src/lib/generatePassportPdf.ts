import * as Print from 'expo-print';
import { i18n } from './i18n';
import { getSignedPhotoUrl } from './photos';
import type { Item } from '@/types/database';

function row(label: string, value: string | null | undefined): string {
  if (value == null || value === '') return '';
  return `<tr><td class="label">${label}</td><td class="value">${value}</td></tr>`;
}

function metadataRows(item: Item): string {
  const t = i18n.t.bind(i18n);
  const m = item.metadata as Record<string, unknown>;
  const parts: string[] = [];

  const movementLabel: Record<string, string> = {
    automatic: t('itemForm.automatic'), manual: t('itemForm.manual'),
    quartz: t('itemForm.quartz'), other: t('common.other'),
  };
  const hardwareLabel: Record<string, string> = {
    gold: t('itemForm.gold'), silver: t('itemForm.silver'),
    rose_gold: t('itemForm.roseGold'), black: t('itemForm.black'), other: t('common.other'),
  };
  const metalLabel: Record<string, string> = {
    gold: t('itemForm.goldYellow'), white_gold: t('itemForm.goldWhite'),
    rose_gold: t('itemForm.roseGold'), silver: t('itemForm.silver'),
    platinum: t('itemForm.platinum'), other: t('common.other'),
  };

  switch (item.category) {
    case 'watch':
      if (m.movement) parts.push(row(t('itemForm.movement'), movementLabel[m.movement as string] ?? String(m.movement)));
      if (m.reference) parts.push(row(t('item.reference'), String(m.reference)));
      if (m.year) parts.push(row(t('itemForm.year'), String(m.year)));
      if (m.case_size_mm) parts.push(row(t('itemForm.diameter'), `${m.case_size_mm} mm`));
      break;
    case 'handbag':
      if (m.material) parts.push(row(t('itemForm.material'), String(m.material)));
      if (m.color) parts.push(row(t('itemForm.color'), String(m.color)));
      if (m.size) parts.push(row(t('itemForm.size'), String(m.size)));
      if (m.hardware_color) parts.push(row(t('itemForm.hardware'), hardwareLabel[m.hardware_color as string] ?? String(m.hardware_color)));
      break;
    case 'sneaker':
      if (m.size_eu) parts.push(row(t('itemForm.euSize'), String(m.size_eu)));
      if (m.colorway) parts.push(row(t('itemForm.colorway'), String(m.colorway)));
      if (m.release_year) parts.push(row(t('itemForm.year'), String(m.release_year)));
      break;
    case 'jewelry':
      if (m.metal) parts.push(row(t('itemForm.metal'), metalLabel[m.metal as string] ?? String(m.metal)));
      if (m.material) parts.push(row(t('itemForm.alloy'), String(m.material)));
      if (m.stone) parts.push(row(t('itemForm.stones'), String(m.stone)));
      if (m.weight_g) parts.push(row(t('itemForm.weight'), `${m.weight_g} g`));
      break;
  }

  return parts.join('');
}

function formatDate(iso: string): string {
  const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';
  return new Date(`${iso}T00:00:00`).toLocaleDateString(locale, {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export async function generatePassportPdf(item: Item): Promise<string> {
  const t = i18n.t.bind(i18n);
  const metaHtml = metadataRows(item);
  const hasAcquisition = item.purchase_date || item.purchase_price != null;
  const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';
  const generatedAt = new Date().toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
  const coverUrl = item.cover_photo_url ? await getSignedPhotoUrl(item.cover_photo_url) : null;
  const lang = i18n.language === 'fr' ? 'fr' : 'en';

  const html = `<!DOCTYPE html>
<html lang="${lang}">
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
      <div class="brand">OR Vault</div>
      <div class="tagline">${t('item.passportTitle')}</div>
    </div>
    <div class="gen-date">${t('item.generatedOn')}<br>${generatedAt}</div>
  </div>

  ${coverUrl
    ? `<img class="cover" src="${coverUrl}" />`
    : `<div class="cover-placeholder"></div>`}

  <div class="content">
    <div class="category">${t(`item.categories.${item.category}`, { defaultValue: item.category })}</div>
    <div class="item-name">${item.name}</div>
    <div class="item-brand">${item.brand}</div>

    <div class="section">
      <div class="section-title">${t('item.identity')}</div>
      <table>
        ${row(t('item.brand'), item.brand)}
        ${row(t('item.model'), item.model)}
        ${row(t('item.reference'), item.serial_number)}
        ${row(t('item.condition'), t(`item.conditionValues.${item.condition}`, { defaultValue: item.condition }))}
        <tr>
          <td class="label">${t('item.authenticity')}</td>
          <td class="value ${item.is_authenticated ? 'auth' : ''}">${item.is_authenticated ? t('item.authenticated') : t('item.notVerified')}</td>
        </tr>
      </table>
    </div>

    ${hasAcquisition ? `
    <div class="section">
      <div class="section-title">${t('item.acquisition')}</div>
      <table>
        ${item.purchase_date ? row(t('item.purchaseDate'), formatDate(item.purchase_date)) : ''}
        ${item.purchase_price != null ? row(t('item.purchasePrice'), `${item.purchase_price.toLocaleString(locale)} ${item.purchase_currency ?? 'EUR'}`) : ''}
      </table>
    </div>` : ''}

    ${metaHtml ? `
    <div class="section">
      <div class="section-title">${t('itemForm.sectionCharacteristics')}</div>
      <table>${metaHtml}</table>
    </div>` : ''}

    <div class="footer">
      <span>OR Vault — ${t('item.privateCollection')}</span>
      <span>${t('item.refAbbr')} ${item.id.substring(0, 8).toUpperCase()}</span>
    </div>
  </div>
</body>
</html>`;

  const { uri } = await Print.printToFileAsync({ html, base64: false });
  return uri;
}
