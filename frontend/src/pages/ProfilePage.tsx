import { useEffect, useState } from "react";
import { Glass } from "../components/Glass";
import { Btn } from "../components/Btn";
import { Chip } from "../components/Chip";
import { Avatar } from "../components/Avatar";
import { Row } from "../components/Row";
import { PageHeader, fireWalletRefresh } from "../components/Layout";
import { useSession } from "../stores/session";
import { useToasts } from "../stores/toast";
import { useMarket } from "../stores/market";
import {
  getFeed, getReferrals, getWallet, redeemPromo, updateProfile,
} from "../api/endpoints";
import type { FeedItem, Wallet } from "../types";
import { nf, timeAgo } from "../utils/format";

export function ProfilePage() {
  const user = useSession((s) => s.user);
  const refreshSession = useSession((s) => s.refresh);
  const market = useMarket((s) => s.market);
  const show = useToasts((s) => s.show);

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [promo, setPromo] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [referrals, setReferrals] = useState<{ code: string; count: number; total_bonus_mpl: number } | null>(null);

  useEffect(() => {
    getWallet().then(setWallet).catch(() => {});
    getFeed().then(setFeed).catch(() => {});
    getReferrals().then(setReferrals).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) setNameDraft(user.display_name || user.handle);
  }, [user?.display_name]);

  if (!user || !wallet || !market) return null;

  const refUrl = referrals
    ? `${window.location.origin}/login?ref=${encodeURIComponent(referrals.code)}`
    : "";

  const doPromo = async () => {
    try {
      const r = await redeemPromo(promo);
      show({ emoji: "✅", text: `+${nf(r.mpl)} MPL зачислено.` });
      setPromo("");
      fireWalletRefresh();
      getWallet().then(setWallet);
    } catch (e) {
      show({ emoji: "❌", text: e instanceof Error ? e.message : "Код не найден." });
    }
  };

  const saveName = async () => {
    try {
      await updateProfile({ display_name: nameDraft.trim() });
      await refreshSession();
      setEditingName(false);
      show({ emoji: "✅", text: "Имя обновлено." });
    } catch (e) {
      show({ emoji: "❌", text: e instanceof Error ? e.message : "ошибка" });
    }
  };

  return (
    <>
      <PageHeader title="Профиль" sub="Настройки, промокоды и реферальная программа." />
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 360px", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <Glass tier="thick" style={{ padding: 28, borderRadius: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
              <Avatar handle={user.handle} size={80} src={user.avatar_url || undefined} />
              <div style={{ flex: 1, minWidth: 200 }}>
                {editingName ? (
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)}
                      style={{ fontSize: 22, padding: "6px 10px", borderRadius: 8, background: "rgb(0 0 0 / .3)",
                        border: "1px solid rgb(255 255 255 / .12)", color: "#fff", outline: "none", minWidth: 0, flex: 1 }} />
                    <Btn tone="amber" size="sm" onClick={saveName}>Сохранить</Btn>
                    <Btn tone="glass" size="sm" onClick={() => setEditingName(false)}>Отмена</Btn>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-.02em" }}>{user.display_name || user.handle}</div>
                    <div style={{ fontSize: 13, color: "#9AA2B4", marginTop: 4 }}>
                      {user.handle} · в системе с {new Date(user.joined_at).toLocaleDateString("ru-RU")} · {nf(user.trades_count)} сделок
                    </div>
                  </>
                )}
                <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                  <Chip tint="amber">⭐ Trader</Chip>
                  <Chip tint="reserve">🏛 Reserve partner</Chip>
                  {user.is_admin && <Chip tint="violet">🛡 Admin</Chip>}
                </div>
              </div>
              {!editingName && <Btn tone="glass" size="sm" onClick={() => setEditingName(true)}>Изменить</Btn>}
            </div>
          </Glass>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
            {([
              { k: "CBC баланс", v: nf(wallet.cbc, 2), sub: `≈ ${nf(wallet.cbc * market.price)} MPL`, tint: "amber" as const },
              { k: "MPL баланс", v: nf(wallet.mpl), sub: "Доступно к выводу", tint: "maple" as const },
              { k: "Эквити", v: nf(wallet.equity_mpl), sub: "CBC + MPL в MPL", tint: "success" as const },
            ]).map((x) => (
              <Glass key={x.k} tint={x.tint} style={{ padding: 18 }}>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700, color: "#C8CEDB" }}>{x.k}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 26, fontWeight: 700, marginTop: 6 }}>{x.v}</div>
                <div style={{ fontSize: 12, color: "#C8CEDB", marginTop: 2 }}>{x.sub}</div>
              </Glass>
            ))}
          </div>

          <Glass style={{ padding: 4 }}>
            <div style={{ padding: "14px 16px 6px", fontSize: 17, fontWeight: 700 }}>⚙ Настройки</div>
            {[
              ["🔔", "Уведомления", "Push · email", "Вкл."],
              ["🔒", "Двухфакторная защита", "Telegram-код", "Активна"],
              ["💳", "Способы вывода", "2 карты, 1 кошелёк", "›"],
              ["🎫", "Реферальная программа", `${referrals?.count ?? 0} приглашённых · ${nf(referrals?.total_bonus_mpl ?? 0)} MPL`, user.referral_code],
              ["🌐", "Язык интерфейса", "Русский", "RU / EN"],
              ["🔓", "Сессия", `${user.email ?? user.handle}`, "›"],
            ].map(([ic, t, sub, tr], i) => (
              <div key={i}>
                <Row leading={<span style={{ fontSize: 22 }}>{ic}</span>} title={t} subtitle={sub}
                  trailing={<span style={{ color: "#F5B841", fontSize: 13, fontWeight: 600 }}>{tr}</span>}
                  onClick={() => {}}
                />
                {i < 5 && <div style={{ height: 1, background: "rgb(255 255 255 / .06)", marginLeft: 16 }} />}
              </div>
            ))}
          </Glass>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          <Glass tint="violet" style={{ padding: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>🎫 Промокод</div>
            <div style={{ fontSize: 12, color: "#D4B8FF", marginTop: 2, marginBottom: 12 }}>Введи код — получи бонус в MPL.</div>
            <input value={promo} onChange={(e) => setPromo(e.target.value)} placeholder="COBYA26"
              style={{
                width: "100%", padding: "12px 14px", borderRadius: 12,
                background: "rgb(0 0 0 / .3)", border: "1px solid rgb(255 255 255 / .1)",
                color: "#fff", fontSize: 14, fontFamily: "var(--font-mono)",
                outline: "none", marginBottom: 10, boxSizing: "border-box",
              }} />
            <Btn tone="amber" style={{ width: "100%" }} onClick={doPromo}>Активировать</Btn>
            <div style={{ fontSize: 11, color: "#9AA2B4", marginTop: 8, textAlign: "center" }}>
              Попробуй: <code style={{ color: "#FFD78C" }}>COBYA26</code>
            </div>
          </Glass>

          <Glass style={{ padding: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>🎫 Твоя ссылка</div>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 12px", borderRadius: 10,
              background: "rgb(0 0 0 / .3)", boxShadow: "inset 0 0 0 1px rgb(255 255 255 / .08)",
            }}>
              <span style={{ flex: 1, fontFamily: "var(--font-mono)", fontSize: 12, color: "#FFD78C", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {refUrl}
              </span>
              <button onClick={async () => { await navigator.clipboard?.writeText(refUrl); show({ emoji: "✅", text: "Ссылка скопирована." }); }}
                style={{ border: "none", background: "rgb(245 184 65 / .22)", color: "#FFE3A6", padding: "6px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                Копировать
              </button>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 12, color: "#9AA2B4" }}>
              <span>Бонус за друга</span><span style={{ color: "#fff", fontWeight: 600 }}>30 000 MPL + 90 CBC</span>
            </div>
          </Glass>

          <Glass style={{ padding: 4, maxHeight: 360, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "12px 16px 8px", fontSize: 14, fontWeight: 700 }}>История активности</div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {feed.length === 0 && <div style={{ padding: 16, color: "var(--fg-4)", fontSize: 13 }}>пока ничего</div>}
              {feed.slice(0, 12).map((f) => (
                <Row key={f.id}
                  leading={<span style={{ fontSize: 18 }}>{f.emoji}</span>}
                  title={<span style={{ fontSize: 13, fontWeight: 500, whiteSpace: "normal" }}>{f.text}</span>}
                  subtitle={<span style={{ fontSize: 11 }}>{timeAgo(f.created_at)}</span>}
                />
              ))}
            </div>
          </Glass>
        </div>
      </div>
    </>
  );
}
