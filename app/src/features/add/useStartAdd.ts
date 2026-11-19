import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMe } from '@/api/hooks';
import { useAddDraft } from './draft';

/** Point d'entrée unique du flow d'ajout : profil complet et limite Free vérifiés avant d'entrer. */
export function useStartAdd() {
  const { t } = useTranslation();
  const me = useMe();
  const reset = useAddDraft((s) => s.reset);
  return () => {
    if (me.data && !me.data.profile_complete) {
      router.push('/profile');
      return;
    }
    if (me.data && !me.data.limits.can_add_item) {
      Alert.alert(t('v.errors.FREE_LIMIT_REACHED'), undefined, [
        { text: t('v.common.cancel'), style: 'cancel' },
        { text: t('v.vault.goPremium'), onPress: () => router.push('/premium') },
      ]);
      return;
    }
    reset();
    router.push('/add');
  };
}
