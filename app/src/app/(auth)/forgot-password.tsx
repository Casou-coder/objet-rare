import { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/theme';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { colorScheme } = useColorScheme();

  const onSubmit = async () => {
    if (!email.trim()) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    setLoading(false);
    if (error) {
      Alert.alert(t('common.error'), error.message);
    } else {
      setSent(true);
    }
  };

  return (
    <View className="flex-1 bg-bone dark:bg-ink px-6">
      <Pressable onPress={() => router.back()} hitSlop={8} className="mt-14 mb-8 self-start">
        <ChevronLeft color={colorScheme === 'dark' ? colors.bone : colors.ink} size={26} />
      </Pressable>

      <Text className="mb-2 font-serif text-3xl text-ink dark:text-bone">{t('auth.forgotPassword.title')}</Text>

      {sent ? (
        <View className="mt-6">
          <Text className="mb-6 text-ink-mute dark:text-bone-soft">
            {t('auth.forgotPassword.sentMsg', { email })}{' '}
            <Text className="text-gold">{email}</Text>.{'\n\n'}
            {t('auth.forgotPassword.sentBody')}
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="items-center rounded-xl border border-gray-200 dark:border-ink-mute py-4"
          >
            <Text className="text-ink dark:text-bone">{t('auth.forgotPassword.backToLogin')}</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <Text className="mb-8 text-ink-mute dark:text-bone-soft">
            {t('auth.forgotPassword.description')}
          </Text>

          <Text className="mb-2 text-ink-mute dark:text-bone-soft">{t('auth.email')}</Text>
          <TextInput
            className="mb-6 rounded-xl border border-gray-200 dark:border-ink-mute bg-white dark:bg-ink-soft px-4 py-3 text-ink dark:text-bone"
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder={t('auth.emailPlaceholder')}
            placeholderTextColor={colors.inkGray}
            value={email}
            onChangeText={setEmail}
          />

          <Pressable
            onPress={onSubmit}
            disabled={loading || !email.trim()}
            className={`items-center rounded-xl py-4 active:opacity-80 ${email.trim() ? 'bg-gold' : 'bg-gray-200 dark:bg-ink-mute'}`}
          >
            {loading
              ? <ActivityIndicator color={colors.ink} />
              : <Text className="font-semibold text-ink">{t('auth.forgotPassword.submit')}</Text>}
          </Pressable>
        </>
      )}
    </View>
  );
}
