import { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '@/stores/auth';
import { colors } from '@/lib/theme';

export default function SignupScreen() {
  const signUp = useAuth((s) => s.signUp);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setLoading(true);
    const { error } = await signUp(email, password);
    setLoading(false);
    if (error) {
      Alert.alert('Inscription impossible', error.message);
    } else {
      Alert.alert('Bienvenue', 'Vérifie ta boîte mail pour confirmer ton compte.');
      router.replace('/(auth)/login');
    }
  };

  return (
    <View className="flex-1 justify-center bg-bone dark:bg-ink px-6">
      <Text className="mb-10 font-serif text-3xl text-ink dark:text-bone">Créer un compte</Text>

      <View className="mb-4">
        <Text className="mb-2 text-ink-mute dark:text-bone-soft">Email</Text>
        <TextInput
          className="rounded-xl border border-gray-200 dark:border-ink-mute bg-white dark:bg-ink-soft px-4 py-3 text-ink dark:text-bone"
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="ton@email.com"
          placeholderTextColor={colors.inkGray}
          value={email}
          onChangeText={setEmail}
        />
      </View>

      <View className="mb-6">
        <Text className="mb-2 text-ink-mute dark:text-bone-soft">Mot de passe</Text>
        <TextInput
          className="rounded-xl border border-gray-200 dark:border-ink-mute bg-white dark:bg-ink-soft px-4 py-3 text-ink dark:text-bone"
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor={colors.inkGray}
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <Pressable
        onPress={onSubmit}
        disabled={loading}
        className="items-center rounded-xl bg-gold py-4 active:opacity-80"
      >
        {loading ? <ActivityIndicator color={colors.ink} /> : <Text className="font-semibold text-ink">S'inscrire</Text>}
      </Pressable>

      <View className="mt-6 flex-row justify-center">
        <Text className="text-ink-mute dark:text-bone-soft">Déjà un compte ? </Text>
        <Link href="/(auth)/login" className="text-gold">
          Se connecter
        </Link>
      </View>
    </View>
  );
}
