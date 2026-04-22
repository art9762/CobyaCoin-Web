import { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useSession } from "../stores/session";
import { useMarket } from "../stores/market";
import { getWallet } from "../api/endpoints";
import { useToasts } from "../stores/toast";
import type { Wallet } from "../types";
import { Btn } from "./Btn";
import { Chip } from "./Chip";
import { ToastStack } from "./ToastStack";
import { nf } from "../utils/format";

const NAV = [
  { path: "/home",    icon: "◎", label: "Главная",   sub: "Обзор" },
  { path: "/trade",   icon: "⇅", label: "Биржа",     sub: "CBC/MPL" },
  { path: "/mining",  icon: "⛏", label: "Майнинг",   sub: "Ферма" },
  { path: "/auction", icon: "🎴", label: "Аукцион",  sub: "NFT-лоты" },
  { path: "/casino",  icon: "🎰", label: "Казино",   sub: "Джекпот" },
  { path: "/ranks",   icon: "🏆", label: "Рейтинг",  sub: "Топ" },
  { path: "/me",      icon: "◐", label: "Профиль",  sub: "Настройки" },
];

function TickerStripBar() {
  const market = useMarket((s) => s.market);
  if (!market) return null;
  const items = [
    { k: "CBC/MPL", v: nf(market.price, 2), d: `${market.day_change_pct >= 0 ? "+" : ""}${nf(market.day_change_pct, 2)}%`, up: market.day_change_pct >= 0 },
    { k: "Reserve liq.", v: `${nf(market.reserve_liq_mpl / 1000, 0)}k MPL`, d: "", up: true },
    { k: "Reserve CBC", v: nf(market.reserve_liq_cbc, 0), d: "", up: true },
    { k: "Circuit", v: market.circuit ? "🔒 halted" : "open", d: "", up: !market.circuit },
  ];
  const looped = [...items, ...items, ...items];
  return (
    <div className="ticker-strip">
      <div className="ticker-strip-inner">
        {looped.map((x, i) => (
          <span key={i} style={{ fontSize: 12, color: "#C8CEDB", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#9AA2B4" }}>{x.k}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "#fff" }}>{x.v}</span>
            {x.d && <span style={{ color: x.up ? "#9CEBB3" : "#FFB3AE", fontFamily: "var(--font-mono)" }}>{x.d}</span>}
            <span style={{ color: "#343B4C" }}>·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Sidebar({ wallet }: { wallet: Wallet | null }) {
  const user = useSession((s) => s.user);
  const logout = useSession((s) => s.logout);
  const navigate = useNavigate();

  return (
    <aside className="sidebar" style={{
      position: "sticky", top: 36, alignSelf: "start",
      height: "calc(100vh - 36px)",
      padding: "20px 14px",
      borderRight: "1px solid rgb(255 255 255 / .06)",
      background: "rgb(6 7 10 / .6)",
      backdropFilter: "saturate(180%) blur(30px)",
      WebkitBackdropFilter: "saturate(180%) blur(30px)",
      display: "flex", flexDirection: "column", gap: 4,
      overflowY: "auto",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px 18px" }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: "radial-gradient(circle at 30% 30%, #FFE3A6, #F5B841 55%, #D39110)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#1A0F00", fontWeight: 900, fontSize: 22,
          boxShadow: "inset 0 2px 4px rgb(255 255 255 / .5), 0 6px 16px rgb(245 184 65 / .4)",
        }}>C</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-.02em" }}>CobyaCoin</div>
          <div style={{ fontSize: 10, color: "#9AA2B4", letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 700 }}>
            Pseudo exchange
          </div>
        </div>
      </div>

      {NAV.map((item) => (
        <NavLink key={item.path} to={item.path} style={({ isActive }) => ({
          display: "flex", alignItems: "center", gap: 12,
          padding: "10px 12px", borderRadius: 12,
          background: isActive ? "rgb(245 184 65 / .16)" : "transparent",
          boxShadow: isActive ? "inset 0 0 0 1px rgb(245 184 65 / .3)" : "none",
          color: isActive ? "#FFE3A6" : "#C8CEDB",
          textDecoration: "none", transition: "all 220ms",
        })}>
          {({ isActive }) => (
            <>
              <span style={{ fontSize: 20, width: 24, textAlign: "center" }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{item.label}</div>
                <div style={{ fontSize: 11, color: "#727A8C" }}>{item.sub}</div>
              </div>
              {isActive && <span style={{ color: "#F5B841", fontWeight: 700 }}>›</span>}
            </>
          )}
        </NavLink>
      ))}

      {user?.is_admin && (
        <NavLink to="/admin" style={({ isActive }) => ({
          display: "flex", alignItems: "center", gap: 12,
          padding: "10px 12px", borderRadius: 12,
          background: isActive ? "rgb(58 141 255 / .16)" : "transparent",
          boxShadow: isActive ? "inset 0 0 0 1px rgb(58 141 255 / .3)" : "none",
          color: isActive ? "#BFD7FF" : "#C8CEDB",
          textDecoration: "none", transition: "all 220ms",
        })}>
          <span style={{ fontSize: 20, width: 24, textAlign: "center" }}>🛡</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Админ</div>
            <div style={{ fontSize: 11, color: "#727A8C" }}>Модерация</div>
          </div>
        </NavLink>
      )}

      <div style={{ flex: 1 }} />

      {wallet && (
        <div style={{
          padding: 14, borderRadius: 14,
          background: "linear-gradient(135deg, rgb(245 184 65 / .12), rgb(217 67 42 / .12))",
          boxShadow: "inset 0 0 0 1px rgb(255 255 255 / .08)",
        }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".1em", color: "#9AA2B4", fontWeight: 700 }}>
            Кошелёк
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 17, marginTop: 4 }}>
            {nf(wallet.cbc, 2)} <span style={{ color: "#F5B841", fontSize: 11 }}>CBC</span>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 13, color: "#FFC4B3" }}>
            {nf(wallet.mpl, 0)} <span style={{ color: "#D9432A", fontSize: 11 }}>MPL</span>
          </div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "10px 4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "#727A8C" }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: "#34C759", boxShadow: "0 0 10px #34C759" }} />
          Онлайн
        </div>
        <button onClick={() => { logout(); navigate("/login"); }}
          style={{ background: "transparent", border: "none", color: "#9AA2B4", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>
          Выйти
        </button>
      </div>
    </aside>
  );
}

export interface PageHeaderProps {
  title: string;
  sub?: string;
  right?: React.ReactNode;
}

export function PageHeader({ title, sub, right }: PageHeaderProps) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 18, gap: 16, flexWrap: "wrap" }}>
      <div>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-.02em", margin: 0 }}>{title}</h1>
        {sub && <p style={{ color: "#9AA2B4", marginTop: 4, marginBottom: 0 }}>{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function AppLayout() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const connect = useMarket((s) => s.connect);
  const show = useToasts((s) => s.show);

  useEffect(() => {
    const disconnect = connect();
    return disconnect;
  }, [connect]);

  useEffect(() => {
    const refreshWallet = () => getWallet().then(setWallet).catch(() => {});
    refreshWallet();
    const timer = window.setInterval(refreshWallet, 5000);
    const onEvt = () => refreshWallet();
    window.addEventListener("cobya:wallet-refresh", onEvt);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("cobya:wallet-refresh", onEvt);
    };
  }, []);

  useEffect(() => {
    const seen = sessionStorage.getItem("cobya:greeted");
    if (!seen) {
      setTimeout(() => show({ emoji: "🤖", text: "Привет — ты в системе CobyaCoin." }), 400);
      sessionStorage.setItem("cobya:greeted", "1");
    }
  }, [show]);

  return (
    <>
      <TickerStripBar />
      <div className="app-shell" style={{ paddingTop: 36 }}>
        <Sidebar wallet={wallet} />
        <main className="app-main">
          <Outlet />
        </main>
      </div>
      <ToastStack />
    </>
  );
}

export function fireWalletRefresh(): void {
  window.dispatchEvent(new Event("cobya:wallet-refresh"));
}

export { Btn, Chip };
