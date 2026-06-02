import { ScrollView, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
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

function Bold({ children }: { children: React.ReactNode }) {
  return <Text className="font-medium text-ink dark:text-bone">{children}</Text>;
}

function ContentEN() {
  return (
    <>
      <Text className="mb-1 text-xs text-ink-mute dark:text-bone-soft">Last updated: May 2025</Text>
      <Text className="mb-6 font-serif text-2xl text-ink dark:text-bone">Your data, your control.</Text>

      <P>
        OR Vault is an app for managing your valuable item collection. We take the protection of your
        data very seriously. This policy describes what data we collect, why, and how we protect it.
      </P>

      <View className="my-6 h-px bg-gray-100 dark:bg-ink-mute" />

      <Section title="1. Data controller">
        <P>
          OR Vault — contact: support@objetrare.app{'\n'}
          App distributed on the App Store (Apple Inc.) and Google Play Store.
        </P>
      </Section>

      <Section title="2. Data collected">
        <P className="mb-2">We only collect what is strictly necessary to run the app:</P>
        <Bullet>
          <Bold>Account:</Bold>
          {' '}email address and password (securely stored via Supabase Auth).
        </Bullet>
        <Bullet>
          <Bold>Collection:</Bold>
          {' '}information about your items (name, value, photos, documents) that you voluntarily
          enter. This data belongs entirely to you.
        </Bullet>
        <Bullet>
          <Bold>Payment data:</Bold>
          {' '}handled exclusively by Apple (In-App Purchase), Google Play, or RevenueCat. We never
          store your banking information.
        </Bullet>
        <Bullet>
          <Bold>Anonymous analytics:</Bold>
          {' '}if you consent during onboarding, anonymized and aggregated usage data (screens visited,
          features used) helps us improve the app. No personal data is included.
        </Bullet>
      </Section>

      <Section title="3. Data NOT collected">
        <P className="mb-2">We never collect:</P>
        <Bullet>Your GPS location</Bullet>
        <Bullet>Your contacts or address book</Bullet>
        <Bullet>
          Biometric data (Face ID / Touch ID) — biometric unlock is handled locally by iOS/Android
          and never leaves your device
        </Bullet>
        <Bullet>Information about other apps installed on your phone</Bullet>
      </Section>

      <Section title="4. Data security">
        <Bullet>
          All data is stored on <Bold>Supabase</Bold>, hosted on secure servers (AWS, EU region).
        </Bullet>
        <Bullet>
          Your photos and documents are stored in a <Bold>private bucket</Bold> with row-level
          security (RLS): only you can access them. URLs are temporary (5 minutes) and
          cryptographically signed.
        </Bullet>
        <Bullet>
          Communications between the app and our servers are encrypted via <Bold>HTTPS/TLS</Bold>.
        </Bullet>
        <Bullet>
          App access can be protected by <Bold>Face ID / Touch ID</Bold> — biometric authentication
          handled locally by your device.
        </Bullet>
      </Section>

      <Section title="5. Data sharing">
        <P className="mb-2">
          We never sell, rent, or share your personal data with third parties for commercial purposes.
          The only processors we use are:
        </P>
        <Bullet>
          <Bold>Supabase</Bold>
          {' '}(database and file storage) — GDPR compliant, data stored in the EU.
        </Bullet>
        <Bullet>
          <Bold>RevenueCat</Bold>
          {' '}(Premium subscription management) — receives only your anonymized user identifier.
        </Bullet>
        <Bullet>
          <Bold>OpenAI</Bold>
          {' '}(document OCR extraction) — images are sent temporarily to the API for text extraction,
          then immediately discarded. OpenAI does not retain images per their data policy.
        </Bullet>
      </Section>

      <Section title="6. Data retention">
        <P>
          Your data is retained for as long as your account is active. If you delete your account
          from the app (Settings → Delete my account), all your data (collection, photos, documents)
          is permanently deleted within 30 days.
        </P>
      </Section>

      <Section title="7. Your rights (GDPR / CCPA)">
        <P className="mb-2">
          In accordance with applicable data protection regulations, you have the right to:
        </P>
        <Bullet>Access your personal data</Bullet>
        <Bullet>Correct inaccurate data</Bullet>
        <Bullet>Erase your data (right to be forgotten)</Bullet>
        <Bullet>Object to or restrict processing</Bullet>
        <Bullet>Data portability (export)</Bullet>
        <Bullet>Opt out of the sale of personal information (we do not sell data)</Bullet>
        <P className="mt-2">To exercise these rights, contact us at: support@objetrare.app</P>
      </Section>

      <Section title="8. Minors">
        <P>
          OR Vault is intended for users aged 17 and over, in accordance with App Store guidelines.
          We do not knowingly collect data from children under the age of 13.
        </P>
      </Section>

      <Section title="9. Changes to this policy">
        <P>
          We may update this policy as our practices evolve. In the event of a significant change,
          you will be notified within the app. The update date is shown at the top of this page.
        </P>
      </Section>

      <Section title="10. Contact">
        <P>
          For any questions regarding the privacy of your data:{'\n'}
          support@objetrare.app
        </P>
      </Section>
    </>
  );
}

function ContentFR() {
  return (
    <>
      <Text className="mb-1 text-xs text-ink-mute dark:text-bone-soft">
        Dernière mise à jour : mai 2025
      </Text>
      <Text className="mb-6 font-serif text-2xl text-ink dark:text-bone">
        Vos données, votre contrôle.
      </Text>

      <P>
        OR Vault est une application de gestion de collection d'objets de valeur. Nous prenons la
        protection de vos données très au sérieux. Cette politique décrit quelles données nous
        collectons, pourquoi, et comment nous les protégeons.
      </P>

      <View className="my-6 h-px bg-gray-100 dark:bg-ink-mute" />

      <Section title="1. Responsable du traitement">
        <P>
          OR Vault — contact : support@objetrare.app{'\n'}
          Application distribuée sur l'App Store (Apple Inc.) et Google Play Store.
        </P>
      </Section>

      <Section title="2. Données collectées">
        <P className="mb-2">Nous collectons uniquement ce qui est nécessaire au fonctionnement de l'app :</P>
        <Bullet>
          <Bold>Compte :</Bold>
          {' '}adresse e-mail et mot de passe (stockés de manière sécurisée via Supabase Auth).
        </Bullet>
        <Bullet>
          <Bold>Collection :</Bold>
          {' '}informations sur vos objets (nom, valeur, photos, documents) que vous saisissez
          volontairement. Ces données vous appartiennent entièrement.
        </Bullet>
        <Bullet>
          <Bold>Données de paiement :</Bold>
          {' '}gérées exclusivement par Apple (In-App Purchase), Google Play ou RevenueCat. Nous ne
          stockons jamais vos informations bancaires.
        </Bullet>
        <Bullet>
          <Bold>Analytics anonymes :</Bold>
          {' '}si vous l'acceptez lors de l'onboarding, des données d'usage anonymisées et agrégées
          (écrans visités, fonctionnalités utilisées) nous aident à améliorer l'app. Aucune donnée
          personnelle n'est incluse.
        </Bullet>
      </Section>

      <Section title="3. Données NON collectées">
        <P className="mb-2">Nous ne collectons jamais :</P>
        <Bullet>Votre localisation GPS</Bullet>
        <Bullet>Vos contacts ou votre carnet d'adresses</Bullet>
        <Bullet>
          Des données biométriques (Face ID / Touch ID) — le déverrouillage biométrique est traité
          localement par iOS/Android et ne quitte jamais votre appareil
        </Bullet>
        <Bullet>Des informations sur les autres apps installées sur votre téléphone</Bullet>
      </Section>

      <Section title="4. Sécurité de vos données">
        <Bullet>
          Toutes les données sont stockées sur <Bold>Supabase</Bold>, hébergé sur des serveurs
          sécurisés (AWS, région EU).
        </Bullet>
        <Bullet>
          Vos photos et documents sont stockés dans un <Bold>bucket privé</Bold> avec des règles de
          sécurité (RLS) : seul vous pouvez y accéder. Les URLs sont temporaires (5 minutes) et
          signées cryptographiquement.
        </Bullet>
        <Bullet>
          Les communications entre l'app et nos serveurs sont chiffrées en <Bold>HTTPS/TLS</Bold>.
        </Bullet>
        <Bullet>
          L'accès à l'app peut être protégé par <Bold>Face ID / Touch ID</Bold> — authentification
          biométrique traitée localement par votre appareil.
        </Bullet>
      </Section>

      <Section title="5. Partage des données">
        <P className="mb-2">
          Nous ne vendons, ne louons et ne partageons jamais vos données personnelles avec des tiers
          à des fins commerciales. Les seuls sous-traitants auxquels nous faisons appel sont :
        </P>
        <Bullet>
          <Bold>Supabase</Bold>
          {' '}(base de données et stockage de fichiers) — conforme RGPD, données en UE.
        </Bullet>
        <Bullet>
          <Bold>RevenueCat</Bold>
          {' '}(gestion des abonnements Premium) — reçoit uniquement votre identifiant utilisateur
          anonymisé.
        </Bullet>
        <Bullet>
          <Bold>OpenAI</Bold>
          {' '}(extraction OCR des documents) — les images sont envoyées temporairement à l'API pour
          extraction de texte, puis immédiatement supprimées. OpenAI ne conserve pas les images selon
          leur politique de données.
        </Bullet>
      </Section>

      <Section title="6. Conservation des données">
        <P>
          Vos données sont conservées tant que votre compte est actif. Si vous supprimez votre compte
          depuis l'app (Paramètres → Supprimer mon compte), l'intégralité de vos données (collection,
          photos, documents) est définitivement supprimée dans les 30 jours.
        </P>
      </Section>

      <Section title="7. Vos droits (RGPD)">
        <P className="mb-2">Conformément au Règlement Général sur la Protection des Données, vous avez le droit :</P>
        <Bullet>D'accéder à vos données personnelles</Bullet>
        <Bullet>De rectifier des données incorrectes</Bullet>
        <Bullet>D'effacer vos données (droit à l'oubli)</Bullet>
        <Bullet>De vous opposer au traitement ou de le limiter</Bullet>
        <Bullet>De porter vos données (export)</Bullet>
        <P className="mt-2">Pour exercer ces droits, contactez-nous à : support@objetrare.app</P>
      </Section>

      <Section title="8. Mineurs">
        <P>
          OR Vault est destinée aux personnes âgées de 17 ans et plus, conformément aux règles de
          l'App Store. Nous ne collectons pas sciemment de données concernant des mineurs de moins
          de 13 ans.
        </P>
      </Section>

      <Section title="9. Modifications de cette politique">
        <P>
          Nous pouvons mettre à jour cette politique si nos pratiques évoluent. En cas de changement
          significatif, vous serez notifié dans l'application. La date de mise à jour est indiquée
          en haut de cette page.
        </P>
      </Section>

      <Section title="10. Contact">
        <P>
          Pour toute question relative à la confidentialité de vos données :{'\n'}
          support@objetrare.app
        </P>
      </Section>
    </>
  );
}

export default function PrivacyPolicyScreen() {
  const { t, i18n } = useTranslation();
  const isEN = i18n.language === 'en';

  return (
    <SafeAreaView className="flex-1 bg-bone dark:bg-ink" edges={['top']}>
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-ink-mute">
        <Pressable onPress={() => router.back()} hitSlop={12} className="active:opacity-60">
          <ChevronLeft color={colors.inkGray} size={24} />
        </Pressable>
        <Text className="font-serif text-xl text-ink dark:text-bone">{t('account.privacyPolicy')}</Text>
      </View>

      <ScrollView contentContainerClassName="px-6 pb-16 pt-6">
        {isEN ? <ContentEN /> : <ContentFR />}

        <View className="mt-2 rounded-xl border border-gray-100 dark:border-ink-mute bg-white dark:bg-ink-soft p-4">
          <Text className="text-center text-xs text-ink-mute dark:text-bone-soft">
            OR Vault · app.orvault{'\n'}
            {isEN ? 'Your data belongs to you. Always.' : 'Vos données vous appartiennent. Toujours.'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
