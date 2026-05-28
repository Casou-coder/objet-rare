import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';

// .env: EXPO_PUBLIC_REVENUECAT_IOS_KEY / EXPO_PUBLIC_REVENUECAT_ANDROID_KEY
const RC_API_KEY_IOS     = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY     ?? '';
const RC_API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '';

export const ENTITLEMENT_PREMIUM = 'Rarity Locker Pro';

export type { CustomerInfo, PurchasesOffering, PurchasesPackage };

export type RCOffering = PurchasesOffering;
export type RCPackage  = PurchasesPackage;

let configured = false;

export function initPurchases(): void {
  if (configured) return;
  const apiKey = Platform.OS === 'ios' ? RC_API_KEY_IOS : RC_API_KEY_ANDROID;
  if (!apiKey) return;
  try {
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);
    Purchases.configure({ apiKey });
    configured = true;
  } catch {
    // native module absent (Expo Go)
  }
}

export async function loginPurchases(userId: string): Promise<CustomerInfo> {
  const { customerInfo } = await Purchases.logIn(userId);
  return customerInfo;
}

export async function logoutPurchases(): Promise<CustomerInfo> {
  return Purchases.logOut();
}

export async function getOfferings(): Promise<PurchasesOffering | null> {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch {
    return null;
  }
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

export async function restorePurchases(): Promise<CustomerInfo> {
  return Purchases.restorePurchases();
}

export async function getCustomerInfo(): Promise<CustomerInfo> {
  return Purchases.getCustomerInfo();
}

export function isPremiumEntitled(info: CustomerInfo): boolean {
  return ENTITLEMENT_PREMIUM in info.entitlements.active;
}
