import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setLanguage, type Language } from '@/lib/i18n';

export type Theme = 'system' | 'light' | 'dark';
export type Currency = 'EUR' | 'USD' | 'GBP' | 'CHF';
export type { Language };

/** Préférences d'affichage uniquement (aucune donnée personnelle en local). */
interface PreferencesState {
  theme: Theme;
  currency: Currency;
  language: Language | null;
  hydrated: boolean;
  setTheme: (t: Theme) => void;
  setCurrency: (c: Currency) => void;
  setLanguage: (l: Language) => void;
}

export const usePreferences = create<PreferencesState>((set) => ({
  theme: 'system',
  currency: 'EUR',
  language: null,
  hydrated: false,
  setTheme: (theme) => {
    set({ theme });
    AsyncStorage.setItem('@theme', theme).catch(() => undefined);
  },
  setCurrency: (currency) => {
    set({ currency });
    AsyncStorage.setItem('@currency', currency).catch(() => undefined);
  },
  setLanguage: (language) => {
    set({ language });
    setLanguage(language);
    AsyncStorage.setItem('@language', language).catch(() => undefined);
  },
}));

// Purge des anciennes clés de profil locales (prototype) : le profil vit côté serveur.
AsyncStorage.multiRemove([
  '@profile_first', '@profile_last', '@profile_bio', '@profile_prefs', '@profile_custom', '@stats_private', '@compact_values',
  'REACT_QUERY_OFFLINE_CACHE',
]).catch(() => undefined);

AsyncStorage.multiGet(['@theme', '@currency', '@language'])
  .then((pairs) => {
    const m = Object.fromEntries(pairs);
    const language = (m['@language'] as Language | null) ?? null;
    if (language) setLanguage(language);
    usePreferences.setState({
      theme: (m['@theme'] as Theme | null) ?? 'system',
      currency: (m['@currency'] as Currency | null) ?? 'EUR',
      language,
      hydrated: true,
    });
  })
  .catch(() => usePreferences.setState({ hydrated: true }));
