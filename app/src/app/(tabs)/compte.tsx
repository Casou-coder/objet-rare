import { Linking, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMe } from '@/api/hooks';
import { Button, Card, Chips, ErrorState, Placeholders, SectionTitle, Title } from '@/components/ui';
import { useSession } from '@/stores/session';
import { usePreferences, type Language } from '@/stores/preferences';
import { maskEmail } from '@/lib/format';

const SUPPORT_EMAIL = process.env.EXPO_PUBLIC_SUPPORT_EMAIL ?? '';
const SUBSCRIPTIONS_URL =
  Platform.OS === 'ios' ? 'https://apps.apple.com/account/subscriptions' : 'https://play.google.com/store/account/subscriptions';

/** Mon compte : espace de contrôle. Ordre des sections fixe (Page mon compte §4). */
export default function AccountScreen() {
  const { t } = useTranslation();
  const me = useMe();
  const signOut = useSession((s) => s.signOut);
  const language = usePreferences((s) => s.language);
  const setLanguage = usePreferences((s) => s.setLanguage);

  if (me.isPending) {
    return (
      <SafeAreaView className="flex-1 bg-bone p-5 dark:bg-ink"><Placeholders count={4} height={96} columns={1} /></SafeAreaView>
    );
  }
  if (me.isError) {
    return (
      <SafeAreaView className="flex-1 justify-center bg-bone dark:bg-ink">
        <ErrorState message={t('v.common.networkError')} onRetry={() => me.refetch()} />
      </SafeAreaView>
    );
  }
  const m = me.data;
  const premium = m.plan === 'premium';

  const contactSupport = () => {
    // Contexte transmis automatiquement (Page mon compte §5.B), sans donnée sensible
    const subject = encodeURIComponent('Support Vault');
    const body = encodeURIComponent(`\n\n—\nRéf. compte : ${m.id}\nPlan : ${m.plan}`);
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`).catch(() => undefined);
  };

  return (
    <SafeAreaView className="flex-1 bg-bone dark:bg-ink" edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
        <Title>{t('v.account.title')}</Title>
        {m.email ? <Text className="mt-1 text-ink-mute dark:text-bone-soft">{maskEmail(m.email)}</Text> : null}

        <SectionTitle>{t('v.account.subscription')}</SectionTitle>
        <Card>
          <Text className="font-serif text-xl text-ink dark:text-bone">
            {premium ? t('v.account.planPremium') : t('v.account.planFree')}
          </Text>
          {!premium ? <Text className="mb-4 mt-1 text-ink-mute dark:text-bone-soft">{t('v.account.freeLimits')}</Text> : null}
          <Text className="mb-4 text-sm text-ink-mute dark:text-bone-soft">
            {t('v.account.objects')} : {m.counts.items}
            {!premium ? ` / ${m.limits.free_item_limit}` : ''} · {t('v.account.documents')} : {m.counts.documents}
          </Text>
          {premium ? (
            <Button label={t('v.account.manage')} variant="secondary" onPress={() => Linking.openURL(SUBSCRIPTIONS_URL)} />
          ) : (
            <Button label={t('v.account.goPremium')} onPress={() => router.push('/premium')} />
          )}
        </Card>

        <SectionTitle>{t('v.account.privacy')}</SectionTitle>
        <Card>
          <Text className="mb-3 text-ink dark:text-bone">{t('v.account.privacyText')}</Text>
          <Pressable onPress={() => router.push('/privacy-policy')} className="py-2" accessibilityRole="link">
            <Text className="text-gold">{t('v.account.privacyPolicy')}</Text>
          </Pressable>
        </Card>

        {SUPPORT_EMAIL ? (
          <>
            <SectionTitle>{t('v.account.support')}</SectionTitle>
            <Card>
              <Text className="mb-4 text-ink dark:text-bone">{t('v.account.supportText')}</Text>
              <Button label={t('v.account.contactSupport')} variant="secondary" onPress={contactSupport} />
            </Card>
          </>
        ) : null}

        <SectionTitle>{t('v.account.language')}</SectionTitle>
        <Chips<Language>
          value={language}
          onChange={setLanguage}
          options={[{ value: 'fr', label: 'Français' }, { value: 'en', label: 'English' }]}
        />

        <View className="mt-2">
          <Button label={t('v.account.signOut')} variant="link" onPress={() => void signOut()} />
        </View>

        <SectionTitle>{t('v.account.deleteTitle')}</SectionTitle>
        <Card>
          <Text className="mb-4 text-ink dark:text-bone">{t('v.account.deleteText')}</Text>
          <Button label={t('v.account.deleteCta')} variant="danger" onPress={() => router.push('/account-delete')} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
