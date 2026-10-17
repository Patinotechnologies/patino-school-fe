import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  token: string | null;
  /** True once the persisted token has been read back from localStorage on the client. */
  hasHydrated: boolean;
  setToken: (token: string) => void;
  clearToken: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      hasHydrated: false,
      setToken: (token) => set({ token }),
      clearToken: () => set({ token: null }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "patino-auth-token",
      partialize: (state) => ({ token: state.token }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
