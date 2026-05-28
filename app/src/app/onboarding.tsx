import { useRef, useState } from 'react';
import { View, Text, Pressable, FlatList, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BookOpen, Archive, Crown, Bell, BarChart2 } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as TrackingTransparency from 'expo-tracking-transparency';
import { requestNotificationPermission } from '@/lib/notifications';
import { colors } from '@/lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type SlideKind = 'info' | 'notifications' | 'tracking';

type Slide = {
  kind: SlideKind;
  icon: React.ComponentType<{ color: string; size: number }>;
  title: string;
  body: string;
  primaryLabel?: string;
  skipLabel?: string;
};

const SLIDES: Slide[] = [
  {
    kind: 'info',
    icon: BookOpen,
    title: 'Ta collection,\ntoujours avec toi',
    body: 'Catalogue chaque objet précieux avec sa photo, ses informations et ses documents en quelques secondes.',
  },
  {
    kind: 'info',
    icon: Archive,
    title: 'Tous tes documents\nen un seul endroit',
    body: "Factures, certificats d'authenticité, garanties — accessibles en un instant, protégés et privés.",
  },
  {
    kind: 'info',
    icon: Crown,
    title: 'Prouve la valeur\nde chaque objet',
    body: "Génère un passeport digital pour chaque pièce. Parfait pour la revente, le prêt ou l'assurance.",
  },
  {
    kind: 'notifications',
    icon: Bell,
    title: 'Ne rate aucune\nexpiration',
    body: "Objet Rare t'avertit 30 jours et 7 jours avant l'expiration d'une garantie, pour que tu ne sois jamais pris de court.",
    primaryLabel: 'Activer les notifications',
    skipLabel: 'Plus tard',
  },
  {
    kind: 'tracking',
    icon: BarChart2,
    title: "Aide-nous à\naméliorer l'app",
    body: "Des données anonymes et agrégées nous permettent de comprendre comment l'app est utilisée et de la faire évoluer dans la bonne direction.\n\nAucune donnée personnelle, aucune revente.",
    primaryLabel: 'Autoriser',
    skipLabel: 'Refuser',
  },
];

async function finishOnboarding() {
  await AsyncStorage.setItem('@onboarding_done', '1');
  router.replace('/(auth)/login');
}

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const [isPending, setIsPending] = useState(false);
  const listRef = useRef<FlatList>(null);
  const slide = SLIDES[index]!;

  const advance = () => {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    } else {
      finishOnboarding();
    }
  };

  const handlePrimary = async () => {
    setIsPending(true);
    try {
      if (slide.kind === 'notifications') {
        await requestNotificationPermission();
      } else if (slide.kind === 'tracking') {
        await TrackingTransparency.requestTrackingPermissionsAsync();
        await finishOnboarding();
        return;
      }
    } finally {
      setIsPending(false);
    }
    advance();
  };

  const handleSkip = () => {
    if (slide.kind === 'tracking') {
      finishOnboarding();
    } else {
      advance();
    }
  };
  const isPermissionSlide = slide.kind !== 'info';
  const isLastInfoSlide = slide.kind === 'info' && index === SLIDES.filter(s => s.kind === 'info').length - 1;

  return (
    <SafeAreaView className="flex-1 bg-bone dark:bg-ink" edges={['top', 'bottom']}>
      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        keyExtractor={(_, i) => String(i)}
        onMomentumScrollEnd={(e) => {
          setIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH));
        }}
        renderItem={({ item }) => {
          const Icon = item.icon;
          return (
            <View style={{ width: SCREEN_WIDTH }} className="flex-1 items-center justify-center px-10">
              <View className="mb-8 h-24 w-24 items-center justify-center rounded-full bg-gold/10 border border-gold/30">
                <Icon color={colors.gold} size={40} />
              </View>
              <Text className="mb-4 text-center font-serif text-3xl text-ink dark:text-bone leading-tight">
                {item.title}
              </Text>
              <Text className="text-center text-base text-ink-mute dark:text-bone-soft leading-relaxed">
                {item.body}
              </Text>
            </View>
          );
        }}
      />

      {/* Pagination dots */}
      <View className="flex-row items-center justify-center gap-2 mb-6">
        {SLIDES.map((_, i) => (
          <View
            key={i}
            className={`rounded-full ${i === index ? 'h-2 w-6 bg-gold' : 'h-2 w-2 bg-gray-300 dark:bg-ink-mute'}`}
          />
        ))}
      </View>

      <View className="px-6 pb-4 gap-3">
        <Pressable
          onPress={handlePrimary}
          disabled={isPending}
          className="items-center rounded-xl bg-gold py-4 active:opacity-80"
        >
          {isPending
            ? <ActivityIndicator color={colors.ink} />
            : <Text className="font-semibold text-base text-ink">
                {isPermissionSlide ? slide.primaryLabel : isLastInfoSlide ? 'Continuer' : 'Suivant'}
              </Text>
          }
        </Pressable>

        {isPermissionSlide && (
          <Pressable onPress={handleSkip} className="items-center py-2">
            <Text className="text-sm text-ink-mute dark:text-bone-soft">{slide.skipLabel}</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}
