import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { usePreferences, type Language } from '@/stores/preferences';
import { getDeviceRegionCurrency } from '@/lib/i18n';
import { colors } from '@/lib/theme';
import { Crown } from 'lucide-react-native';
import { useState } from 'react';

const LANGUAGES: { code: Language; flag: string; label: string; sublabel: string }[] = [
  { code: 'fr', flag: '🇫🇷', label: 'Français', sublabel: 'French' },
  { code: 'en', flag: '🇺🇸', label: 'English', sublabel: 'Anglais' },
];

export default function LanguageSelectScreen() {
  const { t } = useTranslation();
  const setLang = usePreferences((s) => s.setLanguage);
  const setCurrency = usePreferences((s) => s.setCurrency);
  const [selected, setSelected] = useState<Language>('fr');

  const handleContinue = () => {
    setLang(selected);
    if (!usePreferences.getState().currency || usePreferences.getState().currency === 'EUR') {
      setCurrency(getDeviceRegionCurrency());
    }
    router.replace('/onboarding');
  };

  return (
    <SafeAreaView className="flex-1 bg-bone dark:bg-ink" edges={['top', 'bottom']}>
      <View className="flex-1 items-center justify-center px-8">
        {/* Logo */}
        <View className="mb-8 h-20 w-20 items-center justify-center rounded-full bg-gold/10 border border-gold/30">
          <Crown color={colors.gold} size={36} />
        </View>

        <Text className="font-serif text-3xl text-ink dark:text-bone mb-1">OR Vault</Text>

        <Text className="text-center text-lg font-semibold text-ink dark:text-bone mt-6 mb-2">
          {t('languageSelect.title')}
        </Text>
        <Text className="text-center text-sm text-ink-mute dark:text-bone-soft mb-10">
          {t('languageSelect.subtitle')}
        </Text>

        {/* Language cards */}
        <View className="w-full gap-4">
          {LANGUAGES.map(({ code, flag, label, sublabel }) => (
            <Pressable
              key={code}
              onPress={() => setSelected(code)}
              className={`flex-row items-center gap-4 rounded-2xl border p-5 active:opacity-80 ${
                selected === code
                  ? 'border-gold bg-gold/10'
                  : 'border-gray-200 dark:border-ink-mute bg-white dark:bg-ink-soft'
              }`}
            >
              <Text style={{ fontSize: 40 }}>{flag}</Text>
              <View className="flex-1">
                <Text className={`text-xl font-semibold ${selected === code ? 'text-gold' : 'text-ink dark:text-bone'}`}>
                  {label}
                </Text>
                <Text className="text-sm text-ink-mute dark:text-bone-soft">{sublabel}</Text>
              </View>
              {selected === code && (
                <View className="h-6 w-6 rounded-full bg-gold items-center justify-center">
                  <Text className="text-ink text-xs font-bold">✓</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>

        {/* Continue */}
        <Pressable
          onPress={handleContinue}
          className="mt-10 w-full items-center rounded-xl bg-gold py-4 active:opacity-80"
        >
          <Text className="font-semibold text-base text-ink">{t('languageSelect.continue')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
