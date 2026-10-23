import type { PublicConfig, User } from "../types";

export const user: User = {
  id: -1, handle: "@synthetic", display_name: "Synthetic tester", avatar_url: "",
  email: null, is_admin: false, is_banned: false, joined_at: "2026-01-01T00:00:00Z",
  trades_count: 0, referral_code: "SYNTHETIC",
};

export const config: PublicConfig = {
  telegram_bot_username: "synthetic_test_bot", google_client_id: "", apple_client_id: "",
  enable_telegram_auth: true, enable_google_auth: false, enable_apple_auth: false,
};

export function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
