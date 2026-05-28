import { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';
import { colors } from './theme';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
  title?: string;
  triggerLabel?: string;
}

export function SelectModal<T extends string>({ value, options, onChange, title, triggerLabel }: Props<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  const pick = (v: T) => {
    onChange(v);
    setOpen(false);
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className="flex-row items-center justify-between rounded-xl border border-gray-200 dark:border-ink-mute bg-white dark:bg-ink-soft px-4 py-3 active:opacity-70"
      >
        <Text className="flex-1 text-ink dark:text-bone" numberOfLines={1}>{triggerLabel ?? selected?.label ?? value}</Text>
        <ChevronDown color={colors.inkGray} size={16} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View className="flex-1 justify-end bg-black/60">
          <Pressable className="absolute inset-0" onPress={() => setOpen(false)} />
          <View className="rounded-t-3xl bg-white dark:bg-ink-soft px-6 pb-10 pt-4">
            <View className="mb-4 h-1 w-10 self-center rounded-full bg-gray-200 dark:bg-ink-mute" />
            {title && (
              <Text className="mb-4 font-serif text-lg text-ink dark:text-bone">{title}</Text>
            )}
            <ScrollView>
              {options.map((o) => (
                <Pressable
                  key={o.value}
                  onPress={() => pick(o.value)}
                  className="flex-row items-center justify-between border-b border-gray-100 dark:border-ink-mute py-4 last:border-0 active:opacity-70"
                >
                  <Text className={`text-base ${o.value === value ? 'font-semibold text-gold' : 'text-ink dark:text-bone'}`}>
                    {o.label}
                  </Text>
                  {o.value === value && <Check color={colors.gold} size={18} />}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
