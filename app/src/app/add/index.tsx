import { Pressable, ScrollView, Text } from 'react-native';
import { router } from 'expo-router';
import { Camera, PenLine, QrCode } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Card, Title } from '@/components/ui';
import { useAddDraft, type Method } from '@/features/add/draft';
import { colors } from '@/lib/theme';

/** Écran 1 — Choix de la méthode. Aucune option ne contourne le certificat. */
export default function AddMethodScreen() {
  const { t } = useTranslation();
  const set = useAddDraft((s) => s.set);
  const choose = (method: Method) => {
    set({ method });
    router.push('/add/category');
  };
  const options: { method: Method; label: string; Icon: typeof PenLine }[] = [
    { method: 'manual', label: t('v.add.manual'), Icon: PenLine },
    { method: 'qr', label: t('v.add.qr'), Icon: QrCode },
    { method: 'photo', label: t('v.add.photo'), Icon: Camera },
  ];
  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Title>{t('v.add.methodTitle')}</Title>
      <Text className="mb-6 mt-3 leading-6 text-ink-mute dark:text-bone-soft">{t('v.add.methodInfo')}</Text>
      {options.map(({ method, label, Icon }) => (
        <Pressable key={method} onPress={() => choose(method)} className="mb-3 active:opacity-80" accessibilityRole="button">
          <Card className="flex-row items-center gap-4 py-5">
            <Icon color={colors.gold} size={22} />
            <Text className="text-base text-ink dark:text-bone">{label}</Text>
          </Card>
        </Pressable>
      ))}
    </ScrollView>
  );
}
