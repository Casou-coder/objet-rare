import {
  View, Text, TextInput, Pressable, ScrollView, Switch,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { itemSchema, type ItemFormValues } from './schemas';
import { categoryLabel, conditionLabel } from '@/lib/labels';
import { SelectModal } from '@/lib/SelectModal';
import { DatePickerField } from '@/lib/DatePickerField';
import { colors } from '@/lib/theme';
import type { ItemCategory, ItemCondition } from '@/types/database';

const CONDITIONS: ItemCondition[] = ['mint', 'excellent', 'good', 'fair', 'poor'];
const CURRENCY_OPTIONS = [
  { value: 'EUR' as const, label: '€ Euro',            short: '€ EUR' },
  { value: 'USD' as const, label: '$ Dollar américain', short: '$ USD' },
  { value: 'GBP' as const, label: '£ Livre sterling',   short: '£ GBP' },
  { value: 'CHF' as const, label: 'CHF Franc suisse',   short: 'CHF'   },
];
const MOVEMENTS = ['automatic', 'manual', 'quartz', 'other'] as const;
const HARDWARE  = ['gold', 'silver', 'rose_gold', 'black', 'other'] as const;
const METALS    = ['gold', 'white_gold', 'rose_gold', 'silver', 'platinum', 'other'] as const;

const movementLabel: Record<string, string> = {
  automatic: 'Automatique', manual: 'Manuel', quartz: 'Quartz', other: 'Autre',
};
const hardwareLabel: Record<string, string> = {
  gold: 'Or', silver: 'Argent', rose_gold: 'Or rose', black: 'Noir', other: 'Autre',
};
const metalLabel: Record<string, string> = {
  gold: 'Or jaune', white_gold: 'Or blanc', rose_gold: 'Or rose',
  silver: 'Argent', platinum: 'Platine', other: 'Autre',
};

function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <Text className="mb-1.5 text-xs uppercase tracking-wider text-gold">
      {text}{required && <Text className="text-red-400"> *</Text>}
    </Text>
  );
}

function FieldWrap({ error, children }: { error?: string; children: React.ReactNode }) {
  return (
    <View className="mb-4">
      {children}
      {error ? <Text className="mt-1 text-xs text-red-400">{error}</Text> : null}
    </View>
  );
}

function StyledInput(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      placeholderTextColor={colors.inkGray}
      className="rounded-xl border border-gray-200 dark:border-ink-mute bg-white dark:bg-ink-soft px-4 py-3 text-ink dark:text-bone"
      {...props}
    />
  );
}

function Chips<T extends string>({
  options, value, onChange, labelMap,
}: {
  options: readonly T[];
  value: T | undefined;
  onChange: (v: T) => void;
  labelMap?: Record<string, string>;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((o) => (
        <Pressable
          key={o}
          onPress={() => onChange(o)}
          className={`rounded-xl border px-3 py-2 ${value === o ? 'border-gold bg-gold/10' : 'border-gray-200 dark:border-ink-mute bg-white dark:bg-ink-soft'}`}
        >
          <Text className={value === o ? 'text-sm text-gold' : 'text-sm text-ink-mute dark:text-bone-soft'}>
            {labelMap?.[o] ?? o}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text className="mb-4 mt-2 font-serif text-lg text-ink dark:text-bone">{title}</Text>;
}

interface Props {
  defaultValues: ItemFormValues;
  onSubmit: (values: ItemFormValues) => Promise<void>;
  isPending: boolean;
  submitLabel?: string;
  onDirtyChange?: (dirty: boolean) => void;
  onRegisterSubmit?: (fn: () => void) => void;
}

export function ItemForm({ defaultValues, onSubmit, isPending, submitLabel = 'Enregistrer', onDirtyChange, onRegisterSubmit }: Props) {
  const category = defaultValues.category as ItemCategory;

  const { control, handleSubmit, formState: { errors, isDirty } } = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues,
  });

  useEffect(() => { onDirtyChange?.(isDirty); }, [isDirty, onDirtyChange]);
  useEffect(() => { onRegisterSubmit?.(handleSubmit(onSubmit)); }, [onRegisterSubmit, handleSubmit, onSubmit]);

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerClassName="px-6 pb-32" keyboardShouldPersistTaps="handled">

        <SectionTitle title="L'objet" />

        <FieldWrap error={errors.name?.message}>
          <Label text="Nom" required />
          <Controller control={control} name="name" render={({ field: { onChange, value } }) => (
            <StyledInput placeholder="Ex : Rolex Daytona" onChangeText={onChange} value={value} />
          )} />
        </FieldWrap>

        <FieldWrap error={errors.brand?.message}>
          <Label text="Marque" required />
          <Controller control={control} name="brand" render={({ field: { onChange, value } }) => (
            <StyledInput placeholder="Ex : Rolex" onChangeText={onChange} value={value} />
          )} />
        </FieldWrap>

        <FieldWrap error={errors.model?.message}>
          <Label text="Modèle" />
          <Controller control={control} name="model" render={({ field: { onChange, value } }) => (
            <StyledInput placeholder="Ex : Cosmograph Daytona" onChangeText={onChange} value={value ?? ''} />
          )} />
        </FieldWrap>

        <FieldWrap error={errors.serial_number?.message}>
          <Label text="Numéro de série" />
          <Controller control={control} name="serial_number" render={({ field: { onChange, value } }) => (
            <StyledInput placeholder="Ex : 116500LN" onChangeText={onChange} value={value ?? ''} />
          )} />
        </FieldWrap>

        {/* Watch */}
        {category === 'watch' && (
          <>
            <SectionTitle title="Caractéristiques" />
            <FieldWrap>
              <Label text="Mouvement" />
              <Controller control={control} name="metadata.movement" render={({ field: { onChange, value } }) => (
                <Chips options={MOVEMENTS} value={value as string} onChange={onChange} labelMap={movementLabel} />
              )} />
            </FieldWrap>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <FieldWrap>
                  <Label text="Référence modèle" />
                  <Controller control={control} name="metadata.reference" render={({ field: { onChange, value } }) => (
                    <StyledInput placeholder="116500LN" onChangeText={onChange} value={value as string ?? ''} />
                  )} />
                </FieldWrap>
              </View>
              <View className="flex-1">
                <FieldWrap>
                  <Label text="Année" />
                  <Controller control={control} name="metadata.year" render={({ field: { onChange, value } }) => (
                    <StyledInput placeholder="2022" keyboardType="numeric" onChangeText={(t) => onChange(t ? parseInt(t) : undefined)} value={value ? String(value) : ''} />
                  )} />
                </FieldWrap>
              </View>
            </View>
            <FieldWrap>
              <Label text="Diamètre (mm)" />
              <Controller control={control} name="metadata.case_size_mm" render={({ field: { onChange, value } }) => (
                <StyledInput placeholder="40" keyboardType="numeric" onChangeText={(t) => onChange(t ? parseFloat(t) : undefined)} value={value ? String(value) : ''} />
              )} />
            </FieldWrap>
          </>
        )}

        {/* Handbag */}
        {category === 'handbag' && (
          <>
            <SectionTitle title="Caractéristiques" />
            <FieldWrap>
              <Label text="Matière" />
              <Controller control={control} name="metadata.material" render={({ field: { onChange, value } }) => (
                <StyledInput placeholder="Ex : Togo, Epsom, Caviar…" onChangeText={onChange} value={value as string ?? ''} />
              )} />
            </FieldWrap>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <FieldWrap>
                  <Label text="Couleur" />
                  <Controller control={control} name="metadata.color" render={({ field: { onChange, value } }) => (
                    <StyledInput placeholder="Ex : Noir" onChangeText={onChange} value={value as string ?? ''} />
                  )} />
                </FieldWrap>
              </View>
              <View className="flex-1">
                <FieldWrap>
                  <Label text="Taille" />
                  <Controller control={control} name="metadata.size" render={({ field: { onChange, value } }) => (
                    <StyledInput placeholder="Ex : 25, 30…" onChangeText={onChange} value={value as string ?? ''} />
                  )} />
                </FieldWrap>
              </View>
            </View>
            <FieldWrap>
              <Label text="Quincaillerie" />
              <Controller control={control} name="metadata.hardware_color" render={({ field: { onChange, value } }) => (
                <Chips options={HARDWARE} value={value as string} onChange={onChange} labelMap={hardwareLabel} />
              )} />
            </FieldWrap>
          </>
        )}

        {/* Sneaker */}
        {category === 'sneaker' && (
          <>
            <SectionTitle title="Caractéristiques" />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <FieldWrap>
                  <Label text="Pointure EU" />
                  <Controller control={control} name="metadata.size_eu" render={({ field: { onChange, value } }) => (
                    <StyledInput placeholder="42" keyboardType="numeric" onChangeText={(t) => onChange(t ? parseFloat(t) : undefined)} value={value ? String(value) : ''} />
                  )} />
                </FieldWrap>
              </View>
              <View className="flex-1">
                <FieldWrap>
                  <Label text="Année" />
                  <Controller control={control} name="metadata.release_year" render={({ field: { onChange, value } }) => (
                    <StyledInput placeholder="2022" keyboardType="numeric" onChangeText={(t) => onChange(t ? parseInt(t) : undefined)} value={value ? String(value) : ''} />
                  )} />
                </FieldWrap>
              </View>
            </View>
            <FieldWrap>
              <Label text="Colorway" />
              <Controller control={control} name="metadata.colorway" render={({ field: { onChange, value } }) => (
                <StyledInput placeholder="Ex : Chicago / Black Toe" onChangeText={onChange} value={value as string ?? ''} />
              )} />
            </FieldWrap>
          </>
        )}

        {/* Jewelry */}
        {category === 'jewelry' && (
          <>
            <SectionTitle title="Caractéristiques" />
            <FieldWrap>
              <Label text="Métal" />
              <Controller control={control} name="metadata.metal" render={({ field: { onChange, value } }) => (
                <Chips options={METALS} value={value as string} onChange={onChange} labelMap={metalLabel} />
              )} />
            </FieldWrap>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <FieldWrap>
                  <Label text="Matière / Alliage" />
                  <Controller control={control} name="metadata.material" render={({ field: { onChange, value } }) => (
                    <StyledInput placeholder="Ex : Or 18 carats" onChangeText={onChange} value={value as string ?? ''} />
                  )} />
                </FieldWrap>
              </View>
              <View className="flex-1">
                <FieldWrap>
                  <Label text="Poids (g)" />
                  <Controller control={control} name="metadata.weight_g" render={({ field: { onChange, value } }) => (
                    <StyledInput placeholder="5.2" keyboardType="decimal-pad" onChangeText={(t) => onChange(t ? parseFloat(t) : undefined)} value={value ? String(value) : ''} />
                  )} />
                </FieldWrap>
              </View>
            </View>
            <FieldWrap>
              <Label text="Pierre(s)" />
              <Controller control={control} name="metadata.stone" render={({ field: { onChange, value } }) => (
                <StyledInput placeholder="Ex : Diamant 0,5 ct, Rubis" onChangeText={onChange} value={value as string ?? ''} />
              )} />
            </FieldWrap>
          </>
        )}

        <SectionTitle title="Achat" />

        <FieldWrap error={errors.purchase_date?.message}>
          <Label text="Date d'achat" />
          <Controller control={control} name="purchase_date" render={({ field: { onChange, value } }) => (
            <DatePickerField value={value} onChange={onChange} />
          )} />
        </FieldWrap>

        <View className="mb-4">
          <Label text="Prix payé" />
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Controller control={control} name="purchase_price" render={({ field: { onChange, value } }) => (
                <StyledInput placeholder="12 000" keyboardType="decimal-pad" onChangeText={(t) => onChange(t ? parseFloat(t) : undefined)} value={value != null ? String(value) : ''} />
              )} />
            </View>
            <View className="w-24">
              <Controller control={control} name="purchase_currency" render={({ field: { onChange, value } }) => (
                <SelectModal
                  value={value}
                  options={CURRENCY_OPTIONS}
                  onChange={onChange}
                  title="Devise d'achat"
                  triggerLabel={CURRENCY_OPTIONS.find((o) => o.value === value)?.short}
                />
              )} />
            </View>
          </View>
          {errors.purchase_price?.message ? (
            <Text className="mt-1 text-xs text-red-400">{errors.purchase_price.message}</Text>
          ) : null}
        </View>

        <SectionTitle title="État" />

        <FieldWrap error={errors.condition?.message}>
          <Controller control={control} name="condition" render={({ field: { onChange, value } }) => (
            <Chips options={CONDITIONS} value={value} onChange={onChange} labelMap={conditionLabel} />
          )} />
        </FieldWrap>

        <View className="mb-4 flex-row items-center justify-between rounded-xl border border-gray-200 dark:border-ink-mute bg-white dark:bg-ink-soft px-4 py-3">
          <View className="flex-1 mr-3">
            <Text className="text-sm font-medium text-ink dark:text-bone">Authenticité vérifiée</Text>
            <Text className="text-xs text-ink-mute dark:text-bone-soft mt-0.5">
              Certificat, facture ou expertise confirmant l'origine
            </Text>
          </View>
          <Controller control={control} name="is_authenticated" render={({ field: { onChange, value } }) => (
            <Switch
              value={value ?? false}
              onValueChange={onChange}
              trackColor={{ false: '#D1D5DB', true: colors.gold }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#D1D5DB"
            />
          )} />
        </View>

      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 border-t border-gray-200 dark:border-ink-mute bg-bone dark:bg-ink px-6 pb-8 pt-4">
        <Pressable
          onPress={handleSubmit(onSubmit)}
          disabled={isPending}
          className="items-center rounded-xl bg-gold py-4 active:opacity-80"
        >
          {isPending
            ? <ActivityIndicator color={colors.ink} />
            : <Text className="font-semibold text-ink">{submitLabel}</Text>}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
