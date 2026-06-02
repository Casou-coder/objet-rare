import { Tabs } from 'expo-router';
import { GalleryVerticalEnd, Vault, Plus, User } from 'lucide-react-native';
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
      <Tabs.Screen
        name="collection"
        options={{
          title: t('tabs.collection'),
          tabBarIcon: ({ color, size }) => <GalleryVerticalEnd color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="coffre"
        options={{
          title: t('tabs.coffre'),
          tabBarIcon: ({ color, size }) => <Vault color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="ajouter"
        options={{
          title: t('tabs.add'),
          tabBarIcon: ({ color, size }) => <Plus color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="compte"
        options={{
          title: t('tabs.account'),
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
