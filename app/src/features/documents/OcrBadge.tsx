import { View, Text } from 'react-native';
import { CheckCircle, XCircle, Clock } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '@/lib/theme';
import type { OcrStatus } from '@/types/database';

export function OcrBadge({ status, size = 12 }: { status: OcrStatus; size?: number }) {
  const { t } = useTranslation();
  if (status === 'done')
    return (
      <View className="flex-row items-center gap-1">
        <CheckCircle color="#22C55E" size={size} />
        <Text className="text-xs text-green-500">{t('ocr.done')}</Text>
      </View>
    );
  if (status === 'failed')
    return (
      <View className="flex-row items-center gap-1">
        <XCircle color="#EF4444" size={size} />
        <Text className="text-xs text-red-400">{t('ocr.failed')}</Text>
      </View>
    );
  return (
    <View className="flex-row items-center gap-1">
      <Clock color="#D97706" size={size} />
      <Text className="text-xs text-amber-600">{t('ocr.pending')}</Text>
    </View>
  );
}
