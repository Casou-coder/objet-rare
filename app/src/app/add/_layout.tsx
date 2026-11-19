import { Stack } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { colors } from '@/lib/theme';

export default function AddLayout() {
  const { colorScheme } = useColorScheme();
  const dark = colorScheme === 'dark';
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitle: '',
        headerShadowVisible: false,
        headerTintColor: dark ? colors.bone : colors.ink,
        headerStyle: { backgroundColor: dark ? colors.ink : colors.bone },
        contentStyle: { backgroundColor: dark ? colors.ink : colors.bone },
      }}
    />
  );
}
