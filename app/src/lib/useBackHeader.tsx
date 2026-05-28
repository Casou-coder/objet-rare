import { Pressable } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { colors } from './theme';

export function useBackHeader(title: string) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  return {
    headerShown: true,
    title,
    headerBackVisible: false,
    headerLeft: () => (
      <Pressable onPress={() => router.back()} hitSlop={8} className="mr-2">
        <ChevronLeft color={isDark ? colors.bone : colors.ink} size={26} />
      </Pressable>
    ),
    headerStyle: { backgroundColor: isDark ? colors.ink : colors.bone },
    headerTitleStyle: { color: isDark ? colors.bone : colors.ink, fontSize: 16 },
    headerShadowVisible: false,
  } as const;
}
