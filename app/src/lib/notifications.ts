import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { i18n } from './i18n';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('warranty', {
      name: i18n.t('notify.warrantyChannelName'),
      description: i18n.t('notify.warrantyChannelDesc'),
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const existing = await Notifications.getPermissionsAsync();
  if ((existing as any).granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return !!(requested as any).granted;
}

export async function scheduleWarrantyNotifications(
  docId: string,
  itemName: string,
  expiresAt: string,
): Promise<void> {
  await cancelWarrantyNotifications(docId);

  const expiry = new Date(`${expiresAt}T00:00:00`);
  const now = new Date();

  const schedule = async (daysBeforeLabel: '30' | '7', daysBefore: number) => {
    const trigger = new Date(expiry);
    trigger.setDate(trigger.getDate() - daysBefore);
    trigger.setHours(9, 0, 0, 0);
    if (trigger <= now) return;
    await Notifications.scheduleNotificationAsync({
      identifier: `warranty-${daysBeforeLabel}-${docId}`,
      content: {
        title: i18n.t('notify.warrantyTitle'),
        body: i18n.t('notify.warrantyBody', { itemName, count: daysBefore }),
        data: { docId },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: trigger,
      },
    });
  };

  await schedule('30', 30);
  await schedule('7', 7);
}

export async function cancelWarrantyNotifications(docId: string): Promise<void> {
  await Promise.allSettled([
    Notifications.cancelScheduledNotificationAsync(`warranty-30-${docId}`),
    Notifications.cancelScheduledNotificationAsync(`warranty-7-${docId}`),
  ]);
}

export function daysUntil(isoDate: string): number {
  const expiry = new Date(`${isoDate}T00:00:00`);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}
