import { useState, useEffect } from 'react';
import { View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack, router, useNavigation } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ItemForm } from '@/features/items/ItemForm';
import { useCreateItem } from '@/features/items/hooks';
import { useBackHeader } from '@/lib/useBackHeader';
import { haptic } from '@/lib/haptics';
import type { ItemCategory } from '@/types/database';
import type { ItemFormValues } from '@/features/items/schemas';

export default function NewItemScreen() {
  const { t } = useTranslation();
  const { category } = useLocalSearchParams<{ category: ItemCategory }>();
  const { mutateAsync: createItem, isPending } = useCreateItem();
  const navigation = useNavigation();
  const title = category ? t('item.newTitleCategory', { category: t(`item.categories.${category}`) }) : t('item.newTitle');
  const backHeader = useBackHeader(title);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const unsubscribe = (navigation as any).addListener('beforeRemove', (e: any) => {
      if (!isDirty) return;
      e.preventDefault();
      Alert.alert(
        t('item.discardTitle'),
        t('item.discardMsg'),
        [
          { text: t('item.keepEditing'), style: 'cancel' },
          { text: t('item.discard'), style: 'destructive', onPress: () => (navigation as any).dispatch(e.data.action) },
        ],
      );
    });
    return unsubscribe;
  }, [navigation, isDirty, t]);

  const defaultValues: ItemFormValues = {
    category: category ?? 'other',
    name: '',
    brand: '',
    condition: 'excellent',
    purchase_currency: 'EUR',
    is_authenticated: false,
    metadata: {},
  } as ItemFormValues;

  const onSubmit = async (values: ItemFormValues) => {
    try {
      const item = await createItem(values);
      haptic.success();
      setIsDirty(false);
      router.replace(`/item/${item.id}`);
    } catch (e: any) {
      haptic.error();
      Alert.alert(t('common.error'), e.message ?? t('item.createError'));
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bone dark:bg-ink" edges={['bottom']}>
      <Stack.Screen options={backHeader} />
      <ItemForm
        defaultValues={defaultValues}
        onSubmit={onSubmit}
        isPending={isPending}
        submitLabel={t('item.saveItem')}
        onDirtyChange={setIsDirty}
      />
    </SafeAreaView>
  );
}
