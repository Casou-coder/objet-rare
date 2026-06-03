import { useState } from 'react';
import {
  View, Text, Pressable, ScrollView, Switch,
  Modal, TextInput, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Crown, Package, Eye, Hash, Pencil, X, BookOpen, Shield, Mail, Globe } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/stores/auth';
import { usePlan, FREE_LIMITS } from '@/features/premium/usePlan';
import { deleteAccount } from '@/features/account/deleteAccount';
import { queryClient } from '@/lib/query-client';
import { usePreferences, CURRENCY_SYMBOL, type Theme, type Currency, type Language } from '@/stores/preferences';
import { maskEmail } from '@/lib/format';
import { SelectModal } from '@/lib/SelectModal';
import { colors } from '@/lib/theme';

function SectionLabel({ title }: { title: string }) {
  return (
    <Text className="mb-2 mt-6 text-xs uppercase tracking-widest text-ink-mute dark:text-bone-soft">
      {title}
    </Text>
  );
}

// ── Profile modal ─────────────────────────────────────────────────────────────

function ProfileModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { firstName, lastName, bio, collectionPrefs, customCollection, setProfile } = usePreferences();

  const COLLECTION_INTERESTS = [
    { key: 'montres',      label: t('account.interests.watches') },
    { key: 'voitures',     label: t('account.interests.cars') },
    { key: 'sneakers',     label: t('account.interests.sneakers') },
    { key: 'maroquinerie', label: t('account.interests.bags') },
    { key: 'bijoux',       label: t('account.interests.jewelry') },
    { key: 'autres',       label: t('account.interests.other') },
  ];

  const [lFirst,  setLFirst]  = useState(firstName);
  const [lLast,   setLLast]   = useState(lastName);
  const [lBio,    setLBio]    = useState(bio);
  const [lPrefs,  setLPrefs]  = useState(collectionPrefs);
  const [lCustom, setLCustom] = useState(customCollection);

  const handleShow = () => {
    setLFirst(firstName); setLLast(lastName); setLBio(bio);
    setLPrefs(collectionPrefs); setLCustom(customCollection);
  };

  const toggle = (key: string) =>
    setLPrefs((p) => p.includes(key) ? p.filter((k) => k !== key) : [...p, key]);

  const save = () => {
    setProfile({
      firstName: lFirst.trim(),
      lastName:  lLast.trim(),
      bio:       lBio.trim(),
      collectionPrefs: lPrefs,
      customCollection: lCustom.trim(),
    });
    onClose();
  };

  const inputClass = "rounded-xl border border-gray-200 dark:border-ink-mute bg-bone dark:bg-ink px-4 py-3 text-ink dark:text-bone";

  return (
    <Modal visible={visible} transparent animationType="slide" onShow={handleShow} onRequestClose={onClose}>
      <KeyboardAvoidingView
        className="flex-1 justify-end"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-1 justify-end bg-black/60">
          <Pressable className="absolute inset-0" onPress={onClose} />

          <View className="max-h-[85%] rounded-t-3xl bg-white dark:bg-ink-soft">
            <ScrollView
              contentContainerClassName="px-6 pb-10 pt-4"
              keyboardShouldPersistTaps="handled"
            >
              <View className="mb-4 h-1 w-10 self-center rounded-full bg-gray-200 dark:bg-ink-mute" />

              <View className="mb-5 flex-row items-center justify-between">
                <Text className="font-serif text-xl text-ink dark:text-bone">{t('account.myProfile')}</Text>
                <Pressable onPress={onClose} hitSlop={8} className="active:opacity-60">
                  <X color={colors.inkGray} size={20} />
                </Pressable>
              </View>

              <View className="mb-3 flex-row gap-3">
                <View className="flex-1">
                  <Text className="mb-1.5 text-xs text-ink-mute dark:text-bone-soft">{t('account.firstName')}</Text>
                  <TextInput
                    value={lFirst}
                    onChangeText={setLFirst}
                    placeholder={t('common.optional')}
                    placeholderTextColor={colors.inkGray}
                    className={inputClass}
                    autoCapitalize="words"
                  />
                </View>
                <View className="flex-1">
                  <Text className="mb-1.5 text-xs text-ink-mute dark:text-bone-soft">{t('account.lastName')}</Text>
                  <TextInput
                    value={lLast}
                    onChangeText={setLLast}
                    placeholder={t('common.optional')}
                    placeholderTextColor={colors.inkGray}
                    className={inputClass}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <Text className="mb-1.5 text-xs text-ink-mute dark:text-bone-soft">{t('account.profile')}</Text>
              <TextInput
                value={lBio}
                onChangeText={setLBio}
                placeholder={t('account.bioPlaceholder')}
                placeholderTextColor={colors.inkGray}
                className={`${inputClass} mb-4`}
                multiline
                numberOfLines={2}
              />

              <Text className="mb-2 text-xs text-ink-mute dark:text-bone-soft">{t('account.collectionPrefs')}</Text>
              <View className="mb-3 flex-row flex-wrap gap-2">
                {COLLECTION_INTERESTS.map((i) => {
                  const active = lPrefs.includes(i.key);
                  return (
                    <Pressable
                      key={i.key}
                      onPress={() => toggle(i.key)}
                      className={`rounded-full border px-3.5 py-2 active:opacity-70 ${
                        active ? 'border-gold bg-gold/10' : 'border-gray-200 dark:border-ink-mute'
                      }`}
                    >
                      <Text className={`text-sm ${active ? 'text-gold' : 'text-ink-mute dark:text-bone-soft'}`}>
                        {i.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {lPrefs.includes('autres') && (
                <TextInput
                  value={lCustom}
                  onChangeText={setLCustom}
                  placeholder={t('account.customCollection')}
                  placeholderTextColor={colors.inkGray}
                  className={`${inputClass} mb-4`}
                />
              )}

              <Pressable onPress={save} className="mt-2 items-center rounded-xl bg-gold py-4 active:opacity-80">
                <Text className="font-semibold text-ink">{t('common.save')}</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function CompteScreen() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { isPremium, itemCount, canAddItem } = usePlan();
  const {
    theme, statsPrivate, currency, compactValues, language,
    firstName, lastName, bio, collectionPrefs, customCollection,
    setTheme, setStatsPrivate, setCurrency, setCompactValues, setLanguage,
  } = usePreferences();

  const [profileVisible, setProfileVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    queryClient.clear();
    router.replace('/(auth)/login');
  };

  const THEMES: { key: Theme; label: string }[] = [
    { key: 'system', label: t('account.themes.system') },
    { key: 'light',  label: t('account.themes.light') },
    { key: 'dark',   label: t('account.themes.dark') },
  ];

  const CURRENCY_OPTIONS: { value: Currency; label: string }[] = [
    { value: 'EUR', label: t('account.currencies.EUR') },
    { value: 'USD', label: t('account.currencies.USD') },
    { value: 'GBP', label: t('account.currencies.GBP') },
    { value: 'CHF', label: t('account.currencies.CHF') },
  ];

  const LANGUAGE_OPTIONS: { value: Language; label: string; flag: string }[] = [
    { value: 'fr', label: 'Français', flag: '🇫🇷' },
    { value: 'en', label: 'English',  flag: '🇺🇸' },
  ];

  const COLLECTION_INTERESTS = [
    { key: 'montres',      label: t('account.interests.watches') },
    { key: 'voitures',     label: t('account.interests.cars') },
    { key: 'sneakers',     label: t('account.interests.sneakers') },
    { key: 'maroquinerie', label: t('account.interests.bags') },
    { key: 'bijoux',       label: t('account.interests.jewelry') },
    { key: 'autres',       label: t('account.interests.other') },
  ];

  const displayName = [firstName, lastName].filter(Boolean).join(' ');
  const activeInterests = [
    ...COLLECTION_INTERESTS.filter((i) => collectionPrefs.includes(i.key) && i.key !== 'autres').map((i) => i.label),
    ...(collectionPrefs.includes('autres') && customCollection ? [customCollection] : []),
  ];

  const selectedLang = LANGUAGE_OPTIONS.find((l) => l.value === language);

  return (
    <SafeAreaView className="flex-1 bg-bone dark:bg-ink" edges={['top']}>
      <ProfileModal visible={profileVisible} onClose={() => setProfileVisible(false)} />

      <ScrollView contentContainerClassName="px-6 pb-24">

        <View className="pt-2 pb-2">
          <Text className="font-serif text-3xl text-ink dark:text-bone">{t('account.settings')}</Text>
        </View>

        {/* ── Mon profil ── */}
        <SectionLabel title={t('account.myProfile')} />

        <View className="rounded-2xl border border-gray-200 dark:border-ink-mute bg-white dark:bg-ink-soft p-4">
          <View className="flex-row items-start">
            <View className="flex-1">
              <Text className="text-xs text-ink-mute dark:text-bone-soft">
                {maskEmail(user?.email ?? '')}
              </Text>
              {displayName ? (
                <Text className="mt-1 font-semibold text-ink dark:text-bone">{displayName}</Text>
              ) : null}
              {bio ? (
                <Text className="mt-1 text-sm text-ink-mute dark:text-bone-soft" numberOfLines={2}>{bio}</Text>
              ) : null}
              {activeInterests.length > 0 && (
                <View className="mt-2 flex-row flex-wrap gap-1.5">
                  {activeInterests.map((label) => (
                    <View key={label} className="rounded-full bg-gold/10 px-2.5 py-1">
                      <Text className="text-xs text-gold">{label}</Text>
                    </View>
                  ))}
                </View>
              )}
              {!displayName && !bio && activeInterests.length === 0 && (
                <Text className="mt-1 text-sm text-ink-mute dark:text-bone-soft">
                  {t('account.completeProfile')}
                </Text>
              )}
            </View>
            <Pressable onPress={() => setProfileVisible(true)} hitSlop={12} className="ml-3 active:opacity-60">
              <Pencil color={colors.inkGray} size={18} />
            </Pressable>
          </View>
        </View>

        {/* ── Personnalisation ── */}
        <SectionLabel title={t('account.personalization')} />

        <View className="rounded-2xl border border-gray-200 dark:border-ink-mute bg-white dark:bg-ink-soft">

          {/* Apparence */}
          <View className="flex-row items-center gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-ink-mute">
            <Text className="flex-1 text-ink dark:text-bone">{t('account.appearance')}</Text>
            <View className="flex-row gap-1.5">
              {THEMES.map((th) => (
                <Pressable
                  key={th.key}
                  onPress={() => setTheme(th.key)}
                  className={`rounded-lg border px-3 py-1.5 active:opacity-70 ${
                    theme === th.key ? 'border-gold bg-gold/10' : 'border-gray-200 dark:border-ink-mute'
                  }`}
                >
                  <Text className={`text-xs ${theme === th.key ? 'text-gold' : 'text-ink-mute dark:text-bone-soft'}`}>
                    {th.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Masquer les stats */}
          <View className="flex-row items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-ink-mute">
            <Eye color={colors.inkGray} size={18} />
            <View className="flex-1">
              <Text className="text-ink dark:text-bone">{t('account.hideStats')}</Text>
              <Text className="text-xs text-ink-mute dark:text-bone-soft mt-0.5">
                {t('account.hideStatsDesc')}
              </Text>
            </View>
            <Switch
              value={statsPrivate}
              onValueChange={setStatsPrivate}
              trackColor={{ false: '#D1D5DB', true: colors.gold }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#D1D5DB"
            />
          </View>

          {/* Valeurs compactes */}
          <View className="flex-row items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-ink-mute">
            <Hash color={colors.inkGray} size={18} />
            <View className="flex-1">
              <Text className="text-ink dark:text-bone">{t('account.compactValues')}</Text>
              <Text className="text-xs text-ink-mute dark:text-bone-soft mt-0.5">
                {t('account.compactValuesDesc')}
              </Text>
            </View>
            <Switch
              value={compactValues}
              onValueChange={setCompactValues}
              trackColor={{ false: '#D1D5DB', true: colors.gold }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#D1D5DB"
            />
          </View>

          {/* Devise */}
          <View className="px-4 py-3 border-b border-gray-100 dark:border-ink-mute">
            <Text className="mb-2 text-ink dark:text-bone">{t('account.currency')}</Text>
            <SelectModal
              value={currency}
              options={CURRENCY_OPTIONS}
              onChange={setCurrency}
              title={t('account.chooseCurrency')}
            />
          </View>

          {/* Langue */}
          <View className="px-4 py-3">
            <Text className="mb-2 text-ink dark:text-bone">{t('account.language')}</Text>
            <View className="flex-row gap-2">
              {LANGUAGE_OPTIONS.map((lang) => (
                <Pressable
                  key={lang.value}
                  onPress={() => setLanguage(lang.value)}
                  className={`flex-1 flex-row items-center gap-2 rounded-xl border px-3 py-2.5 active:opacity-70 ${
                    language === lang.value ? 'border-gold bg-gold/10' : 'border-gray-200 dark:border-ink-mute'
                  }`}
                >
                  <Text style={{ fontSize: 20 }}>{lang.flag}</Text>
                  <Text className={`text-sm font-medium ${language === lang.value ? 'text-gold' : 'text-ink dark:text-bone'}`}>
                    {lang.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

        </View>

        {/* ── Abonnement ── */}
        <SectionLabel title={t('account.subscription')} />

        {isPremium ? (
          <View className="rounded-2xl border border-gold bg-gold/5 dark:bg-gold/10 p-4 flex-row items-center gap-3">
            <Crown color={colors.gold} size={20} />
            <View className="flex-1">
              <Text className="font-semibold text-gold">{t('account.premiumActive')}</Text>
              <Text className="text-xs text-ink-mute dark:text-bone-soft mt-0.5">{t('account.unlimitedCollection')}</Text>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={() => router.push('/premium')}
            className="rounded-2xl border border-gold bg-white dark:bg-ink-soft p-4 active:opacity-80"
          >
            <View className="flex-row items-center gap-3 mb-1.5">
              <Crown color={colors.gold} size={20} />
              <Text className="font-semibold text-gold">{t('account.upgradePremium')}</Text>
            </View>
            <Text className="text-sm text-ink-mute dark:text-bone-soft">
              {t('account.premiumDesc')}
            </Text>
          </Pressable>
        )}

        <View className="mt-2 rounded-2xl border border-gray-200 dark:border-ink-mute bg-white dark:bg-ink-soft p-4 flex-row items-center gap-3">
          <Package color={isPremium ? colors.gold : colors.inkGray} size={20} />
          <View className="flex-1">
            <Text className="text-ink dark:text-bone font-medium">{t('account.itemsCatalogued')}</Text>
            <Text className="text-xs text-ink-mute dark:text-bone-soft mt-0.5">
              {isPremium
                ? `${itemCount} objet${itemCount !== 1 ? 's' : ''}`
                : `${itemCount} / ${FREE_LIMITS.items} · ${t('account.freePlan')}`}
            </Text>
          </View>
          {!isPremium && !canAddItem && (
            <Pressable
              onPress={() => router.push('/premium')}
              className="rounded-lg bg-gold px-3 py-1.5 active:opacity-80"
            >
              <Text className="text-xs font-semibold text-ink">{t('account.unlock')}</Text>
            </Pressable>
          )}
        </View>

        {/* ── Aide ── */}
        <SectionLabel title={t('account.help')} />

        <View className="rounded-2xl border border-gray-200 dark:border-ink-mute bg-white dark:bg-ink-soft">
          <Pressable
            onPress={() => router.push('/tutorial')}
            className="flex-row items-center gap-3 px-4 py-4 border-b border-gray-100 dark:border-ink-mute active:opacity-60"
          >
            <BookOpen color={colors.inkGray} size={18} />
            <View className="flex-1">
              <Text className="font-medium text-ink dark:text-bone">{t('account.howToUse')}</Text>
              <Text className="text-xs text-ink-mute dark:text-bone-soft mt-0.5">
                {t('account.tutorialDesc')}
              </Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => router.push('/privacy-policy' as any)}
            className="flex-row items-center gap-3 px-4 py-4 border-b border-gray-100 dark:border-ink-mute active:opacity-60"
          >
            <Shield color={colors.inkGray} size={18} />
            <View className="flex-1">
              <Text className="font-medium text-ink dark:text-bone">{t('account.privacyPolicy')}</Text>
              <Text className="text-xs text-ink-mute dark:text-bone-soft mt-0.5">
                {t('account.privacyDesc')}
              </Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => Linking.openURL('mailto:support@objetrare.app')}
            className="flex-row items-center gap-3 px-4 py-4 active:opacity-60"
          >
            <Mail color={colors.inkGray} size={18} />
            <View className="flex-1">
              <Text className="font-medium text-ink dark:text-bone">{t('account.contactUs')}</Text>
              <Text className="text-xs text-ink-mute dark:text-bone-soft mt-0.5">
                support@objetrare.app
              </Text>
            </View>
          </Pressable>
        </View>

        {/* ── Compte ── */}
        <SectionLabel title={t('tabs.account')} />

        <View className="rounded-2xl border border-gray-200 dark:border-ink-mute bg-white dark:bg-ink-soft">
          <Pressable onPress={handleSignOut} className="px-4 py-4 border-b border-gray-100 dark:border-ink-mute active:opacity-60">
            <Text className="font-medium text-red-500">{t('account.signOut')}</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              Alert.alert(
                t('account.deleteAccountTitle'),
                t('account.deleteAccountMsg'),
                [
                  { text: t('common.cancel'), style: 'cancel' },
                  {
                    text: t('account.deleteForever'),
                    style: 'destructive',
                    onPress: async () => {
                      setIsDeleting(true);
                      try {
                        await deleteAccount();
                        queryClient.clear();
                        router.replace('/(auth)/login');
                      } catch (e: any) {
                        Alert.alert(t('common.error'), e.message ?? t('account.deleteError'));
                      } finally {
                        setIsDeleting(false);
                      }
                    },
                  },
                ],
              );
            }}
            disabled={isDeleting}
            className="flex-row items-center justify-between px-4 py-4 active:opacity-60"
          >
            <Text className="font-medium text-red-400">{t('account.deleteAccount')}</Text>
            {isDeleting && <ActivityIndicator size="small" color="#F87171" />}
          </Pressable>
        </View>


      </ScrollView>
    </SafeAreaView>
  );
}
