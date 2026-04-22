import { create } from "zustand";

export interface Toast {
  id: number;
  emoji?: string;
  text: string;
  tint?: "neutral" | "success" | "danger";
}

interface ToastState {
  toasts: Toast[];
  show: (t: Omit<Toast, "id">) => void;
  dismiss: (id: number) => void;
}

export const useToasts = create<ToastState>((set, get) => ({
  toasts: [],
  show: (t) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    set({ toasts: [...get().toasts, { id, ...t }] });
    setTimeout(() => get().dismiss(id), 3600);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));
