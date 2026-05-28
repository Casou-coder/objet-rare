import { Tabs } from 'expo-router';
import { GalleryVerticalEnd, Vault, Plus, User } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { colors } from '@/lib/theme';

export default function TabsLayout() {
  const { colorScheme } = useColorScheme();
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
          title: 'Collection',
          tabBarIcon: ({ color, size }) => <GalleryVerticalEnd color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="coffre"
        options={{
          title: 'Coffre',
          tabBarIcon: ({ color, size }) => <Vault color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="ajouter"
        options={{
          title: 'Ajouter',
          tabBarIcon: ({ color, size }) => <Plus color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="compte"
        options={{
          title: 'Mon compte',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
