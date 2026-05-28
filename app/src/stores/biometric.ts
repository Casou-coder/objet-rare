import { create } from 'zustand';

interface BiometricState {
  locked: boolean;
  lock: () => void;
  unlock: () => void;
}

export const useBiometric = create<BiometricState>((set) => ({
  locked: false,
  lock: () => set({ locked: true }),
  unlock: () => set({ locked: false }),
}));
