import { usePreventScreenCapture } from 'expo-screen-capture';

/**
 * Anti-capture d'écran sur le passeport et le viewer (décision P16).
 * Android : capture bloquée par le système. iOS : enregistrement d'écran masqué.
 */
export function useScreenProtection(): void {
  usePreventScreenCapture('passport');
}
