import { Tabs } from 'expo-router';
import { FileText, GalleryVerticalEnd, User, Vault } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useTranslation } from 'react-i18next';
import { colors } from '@/lib/theme';

export default function TabsLayout() {
  const { colorScheme } = useColorScheme();
  const { t } = useTranslation();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: isDark ? colors.inkGray : colors.inkMute,
        tabBarStyle: {
          backgroundColor: isDark ? colors.ink : colors.bone,
          borderTopColor: isDark ? colors.inkSoft : '#E5E7EB',
        },
      }}
    >
      <Tabs.Screen name="collection" options={{ title: t('v.tabs.collection'), tabBarIcon: ({ color, size }) => <GalleryVerticalEnd color={color} size={size} /> }} />
      <Tabs.Screen name="coffre" options={{ title: t('v.tabs.vault'), tabBarIcon: ({ color, size }) => <Vault color={color} size={size} /> }} />
      <Tabs.Screen name="documents" options={{ title: t('v.tabs.documents'), tabBarIcon: ({ color, size }) => <FileText color={color} size={size} /> }} />
      <Tabs.Screen name="compte" options={{ title: t('v.tabs.account'), tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }} />
    </Tabs>
  );
}
