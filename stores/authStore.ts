'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Profile, UserRole, Gym } from '@/types/database';

interface ImpersonationState {
  originalUserId: string | null;
  impersonatingGymId: string | null;
  impersonatingRole: UserRole | null;
}

interface AuthState {
  user: Profile | null;
  gym: Gym | null;
  isLoading: boolean;
  impersonation: ImpersonationState;

  // Actions
  setUser: (user: Profile | null) => void;
  setGym: (gym: Gym | null) => void;
  setLoading: (loading: boolean) => void;

  // Super Admin impersonation
  startImpersonation: (gymId: string, role: UserRole, originalUserId: string) => void;
  stopImpersonation: () => void;
  isImpersonating: () => boolean;

  // Helpers
  getEffectiveRole: () => UserRole | null;
  getEffectiveGymId: () => string | null;
  isSuperAdmin: () => boolean;
  isGymOwner: () => boolean;
  isStaff: () => boolean;
  isMember: () => boolean;

  // Reset
  reset: () => void;
}

const initialImpersonation: ImpersonationState = {
  originalUserId: null,
  impersonatingGymId: null,
  impersonatingRole: null,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      gym: null,
      isLoading: true,
      impersonation: initialImpersonation,

      setUser: (user) => set({ user }),
      setGym: (gym) => set({ gym }),
      setLoading: (isLoading) => set({ isLoading }),

      startImpersonation: (gymId, role, originalUserId) =>
        set({
          impersonation: {
            originalUserId,
            impersonatingGymId: gymId,
            impersonatingRole: role,
          },
        }),

      stopImpersonation: () =>
        set({ impersonation: initialImpersonation }),

      isImpersonating: () => {
        const { impersonation } = get();
        return impersonation.originalUserId !== null;
      },

      getEffectiveRole: () => {
        const { user, impersonation } = get();
        if (impersonation.impersonatingRole) {
          return impersonation.impersonatingRole;
        }
        return user?.role || null;
      },

      getEffectiveGymId: () => {
        const { user, gym, impersonation } = get();
        if (impersonation.impersonatingGymId) {
          return impersonation.impersonatingGymId;
        }
        return gym?.id || user?.gym_id || null;
      },

      isSuperAdmin: () => {
        const { user } = get();
        return user?.role === 'super_admin';
      },

      isGymOwner: () => {
        const role = get().getEffectiveRole();
        return role === 'gym_owner';
      },

      isStaff: () => {
        const role = get().getEffectiveRole();
        return role === 'gym_staff';
      },

      isMember: () => {
        const role = get().getEffectiveRole();
        return role === 'member';
      },

      reset: () =>
        set({
          user: null,
          gym: null,
          isLoading: false,
          impersonation: initialImpersonation,
        }),
    }),
    {
      name: 'gymsaas-auth',
      partialize: (state) => ({
        impersonation: state.impersonation,
      }),
    }
  )
);
