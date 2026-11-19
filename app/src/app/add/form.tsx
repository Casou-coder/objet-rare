import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { isApiError } from '@/api/client';
import { uploadCertificate, uploadCoverPhoto, useIssuers } from '@/api/hooks';
import { fileSize, normalizeMime, type PickedFile } from '@/api/upload';
import { Button, Card, Chips, Field, SectionTitle, Title, useErrorMessage } from '@/components/ui';
import { buildCreateItem, useAddDraft } from '@/features/add/draft';

const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF'] as const;
const CERT_TYPES = {
  watch: ['card', 'certificate', 'invoice'],
  handbag: ['card', 'invoice', 'third_party'],
  sneaker: ['invoice', 'marketplace'],
  certified_other: ['certificate', 'third_party', 'invoice'],
} as const;

async function pickFromCamera(): Promise<PickedFile | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return null;
  const r = await ImagePicker.launchCameraAsync({ quality: 1, exif: false });
  if (r.canceled || !r.assets[0]) return null;
  const a = r.assets[0];
  return { uri: a.uri, mimeType: normalizeMime(a.mimeType, a.uri), size: await fileSize(a.uri, a.fileSize) };
}

async function pickFromFiles(): Promise<PickedFile | null> {
  const r = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true, multiple: false });
  if (r.canceled || !r.assets[0]) return null;
  const a = r.assets[0];
  return { uri: a.uri, mimeType: normalizeMime(a.mimeType, a.name), size: await fileSize(a.uri, a.size) };
}

/** Écran 3 — Formulaire contextualisé + certificat. Aucun passage à l'étape suivante sans résolution. */
export default function AddFormScreen() {
  const { t, i18n } = useTranslation();
  const d = useAddDraft();
  const issuers = useIssuers();
  const errorMessage = useErrorMessage();
  const [busy, setBusy] = useState<'certificate' | 'photo' | null>(null);
  const [certError, setCertError] = useState<{ message: string; unreadable: boolean } | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [prefilled, setPrefilled] = useState(false);
  const cat = d.category ?? 'watch';

  useEffect(() => {
    if (d.method === 'photo' && !d.certificate) void onCertificate('camera');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCertificate = async (source: 'camera' | 'files') => {
    setCertError(null);
    const file = source === 'camera' ? await pickFromCamera() : await pickFromFiles();
    if (!file) return;
    setBusy('certificate');
    try {
      const confirmation = await uploadCertificate(d.draftId, file, d.category);
      d.set({ certificate: { file, confirmation } });
      // Préremplissage OCR (décision P6) : uniquement les champs vides, l'utilisateur corrige
      let any = false;
      for (const [k, v] of Object.entries(confirmation.extraction ?? {})) {
        if (v && !useAddDraft.getState().fields[k]) { d.setField(k, String(v)); any = true; }
      }
      setPrefilled(any);
    } catch (e) {
      d.set({ certificate: null });
      setCertError({ message: errorMessage(e), unreadable: isApiError(e, 'CERTIFICATE_NOT_READABLE') });
    } finally {
      setBusy(null);
    }
  };

  const onPhoto = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, exif: false });
    if (r.canceled || !r.assets[0]) return;
    const a = r.assets[0];
    const file: PickedFile = { uri: a.uri, mimeType: normalizeMime(a.mimeType, a.uri), size: await fileSize(a.uri, a.fileSize) };
    setBusy('photo');
    try {
      const uploadKey = await uploadCoverPhoto(d.draftId, file);
      d.set({ photo: { file, uploadKey } });
    } catch (e) {
      setCertError({ message: errorMessage(e), unreadable: false });
    } finally {
      setBusy(null);
    }
  };

  const { missing } = buildCreateItem(d);
  const err = (k: string) => (showErrors && missing.includes(k) ? t('v.add.required') : undefined);
  const field = (k: string, label: string, opts: { optional?: boolean; keyboard?: 'decimal-pad' | 'default'; upper?: boolean } = {}) => (
    <Field
      label={label}
      optional={opts.optional}
      value={d.fields[k] ?? ''}
      onChangeText={(v) => d.setField(k, v)}
      keyboardType={opts.keyboard ?? 'default'}
      autoCapitalize={opts.upper ? 'characters' : 'sentences'}
      autoCorrect={false}
      error={err(k)}
    />
  );

  const next = () => {
    setShowErrors(true);
    if (!d.certificate) {
      setCertError({ message: t('v.add.missingCertificate'), unreadable: false });
      return;
    }
    if (missing.length) return;
    router.push('/add/review');
  };

  const holder = d.certificate?.confirmation;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <Title>{t('v.add.formTitle')}</Title>
        <Text className="mt-1 text-ink-mute dark:text-bone-soft">{t(`v.categories.${cat}`)}</Text>

        <SectionTitle>{t('v.add.certificate')}</SectionTitle>
        <Card>
          <Text className="mb-3 text-sm text-ink-mute dark:text-bone-soft">{t('v.add.captureTip')}</Text>
          {busy === 'certificate' ? (
            <View className="flex-row items-center gap-3 py-3">
              <ActivityIndicator />
              <Text className="text-ink dark:text-bone">{t('v.add.checking')}</Text>
            </View>
          ) : d.certificate ? (
            <View>
              <Text className="text-ink dark:text-bone">{t('v.add.certificateOk')}</Text>
              {holder ? (
                <Text className="mt-1 text-sm text-ink-mute dark:text-bone-soft">
                  {holder.holder_match === 'match'
                    ? t('v.passport.holderConfirmed')
                    : holder.holder_name_detected
                      ? t('v.passport.holderDetected')
                      : t('v.passport.holderNotDetected')}
                </Text>
              ) : null}
              {prefilled ? <Text className="mt-2 text-sm text-gold">{t('v.add.prefilled')}</Text> : null}
              <View className="mt-3"><Button label={t('v.add.rescan')} variant="link" onPress={() => void onCertificate('camera')} /></View>
            </View>
          ) : (
            <View className="gap-3">
              <Button label={t('v.add.takePhoto')} onPress={() => void onCertificate('camera')} />
              <Button label={t('v.add.importFile')} variant="secondary" onPress={() => void onCertificate('files')} />
            </View>
          )}
          {certError ? (
            <View className="mt-3">
              <Text className="text-red-500">{certError.message}</Text>
              {certError.unreadable ? (
                <View className="mt-3 gap-2">
                  <Button label={t('v.add.rescan')} variant="secondary" onPress={() => void onCertificate('camera')} />
                  <Button label={t('v.add.manualEntry')} variant="link" onPress={() => setCertError(null)} />
                </View>
              ) : null}
            </View>
          ) : null}
        </Card>

        <SectionTitle>{t('v.add.certificateType')}</SectionTitle>
        <Chips
          value={d.fields.certificate_type ?? null}
          onChange={(v) => d.setField('certificate_type', v)}
          options={CERT_TYPES[cat].map((c) => ({ value: c, label: t(`v.add.certTypes.${c}`) }))}
        />
        {err('certificate_type') ? <Text className="-mt-2 mb-3 text-sm text-red-500">{err('certificate_type')}</Text> : null}

        <Text className="mb-2 text-ink-mute dark:text-bone-soft">{t('v.add.issuer')}</Text>
        <Chips
          value={d.fields.issuer_id ?? null}
          onChange={(v) => d.setField('issuer_id', v)}
          options={(issuers.data ?? []).map((i) => ({ value: i.id, label: i18n.language === 'fr' ? i.label_fr : i.label_en }))}
        />
        {err('issuer_id') ? <Text className="-mt-2 mb-3 text-sm text-red-500">{err('issuer_id')}</Text> : null}
        {field('certificate_external_id', t('v.add.certificateId'), { optional: cat !== 'sneaker', upper: true })}

        <SectionTitle>{t('v.add.identity')}</SectionTitle>
        {field('brand', t('v.add.brand'))}
        {cat === 'certified_other'
          ? field('model', t('v.add.designation'))
          : field('model', t('v.add.model'), { optional: cat !== 'sneaker' })}
        {cat !== 'sneaker' ? field('reference_code', t('v.add.reference'), { optional: true, upper: true }) : null}
        {cat === 'watch' ? field('serial_number', t('v.add.serialNumber'), { upper: true }) : null}
        {cat === 'handbag' ? field('auth_code', t('v.add.authCode'), { upper: true }) : null}
        {cat === 'sneaker' ? (
          <>
            {field('sku', t('v.add.sku'), { upper: true })}
            {field('size', t('v.add.size'))}
            {field('order_id', t('v.add.orderId'), { upper: true })}
          </>
        ) : null}
        {cat === 'certified_other' ? field('unique_id_value', t('v.add.uniqueId'), { upper: true }) : null}

        <SectionTitle>{t('v.add.acquisition')}</SectionTitle>
        {field('price', t('v.add.price'), { keyboard: 'decimal-pad' })}
        <Chips value={d.fields.currency ?? 'EUR'} onChange={(v) => d.setField('currency', v)} options={CURRENCIES.map((c) => ({ value: c, label: c }))} />
        {field('acquisition_date', t('v.add.date'), { optional: true })}

        <SectionTitle>{t('v.add.photoTitle')}</SectionTitle>
        {d.photo ? <Image source={{ uri: d.photo.file.uri }} style={{ height: 180, borderRadius: 16, marginBottom: 12 }} contentFit="cover" /> : null}
        <Button
          label={d.photo ? t('v.add.changePhoto') : `${t('v.add.addPhoto')} (${t('v.common.optional')})`}
          variant="secondary"
          loading={busy === 'photo'}
          onPress={() => void onPhoto()}
        />

        <View className="mt-8">
          <Button label={t('v.common.continue')} onPress={next} disabled={busy !== null} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
