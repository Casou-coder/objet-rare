import { useState, useEffect } from 'react';
import { View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack, router, useNavigation } from 'expo-router';
import { ItemForm } from '@/features/items/ItemForm';
import { useCreateItem } from '@/features/items/hooks';
import { categoryLabel } from '@/lib/labels';
import { useBackHeader } from '@/lib/useBackHeader';
import { haptic } from '@/lib/haptics';
import type { ItemCategory } from '@/types/database';
import type { ItemFormValues } from '@/features/items/schemas';

export default function NewItemScreen() {
  const { category } = useLocalSearchParams<{ category: ItemCategory }>();
  const { mutateAsync: createItem, isPending } = useCreateItem();
  const navigation = useNavigation();
  const backHeader = useBackHeader(category ? `Nouveau — ${categoryLabel[category]}` : 'Nouvel objet');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const unsubscribe = (navigation as any).addListener('beforeRemove', (e: any) => {
      if (!isDirty) return;
      e.preventDefault();
      Alert.alert(
        'Abandonner ?',
        'Les informations saisies seront perdues.',
        [
          { text: 'Continuer à éditer', style: 'cancel' },
          { text: 'Abandonner', style: 'destructive', onPress: () => (navigation as any).dispatch(e.data.action) },
        ],
      );
    });
    return unsubscribe;
  }, [navigation, isDirty]);

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
      Alert.alert('Erreur', e.message ?? "Impossible de créer l'objet.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bone dark:bg-ink" edges={['bottom']}>
      <Stack.Screen options={backHeader} />
      <ItemForm
        defaultValues={defaultValues}
        onSubmit={onSubmit}
        isPending={isPending}
        submitLabel="Enregistrer l'objet"
        onDirtyChange={setIsDirty}
      />
    </SafeAreaView>
  );
}
