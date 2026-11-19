import { useRef } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui';
import { uniqueIdField, useAddDraft } from '@/features/add/draft';

/** Scan QR : remplit l'identifiant unique, modifiable ensuite (décision P7). */
export default function AddScanScreen() {
  const { t } = useTranslation();
  const [permission, request] = useCameraPermissions();
  const { category, setField, set } = useAddDraft();
  const done = useRef(false);

  if (!permission) return <View className="flex-1" />;
  if (!permission.granted) {
    return (
      <View className="flex-1 justify-center px-6">
        <Text className="mb-6 text-center text-ink dark:text-bone">{t('v.add.qrPermission')}</Text>
        <Button label={t('v.add.qrAllow')} onPress={() => void request()} />
        <View className="mt-3"><Button label={t('v.add.manualEntry')} variant="link" onPress={() => router.replace('/add/form')} /></View>
      </View>
    );
  }
  return (
    <View className="flex-1">
      <CameraView
        style={{ flex: 1 }}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={({ data }) => {
          if (done.current || !data) return;
          done.current = true;
          const value = data.trim().slice(0, 120);
          setField(uniqueIdField(category), value);
          set({ scannedId: value });
          router.replace('/add/form');
        }}
      />
      <View className="absolute bottom-10 left-6 right-6">
        <Button label={t('v.add.manualEntry')} variant="secondary" onPress={() => router.replace('/add/form')} />
      </View>
    </View>
  );
}
