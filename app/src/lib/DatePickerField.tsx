import { useState } from 'react';
import { View, Text, Pressable, Modal, Platform } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { CalendarDays } from 'lucide-react-native';
import { colors } from './theme';

interface Props {
  value: string | undefined;
  onChange: (iso: string | undefined) => void;
  placeholder?: string;
  maximumDate?: Date;
  minimumDate?: Date;
}

function isoToDate(iso: string): Date {
  // Force midnight local time to avoid UTC offset shifting the day
  return new Date(`${iso}T00:00:00`);
}

function dateToIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDisplay(iso: string): string {
  return isoToDate(iso).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export function DatePickerField({
  value, onChange, placeholder = 'Sélectionner une date',
  maximumDate = new Date(), minimumDate,
}: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Date>(value ? isoToDate(value) : new Date());

  const current = value ? isoToDate(value) : new Date();

  // Android: picker renders as native dialog, no wrapping modal needed
  if (Platform.OS === 'android') {
    return (
      <>
        <Trigger value={value} onPress={() => setOpen(true)} placeholder={placeholder} />
        {open && (
          <DateTimePicker
            mode="date"
            display="default"
            value={current}
            maximumDate={maximumDate}
            minimumDate={minimumDate}
            onChange={(e: DateTimePickerEvent, d?: Date) => {
              setOpen(false);
              if (e.type === 'set' && d) onChange(dateToIso(d));
            }}
          />
        )}
      </>
    );
  }

  // iOS: spinner inside a bottom-sheet modal
  return (
    <>
      <Trigger value={value} onPress={() => { setDraft(current); setOpen(true); }} placeholder={placeholder} />

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View className="flex-1 justify-end bg-black/60">
          <Pressable className="absolute inset-0" onPress={() => setOpen(false)} />
          <View className="rounded-t-3xl bg-white dark:bg-ink-soft px-6 pb-10 pt-4">
            <View className="mb-2 h-1 w-10 self-center rounded-full bg-gray-200 dark:bg-ink-mute" />
            <Text className="mb-2 font-serif text-lg text-ink dark:text-bone">Date</Text>

            <DateTimePicker
              mode="date"
              display="spinner"
              value={draft}
              maximumDate={maximumDate}
              minimumDate={minimumDate}
              locale="fr-FR"
              onChange={(_: DateTimePickerEvent, d?: Date) => { if (d) setDraft(d); }}
              style={{ height: 180 }}
            />

            <View className="flex-row gap-3 mt-2">
              <Pressable
                onPress={() => setOpen(false)}
                className="flex-1 items-center rounded-xl border border-gray-200 dark:border-ink-mute py-3 active:opacity-70"
              >
                <Text className="text-ink-mute dark:text-bone-soft">Annuler</Text>
              </Pressable>
              <Pressable
                onPress={() => { onChange(dateToIso(draft)); setOpen(false); }}
                className="flex-1 items-center rounded-xl bg-gold py-3 active:opacity-80"
              >
                <Text className="font-semibold text-ink">Confirmer</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function Trigger({ value, onPress, placeholder }: { value: string | undefined; onPress: () => void; placeholder: string }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between rounded-xl border border-gray-200 dark:border-ink-mute bg-white dark:bg-ink-soft px-4 py-3 active:opacity-70"
    >
      <Text className={value ? 'text-ink dark:text-bone' : 'text-ink-mute dark:text-bone-soft'}>
        {value ? formatDisplay(value) : placeholder}
      </Text>
      <CalendarDays color={colors.inkGray} size={16} />
    </Pressable>
  );
}
