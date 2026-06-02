import { useRef, useState } from 'react';
import { View, Text, Pressable, FlatList, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  BookOpen, Archive, Shield, ScanLine, Eye, Crown, CheckCircle, XCircle, Clock,
} from 'lucide-react-native';
import { colors } from '@/lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Slide = {
  icon: React.ComponentType<{ color: string; size: number }>;
  title: string;
  body: string;
  detail?: React.ReactNode;
};

function OcrRow({
  icon: Icon, color, label, description,
}: {
  icon: React.ComponentType<{ color: string; size: number }>;
  color: string;
  label: string;
  description: string;
}) {
  return (
    <View className="flex-row items-start gap-3 mb-3">
      <View className="mt-0.5">
        <Icon color={color} size={16} />
      </View>
      <View className="flex-1">
        <Text style={{ color }} className="text-sm font-semibold mb-0.5">{label}</Text>
        <Text className="text-sm text-ink-mute dark:text-bone-soft leading-snug">{description}</Text>
      </View>
    </View>
  );
}

export default function TutorialScreen() {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  const SLIDES: Slide[] = [
    {
      icon: BookOpen,
      title: t('tutorial.slide1Title'),
      body: t('tutorial.slide1Body'),
    },
    {
      icon: Shield,
      title: t('tutorial.slide2Title'),
      body: t('tutorial.slide2Body'),
    },
    {
      icon: Archive,
      title: t('tutorial.slide3Title'),
      body: t('tutorial.slide3Body'),
    },
    {
      icon: ScanLine,
      title: t('tutorial.slide4Title'),
      body: t('tutorial.slide4Body'),
      detail: (
        <View className="mt-4 w-full rounded-xl bg-gold/5 border border-gold/20 px-4 py-3">
          <OcrRow
            icon={Clock}
            color="#D97706"
            label={t('tutorial.ocrPending')}
            description={t('tutorial.ocrPendingDesc')}
          />
          <OcrRow
            icon={CheckCircle}
            color={colors.gold}
            label={t('tutorial.ocrDone')}
            description={t('tutorial.ocrDoneDesc')}
          />
          <OcrRow
            icon={XCircle}
            color="#EF4444"
            label={t('tutorial.ocrFailed')}
            description={t('tutorial.ocrFailedDesc')}
          />
        </View>
      ),
    },
    {
      icon: Eye,
      title: t('tutorial.slide5Title'),
      body: t('tutorial.slide5Body'),
    },
    {
      icon: Crown,
      title: t('tutorial.slide6Title'),
      body: t('tutorial.slide6Body'),
    },
  ];

  const isLast = index === SLIDES.length - 1;

  const goNext = () => {
    if (!isLast) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bone dark:bg-ink" edges={['top', 'bottom']}>

      {/* Close button */}
      <View className="flex-row justify-end px-5 pt-2 pb-1">
        <Pressable onPress={() => router.back()} className="px-3 py-1.5 active:opacity-60">
          <Text className="text-sm text-ink-mute dark:text-bone-soft">{t('common.close')}</Text>
        </Pressable>
      </View>

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
            <ScrollView
              style={{ width: SCREEN_WIDTH }}
              contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingBottom: 24 }}
              scrollEnabled={!!item.detail}
              showsVerticalScrollIndicator={false}
            >
              <View className="mb-8 h-24 w-24 items-center justify-center rounded-full bg-gold/10 border border-gold/30">
                <Icon color={colors.gold} size={40} />
              </View>
              <Text className="mb-4 text-center font-serif text-3xl text-ink dark:text-bone leading-tight">
                {item.title}
              </Text>
              <Text className="text-center text-base text-ink-mute dark:text-bone-soft leading-relaxed">
                {item.body}
              </Text>
              {item.detail}
            </ScrollView>
          );
        }}
      />

      {/* Pagination */}
      <View className="flex-row items-center justify-center gap-2 mb-5">
        {SLIDES.map((_, i) => (
          <View
            key={i}
            className={`rounded-full ${i === index ? 'h-2 w-6 bg-gold' : 'h-2 w-2 bg-gray-300 dark:bg-ink-mute'}`}
          />
        ))}
      </View>

      <View className="px-6 pb-4">
        <Pressable onPress={goNext} className="items-center rounded-xl bg-gold py-4 active:opacity-80">
          <Text className="font-semibold text-base text-ink">
            {isLast ? t('tutorial.done') : t('common.next')}
          </Text>
        </Pressable>
      </View>

    </SafeAreaView>
  );
}
