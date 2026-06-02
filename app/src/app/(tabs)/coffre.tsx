import { useState, useMemo, useEffect, useRef, memo } from 'react';
import {
  View, Text, FlatList, Pressable, ActivityIndicator, Alert,
  Modal, ScrollView, Animated, PanResponder, TextInput,
} from 'react-native';
import { BannerAd } from '@/components/BannerAd';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
  FileText, Receipt, Award, ShieldCheck,
  Plus, X, Layers, Clock, Download, Trash2, Pencil, Check,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useDocuments, useUploadDocument, useDeleteDocument, useRenameDocument, useUpdateDocumentExpiry } from '@/features/documents/hooks';
import { OcrBadge } from '@/features/documents/OcrBadge';
import { getDocumentUrl } from '@/features/documents/api';
import { useItems } from '@/features/items/hooks';
import { useAuth } from '@/stores/auth';
import { DatePickerField } from '@/lib/DatePickerField';
import { requestNotificationPermission, scheduleWarrantyNotifications, cancelWarrantyNotifications, daysUntil } from '@/lib/notifications';
import { i18n } from '@/lib/i18n';
import { colors } from '@/lib/theme';
import { haptic } from '@/lib/haptics';
import type { DocumentRow, DocumentType } from '@/types/database';

const TYPE_META: Record<DocumentType, { icon: React.ComponentType<{ color: string; size: number }> }> = {
  invoice:     { icon: Receipt },
  certificate: { icon: Award },
  warranty:    { icon: ShieldCheck },
  other:       { icon: FileText },
};

const OCR_KEY_MAP: Record<string, string> = {
  amount: 'amount', total_amount: 'totalAmount', price: 'price', total: 'total',
  date: 'date', invoice_date: 'invoiceDate', issued_at: 'issuedOn',
  expiry_date: 'expiryDate', warranty_expires: 'warrantyUntil',
  vendor: 'seller', seller: 'seller', buyer: 'buyer',
  description: 'description', brand: 'brand', model: 'model',
  serial_number: 'serialNumber', reference: 'reference',
  currency: 'currency', invoice_number: 'invoiceNumber', certificate_number: 'certNumber',
  condition: 'condition', authenticity: 'authenticity', notes: 'notes',
};


function SkeletonDocRow() {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);
  return (
    <Animated.View style={{ opacity }} className="mb-3 flex-row items-center gap-3 rounded-2xl border border-gray-200 dark:border-ink-mute bg-white dark:bg-ink-soft p-4">
      <View className="h-10 w-10 rounded-xl bg-bone-soft dark:bg-ink-mute" />
      <View className="flex-1 gap-2">
        <View className="h-4 w-40 rounded bg-bone-soft dark:bg-ink-mute" />
        <View className="h-3 w-24 rounded bg-bone-soft dark:bg-ink-mute" />
      </View>
    </Animated.View>
  );
}

const DocRow = memo(function DocRow({ doc, onPress }: { doc: DocumentRow; onPress: () => void }) {
  const { t } = useTranslation();
  const meta = TYPE_META[doc.type];
  const Icon = meta.icon;
  const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';
  const date = new Date(doc.created_at).toLocaleDateString(locale, {
    day: 'numeric', month: 'short', year: 'numeric',
  });
  const days = doc.expires_at ? daysUntil(doc.expires_at) : null;
  return (
    <Pressable
      onPress={onPress}
      className="mb-3 flex-row items-center rounded-2xl border border-gray-200 dark:border-ink-mute bg-white dark:bg-ink-soft p-4 active:opacity-75"
    >
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-bone dark:bg-ink">
        <Icon color={days !== null && days <= 30 ? '#F59E0B' : colors.gold} size={20} />
      </View>
      <View className="flex-1">
        <Text className="text-ink dark:text-bone" numberOfLines={1}>{doc.filename}</Text>
        <View className="mt-1 flex-row items-center gap-3">
          <Text className="text-xs text-ink-mute dark:text-bone-soft">
            {t(`coffre.docTypeLabels.${doc.type}`)} · {date}
          </Text>
          <OcrBadge status={doc.ocr_status} />
          {days !== null && days <= 60 && (
            <View className={`rounded-full px-2 py-0.5 ${days <= 7 ? 'bg-red-100' : 'bg-amber-100'}`}>
              <Text className={`text-xs font-medium ${days <= 7 ? 'text-red-600' : 'text-amber-600'}`}>
                {days <= 0 ? t('coffre.expired') : t('coffre.expiresIn', { days })}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
});

function DocDetailModal({
  doc,
  onClose,
  onDownload,
  onDelete,
  itemName,
}: {
  doc: DocumentRow | null;
  onClose: () => void;
  onDownload: (doc: DocumentRow) => void;
  onDelete: (doc: DocumentRow) => void;
  itemName?: string;
}) {
  const { t } = useTranslation();
  const { mutateAsync: updateExpiry, isPending: isUpdatingExpiry } = useUpdateDocumentExpiry();
  const { mutateAsync: rename } = useRenameDocument();
  const [localExpiry, setLocalExpiry] = useState<string | undefined>(undefined);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [currentFilename, setCurrentFilename] = useState(doc?.filename ?? '');
  const dragY = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, { dy, dx }) => dy > 5 && dy > Math.abs(dx),
      onPanResponderMove: (_, { dy }) => { if (dy > 0) dragY.setValue(dy); },
      onPanResponderRelease: (_, { dy, vy }) => {
        if (dy > 80 || vy > 0.8) {
          Animated.timing(dragY, { toValue: 500, duration: 200, useNativeDriver: true }).start(() => {
            dragY.setValue(0);
            onClose();
          });
        } else {
          Animated.spring(dragY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    setLocalExpiry(doc?.expires_at ?? undefined);
    setCurrentFilename(doc?.filename ?? '');
    setIsRenaming(false);
  }, [doc?.id]);

  if (!doc) return null;
  const meta = TYPE_META[doc.type];
  const Icon = meta.icon;
  const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';
  const date = new Date(doc.created_at).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
  const ocrEntries = doc.ocr_data
    ? Object.entries(doc.ocr_data).filter(([k, v]) => k !== 'raw_text' && v != null && v !== '')
    : [];

  const handleExpiryChange = async (iso: string | undefined) => {
    setLocalExpiry(iso);
    try {
      await updateExpiry({ id: doc.id, expiresAt: iso ?? null });
      if (iso && itemName) {
        const granted = await requestNotificationPermission();
        if (granted) await scheduleWarrantyNotifications(doc.id, itemName, iso);
      } else {
        await cancelWarrantyNotifications(doc.id);
      }
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message ?? t('coffre.saveExpiryError'));
    }
  };

  const handleRename = async () => {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === currentFilename) { setIsRenaming(false); return; }
    try {
      await rename({ id: doc.id, filename: trimmed });
      haptic.success();
      setCurrentFilename(trimmed);
      setIsRenaming(false);
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message ?? t('coffre.renameError'));
    }
  };

  const confirmDelete = () => {
    haptic.error();
    Alert.alert(t('coffre.deleteConfirmTitle', { filename: doc.filename }), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'), style: 'destructive', onPress: async () => {
          await cancelWarrantyNotifications(doc.id);
          onClose();
          onDelete(doc);
        },
      },
    ]);
  };

  const days = localExpiry ? daysUntil(localExpiry) : null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <Pressable className="absolute inset-0" onPress={onClose} />
        <Animated.View
          className="rounded-t-3xl bg-white dark:bg-ink-soft"
          style={{ maxHeight: '85%', transform: [{ translateY: dragY }] }}
        >
        <ScrollView
          contentContainerClassName="px-6 pb-10"
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-row items-center justify-end pt-4 mb-4" {...panResponder.panHandlers}>
            <View className="absolute left-0 right-0 items-center">
              <View className="h-1 w-10 rounded-full bg-gray-200 dark:bg-ink-mute" />
            </View>
            <Pressable onPress={onClose} className="active:opacity-70 p-1">
              <X color={colors.inkGray} size={20} />
            </Pressable>
          </View>

          <View className="mb-5 flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-bone dark:bg-ink">
              <Icon color={days !== null && days <= 30 ? '#F59E0B' : colors.gold} size={20} />
            </View>
            <View className="flex-1">
              {isRenaming ? (
                <TextInput
                  value={renameValue}
                  onChangeText={setRenameValue}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleRename}
                  placeholderTextColor={colors.inkGray}
                  className="border-b border-gold pb-0.5 font-medium text-ink dark:text-bone"
                />
              ) : (
                <Text className="font-medium text-ink dark:text-bone" numberOfLines={1}>{currentFilename}</Text>
              )}
              <Text className="text-xs text-ink-mute dark:text-bone-soft mt-0.5">
                {t(`coffre.docTypeLabels.${doc.type}`)} · {date}
              </Text>
            </View>
            {isRenaming ? (
              <View className="flex-row items-center gap-3">
                <Pressable onPress={handleRename} hitSlop={8} className="active:opacity-70">
                  <Check color={colors.gold} size={20} />
                </Pressable>
                <Pressable onPress={() => setIsRenaming(false)} hitSlop={8} className="active:opacity-70">
                  <X color={colors.inkGray} size={20} />
                </Pressable>
              </View>
            ) : (
              <View className="flex-row items-center gap-3">
                <Pressable
                  onPress={() => { setRenameValue(currentFilename); setIsRenaming(true); }}
                  hitSlop={8}
                  className="active:opacity-70"
                >
                  <Pencil color={colors.inkGray} size={16} />
                </Pressable>
                <OcrBadge status={doc.ocr_status} />
              </View>
            )}
          </View>

          {/* Expiry date — warranty only */}
          {doc.type === 'warranty' && (
            <View className="mb-5">
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-xs uppercase tracking-wider text-gold">
                  {t('coffre.extractedFields.expiryDate')}
                </Text>
                {isUpdatingExpiry && <ActivityIndicator size="small" color={colors.gold} />}
                {days !== null && (
                  <View className={`rounded-full px-2 py-0.5 ${days <= 0 ? 'bg-red-100' : days <= 7 ? 'bg-red-100' : days <= 30 ? 'bg-amber-100' : 'bg-green-100'}`}>
                    <Text className={`text-xs font-medium ${days <= 0 ? 'text-red-600' : days <= 7 ? 'text-red-600' : days <= 30 ? 'text-amber-600' : 'text-green-600'}`}>
                      {days <= 0 ? t('coffre.expired') : t('coffre.expiresIn', { days })}
                    </Text>
                  </View>
                )}
              </View>
              <DatePickerField
                value={localExpiry}
                onChange={handleExpiryChange}
                placeholder={t('coffre.setExpiry')}
                maximumDate={undefined}
                minimumDate={new Date()}
              />
            </View>
          )}

          {/* OCR data */}
          {doc.ocr_status === 'done' && ocrEntries.length > 0 ? (
            <View className="mb-5">
              <Text className="mb-2 text-xs uppercase tracking-wider text-gold">{t('coffre.extractedData')}</Text>
              {ocrEntries.map(([key, value]) => {
                const tKey = OCR_KEY_MAP[key];
                const label = tKey ? t(`coffre.extractedFields.${tKey}`, { defaultValue: key }) : key;
                return (
                  <View key={key} className="flex-row items-start justify-between border-b border-gray-100 dark:border-ink-mute py-2.5">
                    <Text className="text-sm text-ink-mute dark:text-bone-soft">{label}</Text>
                    <Text className="ml-4 flex-1 text-right text-sm font-medium text-ink dark:text-bone" numberOfLines={2}>
                      {String(value)}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : doc.ocr_status === 'pending' ? (
            <View className="mb-5 flex-row items-center gap-2">
              <Clock color={colors.inkGray} size={14} />
              <Text className="text-sm text-ink-mute dark:text-bone-soft">{t('coffre.analyzing')}</Text>
            </View>
          ) : doc.ocr_status === 'failed' ? (
            <View className="mb-5">
              <Text className="text-sm text-red-400">{t('coffre.ocrFailed')}</Text>
            </View>
          ) : null}

          <View className="flex-row gap-3">
            <Pressable
              onPress={() => { onClose(); onDownload(doc); }}
              className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-ink-mute py-3 active:opacity-70"
            >
              <Download color={colors.inkGray} size={16} />
              <Text className="text-ink-mute dark:text-bone-soft">{t('common.download')}</Text>
            </Pressable>
            <Pressable
              onPress={confirmDelete}
              className="flex-row items-center justify-center gap-2 rounded-xl border border-red-200 dark:border-red-900/50 px-5 py-3 active:opacity-70"
            >
              <Trash2 color="#EF4444" size={16} />
              <Text className="text-red-400">{t('common.delete')}</Text>
            </Pressable>
          </View>
        </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function UploadModal({
  visible,
  onClose,
  onUpload,
  items,
  contextItemId,
  loading,
}: {
  visible: boolean;
  onClose: () => void;
  onUpload: (type: DocumentType, itemId: string) => void;
  items: { id: string; name: string }[];
  contextItemId?: string;
  loading: boolean;
}) {
  const { t } = useTranslation();
  const [type, setType] = useState<DocumentType>('invoice');
  const [itemId, setItemId] = useState<string | undefined>(contextItemId);

  const handleOpen = () => setItemId(contextItemId ?? items[0]?.id);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onShow={handleOpen}
    >
      <View className="flex-1 justify-end bg-black/60">
        <View className="rounded-t-3xl bg-white dark:bg-ink-soft px-6 pb-10 pt-4">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="font-serif text-xl text-ink dark:text-bone">{t('coffre.addDocument')}</Text>
            <Pressable onPress={onClose}><X color={colors.inkGray} size={22} /></Pressable>
          </View>

          {/* Type */}
          <Text className="mb-2 text-xs uppercase tracking-wider text-gold">{t('coffre.docType')}</Text>
          <View className="mb-4 flex-row flex-wrap gap-2">
            {(Object.keys(TYPE_META) as DocumentType[]).map((docType) => (
              <Pressable
                key={docType}
                onPress={() => setType(docType)}
                className={`rounded-xl border px-4 py-2 ${type === docType ? 'border-gold bg-gold/10' : 'border-gray-200 dark:border-ink-mute'}`}
              >
                <Text className={type === docType ? 'text-gold' : 'text-ink-mute dark:text-bone-soft'}>
                  {t(`coffre.docTypeLabels.${docType}`)}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Associated item — required */}
          <Text className="mb-2 text-xs uppercase tracking-wider text-gold">
            {t('coffre.associatedItem')} <Text className="text-red-400">*</Text>
          </Text>
          {items.length === 0 ? (
            <View className="mb-4 rounded-xl border border-gray-200 dark:border-ink-mute bg-bone dark:bg-ink p-3">
              <Text className="text-sm text-ink-mute dark:text-bone-soft">
                {t('coffre.noItems')}{'\n'}{t('coffre.noItemsHint')}
              </Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              {items.map((it) => (
                <Pressable
                  key={it.id}
                  onPress={() => setItemId(it.id)}
                  className={`mr-2 rounded-xl border px-4 py-2 ${itemId === it.id ? 'border-gold bg-gold/10' : 'border-gray-200 dark:border-ink-mute'}`}
                >
                  <Text className={itemId === it.id ? 'text-gold' : 'text-ink-mute dark:text-bone-soft'}>{it.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          <Pressable
            onPress={() => itemId && onUpload(type, itemId)}
            disabled={loading || !itemId}
            className={`items-center rounded-xl py-4 ${itemId ? 'bg-gold active:opacity-80' : 'bg-gray-200 dark:bg-ink-mute'}`}
          >
            {loading
              ? <ActivityIndicator color={colors.ink} />
              : <Text className={`font-semibold ${itemId ? 'text-ink' : 'text-ink-mute dark:text-bone-soft'}`}>
                  {t('coffre.chooseFile')}
                </Text>}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function CoffreScreen() {
  const { t } = useTranslation();
  const { itemId } = useLocalSearchParams<{ itemId?: string }>();
  const { user } = useAuth();
  const [filter, setFilter] = useState<DocumentType | 'all'>('all');
  const [uploadVisible, setUploadVisible] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentRow | null>(null);

  const { data: docs, isLoading, refetch, isRefetching } = useDocuments(itemId);
  const { data: items } = useItems();
  const { mutateAsync: upload, isPending: uploading } = useUploadDocument();
  const { mutate: remove } = useDeleteDocument();

  const FILTERS = useMemo(() => [
    { key: 'all' as DocumentType | 'all',         label: t('coffre.docTypes.all'),         icon: Layers },
    { key: 'invoice' as DocumentType | 'all',     label: t('coffre.docTypes.invoice'),     icon: Receipt },
    { key: 'certificate' as DocumentType | 'all', label: t('coffre.docTypes.certificate'), icon: Award },
    { key: 'warranty' as DocumentType | 'all',    label: t('coffre.docTypes.warranty'),    icon: ShieldCheck },
    { key: 'other' as DocumentType | 'all',       label: t('coffre.docTypes.other'),       icon: FileText },
  ], [t]);

  const filtered = useMemo(
    () => filter === 'all' ? docs ?? [] : (docs ?? []).filter((d) => d.type === filter),
    [docs, filter],
  );
  const contextItem = itemId ? items?.find((it) => it.id === itemId) : undefined;

  const handleDownload = async (doc: DocumentRow) => {
    try {
      const url = await getDocumentUrl(doc.storage_path);
      const localUri = ((FileSystem as any).cacheDirectory ?? '') + doc.filename;
      const { uri } = await FileSystem.downloadAsync(url, localUri);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { dialogTitle: doc.filename });
      } else {
        Alert.alert('Info', t('coffre.shareUnavailable'));
      }
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message ?? t('coffre.downloadError'));
    }
  };

  const handleUpload = async (type: DocumentType, linkedItemId: string) => {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) return;
    const file = result.assets[0];
    setUploadVisible(false);
    try {
      await upload({
        uri: file.uri,
        filename: file.name,
        mimeType: file.mimeType ?? 'application/octet-stream',
        type,
        itemId: linkedItemId,
        ownerId: user!.id,
      });
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message ?? t('coffre.uploadError'));
    }
  };

  const docCount = docs?.length ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-bone dark:bg-ink" edges={['top']}>
      <DocDetailModal
        doc={selectedDoc}
        onClose={() => setSelectedDoc(null)}
        onDownload={handleDownload}
        onDelete={(doc) => remove({ id: doc.id, storagePath: doc.storage_path })}
        itemName={selectedDoc?.item_id ? items?.find((it) => it.id === selectedDoc.item_id)?.name : undefined}
      />
      <UploadModal
        visible={uploadVisible}
        onClose={() => setUploadVisible(false)}
        onUpload={handleUpload}
        items={(items ?? []).map((it) => ({ id: it.id, name: it.name }))}
        contextItemId={itemId}
        loading={uploading}
      />

      {/* Header */}
      <View className="px-6 pb-2 pt-2">
        <Text className="font-serif text-3xl text-ink dark:text-bone">{t('coffre.title')}</Text>
        {contextItem ? (
          <Pressable
            onPress={() => router.setParams({ itemId: undefined })}
            className="mt-1 flex-row items-center gap-2"
          >
            <Text className="text-ink-mute dark:text-bone-soft">{t('coffre.filterLabel', { itemName: contextItem.name })}</Text>
            <X color={colors.inkGray} size={14} />
          </Pressable>
        ) : (
          <Text className="mt-1 text-ink-mute dark:text-bone-soft">
            {t('coffre.document', { count: docCount })}
          </Text>
        )}
      </View>

      {/* Filters */}
      <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-3 px-6"
        contentContainerClassName="gap-2"
      >
        {FILTERS.map((f) => {
          const active = filter === f.key;
          const Icon = f.icon;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              className={`flex-row items-center gap-1.5 rounded-xl border px-3 py-2 ${active ? 'border-gold bg-gold/10' : 'border-gray-200 dark:border-ink-mute bg-white dark:bg-ink-soft'}`}
            >
              <Icon color={active ? colors.gold : colors.inkGray} size={14} />
              <Text className={`text-sm ${active ? 'text-gold' : 'text-ink-mute dark:text-bone-soft'}`}>{f.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      </View>

      {/* List */}
      {isLoading ? (
        <View className="px-6 pt-2">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonDocRow key={i} />)}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(d) => d.id}
          renderItem={({ item: doc }) => (
            <DocRow doc={doc} onPress={() => setSelectedDoc(doc)} />
          )}
          contentContainerClassName="px-6 pb-24"
          refreshing={isRefetching}
          onRefresh={refetch}
          removeClippedSubviews
          maxToRenderPerBatch={10}
          ListEmptyComponent={
            <View className="mt-20 items-center px-6">
              <Text className="text-center text-ink-mute dark:text-bone-soft">
                {filter === 'all'
                  ? contextItem
                    ? t('coffre.noDocsForItem', { itemName: contextItem.name })
                    : t('coffre.emptyVault')
                  : t('coffre.noDocsOfType', { type: FILTERS.find((f) => f.key === filter)?.label })}
              </Text>
            </View>
          }
          ListFooterComponent={<BannerAd />}
        />
      )}

      {/* FAB */}
      <Pressable
        onPress={() => setUploadVisible(true)}
        className="absolute bottom-8 right-6 h-14 w-14 items-center justify-center rounded-full bg-gold shadow-lg active:opacity-80"
      >
        <Plus color={colors.ink} size={26} />
      </Pressable>
    </SafeAreaView>
  );
}
