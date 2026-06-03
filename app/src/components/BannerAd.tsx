import { Platform, View } from 'react-native';
import {
  BannerAd as AdMobBanner,
  BannerAdSize,
  TestIds,
} from 'react-native-google-mobile-ads';
import { usePlan } from '@/features/premium/usePlan';

// Fill these after creating ad units in AdMob console
// Format: ca-app-pub-XXXXXXXXXXXXXXXX/NNNNNNNNNN
const ANDROID_BANNER_ID = process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER_ID ?? TestIds.BANNER;
const IOS_BANNER_ID     = process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER_ID     ?? TestIds.BANNER;

const AD_UNIT_ID = Platform.OS === 'ios' ? IOS_BANNER_ID : ANDROID_BANNER_ID;

export function BannerAd() {
  const { isPremium } = usePlan();

  if (isPremium) return null;

  return (
    <View className="items-center my-2">
      <AdMobBanner
        unitId={AD_UNIT_ID}
        size={BannerAdSize.BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: false }}
      />
    </View>
  );
}
