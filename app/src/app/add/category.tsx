import { ActivityIndicator, Pressable, ScrollView, Text } from 'react-native';
import { router } from 'expo-router';
import { Footprints, Package, ShoppingBag, Watch } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useOtherTypes } from '@/api/hooks';
import { Card, Title } from '@/components/ui';
import { useAddDraft, type Category } from '@/features/add/draft';
import { colors } from '@/lib/theme';

const CATS: { value: Category; Icon: typeof Watch }[] = [
  { value: 'watch', Icon: Watch },
  { value: 'handbag', Icon: ShoppingBag },
  { value: 'sneaker', Icon: Footprints },
  { value: 'certified_other', Icon: Package },
];

/** Écran 2 — Catégorie : détermine le contrat documentaire applicable. */
export default function AddCategoryScreen() {
  const { t, i18n } = useTranslation();
  const { method, set, setField, fields } = useAddDraft();
  const otherTypes = useOtherTypes();

  const choose = (category: Category) => {
    set({ category });
    router.push(method === 'qr' ? '/add/scan' : '/add/form');
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Title>{t('v.add.categoryTitle')}</Title>
      <Text className="mb-4" />
      {CATS.map(({ value, Icon }) => {
        if (value === 'certified_other') {
          if (otherTypes.isPending) return <ActivityIndicator key={value} color={colors.gold} />;
          const types = otherTypes.data ?? [];
          if (!types.length) {
            return (
              <Card key={value} className="mb-3 flex-row items-center gap-4 py-5 opacity-50">
                <Icon color={colors.inkGray} size={22} />
                <Text className="flex-1 text-ink-mute dark:text-bone-soft">
                  {t('v.categories.certified_other')} — {t('v.add.noOtherTypes')}
                </Text>
              </Card>
            );
          }
          return types.map((ty) => (
            <Pressable
              key={ty.id}
              onPress={() => { setField('controlled_other_type_id', ty.id); choose('certified_other'); }}
              className="mb-3 active:opacity-80"
            >
              <Card className={`flex-row items-center gap-4 py-5 ${fields.controlled_other_type_id === ty.id ? 'border-gold' : ''}`}>
                <Icon color={colors.gold} size={22} />
                <Text className="text-base text-ink dark:text-bone">{i18n.language === 'fr' ? ty.label_fr : ty.label_en}</Text>
              </Card>
            </Pressable>
          ));
        }
        return (
          <Pressable key={value} onPress={() => choose(value)} className="mb-3 active:opacity-80" accessibilityRole="button">
            <Card className="flex-row items-center gap-4 py-5">
              <Icon color={colors.gold} size={22} />
              <Text className="text-base text-ink dark:text-bone">{t(`v.categories.${value}`)}</Text>
            </Card>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
