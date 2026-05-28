import { ScrollView, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { colors } from '@/lib/theme';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-6">
      <Text className="mb-2 font-semibold text-ink dark:text-bone">{title}</Text>
      {children}
    </View>
  );
}

function P({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Text className={`text-sm leading-relaxed text-ink-mute dark:text-bone-soft${className ? ` ${className}` : ''}`}>
      {children}
    </Text>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View className="mb-1 flex-row gap-2">
      <Text className="text-sm text-ink-mute dark:text-bone-soft">•</Text>
      <Text className="flex-1 text-sm leading-relaxed text-ink-mute dark:text-bone-soft">{children}</Text>
    </View>
  );
}

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView className="flex-1 bg-bone dark:bg-ink" edges={['top']}>

      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-ink-mute">
        <Pressable onPress={() => router.back()} hitSlop={12} className="active:opacity-60">
          <ChevronLeft color={colors.inkGray} size={24} />
        </Pressable>
        <Text className="font-serif text-xl text-ink dark:text-bone">Politique de confidentialité</Text>
      </View>

      <ScrollView contentContainerClassName="px-6 pb-16 pt-6">

        <Text className="mb-1 text-xs text-ink-mute dark:text-bone-soft">
          Dernière mise à jour : mai 2025
        </Text>
        <Text className="mb-6 font-serif text-2xl text-ink dark:text-bone">
          Vos données, votre contrôle.
        </Text>

        <P>
          Objet Rare est une application de gestion de collection d'objets de valeur. Nous prenons la
          protection de vos données très au sérieux. Cette politique décrit quelles données nous
          collectons, pourquoi, et comment nous les protégeons.
        </P>

        <View className="my-6 h-px bg-gray-100 dark:bg-ink-mute" />

        <Section title="1. Responsable du traitement">
          <P>
            Clément Dupas — contact : support@objetrare.app{'\n'}
            Application distribuée sur l'App Store (Apple Inc.) et Google Play Store.
          </P>
        </Section>

        <Section title="2. Données collectées">
          <P className="mb-2">Nous collectons uniquement ce qui est nécessaire au fonctionnement de l'app :</P>
          <Bullet>
            <Text className="font-medium text-ink dark:text-bone">Compte :</Text>
            {' '}adresse e-mail et mot de passe (stockés de manière sécurisée via Supabase Auth).
          </Bullet>
          <Bullet>
            <Text className="font-medium text-ink dark:text-bone">Collection :</Text>
            {' '}informations sur vos objets (nom, valeur, photos, documents) que vous saisissez
            volontairement. Ces données vous appartiennent entièrement.
          </Bullet>
          <Bullet>
            <Text className="font-medium text-ink dark:text-bone">Données de paiement :</Text>
            {' '}gérées exclusivement par Apple (In-App Purchase) ou RevenueCat. Nous ne stockons
            jamais vos informations bancaires.
          </Bullet>
          <Bullet>
            <Text className="font-medium text-ink dark:text-bone">Analytics anonymes :</Text>
            {' '}si vous l'acceptez lors de l'onboarding, des données d'usage anonymisées et
            agrégées (écrans visités, fonctionnalités utilisées) nous aident à améliorer l'app.
            Aucune donnée personnelle n'est incluse.
          </Bullet>
        </Section>

        <Section title="3. Données NON collectées">
          <P className="mb-2">Nous ne collectons jamais :</P>
          <Bullet>Votre localisation GPS</Bullet>
          <Bullet>Vos contacts ou votre carnet d'adresses</Bullet>
          <Bullet>Des données biométriques (Face ID / Touch ID) — le déverrouillage biométrique
            est traité localement par iOS/Android et ne quitte jamais votre appareil</Bullet>
          <Bullet>Des informations sur les autres apps installées sur votre téléphone</Bullet>
        </Section>

        <Section title="4. Sécurité de vos données">
          <Bullet>
            Toutes les données sont stockées sur <Text className="font-medium text-ink dark:text-bone">Supabase</Text>
            , hébergé sur des serveurs sécurisés (AWS, région EU).
          </Bullet>
          <Bullet>
            Vos photos et documents sont stockés dans un <Text className="font-medium text-ink dark:text-bone">bucket privé</Text>
            {' '}avec des règles de sécurité (RLS) : seul vous pouvez y accéder. Les URLs sont
            temporaires (5 minutes) et signées cryptographiquement.
          </Bullet>
          <Bullet>
            Les communications entre l'app et nos serveurs sont chiffrées en <Text className="font-medium text-ink dark:text-bone">HTTPS/TLS</Text>.
          </Bullet>
          <Bullet>
            L'accès à l'app peut être protégé par <Text className="font-medium text-ink dark:text-bone">Face ID / Touch ID</Text>
            {' '}— authentification biométrique traitée localement par votre appareil.
          </Bullet>
        </Section>

        <Section title="5. Partage des données">
          <P className="mb-2">
            Nous ne vendons, ne louons et ne partageons jamais vos données personnelles avec des tiers
            à des fins commerciales. Les seuls sous-traitants auxquels nous faisons appel sont :
          </P>
          <Bullet>
            <Text className="font-medium text-ink dark:text-bone">Supabase</Text>
            {' '}(base de données et stockage de fichiers) — conforme RGPD, données en UE.
          </Bullet>
          <Bullet>
            <Text className="font-medium text-ink dark:text-bone">RevenueCat</Text>
            {' '}(gestion des abonnements Premium) — reçoit uniquement votre identifiant utilisateur
            anonymisé.
          </Bullet>
          <Bullet>
            <Text className="font-medium text-ink dark:text-bone">OpenAI</Text>
            {' '}(extraction OCR des documents) — les images sont envoyées temporairement à l'API
            pour extraction de texte, puis immédiatement supprimées. OpenAI ne conserve pas les
            images selon leur politique de données.
          </Bullet>
        </Section>

        <Section title="6. Conservation des données">
          <P>
            Vos données sont conservées tant que votre compte est actif. Si vous supprimez votre
            compte depuis l'app (Paramètres → Supprimer mon compte), l'intégralité de vos données
            (collection, photos, documents) est définitivement supprimée dans les 30 jours.
          </P>
        </Section>

        <Section title="7. Vos droits (RGPD)">
          <P className="mb-2">Conformément au Règlement Général sur la Protection des Données, vous avez le droit :</P>
          <Bullet>D'accéder à vos données personnelles</Bullet>
          <Bullet>De rectifier des données incorrectes</Bullet>
          <Bullet>D'effacer vos données (droit à l'oubli)</Bullet>
          <Bullet>De vous opposer au traitement ou de le limiter</Bullet>
          <Bullet>De porter vos données (export)</Bullet>
          <P className="mt-2">
            Pour exercer ces droits, contactez-nous à : support@objetrare.app
          </P>
        </Section>

        <Section title="8. Mineurs">
          <P>
            L'application Objet Rare est destinée aux personnes âgées de 17 ans et plus, conformément
            aux règles de l'App Store. Nous ne collectons pas sciemment de données concernant des
            mineurs de moins de 13 ans.
          </P>
        </Section>

        <Section title="9. Modifications de cette politique">
          <P>
            Nous pouvons mettre à jour cette politique si nos pratiques évoluent. En cas de
            changement significatif, vous serez notifié dans l'application. La date de mise à jour
            est indiquée en haut de cette page.
          </P>
        </Section>

        <Section title="10. Contact">
          <P>
            Pour toute question relative à la confidentialité de vos données :{'\n'}
            support@objetrare.app
          </P>
        </Section>

        <View className="mt-2 rounded-xl border border-gray-100 dark:border-ink-mute bg-white dark:bg-ink-soft p-4">
          <Text className="text-center text-xs text-ink-mute dark:text-bone-soft">
            Objet Rare · com.clementdupas.objetrare{'\n'}
            Vos données vous appartiennent. Toujours.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
