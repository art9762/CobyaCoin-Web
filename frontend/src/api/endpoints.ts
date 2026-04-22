import { api } from "./client";
import type {
  User, Wallet, Market, MiningState, OrderRow, TradeRow,
  FeedItem, AuctionLot, LeaderRow, PublicConfig, SpinOutcome,
} from "../types";

// ===== Auth =====
export const publicConfig = () => api<PublicConfig>("/auth/config");
export const loginTelegram = (payload: Record<string, unknown>, ref_code?: string) =>
  api<{ access_token: string }>("/auth/telegram", { method: "POST", body: JSON.stringify({ payload, ref_code }) });
export const loginGoogle = (id_token: string, ref_code?: string) =>
  api<{ access_token: string }>("/auth/google", { method: "POST", body: JSON.stringify({ id_token, ref_code }) });
export const loginApple = (id_token: string, ref_code?: string) =>
  api<{ access_token: string }>("/auth/apple", { method: "POST", body: JSON.stringify({ id_token, ref_code }) });
export const me = () => api<User>("/auth/me");

// ===== Market =====
export const getMarket = () => api<Market>("/market");
export const recentTrades = () => api<TradeRow[]>("/market/trades");

// ===== Wallet =====
export const getWallet = () => api<Wallet>("/wallet");
export const getFeed = () => api<FeedItem[]>("/wallet/feed");

// ===== Exchange =====
export const getOrders = () => api<OrderRow[]>("/exchange/orders");
export const getMyOrders = () => api<OrderRow[]>("/exchange/orders/mine");
export const placeOrder = (side: "buy" | "sell", cbc: number, mpl: number) =>
  api<{ order_id: number; fills: number }>("/exchange/orders", {
    method: "POST",
    body: JSON.stringify({ side, cbc, mpl }),
  });
export const cancelOrder = (id: number) =>
  api<{ status: string }>(`/exchange/orders/${id}`, { method: "DELETE" });

// ===== Mining =====
export const getFarm = () => api<MiningState>("/mining");
export const collect = () => api<{ collected_cbc: number }>("/mining/collect", { method: "POST" });
export const buyGpu = () => api<MiningState>("/mining/gpus/buy", { method: "POST" });
export const sellGpu = () => api<MiningState>("/mining/gpus/sell", { method: "POST" });
export const upgradeFarm = () => api<MiningState>("/mining/upgrade", { method: "POST" });

// ===== Auction =====
export const listLots = () => api<AuctionLot[]>("/auction");
export const createLot = (body: {
  title: string; description?: string; rarity: string;
  image_emoji?: string; start_bid: number; duration_hours?: number;
}) => api<AuctionLot>("/auction", { method: "POST", body: JSON.stringify(body) });
export const bidLot = (id: number, amount: number) =>
  api<AuctionLot>(`/auction/${id}/bid`, { method: "POST", body: JSON.stringify({ amount }) });

// ===== Casino =====
export const getJackpot = () => api<{ mpl: number }>("/casino/jackpot");
export const spinRoulette = (bet: number, color: "red" | "black" | "green") =>
  api<SpinOutcome>("/casino/roulette", { method: "POST", body: JSON.stringify({ bet, color }) });
export const playCoinflip = (bet: number, pick: "heads" | "tails") =>
  api<SpinOutcome>("/casino/coinflip", { method: "POST", body: JSON.stringify({ bet, pick }) });
export const hallOfFame = () => api<Array<{ user: string; payout: number; game: string; created_at: string }>>("/casino/hall-of-fame");

// ===== Leaderboard =====
export const getLeaderboard = (by: "cbc" | "mpl" | "equity" | "trades" = "cbc") =>
  api<LeaderRow[]>(`/leaderboard?by=${by}`);

// ===== Profile =====
export const updateProfile = (body: { display_name?: string }) =>
  api<User>("/profile/me", { method: "PATCH", body: JSON.stringify(body) });
export const redeemPromo = (code: string) =>
  api<{ mpl: number; cbc: number }>("/profile/promo", { method: "POST", body: JSON.stringify({ code }) });
export const getDaily = () =>
  api<{ streak: number; can_claim: boolean; next_in_seconds: number }>("/profile/daily-bonus");
export const claimDaily = () =>
  api<{ streak: number; reward_mpl: number; reward_cbc: number }>("/profile/daily-bonus", { method: "POST" });
export const getReferrals = () =>
  api<{ code: string; count: number; total_bonus_mpl: number; recent: Array<{ handle: string; joined_at: string }> }>("/profile/referrals");

// ===== Admin =====
export const adminUsers = (q = "") =>
  api<Array<{
    id: number; handle: string; display_name: string; email: string | null;
    is_admin: boolean; is_banned: boolean; ban_reason: string;
    trades_count: number; cbc: number; mpl: number; joined_at: string;
  }>>(`/admin/users?q=${encodeURIComponent(q)}`);
export const adminBan = (id: number, is_banned: boolean, reason = "") =>
  api(`/admin/users/${id}/ban`, { method: "POST", body: JSON.stringify({ is_banned, reason }) });
export const adminGrant = (id: number, mpl: number, cbc: number, reason = "") =>
  api(`/admin/users/${id}/grant`, { method: "POST", body: JSON.stringify({ mpl, cbc, reason }) });
export const adminPromos = () => api<Array<{
  id: number; code: string; mpl_bonus: number; cbc_bonus: number;
  uses_remaining: number; per_user: number; active: boolean;
}>>("/admin/promo");
export const adminCreatePromo = (body: {
  code: string; mpl_bonus: number; cbc_bonus: number; uses: number; per_user: number;
}) => api("/admin/promo", { method: "POST", body: JSON.stringify(body) });
export const adminDisablePromo = (id: number) =>
  api(`/admin/promo/${id}`, { method: "DELETE" });
export const adminSetJackpot = (mpl: number) =>
  api("/admin/jackpot", { method: "POST", body: JSON.stringify({ mpl }) });
export const adminLots = () => api<Array<{
  id: number; title: string; rarity: string; status: string;
  is_featured: boolean; current_bid: number; ends_at: string; creator_id: number;
}>>("/admin/lots");
export const adminModerateLot = (id: number, status: string, featured?: boolean) =>
  api(`/admin/lots/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status, featured }),
  });
export const adminStats = () => api<{
  users: number; active_orders: number; trades: number; casino_spins: number;
  supply_cbc: number; supply_mpl: number;
}>("/admin/stats");
