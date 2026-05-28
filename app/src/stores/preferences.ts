import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Theme    = 'system' | 'light' | 'dark';
export type Currency = 'EUR' | 'USD' | 'GBP' | 'CHF';

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  EUR: '€', USD: '$', GBP: '£', CHF: 'CHF',
};

interface PreferencesState {
  theme: Theme;
  statsPrivate: boolean;
  currency: Currency;
  compactValues: boolean;
  // Profile
  firstName: string;
  lastName: string;
  bio: string;
  collectionPrefs: string[];
  customCollection: string;
  setTheme: (t: Theme) => void;
  setStatsPrivate: (v: boolean) => void;
  setCurrency: (c: Currency) => void;
  setCompactValues: (v: boolean) => void;
  setProfile: (p: { firstName: string; lastName: string; bio: string; collectionPrefs: string[]; customCollection: string }) => void;
}

export const usePreferences = create<PreferencesState>((set) => ({
  theme: 'system',
  statsPrivate: false,
  currency: 'EUR',
  compactValues: false,
  firstName: '',
  lastName: '',
  bio: '',
  collectionPrefs: [],
  customCollection: '',

  setTheme: (theme) => {
    set({ theme });
    AsyncStorage.setItem('@theme', theme);
  },
  setStatsPrivate: (statsPrivate) => {
    set({ statsPrivate });
    AsyncStorage.setItem('@stats_private', statsPrivate ? '1' : '0');
  },
  setCurrency: (currency) => {
    set({ currency });
    AsyncStorage.setItem('@currency', currency);
  },
  setCompactValues: (compactValues) => {
    set({ compactValues });
    AsyncStorage.setItem('@compact_values', compactValues ? '1' : '0');
  },
  setProfile: (p) => {
    set(p);
    AsyncStorage.multiSet([
      ['@profile_first',   p.firstName],
      ['@profile_last',    p.lastName],
      ['@profile_bio',     p.bio],
      ['@profile_prefs',   JSON.stringify(p.collectionPrefs)],
      ['@profile_custom',  p.customCollection],
    ]);
  },
}));

// Hydrate from storage before first render
AsyncStorage.multiGet([
  '@theme', '@stats_private', '@currency', '@compact_values',
  '@profile_first', '@profile_last', '@profile_bio', '@profile_prefs', '@profile_custom',
]).then((pairs) => {
  const m = Object.fromEntries(pairs.map(([k, v]) => [k, v]));
  let collectionPrefs: string[] = [];
  try { collectionPrefs = JSON.parse(m['@profile_prefs'] ?? '[]'); } catch {}
  usePreferences.setState({
    theme:            (m['@theme'] as Theme | null)       ?? 'system',
    statsPrivate:     m['@stats_private'] === '1',
    currency:         (m['@currency'] as Currency | null) ?? 'EUR',
    compactValues:    m['@compact_values'] === '1',
    firstName:        m['@profile_first']  ?? '',
    lastName:         m['@profile_last']   ?? '',
    bio:              m['@profile_bio']    ?? '',
    collectionPrefs,
    customCollection: m['@profile_custom'] ?? '',
  });
}).catch(() => {
  // Storage unavailable — keep default values
});
