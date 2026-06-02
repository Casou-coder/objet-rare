import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, ActivityIndicator, Pressable,
  Alert, ActionSheetIOS, Platform, Modal, TextInput, Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useTranslation } from 'react-i18next';
import {
  ChevronDown, ChevronUp,
  FileCheck, Camera, Pencil,
  Receipt, Award, ShieldCheck, FileText,
  MoreVertical, Download, Trash2, FileDown, Lock, ScanLine, AlertTriangle,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { useItem, useUploadCoverPhoto, useDeleteItem } from '@/features/items/hooks';
import { useDocuments, useDeleteDocument, useRenameDocument } from '@/features/documents/hooks';
import { getDocumentUrl } from '@/features/documents/api';
import { OcrBadge } from '@/features/documents/OcrBadge';
import { useAuth } from '@/stores/auth';
import { usePlan } from '@/features/premium/usePlan';
import { CATEGORY_ICON } from '@/lib/categories';
import { useBackHeader } from '@/lib/useBackHeader';
import { generatePassportPdf } from '@/lib/generatePassportPdf';
import { daysUntil } from '@/lib/notifications';
import { useSignedPhotoUrl } from '@/lib/photos';
import { colors } from '@/lib/theme';
import { haptic } from '@/lib/haptics';
import type { DocumentRow, DocumentType } from '@/types/database';

type MenuView = 'actions' | 'rename' | 'ocr';

function DocActionMenu({
  doc, onClose, onDelete, onRename,
}: {
  doc: DocumentRow | null;
  onClose: () => void;
  onDelete: (doc: DocumentRow) => void;
  onRename: (doc: DocumentRow, filename: string) => void;
}) {
  const { t } = useTranslation();
  const [view, setView] = useState<MenuView>('actions');
  const [name, setName] = useState('');

  const OCR_LABELS: Record<string, string> = {
    amount: t('coffre.extractedFields.amount'), total_amount: t('coffre.extractedFields.totalAmount'),
    price: t('coffre.extractedFields.price'), total: t('coffre.extractedFields.total'),
    date: t('coffre.extractedFields.date'), invoice_date: t('coffre.extractedFields.invoiceDate'),
    issued_at: t('coffre.extractedFields.issuedOn'), expiry_date: t('coffre.extractedFields.expiryDate'),
    warranty_expires: t('coffre.extractedFields.warrantyUntil'), vendor: t('coffre.extractedFields.seller'),
    seller: t('coffre.extractedFields.seller'), buyer: t('coffre.extractedFields.buyer'),
    description: t('coffre.extractedFields.description'), brand: t('coffre.extractedFields.brand'),
    model: t('coffre.extractedFields.model'), serial_number: t('coffre.extractedFields.serialNumber'),
    reference: t('coffre.extractedFields.reference'), currency: t('coffre.extractedFields.currency'),
    invoice_number: t('coffre.extractedFields.invoiceNumber'), certificate_number: t('coffre.extractedFields.certNumber'),
    condition: t('coffre.extractedFields.condition'), authenticity: t('coffre.extractedFields.authenticity'),
    notes: t('coffre.extractedFields.notes'),
  };

  useEffect(() => {
    if (doc) { setView('actions'); setName(doc.filename); }
  }, [doc?.id]);

  if (!doc) return null;

  const ocrEntries = doc.ocr_data
    ? Object.entries(doc.ocr_data).filter(([k, v]) => k !== 'raw_text' && v != null && v !== '')
    : [];

  const handleDownload = async () => {
    onClose();
    try {
      const url = await getDocumentUrl(doc.storage_path);
      await Linking.openURL(url);
    } catch {
      Alert.alert(t('item.fileNotReady'), t('item.fileNotReadyMsg'));
    }
  };

  const handleDelete = () => {
    Alert.alert(
      t('item.deleteDocTitle'),
      t('item.deleteDocMsg', { filename: doc.filename }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: () => { onClose(); onDelete(doc); } },
      ],
    );
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <Pressable className="absolute inset-0" onPress={onClose} />
        <View className="rounded-t-3xl bg-white dark:bg-ink-soft px-6 pb-10 pt-4">
          <View className="mb-4 h-1 w-10 self-center rounded-full bg-gray-200 dark:bg-ink-mute" />

          {view === 'actions' && (
            <>
              <Text className="mb-4 font-serif text-base text-ink dark:text-bone" numberOfLines={1}>{doc.filename}</Text>
              <ActionRow icon={Pencil} label={t('common.rename')} onPress={() => setView('rename')} />
              {ocrEntries.length > 0 && (
                <ActionRow icon={ScanLine} label={t('coffre.extractedData')} onPress={() => setView('ocr')} />
              )}
              <ActionRow icon={Download} label={t('item.openDownload')} onPress={handleDownload} />
              <ActionRow icon={Trash2} label={t('common.delete')} onPress={handleDelete} destructive />
            </>
          )}

          {view === 'rename' && (
            <>
              <Text className="mb-3 text-xs uppercase tracking-wider text-gold">{t('common.rename')}</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                autoFocus
                selectTextOnFocus
                placeholderTextColor={colors.inkGray}
                className="mb-4 rounded-xl border border-gray-200 dark:border-ink-mute bg-bone dark:bg-ink px-4 py-3 text-ink dark:text-bone"
              />
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => setView('actions')}
                  className="flex-1 items-center rounded-xl border border-gray-200 dark:border-ink-mute py-3"
                >
                  <Text className="text-ink-mute dark:text-bone-soft">{t('common.cancel')}</Text>
                </Pressable>
                <Pressable
                  onPress={() => { onRename(doc, name.trim() || doc.filename); onClose(); }}
                  className="flex-1 items-center rounded-xl bg-gold py-3"
                >
                  <Text className="font-semibold text-ink">{t('common.save')}</Text>
                </Pressable>
              </View>
            </>
          )}

          {view === 'ocr' && (
            <>
              <View className="mb-4 flex-row items-center justify-between">
                <Text className="font-serif text-base text-ink dark:text-bone">{t('coffre.extractedData')}</Text>
                <Pressable onPress={() => setView('actions')} hitSlop={8} className="active:opacity-60">
                  <Text className="text-sm text-gold">← {t('common.back')}</Text>
                </Pressable>
              </View>
              {ocrEntries.map(([key, value]) => (
                <View key={key} className="flex-row items-start justify-between border-b border-gray-200 dark:border-ink-mute py-2.5">
                  <Text className="text-sm text-ink-mute dark:text-bone-soft">{OCR_LABELS[key] ?? key}</Text>
                  <Text className="ml-4 flex-1 text-right text-sm font-medium text-ink dark:text-bone" numberOfLines={2}>
                    {String(value)}
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function ActionRow({
  icon: Icon, label, onPress, destructive,
}: {
  icon: React.ComponentType<{ color: string; size: number }>;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  const { colorScheme } = useColorScheme();
  const iconColor = destructive ? '#EF4444' : (colorScheme === 'dark' ? colors.bone : colors.ink);
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-4 border-b border-gray-200 dark:border-ink-mute py-4 last:border-0 active:opacity-70"
    >
      <Icon color={iconColor} size={20} />
      <Text className={`text-base ${destructive ? 'text-red-400' : 'text-ink dark:text-bone'}`}>{label}</Text>
    </Pressable>
  );
}

function CompactDocRow({
  doc, onMenuOpen,
}: {
  doc: DocumentRow;
  onMenuOpen: (doc: DocumentRow) => void;
}) {
  const TYPE_META: Record<DocumentType, { icon: React.ComponentType<{ color: string; size: number }> }> = {
    invoice:     { icon: Receipt },
    certificate: { icon: Award },
    warranty:    { icon: ShieldCheck },
    other:       { icon: FileText },
  };
  const { icon: Icon } = TYPE_META[doc.type];
  return (
    <View className="flex-row items-center gap-3 border-b border-gray-200 dark:border-ink-mute py-2.5 last:border-0">
      <Icon color={colors.gold} size={16} />
      <Text className="flex-1 text-sm text-ink dark:text-bone" numberOfLines={1}>{doc.filename}</Text>
      <OcrBadge status={doc.ocr_status} size={11} />
      <Pressable onPress={() => onMenuOpen(doc)} hitSlop={8} className="ml-1 active:opacity-60">
        <MoreVertical color={colors.inkGray} size={18} />
      </Pressable>
    </View>
  );
}

export default function ItemPassportScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: item, isLoading, error } = useItem(id);
  const { data: docs } = useDocuments(id);
  const session = useAuth((s) => s.session);
  const ownerId = session?.user.id ?? '';
  const { isPremium } = usePlan();
  const { mutate: uploadCover, isPending: isUploading } = useUploadCoverPhoto(id ?? '', ownerId);
  const { mutate: deleteDoc } = useDeleteDocument();
  const { mutate: renameDoc } = useRenameDocument();
  const { mutateAsync: deleteItem } = useDeleteItem();
  const [docsExpanded, setDocsExpanded] = useState(false);
  const [menuDoc, setMenuDoc] = useState<DocumentRow | null>(null);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const backHeader = useBackHeader(t('item.passportTitle'));
  const coverUrl = useSignedPhotoUrl(item?.cover_photo_url);

  const handleExportPdf = async () => {
    if (!item) return;
    setIsPdfGenerating(true);
    try {
      const uri = await generatePassportPdf(item);
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `${t('item.passportTitle')} — ${item.name}`,
        UTI: 'com.adobe.pdf',
      });
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message ?? t('item.pdfError'));
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const handleUpload = (uri: string) =>
    uploadCover(uri, {
      onError: (e: any) => Alert.alert(t('common.error'), e.message ?? t('item.photoError')),
    });

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('item.cameraPermDenied'), t('item.cameraPermMsg'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets[0]) handleUpload(result.assets[0].uri);
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets[0]) handleUpload(result.assets[0].uri);
  };

  const showPhotoPicker = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: [t('common.cancel'), t('item.takePhoto'), t('item.chooseFromGallery')], cancelButtonIndex: 0 },
        (i) => { if (i === 1) takePhoto(); if (i === 2) pickFromGallery(); },
      );
    } else {
      Alert.alert('', '', [
        { text: t('item.takePhoto'), onPress: takePhoto },
        { text: t('item.chooseFromGallery'), onPress: pickFromGallery },
        { text: t('common.cancel'), style: 'cancel' },
      ]);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bone dark:bg-ink" edges={['bottom']}>
      <Stack.Screen options={{
        ...backHeader,
        headerRight: item
          ? () => (
              <View className="flex-row items-center gap-4">
                <Pressable
                  onPress={() => {
                    haptic.error();
                    Alert.alert(
                      t('item.deleteTitle'),
                      t('item.deleteMsg', { itemName: item.name }),
                      [
                        { text: t('common.cancel'), style: 'cancel' },
                        {
                          text: t('common.delete'),
                          style: 'destructive',
                          onPress: async () => {
                            await deleteItem(item.id);
                            router.replace('/(tabs)/collection');
                          },
                        },
                      ],
                    );
                  }}
                  hitSlop={8}
                >
                  <Trash2 color="#EF4444" size={19} />
                </Pressable>
                <Pressable onPress={() => router.push(`/item/${item.id}/edit`)} hitSlop={8} className="ml-1">
                  <Pencil color={colors.gold} size={20} />
                </Pressable>
              </View>
            )
          : undefined,
      }} />

      <DocActionMenu
        doc={menuDoc}
        onClose={() => setMenuDoc(null)}
        onDelete={(doc) => { haptic.error(); deleteDoc({ id: doc.id, storagePath: doc.storage_path }); }}
        onRename={(doc, filename) => renameDoc({ id: doc.id, filename })}
      />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.gold} />
        </View>
      ) : error || !item ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-ink-mute dark:text-bone-soft">{t('item.notFound')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerClassName="pb-32">
          {(() => {
            const CategoryIcon = CATEGORY_ICON[item.category];
            return (
              <View className="relative h-56 w-full bg-bone-soft dark:bg-ink-soft">
                {coverUrl ? (
                  <Image source={{ uri: coverUrl }} style={{ width: '100%', height: '100%' }} contentFit="contain" transition={200} />
                ) : (
                  <View className="flex-1 items-center justify-center gap-2">
                    <CategoryIcon color={colors.inkGray} size={48} />
                    <Text className="text-xs text-ink-mute dark:text-bone-soft">{t('item.addPhoto')}</Text>
                  </View>
                )}
                {isUploading && (
                  <View className="absolute inset-0 items-center justify-center bg-black/60">
                    <ActivityIndicator color={colors.gold} />
                  </View>
                )}
                {!isUploading && (
                  <Pressable
                    onPress={showPhotoPicker}
                    hitSlop={8}
                    className="absolute bottom-3 right-3 rounded-full bg-black/70 p-2.5 active:opacity-70"
                  >
                    <Camera color={colors.bone} size={18} />
                  </Pressable>
                )}
              </View>
            );
          })()}

          <View className="px-6">
            <Text className="mt-4 text-xs uppercase tracking-wider text-gold">
              {t(`item.categories.${item.category}`, { defaultValue: item.category })}
            </Text>
            <Text className="mt-1 font-serif text-3xl text-ink dark:text-bone">{item.name}</Text>
            <Text className="text-lg text-ink-mute dark:text-bone-soft">{item.brand}</Text>

            <View className="mt-6 rounded-2xl border border-gray-200 dark:border-ink-mute bg-white dark:bg-ink-soft p-4">
              <Text className="mb-3 text-xs uppercase tracking-wider text-gold">{t('item.identity')}</Text>
              <Row label={t('item.brand')} value={item.brand} />
              <Row label={t('item.model')} value={item.model} />
              <Row label={t('item.reference')} value={item.serial_number} />
              <Row label={t('item.condition')} value={t(`item.conditionValues.${item.condition}`, { defaultValue: item.condition })} />
              <Row
                label={t('item.authenticity')}
                value={item.is_authenticated ? t('item.authenticated') : t('item.notVerified')}
                highlight={item.is_authenticated}
              />
            </View>

            <View className="mt-4 rounded-2xl border border-gray-200 dark:border-ink-mute bg-white dark:bg-ink-soft p-4">
              <Text className="mb-3 text-xs uppercase tracking-wider text-gold">{t('item.acquisition')}</Text>
              <Row label={t('item.purchaseDate')} value={item.purchase_date} />
              <Row
                label={t('item.purchasePrice')}
                value={
                  item.purchase_price != null
                    ? `${item.purchase_price.toLocaleString()} ${item.purchase_currency ?? 'EUR'}`
                    : null
                }
              />
            </View>

            {(() => {
              const expiringDocs = docs?.filter(
                (d) => d.type === 'warranty' && d.expires_at && daysUntil(d.expires_at) <= 60,
              ) ?? [];
              if (!expiringDocs.length) return null;
              return (
                <View className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 dark:bg-amber-900/20 p-4">
                  <View className="flex-row items-center gap-2 mb-2">
                    <AlertTriangle color="#D97706" size={16} />
                    <Text className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                      {t('item.warrantyExpiry', { count: expiringDocs.length })}
                    </Text>
                  </View>
                  {expiringDocs.map((d) => {
                    const days = daysUntil(d.expires_at!);
                    return (
                      <View key={d.id} className="flex-row items-center justify-between py-1">
                        <Text className="flex-1 text-sm text-amber-700 dark:text-amber-400" numberOfLines={1}>{d.filename}</Text>
                        <Text className={`text-sm font-medium ml-3 ${days <= 7 ? 'text-red-500' : 'text-amber-600 dark:text-amber-400'}`}>
                          {days <= 0 ? t('coffre.expired') : `${days}j`}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              );
            })()}

            <View className="mt-4 overflow-hidden rounded-2xl border border-gold/40 bg-white dark:bg-ink-soft">
              <Pressable
                onPress={() => setDocsExpanded((v) => !v)}
                className="flex-row items-center justify-between p-4 active:opacity-80"
              >
                <View className="flex-row items-center gap-3">
                  <FileCheck color={colors.gold} size={22} />
                  <View>
                    <Text className="font-semibold text-ink dark:text-bone">{t('item.docsSection')}</Text>
                    <Text className="mt-0.5 text-xs text-ink-mute dark:text-bone-soft">
                      {docs?.length
                        ? `${docs.length} ${t('coffre.document', { count: docs.length })}`
                        : t('item.docsSubtitle')}
                    </Text>
                  </View>
                </View>
                {docsExpanded
                  ? <ChevronUp color={colors.inkGray} size={18} />
                  : <ChevronDown color={colors.inkGray} size={18} />}
              </Pressable>

              {docsExpanded && (
                <View className="border-t border-gray-200 dark:border-ink-mute px-4 pb-4 pt-1">
                  {!docs?.length ? (
                    <Text className="py-3 text-sm text-ink-mute dark:text-bone-soft">{t('item.noDocs')}</Text>
                  ) : (
                    docs.map((doc) => (
                      <CompactDocRow key={doc.id} doc={doc} onMenuOpen={setMenuDoc} />
                    ))
                  )}
                  <Pressable
                    onPress={() => router.push({ pathname: '/(tabs)/coffre', params: { itemId: id } })}
                    className="mt-3 items-center"
                  >
                    <Text className="text-xs text-gold">{t('item.manageInVault')}</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      )}

      {item && (
        <View className="absolute bottom-0 left-0 right-0 border-t border-gray-200 dark:border-ink-mute bg-bone dark:bg-ink px-6 pb-8 pt-4">
          {isPremium ? (
            <Pressable
              onPress={handleExportPdf}
              disabled={isPdfGenerating}
              className="flex-row items-center justify-center gap-2 rounded-xl bg-gold py-4 active:opacity-80"
            >
              {isPdfGenerating
                ? <ActivityIndicator color={colors.ink} />
                : (
                  <>
                    <FileDown color={colors.ink} size={18} />
                    <Text className="font-semibold text-ink">{t('item.exportPdf')}</Text>
                  </>
                )}
            </Pressable>
          ) : (
            <Pressable
              onPress={() => router.push('/premium')}
              className="flex-row items-center justify-center gap-2 rounded-xl border border-gold py-4 active:opacity-70"
            >
              <Lock color={colors.gold} size={16} />
              <Text className="font-semibold text-gold">{t('item.pdfPremiumTitle')}</Text>
            </Pressable>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

function Row({ label, value, highlight }: {
  label: string;
  value: string | null | undefined;
  highlight?: boolean;
}) {
  return (
    <View className="flex-row justify-between border-b border-gray-200 dark:border-ink-mute py-2 last:border-0">
      <Text className="text-ink-mute dark:text-bone-soft">{label}</Text>
      <Text className={highlight ? 'font-semibold text-gold' : 'text-ink dark:text-bone'}>{value ?? '—'}</Text>
    </View>
  );
}
