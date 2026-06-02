import { useState, useEffect, useRef } from 'react';
import { View, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack, router, useNavigation } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ItemForm } from '@/features/items/ItemForm';
import { useItem, useUpdateItem } from '@/features/items/hooks';
import { useBackHeader } from '@/lib/useBackHeader';
import { colors } from '@/lib/theme';
import { haptic } from '@/lib/haptics';
import type { ItemFormValues } from '@/features/items/schemas';

export default function EditItemScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: item, isLoading } = useItem(id);
  const { mutateAsync: updateItem, isPending } = useUpdateItem(id ?? '');
  const navigation = useNavigation();
  const backHeader = useBackHeader(t('item.editTitle'));
  const [isDirty, setIsDirty] = useState(false);
  const submitRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsubscribe = (navigation as any).addListener('beforeRemove', (e: any) => {
      if (!isDirty) return;
      e.preventDefault();
      Alert.alert(
        t('item.unsavedTitle'),
        t('item.unsavedMsg'),
        [
          { text: t('item.keepEditing'), style: 'cancel' },
          { text: t('item.saveChanges'), onPress: () => submitRef.current?.() },
          { text: t('item.discardChanges'), style: 'destructive', onPress: () => (navigation as any).dispatch(e.data.action) },
        ],
      );
    });
    return unsubscribe;
  }, [navigation, isDirty, t]);

  const onSubmit = async (values: ItemFormValues) => {
    try {
      await updateItem(values);
      haptic.success();
      setIsDirty(false);
      router.back();
    } catch (e: any) {
      haptic.error();
      Alert.alert(t('common.error'), e.message ?? t('item.updateError'));
    }
  };

  if (isLoading || !item) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-bone dark:bg-ink">
        <ActivityIndicator color={colors.gold} />
      </SafeAreaView>
    );
  }

  const defaultValues: ItemFormValues = {
    category: item.category,
    name: item.name,
    brand: item.brand,
    model: item.model ?? undefined,
    serial_number: item.serial_number ?? undefined,
    purchase_date: item.purchase_date ?? undefined,
    purchase_price: item.purchase_price ?? undefined,
    purchase_currency: (item.purchase_currency as any) ?? 'EUR',
    condition: item.condition,
    is_authenticated: item.is_authenticated ?? false,
    metadata: item.metadata ?? {},
  } as ItemFormValues;

  return (
    <SafeAreaView className="flex-1 bg-bone dark:bg-ink" edges={['bottom']}>
      <Stack.Screen options={backHeader} />
      <ItemForm
        defaultValues={defaultValues}
        onSubmit={onSubmit}
        isPending={isPending}
        submitLabel={t('item.saveChangesBtn')}
        onDirtyChange={setIsDirty}
        onRegisterSubmit={(fn) => { submitRef.current = fn; }}
      />
    </SafeAreaView>
  );
}
