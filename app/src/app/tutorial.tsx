import { useRef, useState } from 'react';
import { View, Text, Pressable, FlatList, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
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

const SLIDES: Slide[] = [
  {
    icon: BookOpen,
    title: 'Catalogue\nta collection',
    body: "Ajoute tes montres, sacs, sneakers, bijoux et plus. Pour chaque objet : photo personnelle, marque, état, prix d'achat et les caractéristiques propres à sa catégorie (mouvement, matière, pointure…).",
  },
  {
    icon: Shield,
    title: 'Le passeport\nproduit',
    body: "Chaque objet dispose d'une fiche complète qui centralise son identité, ses infos d'achat et tous ses documents liés.\n\nModifie ou supprime l'objet depuis les icônes en haut à droite. Ajoute une photo en appuyant sur l'icône appareil photo.",
  },
  {
    icon: Archive,
    title: 'Le Coffre\nde documents',
    body: "Stocke ici factures, certificats d'authenticité et garanties. Chaque document peut être rattaché à un objet de ta collection.\n\nL'OCR analyse automatiquement le contenu de chaque fichier pour l'indexer.",
  },
  {
    icon: ScanLine,
    title: 'Les statuts\nde traitement OCR',
    body: "Quand tu uploades un document, l'OCR en extrait le texte automatiquement. Trois statuts possibles :",
    detail: (
      <View className="mt-4 w-full rounded-xl bg-gold/5 border border-gold/20 px-4 py-3">
        <OcrRow
          icon={Clock}
          color="#D97706"
          label="En cours"
          description="Le fichier vient d'être uploadé. L'extraction est en cours de traitement — cela prend généralement quelques secondes."
        />
        <OcrRow
          icon={CheckCircle}
          color={colors.gold}
          label="Extrait"
          description="Le texte a été extrait avec succès. Le document est pleinement indexé et consultable."
        />
        <OcrRow
          icon={XCircle}
          color="#EF4444"
          label="Échec"
          description="L'extraction a échoué — image trop floue, format non supporté ou fichier corrompu. Le document reste accessible mais son contenu n'est pas indexé."
        />
      </View>
    ),
  },
  {
    icon: Eye,
    title: 'Mode privé',
    body: "Appuie sur l'icône œil dans l'onglet Collection pour masquer la valeur totale et le nombre d'objets.\n\nUtile en déplacement, en présence de tiers, ou simplement pour préserver ta confidentialité.",
  },
  {
    icon: Crown,
    title: 'Premium',
    body: "La version gratuite permet de cataloguer jusqu'à 3 objets.\n\nPremium débloque : collection illimitée, extraction OCR avancée sur tes documents et génération d'un passeport PDF par objet.",
  },
];

export default function TutorialScreen() {
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);
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
          <Text className="text-sm text-ink-mute dark:text-bone-soft">Fermer</Text>
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
            {isLast ? 'Terminé' : 'Suivant'}
          </Text>
        </Pressable>
      </View>

    </SafeAreaView>
  );
}
