import {
  View, Text, TextInput, Pressable, ScrollView, Switch,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { itemSchema, type ItemFormValues } from './schemas';
import { SelectModal } from '@/lib/SelectModal';
import { DatePickerField } from '@/lib/DatePickerField';
import { colors } from '@/lib/theme';
import type { ItemCategory, ItemCondition } from '@/types/database';

const CONDITIONS: ItemCondition[] = ['mint', 'excellent', 'good', 'fair', 'poor'];
const MOVEMENTS = ['automatic', 'manual', 'quartz', 'other'] as const;
const HARDWARE  = ['gold', 'silver', 'rose_gold', 'black', 'other'] as const;
const METALS    = ['gold', 'white_gold', 'rose_gold', 'silver', 'platinum', 'other'] as const;

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

export function ItemForm({ defaultValues, onSubmit, isPending, submitLabel, onDirtyChange, onRegisterSubmit }: Props) {
  const { t } = useTranslation();
  const category = defaultValues.category as ItemCategory;

  const { control, handleSubmit, formState: { errors, isDirty } } = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues,
  });

  useEffect(() => { onDirtyChange?.(isDirty); }, [isDirty, onDirtyChange]);
  useEffect(() => { onRegisterSubmit?.(handleSubmit(onSubmit)); }, [onRegisterSubmit, handleSubmit, onSubmit]);

  const movementLabel: Record<string, string> = {
    automatic: t('itemForm.automatic'),
    manual: t('itemForm.manual'),
    quartz: t('itemForm.quartz'),
    other: t('common.other'),
  };

  const hardwareLabel: Record<string, string> = {
    gold: t('itemForm.gold'),
    silver: t('itemForm.silver'),
    rose_gold: t('itemForm.roseGold'),
    black: t('itemForm.black'),
    other: t('common.other'),
  };

  const metalLabel: Record<string, string> = {
    gold: t('itemForm.goldYellow'),
    white_gold: t('itemForm.goldWhite'),
    rose_gold: t('itemForm.roseGold'),
    silver: t('itemForm.silver'),
    platinum: t('itemForm.platinum'),
    other: t('common.other'),
  };

  const conditionLabel: Record<string, string> = {
    mint: t('item.conditionValues.mint'),
    excellent: t('item.conditionValues.excellent'),
    good: t('item.conditionValues.good'),
    fair: t('item.conditionValues.fair'),
    poor: t('item.conditionValues.poor'),
  };

  const CURRENCY_OPTIONS = [
    { value: 'EUR' as const, label: t('account.currencies.EUR'), short: '€ EUR' },
    { value: 'USD' as const, label: t('account.currencies.USD'), short: '$ USD' },
    { value: 'GBP' as const, label: t('account.currencies.GBP'), short: '£ GBP' },
    { value: 'CHF' as const, label: t('account.currencies.CHF'), short: 'CHF'   },
  ];

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerClassName="px-6 pb-32" keyboardShouldPersistTaps="handled">

        <SectionTitle title={t('itemForm.sectionItem')} />

        <FieldWrap error={errors.name?.message}>
          <Label text={t('itemForm.name')} required />
          <Controller control={control} name="name" render={({ field: { onChange, value } }) => (
            <StyledInput placeholder="Ex : Rolex Daytona" onChangeText={onChange} value={value} />
          )} />
        </FieldWrap>

        <FieldWrap error={errors.brand?.message}>
          <Label text={t('itemForm.brand')} required />
          <Controller control={control} name="brand" render={({ field: { onChange, value } }) => (
            <StyledInput placeholder="Ex : Rolex" onChangeText={onChange} value={value} />
          )} />
        </FieldWrap>

        <FieldWrap error={errors.model?.message}>
          <Label text={t('itemForm.model')} />
          <Controller control={control} name="model" render={({ field: { onChange, value } }) => (
            <StyledInput placeholder="Ex : Cosmograph Daytona" onChangeText={onChange} value={value ?? ''} />
          )} />
        </FieldWrap>

        <FieldWrap error={errors.serial_number?.message}>
          <Label text={t('itemForm.serialNumber')} />
          <Controller control={control} name="serial_number" render={({ field: { onChange, value } }) => (
            <StyledInput placeholder="Ex : 116500LN" onChangeText={onChange} value={value ?? ''} />
          )} />
        </FieldWrap>

        {/* Watch */}
        {category === 'watch' && (
          <>
            <SectionTitle title={t('itemForm.sectionCharacteristics')} />
            <FieldWrap>
              <Label text={t('itemForm.movement')} />
              <Controller control={control} name="metadata.movement" render={({ field: { onChange, value } }) => (
                <Chips options={MOVEMENTS} value={value as string} onChange={onChange} labelMap={movementLabel} />
              )} />
            </FieldWrap>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <FieldWrap>
                  <Label text={t('itemForm.modelRef')} />
                  <Controller control={control} name="metadata.reference" render={({ field: { onChange, value } }) => (
                    <StyledInput placeholder="116500LN" onChangeText={onChange} value={value as string ?? ''} />
                  )} />
                </FieldWrap>
              </View>
              <View className="flex-1">
                <FieldWrap>
                  <Label text={t('itemForm.year')} />
                  <Controller control={control} name="metadata.year" render={({ field: { onChange, value } }) => (
                    <StyledInput placeholder="2022" keyboardType="numeric" onChangeText={(v) => onChange(v ? parseInt(v) : undefined)} value={value ? String(value) : ''} />
                  )} />
                </FieldWrap>
              </View>
            </View>
            <FieldWrap>
              <Label text={t('itemForm.diameter')} />
              <Controller control={control} name="metadata.case_size_mm" render={({ field: { onChange, value } }) => (
                <StyledInput placeholder="40" keyboardType="numeric" onChangeText={(v) => onChange(v ? parseFloat(v) : undefined)} value={value ? String(value) : ''} />
              )} />
            </FieldWrap>
          </>
        )}

        {/* Handbag */}
        {category === 'handbag' && (
          <>
            <SectionTitle title={t('itemForm.sectionCharacteristics')} />
            <FieldWrap>
              <Label text={t('itemForm.material')} />
              <Controller control={control} name="metadata.material" render={({ field: { onChange, value } }) => (
                <StyledInput placeholder="Ex : Togo, Epsom, Caviar…" onChangeText={onChange} value={value as string ?? ''} />
              )} />
            </FieldWrap>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <FieldWrap>
                  <Label text={t('itemForm.color')} />
                  <Controller control={control} name="metadata.color" render={({ field: { onChange, value } }) => (
                    <StyledInput placeholder="Ex : Noir" onChangeText={onChange} value={value as string ?? ''} />
                  )} />
                </FieldWrap>
              </View>
              <View className="flex-1">
                <FieldWrap>
                  <Label text={t('itemForm.size')} />
                  <Controller control={control} name="metadata.size" render={({ field: { onChange, value } }) => (
                    <StyledInput placeholder="Ex : 25, 30…" onChangeText={onChange} value={value as string ?? ''} />
                  )} />
                </FieldWrap>
              </View>
            </View>
            <FieldWrap>
              <Label text={t('itemForm.hardware')} />
              <Controller control={control} name="metadata.hardware_color" render={({ field: { onChange, value } }) => (
                <Chips options={HARDWARE} value={value as string} onChange={onChange} labelMap={hardwareLabel} />
              )} />
            </FieldWrap>
          </>
        )}

        {/* Sneaker */}
        {category === 'sneaker' && (
          <>
            <SectionTitle title={t('itemForm.sectionCharacteristics')} />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <FieldWrap>
                  <Label text={t('itemForm.euSize')} />
                  <Controller control={control} name="metadata.size_eu" render={({ field: { onChange, value } }) => (
                    <StyledInput placeholder="42" keyboardType="numeric" onChangeText={(v) => onChange(v ? parseFloat(v) : undefined)} value={value ? String(value) : ''} />
                  )} />
                </FieldWrap>
              </View>
              <View className="flex-1">
                <FieldWrap>
                  <Label text={t('itemForm.year')} />
                  <Controller control={control} name="metadata.release_year" render={({ field: { onChange, value } }) => (
                    <StyledInput placeholder="2022" keyboardType="numeric" onChangeText={(v) => onChange(v ? parseInt(v) : undefined)} value={value ? String(value) : ''} />
                  )} />
                </FieldWrap>
              </View>
            </View>
            <FieldWrap>
              <Label text={t('itemForm.colorway')} />
              <Controller control={control} name="metadata.colorway" render={({ field: { onChange, value } }) => (
                <StyledInput placeholder="Ex : Chicago / Black Toe" onChangeText={onChange} value={value as string ?? ''} />
              )} />
            </FieldWrap>
          </>
        )}

        {/* Jewelry */}
        {category === 'jewelry' && (
          <>
            <SectionTitle title={t('itemForm.sectionCharacteristics')} />
            <FieldWrap>
              <Label text={t('itemForm.metal')} />
              <Controller control={control} name="metadata.metal" render={({ field: { onChange, value } }) => (
                <Chips options={METALS} value={value as string} onChange={onChange} labelMap={metalLabel} />
              )} />
            </FieldWrap>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <FieldWrap>
                  <Label text={t('itemForm.alloy')} />
                  <Controller control={control} name="metadata.material" render={({ field: { onChange, value } }) => (
                    <StyledInput placeholder="Ex : Or 18 carats" onChangeText={onChange} value={value as string ?? ''} />
                  )} />
                </FieldWrap>
              </View>
              <View className="flex-1">
                <FieldWrap>
                  <Label text={t('itemForm.weight')} />
                  <Controller control={control} name="metadata.weight_g" render={({ field: { onChange, value } }) => (
                    <StyledInput placeholder="5.2" keyboardType="decimal-pad" onChangeText={(v) => onChange(v ? parseFloat(v) : undefined)} value={value ? String(value) : ''} />
                  )} />
                </FieldWrap>
              </View>
            </View>
            <FieldWrap>
              <Label text={t('itemForm.stones')} />
              <Controller control={control} name="metadata.stone" render={({ field: { onChange, value } }) => (
                <StyledInput placeholder="Ex : Diamant 0,5 ct, Rubis" onChangeText={onChange} value={value as string ?? ''} />
              )} />
            </FieldWrap>
          </>
        )}

        <SectionTitle title={t('itemForm.sectionPurchase')} />

        <FieldWrap error={errors.purchase_date?.message}>
          <Label text={t('itemForm.purchaseDate')} />
          <Controller control={control} name="purchase_date" render={({ field: { onChange, value } }) => (
            <DatePickerField value={value} onChange={onChange} />
          )} />
        </FieldWrap>

        <View className="mb-4">
          <Label text={t('itemForm.purchasePrice')} />
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Controller control={control} name="purchase_price" render={({ field: { onChange, value } }) => (
                <StyledInput placeholder="12 000" keyboardType="decimal-pad" onChangeText={(v) => onChange(v ? parseFloat(v) : undefined)} value={value != null ? String(value) : ''} />
              )} />
            </View>
            <View className="w-24">
              <Controller control={control} name="purchase_currency" render={({ field: { onChange, value } }) => (
                <SelectModal
                  value={value}
                  options={CURRENCY_OPTIONS}
                  onChange={onChange}
                  title={t('itemForm.purchaseCurrency')}
                  triggerLabel={CURRENCY_OPTIONS.find((o) => o.value === value)?.short}
                />
              )} />
            </View>
          </View>
          {errors.purchase_price?.message ? (
            <Text className="mt-1 text-xs text-red-400">{errors.purchase_price.message}</Text>
          ) : null}
        </View>

        <SectionTitle title={t('itemForm.sectionCondition')} />

        <FieldWrap error={errors.condition?.message}>
          <Controller control={control} name="condition" render={({ field: { onChange, value } }) => (
            <Chips options={CONDITIONS} value={value} onChange={onChange} labelMap={conditionLabel} />
          )} />
        </FieldWrap>

        <View className="mb-4 flex-row items-center justify-between rounded-xl border border-gray-200 dark:border-ink-mute bg-white dark:bg-ink-soft px-4 py-3">
          <View className="flex-1 mr-3">
            <Text className="text-sm font-medium text-ink dark:text-bone">{t('itemForm.authenticityVerified')}</Text>
            <Text className="text-xs text-ink-mute dark:text-bone-soft mt-0.5">
              {t('itemForm.authenticityHint')}
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
            : <Text className="font-semibold text-ink">{submitLabel ?? t('itemForm.save')}</Text>}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
