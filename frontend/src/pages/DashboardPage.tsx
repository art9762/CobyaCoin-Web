import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Glass } from "../components/Glass";
import { Btn } from "../components/Btn";
import { Chip } from "../components/Chip";
import { Chart } from "../components/Chart";
import { Ticker } from "../components/Ticker";
import { CoinMark, MapleMark } from "../components/Marks";
import { Avatar } from "../components/Avatar";
import { Row } from "../components/Row";
import { PageHeader } from "../components/Layout";
import { useMarket } from "../stores/market";
import { useSession } from "../stores/session";
import { getFeed, getOrders, getWallet } from "../api/endpoints";
import type { FeedItem, OrderRow, Wallet } from "../types";
import { nf, timeAgo } from "../utils/format";

export function DashboardPage() {
  const navigate = useNavigate();
  const user = useSession((s) => s.user);
  const market = useMarket((s) => s.market);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);

  useEffect(() => {
    const load = () => {
      getWallet().then(setWallet).catch(() => {});
      getFeed().then(setFeed).catch(() => {});
      getOrders().then(setOrders).catch(() => {});
    };
    load();
    const t = window.setInterval(load, 4000);
    return () => window.clearInterval(t);
  }, []);

  if (!user || !market || !wallet) return null;

  const up = market.day_change_pct >= 0;
  const tickPct = (market.price - market.prev_price) / (market.prev_price || 1) * 100;
  const buys = orders.filter((o) => o.side === "buy").slice(0, 5);
  const sells = orders.filter((o) => o.side === "sell").slice(0, 5);

  return (
    <>
      <PageHeader title="Главная" sub={`Добрый день, ${user.handle}.`} right={
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Chip tint="success">🟢 Рынок открыт</Chip>
          <Btn tone="glass" size="sm" onClick={() => navigate("/me")}>🔔 {feed.length}</Btn>
        </div>
      } />

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.6fr) minmax(0, 1fr)", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
          <Glass tier="thick" tint="amber" style={{ padding: 28, borderRadius: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, marginBottom: 14, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <CoinMark size={30} spin />
                <span style={{ fontSize: 12, color: "#FFE3A6", textTransform: "uppercase", letterSpacing: ".12em", fontWeight: 700, whiteSpace: "nowrap" }}>
                  CBC / MPL · Курс Центробанка
                </span>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <Btn tone="amber" onClick={() => navigate("/trade")}>↓ Купить CBC</Btn>
                <Btn tone="maple" onClick={() => navigate("/trade")}>↑ Продать</Btn>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
              <Ticker value={market.price} decimals={2} size={68} />
              <span style={{ color: "#FFE3A6", fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 600 }}>MPL</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
              <Chip tint={up ? "success" : "danger"}>
                {up ? "▲" : "▼"} {nf(Math.abs(market.day_change_pct), 2)}% · 24ч
              </Chip>
              <span style={{ fontSize: 13, color: "#C8CEDB" }}>
                Тик: {tickPct >= 0 ? "+" : ""}{nf(tickPct, 3)}%
              </span>
              {market.circuit && <Chip tint="danger">🔒 Планка</Chip>}
            </div>
            <div style={{ margin: "16px -28px -28px", padding: "0 4px" }}>
              <Chart data={market.ticks} color="#F5B841" height={220} showAxis />
            </div>
          </Glass>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Glass style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 17, fontWeight: 700 }}>Биржа · покупка</span>
                <Chip tint="success">{buys.length}</Chip>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {buys.length === 0 && <div style={{ color: "var(--fg-4)", fontSize: 13 }}>пока пусто</div>}
                {buys.map((o, i) => (
                  <div key={o.id} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10,
                    background: `linear-gradient(90deg, rgb(52 199 89 / ${.02 + (5 - i) * 0.03}) 0%, transparent 100%)`,
                  }}>
                    <Avatar handle={o.user_handle} size={24} />
                    <span style={{ fontSize: 13, color: "#fff", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.user_handle}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "#9CEBB3" }}>{nf(o.cbc, 2)} CBC</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "#C8CEDB", width: 96, textAlign: "right" }}>{nf(o.mpl)} MPL</span>
                  </div>
                ))}
              </div>
            </Glass>
            <Glass style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 17, fontWeight: 700 }}>Биржа · продажа</span>
                <Chip tint="danger">{sells.length}</Chip>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {sells.length === 0 && <div style={{ color: "var(--fg-4)", fontSize: 13 }}>пока пусто</div>}
                {sells.map((o, i) => (
                  <div key={o.id} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10,
                    background: `linear-gradient(90deg, rgb(255 69 58 / ${.02 + (5 - i) * 0.03}) 0%, transparent 100%)`,
                  }}>
                    <Avatar handle={o.user_handle} size={24} />
                    <span style={{ fontSize: 13, color: "#fff", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.user_handle}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "#FFB3AE" }}>{nf(o.cbc, 2)} CBC</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "#C8CEDB", width: 96, textAlign: "right" }}>{nf(o.mpl)} MPL</span>
                  </div>
                ))}
              </div>
            </Glass>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          <Glass tier="thick" style={{ padding: 22, borderRadius: 24 }}>
            <div style={{ fontSize: 12, color: "#9AA2B4", letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 700 }}>Портфель</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 8 }}>
              <Ticker value={wallet.equity_mpl} decimals={0} size={36} flashOnChange={false} />
              <span style={{ color: "#D9432A", fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 600 }}>MPL</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
              <div style={{ padding: 14, borderRadius: 14, background: "rgb(245 184 65 / .12)", boxShadow: "inset 0 0 0 1px rgb(245 184 65 / .22)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <CoinMark size={18} /><span style={{ fontSize: 11, color: "#FFE3A6", fontWeight: 700, letterSpacing: ".08em" }}>CBC</span>
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 20, fontWeight: 700, marginTop: 6 }}>{nf(wallet.cbc, 2)}</div>
                <div style={{ fontSize: 11, color: "#C8CEDB", marginTop: 2 }}>≈ {nf(wallet.cbc * market.price)} MPL</div>
              </div>
              <div style={{ padding: 14, borderRadius: 14, background: "rgb(217 67 42 / .12)", boxShadow: "inset 0 0 0 1px rgb(217 67 42 / .22)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <MapleMark size={18} /><span style={{ fontSize: 11, color: "#FFC4B3", fontWeight: 700, letterSpacing: ".08em" }}>MPL</span>
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 20, fontWeight: 700, marginTop: 6 }}>{nf(wallet.mpl)}</div>
                <div style={{ fontSize: 11, color: "#C8CEDB", marginTop: 2 }}>Кленовые листья</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 14 }}>
              <Btn tone="amber" size="sm" onClick={() => navigate("/trade")} style={{ padding: "10px 4px", fontSize: 12 }}>
                <div style={{ fontSize: 18, marginBottom: 2 }}>↓</div>Купить
              </Btn>
              <Btn tone="maple" size="sm" onClick={() => navigate("/trade")} style={{ padding: "10px 4px", fontSize: 12 }}>
                <div style={{ fontSize: 18, marginBottom: 2 }}>↑</div>Продать
              </Btn>
              <Btn tone="glass" size="sm" onClick={() => navigate("/mining")} style={{ padding: "10px 4px", fontSize: 12 }}>
                <div style={{ fontSize: 18, marginBottom: 2 }}>⛏</div>Майнинг
              </Btn>
              <Btn tone="glass" size="sm" onClick={() => navigate("/casino")} style={{ padding: "10px 4px", fontSize: 12 }}>
                <div style={{ fontSize: 18, marginBottom: 2 }}>🎰</div>Казино
              </Btn>
            </div>
          </Glass>

          <Glass tier="regular" tint="reserve" style={{ padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(180deg,#6FA9FF,#3A8DFF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🏛</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Центробанк активен</div>
                <div style={{ fontSize: 12, color: "#BFD7FF", marginTop: 2 }}>
                  Ликвидность {nf(market.reserve_liq_mpl / 1000, 1)}k MPL · {nf(market.reserve_liq_cbc)} CBC
                </div>
              </div>
              <div style={{ width: 10, height: 10, borderRadius: 999, background: "#34C759", boxShadow: "0 0 12px #34C759" }} />
            </div>
          </Glass>

          <Glass style={{ padding: 4, minHeight: 220, maxHeight: 360, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "12px 16px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Лента событий</span>
              <Chip tint="amber">live</Chip>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "0 4px 8px" }}>
              {feed.length === 0 && <div style={{ color: "var(--fg-4)", fontSize: 13, padding: 16 }}>пока тихо…</div>}
              {feed.slice(0, 15).map((f) => (
                <Row key={f.id}
                  leading={<span style={{ fontSize: 20 }}>{f.emoji}</span>}
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
