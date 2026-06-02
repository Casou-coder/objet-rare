import { useRef, useState } from 'react';
import { View, Text, Pressable, FlatList, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BookOpen, Archive, Crown, Bell, BarChart2 } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as TrackingTransparency from 'expo-tracking-transparency';
import { useTranslation } from 'react-i18next';
import { requestNotificationPermission } from '@/lib/notifications';
import { colors } from '@/lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type SlideKind = 'info' | 'notifications' | 'tracking';

async function finishOnboarding() {
  await AsyncStorage.setItem('@onboarding_done', '1');
  router.replace('/(auth)/login');
}

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [isPending, setIsPending] = useState(false);
  const listRef = useRef<FlatList>(null);

  const SLIDES = [
    { kind: 'info' as SlideKind,          icon: BookOpen, title: t('onboarding.slide1Title'), body: t('onboarding.slide1Body') },
    { kind: 'info' as SlideKind,          icon: Archive,  title: t('onboarding.slide2Title'), body: t('onboarding.slide2Body') },
    { kind: 'info' as SlideKind,          icon: Crown,    title: t('onboarding.slide3Title'), body: t('onboarding.slide3Body') },
    { kind: 'notifications' as SlideKind, icon: Bell,     title: t('onboarding.slide4Title'), body: t('onboarding.slide4Body'), primaryLabel: t('onboarding.notifTitle'), skipLabel: t('onboarding.notifLater') },
    { kind: 'tracking' as SlideKind,      icon: BarChart2,title: t('onboarding.trackingTitle'), body: t('onboarding.trackingBody'), primaryLabel: t('onboarding.allow'), skipLabel: t('onboarding.decline') },
  ];

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
                {isPermissionSlide ? slide.primaryLabel : isLastInfoSlide ? t('common.continue') : t('common.next')}
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
