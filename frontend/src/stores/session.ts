import { create } from "zustand";
import type { User } from "../types";
import { setToken } from "../api/client";
import { me } from "../api/endpoints";

interface SessionState {
  user: User | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setSession: (token: string) => Promise<void>;
  logout: () => void;
}

export const useSession = create<SessionState>((set) => ({
  user: null,
  loading: true,
  error: null,

  refresh: async () => {
    set({ loading: true, error: null });
    try {
      const user = await me();
      set({ user, loading: false });
    } catch (e) {
      const err = e instanceof Error ? e.message : "failed";
      set({ user: null, loading: false, error: err });
    }
  },

  setSession: async (token: string) => {
    setToken(token);
    await useSession.getState().refresh();
  },

  logout: () => {
    setToken(null);
    set({ user: null, loading: false, error: null });
  },
}));
