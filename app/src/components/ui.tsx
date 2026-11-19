import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { colors } from '@/lib/theme';
import { isApiError } from '@/api/client';

export function Title({ children }: { children: ReactNode }) {
  return <Text className="font-serif text-3xl text-ink dark:text-bone">{children}</Text>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text className="mb-3 mt-6 text-xs uppercase tracking-wider text-gold">{children}</Text>;
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <View className={`rounded-2xl border border-gray-200 bg-white p-4 dark:border-ink-mute dark:bg-ink-soft ${className}`}>
      {children}
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'link';
  loading?: boolean;
  disabled?: boolean;
}) {
  const base = 'items-center rounded-xl py-4 active:opacity-80';
  const cls =
    variant === 'primary'
      ? `${base} bg-gold`
      : variant === 'danger'
        ? `${base} border border-red-500`
        : variant === 'secondary'
          ? `${base} border border-gold`
          : 'items-center py-3 active:opacity-60';
  const text =
    variant === 'primary'
      ? 'font-semibold text-ink'
      : variant === 'danger'
        ? 'font-medium text-red-500'
        : variant === 'secondary'
          ? 'font-medium text-gold'
          : 'text-ink-mute dark:text-bone-soft';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      className={`${cls} ${disabled ? 'opacity-40' : ''}`}
    >
      {loading ? <ActivityIndicator color={variant === 'primary' ? colors.ink : colors.gold} /> : <Text className={text}>{label}</Text>}
    </Pressable>
  );
}

export function Field({ label, error, optional, ...props }: TextInputProps & { label: string; error?: string; optional?: boolean }) {
  const { t } = useTranslation();
  return (
    <View className="mb-4">
      <Text className="mb-2 text-ink-mute dark:text-bone-soft">
        {label}
        {optional ? <Text className="text-xs"> ({t('v.common.optional')})</Text> : null}
      </Text>
      <TextInput
        className={`rounded-xl border bg-white px-4 py-3 text-ink dark:bg-ink-soft dark:text-bone ${
          error ? 'border-red-500' : 'border-gray-200 dark:border-ink-mute'
        }`}
        placeholderTextColor={colors.inkGray}
        {...props}
      />
      {error ? <Text className="mt-1 text-sm text-red-500">{error}</Text> : null}
    </View>
  );
}

export function Chips<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T | null;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <View className="mb-4 flex-row flex-wrap gap-2">
      {options.map((o) => (
        <Pressable
          key={o.value}
          onPress={() => onChange(o.value)}
          className={`rounded-full border px-4 py-2 ${
            value === o.value ? 'border-gold bg-gold/10' : 'border-gray-200 dark:border-ink-mute'
          }`}
        >
          <Text className={value === o.value ? 'text-gold' : 'text-ink dark:text-bone'}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Message d'erreur neutre traduit depuis le code API figé. */
export function useErrorMessage() {
  const { t } = useTranslation();
  return (e: unknown, fallback?: string) => {
    if (isApiError(e)) {
      if (e.code === 'DUPLICATE_CERTIFICATE' && e.message.startsWith('Ce document')) return t('v.errors.DUPLICATE_DOCUMENT');
      return t(`v.errors.${e.code}`, { defaultValue: fallback ?? t('v.errors.INTERNAL') });
    }
    return fallback ?? t('v.errors.INTERNAL');
  };
}

/** État d'erreur sobre avec « Réessayer » (pas de spinner plein écran). */
export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <View className="items-center px-6 py-16">
      <Text className="mb-4 text-center text-ink-mute dark:text-bone-soft">{message}</Text>
      <Button label={t('v.common.retry')} variant="secondary" onPress={onRetry} />
    </View>
  );
}

export function EmptyState({ message, cta, onPress }: { message: string; cta?: string; onPress?: () => void }) {
  return (
    <View className="items-center px-6 py-16">
      <Text className="mb-6 text-center text-ink-mute dark:text-bone-soft">{message}</Text>
      {cta && onPress ? <Button label={cta} onPress={onPress} /> : null}
    </View>
  );
}

/** Placeholders neutres (Page ma collection : « pas de skeleton agressif »). */
export function Placeholders({ count = 4, height = 160, columns = 2 }: { count?: number; height?: number; columns?: number }) {
  return (
    <View className="flex-row flex-wrap" style={{ gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          className="rounded-2xl bg-gray-100 dark:bg-ink-soft"
          style={{ height, width: columns === 1 ? '100%' : '48%' }}
        />
      ))}
    </View>
  );
}

/** Image d'objet, ou placeholder neutre avec le nom visible (Page ma collection §7). */
export function ItemImage({ uri, name, size }: { uri?: string | null; name: string; size: number }) {
  if (uri) {
    return <Image source={{ uri }} style={{ width: '100%', height: size, borderRadius: 16 }} contentFit="cover" cachePolicy="none" />;
  }
  return (
    <View className="items-center justify-center rounded-2xl bg-bone-soft dark:bg-ink-mute" style={{ height: size, width: '100%' }}>
      <Text className="font-serif text-3xl text-ink-mute dark:text-bone-soft">{name.trim().charAt(0).toUpperCase()}</Text>
    </View>
  );
}
