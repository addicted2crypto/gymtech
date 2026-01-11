'use client';

import { create } from 'zustand';
import type { Gym, Class, MembershipPlan, FlashSale, SocialConnection } from '@/types/database';

interface GymState {
  // Current gym data
  gym: Gym | null;
  classes: Class[];
  plans: MembershipPlan[];
  flashSales: FlashSale[];
  socialConnections: SocialConnection[];

  // UI State
  isLoading: boolean;

  // Actions
  setGym: (gym: Gym | null) => void;
  setClasses: (classes: Class[]) => void;
  setPlans: (plans: MembershipPlan[]) => void;
  setFlashSales: (sales: FlashSale[]) => void;
  setSocialConnections: (connections: SocialConnection[]) => void;
  setLoading: (loading: boolean) => void;

  // Helpers
  hasConnectedPlatform: (platform: string) => boolean;
  getActiveFlashSales: () => FlashSale[];

  // Reset
  reset: () => void;
}

export const useGymStore = create<GymState>()((set, get) => ({
  gym: null,
  classes: [],
  plans: [],
  flashSales: [],
  socialConnections: [],
  isLoading: false,

  setGym: (gym) => set({ gym }),
  setClasses: (classes) => set({ classes }),
  setPlans: (plans) => set({ plans }),
  setFlashSales: (flashSales) => set({ flashSales }),
  setSocialConnections: (socialConnections) => set({ socialConnections }),
  setLoading: (isLoading) => set({ isLoading }),

  hasConnectedPlatform: (platform) => {
    const { socialConnections } = get();
    return socialConnections.some(c => c.platform === platform);
  },

  getActiveFlashSales: () => {
    const { flashSales } = get();
    const now = new Date().toISOString();
    return flashSales.filter(
      sale => sale.is_active && sale.valid_from <= now && sale.valid_until >= now
    );
  },

  reset: () =>
    set({
      gym: null,
      classes: [],
      plans: [],
      flashSales: [],
      socialConnections: [],
      isLoading: false,
    }),
}));
