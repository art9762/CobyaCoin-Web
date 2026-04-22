import { useEffect, useState } from "react";
import { Glass } from "../components/Glass";
import { Btn } from "../components/Btn";
import { Chart } from "../components/Chart";
import { Ticker } from "../components/Ticker";
import { CoinMark } from "../components/Marks";
import { Avatar } from "../components/Avatar";
import { Row } from "../components/Row";
import { PageHeader, fireWalletRefresh } from "../components/Layout";
import { useMarket } from "../stores/market";
import { useToasts } from "../stores/toast";
import { cancelOrder, getMyOrders, getOrders, getWallet, placeOrder, recentTrades } from "../api/endpoints";
import type { OrderRow, TradeRow, Wallet } from "../types";
import { nf, timeAgo } from "../utils/format";

type Side = "buy" | "sell";

export function ExchangePage() {
  const market = useMarket((s) => s.market);
  const show = useToasts((s) => s.show);
  const [side, setSide] = useState<Side>("buy");
  const [amount, setAmount] = useState("12");
  const [price, setPrice] = useState("104.00");
  const [tab, setTab] = useState<"book" | "trades" | "mine">("book");
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [myOrders, setMyOrders] = useState<OrderRow[]>([]);
  const [trades, setTrades] = useState<TradeRow[]>([]);

  const total = Number(amount || 0) * Number(price || 0);

  useEffect(() => {
    if (market) setPrice(market.price.toFixed(2));
  }, [market?.price.toFixed(0)]);

  const refresh = () => {
    getOrders().then(setOrders).catch(() => {});
    getMyOrders().then(setMyOrders).catch(() => {});
    getWallet().then(setWallet).catch(() => {});
    recentTrades().then(setTrades).catch(() => {});
  };

  useEffect(() => {
    refresh();
    const t = window.setInterval(refresh, 3000);
    return () => window.clearInterval(t);
  }, []);

  const place = async () => {
    const cbc = Number(amount);
    const mpl = Number(amount) * Number(price);
    if (!cbc || !mpl) return show({ emoji: "❌", text: "Заполни объём и цену." });
    try {
      const r = await placeOrder(side, cbc, mpl);
      show({ emoji: "✅", text: `Ордер ${side === "buy" ? "на покупку" : "на продажу"} размещён · фиксаций: ${r.fills}` });
      refresh();
      fireWalletRefresh();
    } catch (e) {
      show({ emoji: "❌", text: e instanceof Error ? e.message : "ошибка" });
    }
  };

  const cancel = async (id: number) => {
    try {
      await cancelOrder(id);
      show({ emoji: "✅", text: "Ордер отменён." });
      refresh();
      fireWalletRefresh();
    } catch (e) {
      show({ emoji: "❌", text: e instanceof Error ? e.message : "не удалось" });
    }
  };

  if (!market || !wallet) return null;

  return (
    <>
      <PageHeader title="Биржа" sub="Торгуй CBC против кленовых листьев. Курс фиксирует Центробанк." />

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 380px", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <Glass tier="thick" style={{ padding: 22, borderRadius: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <CoinMark size={30} />
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>CBC / MPL</div>
                  <div style={{ fontSize: 12, color: "#9AA2B4" }}>Торговая пара Центробанка</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <Ticker value={market.price} decimals={2} size={30} />
                <div style={{ fontSize: 12, color: "#9AA2B4" }}>MPL за 1 CBC</div>
              </div>
            </div>
            <div style={{ margin: "10px -22px -22px" }}>
              <Chart data={market.ticks} color="#F5B841" height={200} showAxis />
            </div>
          </Glass>

          <Glass style={{ padding: 20 }}>
            <div style={{ display: "flex", gap: 6, padding: 4, borderRadius: 14, background: "rgb(0 0 0 / .3)", marginBottom: 16 }}>
              {(["buy", "sell"] as const).map((sd) => (
                <button key={sd} onClick={() => setSide(sd)} style={{
                  flex: 1, padding: "10px 0", borderRadius: 10, border: "none",
                  background: side === sd ? (sd === "buy" ? "linear-gradient(180deg,#6EE59E,#34C759)" : "linear-gradient(180deg,#FF7A73,#FF453A)") : "transparent",
                  color: side === sd ? (sd === "buy" ? "#042b12" : "#fff") : "#C8CEDB",
                  fontWeight: 700, fontSize: 14, cursor: "pointer", letterSpacing: ".04em", textTransform: "uppercase",
                  boxShadow: side === sd ? "inset 0 1px 0 rgb(255 255 255 / .55)" : "none",
                  transition: "all 220ms",
                }}>{sd === "buy" ? "Купить CBC" : "Продать CBC"}</button>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ padding: 14, borderRadius: 14, background: "rgb(0 0 0 / .28)", boxShadow: "inset 0 0 0 1px rgb(255 255 255 / .06)" }}>
                <div style={{ fontSize: 11, color: "#9AA2B4", textTransform: "uppercase", fontWeight: 700, letterSpacing: ".08em" }}>Объём</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
                  <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal"
                    style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", color: "#fff", fontFamily: "var(--font-mono)", fontSize: 26, fontWeight: 700 }} />
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "#F5B841", fontSize: 14 }}>CBC</span>
                </div>
              </div>
              <div style={{ padding: 14, borderRadius: 14, background: "rgb(0 0 0 / .28)", boxShadow: "inset 0 0 0 1px rgb(255 255 255 / .06)" }}>
                <div style={{ fontSize: 11, color: "#9AA2B4", textTransform: "uppercase", fontWeight: 700, letterSpacing: ".08em" }}>Цена</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
                  <input value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal"
                    style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", color: "#fff", fontFamily: "var(--font-mono)", fontSize: 26, fontWeight: 700 }} />
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "#D9432A", fontSize: 14 }}>MPL</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
              {[25, 50, 75, 100].map((p) => (
                <button key={p} onClick={() => {
                  const avail = side === "buy" ? wallet.mpl / (Number(price) || market.price) : wallet.cbc;
                  setAmount(String(Math.floor(avail * p / 100)));
                }} style={{
                  flex: 1, padding: "8px 0", borderRadius: 10,
                  border: "1px solid rgb(255 255 255 / .1)", background: "rgb(255 255 255 / .04)",
                  color: "#C8CEDB", fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}>{p}%</button>
              ))}
            </div>

            <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: "rgb(0 0 0 / .3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 13, color: "#9AA2B4" }}>Итого</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700 }}>
                  {nf(total)} <span style={{ fontSize: 13, color: "#D9432A" }}>MPL</span>
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                <span style={{ fontSize: 12, color: "#9AA2B4" }}>Комиссия Центробанка</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>10%</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span style={{ fontSize: 12, color: "#9AA2B4" }}>Доступно</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                  {side === "buy" ? `${nf(wallet.mpl)} MPL` : `${nf(wallet.cbc, 2)} CBC`}
                </span>
              </div>
            </div>

            <Btn tone={side === "buy" ? "success" : "danger"} size="lg" style={{ width: "100%", marginTop: 14 }} onClick={place}>
              {side === "buy" ? "↓ Купить" : "↑ Продать"} {amount || 0} CBC
            </Btn>
          </Glass>
        </div>

        <Glass style={{ padding: 4, display: "flex", flexDirection: "column", maxHeight: 760 }}>
          <div style={{ padding: "14px 16px 8px", display: "flex", gap: 6 }}>
            {(["book", "trades", "mine"] as const).map((k) => (
              <button key={k} onClick={() => setTab(k)} style={{
                padding: "6px 12px", borderRadius: 10, border: "none",
                background: tab === k ? "rgb(245 184 65 / .22)" : "transparent",
                color: tab === k ? "#FFE3A6" : "#9AA2B4",
                fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}>{k === "book" ? "Стакан" : k === "trades" ? "Сделки" : "Мои"}</button>
            ))}
          </div>
          <div style={{ overflowY: "auto", flex: 1, padding: "0 4px 8px" }}>
            {tab === "book" && orders.map((o) => (
              <Row key={o.id}
                leading={<Avatar handle={o.user_handle} size={28} />}
                title={<span style={{ fontSize: 13 }}>{o.user_handle}</span>}
                subtitle={<span style={{ fontSize: 11 }}>{o.side === "buy" ? "🟢 покупка" : "🔴 продажа"} · {timeAgo(o.created_at)}</span>}
                trailing={
                  <div>
                    <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 13, color: o.side === "buy" ? "#9CEBB3" : "#FFB3AE" }}>{nf(o.cbc, 2)} CBC</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#C8CEDB" }}>{nf(o.mpl)} MPL</div>
                  </div>
                }
              />
            ))}
            {tab === "trades" && trades.map((t) => (
              <Row key={t.id}
                leading={<span style={{ fontSize: 18 }}>⇄</span>}
                title={<span style={{ fontSize: 13 }}>{t.buyer_handle} ← {t.seller_handle}</span>}
                subtitle={<span style={{ fontSize: 11 }}>{t.counterparty} · {timeAgo(t.created_at)}</span>}
                trailing={
                  <div>
                    <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 13 }}>{nf(t.cbc, 2)} CBC</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#C8CEDB" }}>{nf(t.mpl)} MPL</div>
                  </div>
                }
              />
            ))}
            {tab === "mine" && myOrders.map((o) => (
              <Row key={o.id}
                leading={<span style={{ fontSize: 18 }}>{o.side === "buy" ? "↓" : "↑"}</span>}
                title={<span style={{ fontSize: 13 }}>{nf(o.cbc, 2)} CBC @ {nf(o.price, 2)}</span>}
                subtitle={<span style={{ fontSize: 11 }}>{o.status} · filled {nf(o.filled_cbc, 2)} · {timeAgo(o.created_at)}</span>}
                trailing={
                  o.status === "open"
                    ? <button onClick={() => cancel(o.id)} style={{ background: "rgb(255 69 58 / .22)", color: "#FFB3AE", border: "none", borderRadius: 10, padding: "6px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Отменить</button>
                    : <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#C8CEDB" }}>{nf(o.mpl)} MPL</span>
                }
              />
            ))}
          </div>
        </Glass>
      </div>
    </>
  );
}
