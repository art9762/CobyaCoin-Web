import { create } from "zustand";
import type { Market } from "../types";
import { getMarket } from "../api/endpoints";
import { wsUrl } from "../api/client";

interface MarketStore {
  market: Market | null;
  connect: () => () => void;
  refresh: () => Promise<void>;
}

export const useMarket = create<MarketStore>((set, get) => ({
  market: null,

  refresh: async () => {
    try {
      const m = await getMarket();
      set({ market: m });
    } catch {
      // ignore
    }
  },

  connect: () => {
    let ws: WebSocket | null = null;
    let cancelled = false;
    let reconnectTimer: number | undefined;

    const open = () => {
      if (cancelled) return;
      void get().refresh();
      ws = new WebSocket(wsUrl());
      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data as string);
          if (msg.type === "market") {
            const prev = get().market;
            set({
              market: {
                price: msg.price,
                prev_price: msg.prev_price,
                reserve_liq_mpl: msg.reserve_liq_mpl,
                reserve_liq_cbc: msg.reserve_liq_cbc,
                circuit: msg.circuit,
                day_change_pct: prev?.day_change_pct ?? 0,
                ticks: prev ? [...prev.ticks.slice(-239), msg.price] : [msg.price],
              },
            });
          }
        } catch {
          // ignore
        }
      };
      ws.onclose = () => {
        if (cancelled) return;
        reconnectTimer = window.setTimeout(open, 2000);
      };
    };

    open();
    return () => {
      cancelled = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  },
}));
