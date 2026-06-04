import { Platform, View } from 'react-native';
import Constants from 'expo-constants';
import { usePlan } from '@/features/premium/usePlan';

// react-native-google-mobile-ads requires native module absent in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

let AdMobBanner: React.ComponentType<any> | null = null;
let BannerAdSize: any = null;
let TestIds: any = null;

if (!isExpoGo) {
  const ads = require('react-native-google-mobile-ads');
  AdMobBanner = ads.BannerAd;
  BannerAdSize = ads.BannerAdSize;
  TestIds = ads.TestIds;
}

const ANDROID_BANNER_ID = process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER_ID ?? TestIds?.ADAPTIVE_BANNER;
const IOS_BANNER_ID     = process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER_ID     ?? TestIds?.ADAPTIVE_BANNER;
const AD_UNIT_ID        = Platform.OS === 'ios' ? IOS_BANNER_ID : ANDROID_BANNER_ID;

export function BannerAd() {
  const { isPremium } = usePlan();

  if (isPremium || isExpoGo || !AdMobBanner) return null;

  return (
    <View className="items-center py-2">
      <AdMobBanner
        unitId={AD_UNIT_ID}
        size={BannerAdSize.ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: false }}
        onAdFailedToLoad={() => {}}
      />
    </View>
  );
}
