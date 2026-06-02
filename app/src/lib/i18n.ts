import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import fr from '@/locales/fr';
import en from '@/locales/en';

export type Language = 'fr' | 'en';

const EU_REGIONS = [
  'FR','DE','ES','IT','PT','NL','BE','AT','FI','IE','GR','LU','SK','SI','EE','LV','LT','CY','MT',
];

export function getDeviceLanguage(): Language {
  const lang = getLocales()[0]?.languageCode;
  return lang === 'fr' ? 'fr' : 'en';
}

export function getDeviceRegionCurrency(): 'EUR' | 'USD' | 'GBP' | 'CHF' {
  const region = getLocales()[0]?.regionCode ?? '';
  if (region === 'GB') return 'GBP';
  if (region === 'CH') return 'CHF';
  if (region === 'US' || region === 'CA' || region === 'AU') return 'USD';
  if (EU_REGIONS.includes(region)) return 'EUR';
  return 'EUR';
}

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  lng: getDeviceLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

export function setLanguage(lang: Language) {
  i18n.changeLanguage(lang);
}

export { i18n };
