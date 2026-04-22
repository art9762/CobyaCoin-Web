export interface User {
  id: number;
  handle: string;
  display_name: string;
  avatar_url: string;
  email: string | null;
  is_admin: boolean;
  is_banned: boolean;
  joined_at: string;
  trades_count: number;
  referral_code: string;
}

export interface Wallet {
  cbc: number;
  mpl: number;
  frozen_cbc: number;
  frozen_mpl: number;
  equity_mpl: number;
}

export interface Market {
  price: number;
  prev_price: number;
  reserve_liq_mpl: number;
  reserve_liq_cbc: number;
  circuit: string | null;
  day_change_pct: number;
  ticks: number[];
}

export interface MiningState {
  level: number;
  gpus: number;
  max_gpus: number;
  pending: number;
  rate: number;
  hourly: number;
  daily: number;
}

export interface OrderRow {
  id: number;
  user_handle: string;
  side: "buy" | "sell";
  cbc: number;
  mpl: number;
  price: number;
  filled_cbc: number;
  status: string;
  created_at: string;
}

export interface TradeRow {
  id: number;
  buyer_handle: string;
  seller_handle: string;
  cbc: number;
  mpl: number;
  price: number;
  counterparty: string;
  created_at: string;
}

export interface FeedItem {
  id: number;
  emoji: string;
  text: string;
  scope: string;
  created_at: string;
}

export interface AuctionLot {
  id: number;
  title: string;
  description: string;
  rarity: "common" | "rare" | "legendary" | "mythic";
  image_emoji: string;
  current_bid: number;
  current_bidder_handle: string | null;
  ends_at: string;
  status: string;
  is_featured: boolean;
  creator_handle: string;
}

export interface LeaderRow {
  rank: number;
  user_id: number;
  handle: string;
  display_name: string;
  cbc: number;
  mpl: number;
  trades: number;
}

export interface PublicConfig {
  telegram_bot_username: string;
  google_client_id: string;
  apple_client_id: string;
  enable_telegram_auth: boolean;
  enable_google_auth: boolean;
  enable_apple_auth: boolean;
}

export interface SpinOutcome {
  id: number;
  game: string;
  bet: number;
  pick: string;
  result: string;
  payout: number;
  delta_mpl: number;
  wheel_angle?: number | null;
}
