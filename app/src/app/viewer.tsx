import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { ChevronLeft, ChevronRight, RotateCw, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useCertificate, useItemDocuments, useMe } from '@/api/hooks';
import { Button } from '@/components/ui';
import { useScreenProtection } from '@/features/passport/useScreenProtection';
import { toBase64, viewerHtml } from '@/features/viewer/viewerHtml';
import { colors } from '@/lib/theme';

/**
 * Viewer sécurisé : lecture seule, zoom, rotation, pagination, plein écran, watermark utilisateur.
 * Aucun téléchargement. URL expirée → régénération silencieuse (UX_FLOWS §2.4).
 */
export default function ViewerScreen() {
  const { itemId, docId } = useLocalSearchParams<{ itemId: string; docId: string }>();
  const { t } = useTranslation();
  const isCert = docId === 'certificate';
  const cert = useCertificate(itemId, isCert);
  const docs = useItemDocuments(itemId);
  const me = useMe();
  const web = useRef<WebView>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [page, setPage] = useState({ page: 1, pages: 1 });
  const retried = useRef(false);
  useScreenProtection();

  const doc = isCert ? null : docs.data?.find((d) => d.id === docId);
  const source: { url: string; format: 'pdf' | 'image'; watermark: boolean } | null = isCert
    ? cert.data
      ? { url: cert.data.view_url, format: cert.data.document_format, watermark: cert.data.watermark }
      : null
    : doc?.view_url
      ? { url: doc.view_url, format: doc.document_format, watermark: doc.watermark }
      : null;
  const html = useMemo(() => (source ? viewerHtml(source.format, source.format === 'image' ? source.url : undefined) : null), [source?.url, source?.format]);

  const regenerate = () => {
    // Régénération silencieuse une fois, puis état d'erreur d'accès
    if (!retried.current) {
      retried.current = true;
      setState('loading');
      void (isCert ? cert.refetch() : docs.refetch());
    } else setState('error');
  };

  const loadPdf = async () => {
    if (!source || source.format !== 'pdf') return;
    try {
      const res = await fetch(source.url);
      if (!res.ok) throw new Error(String(res.status));
      const b64 = toBase64(await res.arrayBuffer());
      web.current?.injectJavaScript(`load(${JSON.stringify(b64)});true;`);
    } catch {
      regenerate();
    }
  };

  useEffect(() => { setState('loading'); }, [source?.url]);

  const failed = state === 'error' || cert.isError || docs.isError || (!isCert && docs.data && !doc?.view_url);
  const watermark = source?.watermark && me.data?.full_name ? me.data.full_name : null;

  return (
    <SafeAreaView className="flex-1 bg-ink">
      <View className="flex-row items-center justify-between px-4 py-2">
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('v.common.close')}>
          <X color={colors.bone} size={24} />
        </Pressable>
        {state === 'ready' ? (
          <View className="flex-row items-center gap-5">
            {page.pages > 1 ? (
              <>
                <Pressable onPress={() => web.current?.injectJavaScript('go(-1);true;')} hitSlop={8}><ChevronLeft color={colors.bone} size={22} /></Pressable>
                <Text className="text-bone">{t('v.viewer.page', page)}</Text>
                <Pressable onPress={() => web.current?.injectJavaScript('go(1);true;')} hitSlop={8}><ChevronRight color={colors.bone} size={22} /></Pressable>
              </>
            ) : null}
            <Pressable onPress={() => web.current?.injectJavaScript('rotate();true;')} hitSlop={8} accessibilityLabel={t('v.viewer.rotate')}>
              <RotateCw color={colors.bone} size={22} />
            </Pressable>
          </View>
        ) : null}
      </View>

      <View className="flex-1">
        {failed ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="mb-4 text-center text-bone">{t('v.viewer.error')}</Text>
            <Button label={t('v.common.retry')} variant="secondary" onPress={() => { retried.current = false; regenerate(); }} />
          </View>
        ) : html ? (
          <WebView
            ref={web}
            originWhitelist={['*']}
            source={{ html, baseUrl: 'https://localhost' }}
            onLoadEnd={() => void loadPdf()}
            onMessage={(e) => {
              const m = JSON.parse(e.nativeEvent.data) as { type: string; page?: number; pages?: number };
              if (m.type === 'ready') { setState('ready'); setPage({ page: 1, pages: m.pages ?? 1 }); }
              if (m.type === 'page') setPage({ page: m.page ?? 1, pages: m.pages ?? 1 });
              if (m.type === 'error') regenerate();
            }}
            allowFileAccess={false}
            allowsLinkPreview={false}
            setSupportMultipleWindows={false}
            onShouldStartLoadWithRequest={(r) => r.url === 'https://localhost/' || r.url.startsWith('about:') || r.url.startsWith('data:')}
            style={{ backgroundColor: colors.ink }}
          />
        ) : null}
        {state === 'loading' && !failed ? (
          <View className="absolute inset-0 items-center justify-center" pointerEvents="none"><ActivityIndicator color={colors.gold} /></View>
        ) : null}
        {watermark && state === 'ready' ? (
          <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
            <Text style={{ transform: [{ rotate: '-30deg' }], opacity: 0.12, fontSize: 28, color: colors.bone }}>{watermark}</Text>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
