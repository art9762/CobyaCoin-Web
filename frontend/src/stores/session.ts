import { create } from "zustand";
import type { User } from "../types";
import { ApiError, getToken, setToken } from "../api/client";
import { me } from "../api/endpoints";

interface SessionState {
  user: User | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<boolean>;
  setSession: (token: string) => Promise<void>;
  logout: () => void;
}

let revision = 0;
let pending: { token: string; revision: number; promise: Promise<boolean> } | null = null;

export const useSession = create<SessionState>((set, get) => ({
  user: null,
  loading: true,
  error: null,

  refresh: () => {
    const token = getToken();
    if (!token) {
      get().logout();
      return Promise.resolve(false);
    }
    if (pending?.token === token && pending.revision === revision) return pending.promise;

    const currentRevision = revision;
    set({ loading: true, error: null });
    const isCurrent = () => currentRevision === revision && getToken() === token;
    const promise = (async () => {
      try {
        const user = await me();
        if (!isCurrent()) {
          if (currentRevision === revision && !getToken()) get().logout();
          return false;
        }
        set({ user, loading: false, error: null });
        return true;
      } catch (e) {
        if (currentRevision !== revision) return false;
        if (!getToken() || (e instanceof ApiError && e.status === 401 && isCurrent())) {
          get().logout();
        } else if (isCurrent()) {
          const error = e instanceof Error ? e.message : "Не удалось проверить сессию";
          set({ user: null, loading: false, error });
        }
        return false;
      } finally {
        if (pending?.revision === currentRevision && pending.token === token) pending = null;
      }
    })();
    pending = { token, revision: currentRevision, promise };
    return promise;
  },

  setSession: async (token: string) => {
    const currentRevision = ++revision;
    pending = null;
    setToken(token);
    set({ user: null, loading: true, error: null });
    const restored = await get().refresh();
    if (!restored || currentRevision !== revision) {
      throw new Error(get().error ?? "Не удалось подтвердить сессию. Попробуйте войти снова.");
    }
  },

  logout: () => {
    revision++;
    pending = null;
    setToken(null);
    set({ user: null, loading: false, error: null });
  },
}));
