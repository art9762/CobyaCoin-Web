import { useEffect, useMemo, useState } from "react";
import { Glass } from "../components/Glass";
import { Chip } from "../components/Chip";
import { Avatar } from "../components/Avatar";
import { Lift } from "../components/Lift";
import { PageHeader } from "../components/Layout";
import { useSession } from "../stores/session";
import { getLeaderboard } from "../api/endpoints";
import type { LeaderRow } from "../types";
import { nf } from "../utils/format";

type Tab = "cbc" | "mpl" | "equity" | "trades";

export function LeaderboardPage() {
  const user = useSession((s) => s.user);
  const [tab, setTab] = useState<Tab>("cbc");
  const [rows, setRows] = useState<LeaderRow[]>([]);

  useEffect(() => {
    getLeaderboard(tab).then(setRows).catch(() => {});
    const t = window.setInterval(() => getLeaderboard(tab).then(setRows).catch(() => {}), 10_000);
    return () => window.clearInterval(t);
  }, [tab]);

  // Compute a deterministic trend per user so chips don't flicker between renders.
  const trends = useMemo(() =>
    rows.map((r, i) => {
      const seed = (r.user_id * 7 + i * 13) % 100;
      const up = seed % 2 === 0;
      return { up, pct: (seed % 22) + 0.3 };
    }),
  [rows]);

  return (
    <>
      <PageHeader title="Топ игроков" sub="Лучшие по балансу, активности и удаче за последние 7 дней." right={
        <Glass style={{ padding: 4, borderRadius: 14 }}>
          <div style={{ display: "flex" }}>
            {([["cbc", "CBC"], ["mpl", "MPL"], ["equity", "Эквити"], ["trades", "Сделки"]] as const).map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} style={{
                padding: "8px 16px", borderRadius: 10, border: "none",
                background: tab === k ? "linear-gradient(180deg,#FFD78C,#F5B841)" : "transparent",
                color: tab === k ? "#1A0F00" : "#C8CEDB",
                fontWeight: 700, fontSize: 13, cursor: "pointer",
              }}>{l}</button>
            ))}
          </div>
        </Glass>
      } />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.15fr 1fr", gap: 16, alignItems: "end", marginBottom: 20 }}>
        {[rows[1], rows[0], rows[2]].map((p, i) => {
          if (!p) return <div key={i} />;
          const rank = p.rank;
          const tint: "amber" | "maple" | null = rank === 1 ? "amber" : rank === 2 ? null : "maple";
          const height = rank === 1 ? 200 : rank === 2 ? 170 : 150;
          return (
            <Lift key={p.user_id}>
              <Glass tint={tint} style={{ padding: 22, textAlign: "center", height, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 6 }}>{rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}</div>
                <Avatar handle={p.handle} size={rank === 1 ? 56 : 44} />
                <div style={{ fontSize: rank === 1 ? 17 : 15, fontWeight: 700, marginTop: 8 }}>{p.handle}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: rank === 1 ? 20 : 16, marginTop: 4 }}>
                  {nf(tab === "mpl" ? p.mpl : tab === "trades" ? p.trades : p.cbc)}{" "}
                  <span style={{ fontSize: 11, color: tab === "mpl" ? "#FFC4B3" : "#FFE3A6" }}>
                    {tab === "mpl" ? "MPL" : tab === "trades" ? "сделок" : "CBC"}
                  </span>
                </div>
              </Glass>
            </Lift>
          );
        })}
      </div>

      <Glass style={{ padding: 4 }}>
        <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 140px 140px 90px", padding: "12px 16px", fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", color: "#9AA2B4", fontWeight: 700 }}>
          <div>#</div><div>Игрок</div>
          <div style={{ textAlign: "right" }}>CBC</div>
          <div style={{ textAlign: "right" }}>MPL</div>
          <div style={{ textAlign: "right" }}>Тренд</div>
        </div>
        {rows.map((p, i) => (
          <div key={p.user_id} style={{
            display: "grid", gridTemplateColumns: "60px 1fr 140px 140px 90px", alignItems: "center",
            padding: "12px 16px", borderTop: "1px solid rgb(255 255 255 / .05)",
            background: user && p.handle === user.handle ? "rgb(245 184 65 / .08)" : "transparent",
          }}>
            <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: p.rank <= 3 ? "#F5B841" : "#9AA2B4" }}>#{p.rank}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar handle={p.handle} size={32} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {p.handle}
                  {user && p.handle === user.handle && <Chip tint="amber" style={{ marginLeft: 8 }}>ты</Chip>}
                </div>
                <div style={{ fontSize: 11, color: "#9AA2B4" }}>{p.trades} сделок</div>
              </div>
            </div>
            <div style={{ fontFamily: "var(--font-mono)", textAlign: "right", fontWeight: 600 }}>{nf(p.cbc, 2)}</div>
            <div style={{ fontFamily: "var(--font-mono)", textAlign: "right", fontWeight: 600, color: "#C8CEDB" }}>{nf(p.mpl)}</div>
            <div style={{ textAlign: "right" }}>
              <Chip tint={trends[i]?.up ? "success" : "danger"}>
                {trends[i]?.up ? "▲" : "▼"} {nf(trends[i]?.pct ?? 0, 1)}%
              </Chip>
            </div>
          </div>
        ))}
      </Glass>
    </>
  );
}
