import { Stack } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { colors } from '@/lib/theme';

export default function AuthLayout() {
  const { colorScheme } = useColorScheme();
  return (
    <Stack screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: colorScheme === 'dark' ? colors.ink : colors.bone },
    }} />
  );
}
