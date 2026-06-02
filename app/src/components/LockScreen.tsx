import { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { usePassportProtection } from '@/features/passport/usePassportProtection';
import { colors } from '@/lib/theme';

export function LockScreen() {
  const { t } = useTranslation();
  const { authenticate } = usePassportProtection();
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleUnlock = async () => {
    setLoading(true);
    setFailed(false);
    const success = await authenticate();
    setLoading(false);
    if (!success) setFailed(true);
  };

  useEffect(() => { handleUnlock(); }, []);

  return (
    <SafeAreaView className="absolute inset-0 z-50 flex-1 items-center justify-center bg-bone dark:bg-ink">
      <View className="h-20 w-20 items-center justify-center rounded-full border border-gold/30 bg-gold/10">
        <Lock color={colors.gold} size={36} />
      </View>

      <Text className="mt-8 font-serif text-3xl text-ink dark:text-bone">Objet Rare</Text>
      <Text className="mt-2 text-sm text-ink-mute dark:text-bone-soft">
        {t('lock.title')}
      </Text>

      {failed && (
        <Text className="mt-4 text-sm text-red-400">
          {t('lock.failed')}
        </Text>
      )}

      <Pressable
        onPress={handleUnlock}
        disabled={loading}
        className="mt-10 flex-row items-center gap-3 rounded-2xl border border-gold px-10 py-4 active:opacity-70"
      >
        {loading
          ? <ActivityIndicator color={colors.gold} />
          : <Text className="font-medium text-gold">{t('lock.unlock')}</Text>
        }
      </Pressable>
    </SafeAreaView>
  );
}
