import { useEffect, useState } from "react";
import { Glass } from "../components/Glass";
import { Btn } from "../components/Btn";
import { Chip } from "../components/Chip";
import { Ticker } from "../components/Ticker";
import { Avatar } from "../components/Avatar";
import { Row } from "../components/Row";
import { PageHeader, fireWalletRefresh } from "../components/Layout";
import { useToasts } from "../stores/toast";
import { getJackpot, hallOfFame, playCoinflip, spinRoulette } from "../api/endpoints";
import { nf, timeAgo } from "../utils/format";

type RouletteColor = "red" | "black" | "green";

const SEG_COLORS: RouletteColor[] = [
  "red", "black", "red", "black", "red", "black",
  "red", "black", "red", "black", "red", "black", "green",
];

export function CasinoPage() {
  const show = useToasts((s) => s.show);
  const [bet, setBet] = useState(500);
  const [color, setColor] = useState<RouletteColor>("red");
  const [jackpot, setJackpot] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [wheelAngle, setWheelAngle] = useState(0);
  const [lastRoll, setLastRoll] = useState<{ won: boolean; payout: number; result: string } | null>(null);
  const [hof, setHof] = useState<Array<{ user: string; payout: number; game: string; created_at: string }>>([]);

  const refreshHof = () => hallOfFame().then(setHof).catch(() => {});
  useEffect(() => {
    getJackpot().then((r) => setJackpot(r.mpl)).catch(() => {});
    refreshHof();
    const t = window.setInterval(() => getJackpot().then((r) => setJackpot(r.mpl)).catch(() => {}), 10_000);
    return () => window.clearInterval(t);
  }, []);

  const doSpin = async () => {
    if (spinning) return;
    setSpinning(true);
    try {
      const outcome = await spinRoulette(bet, color);
      const targetAngle = wheelAngle + (outcome.wheel_angle ?? 360);
      setWheelAngle(targetAngle);
      setTimeout(() => {
        setSpinning(false);
        const won = outcome.payout > 0;
        setLastRoll({ won, payout: outcome.payout, result: outcome.result });
        if (won) show({ emoji: "🎰", text: `+${nf(outcome.payout)} MPL (${outcome.result}).` });
        else show({ emoji: "❌", text: `Выпало ${outcome.result}. Ставка сгорела.` });
        getJackpot().then((r) => setJackpot(r.mpl)).catch(() => {});
        refreshHof();
        fireWalletRefresh();
      }, 3200);
    } catch (e) {
      setSpinning(false);
      show({ emoji: "❌", text: e instanceof Error ? e.message : "ошибка" });
    }
  };

  const doFlip = async (pick: "heads" | "tails") => {
    try {
      const outcome = await playCoinflip(bet, pick);
      const won = outcome.payout > 0;
      if (won) show({ emoji: "🪙", text: `+${nf(outcome.payout - bet)} MPL` });
      else show({ emoji: "❌", text: `−${nf(bet)} MPL` });
      fireWalletRefresh();
    } catch (e) {
      show({ emoji: "❌", text: e instanceof Error ? e.message : "ошибка" });
    }
  };

  return (
    <>
      <PageHeader title="Казино" sub="Рулетка, подкидной и еженедельный джекпот." />

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 380px", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <Glass tier="thick" tint="maple" style={{ padding: 28, borderRadius: 28, textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "#FFC4B3", textTransform: "uppercase", letterSpacing: ".12em", fontWeight: 700 }}>Джекпот недели</div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 10, marginTop: 6 }}>
              <Ticker value={jackpot} decimals={0} size={56} flashOnChange={false} />
              <span style={{ color: "#FFC4B3", fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700 }}>MPL</span>
            </div>
            <div style={{ fontSize: 13, color: "#C8CEDB", marginTop: 4 }}>Розыгрыш каждую пятницу · пополняется со всех игр</div>
          </Glass>

          <Glass tier="thick" style={{ padding: 28, borderRadius: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-.02em" }}>🎰 Рулетка</div>
                <div style={{ fontSize: 13, color: "#9AA2B4", marginTop: 2 }}>красный/чёрный ×2 · зелёный ×14</div>
              </div>
              {lastRoll && (
                <Chip tint={lastRoll.won ? "success" : "danger"}>
                  {lastRoll.won ? `✅ +${nf(lastRoll.payout)} MPL` : `❌ ${lastRoll.result}`}
                </Chip>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "center", marginBottom: 24, position: "relative" }}>
              <div style={{ position: "relative", width: 320, height: 320 }}>
                <div style={{
                  position: "absolute", top: -6, left: "50%", transform: "translateX(-50%)",
                  width: 0, height: 0,
                  borderLeft: "10px solid transparent", borderRight: "10px solid transparent",
                  borderTop: "18px solid #FFD78C",
                  filter: "drop-shadow(0 4px 8px rgb(245 184 65 / .6))",
                  zIndex: 3,
                }} />
                <div style={{
                  width: 320, height: 320, borderRadius: "50%",
                  background: "conic-gradient(" + SEG_COLORS.map((c, i) => {
                    const deg = 360 / SEG_COLORS.length;
                    const bg = c === "red" ? "#D9432A" : c === "black" ? "#1A1E2A" : "#34C759";
                    return `${bg} ${i * deg}deg ${(i + 1) * deg}deg`;
                  }).join(", ") + ")",
                  boxShadow: "inset 0 0 0 6px rgb(245 184 65 / .8), inset 0 0 0 8px rgb(0 0 0 / .5), 0 20px 48px rgb(0 0 0 / .5), 0 0 60px rgb(245 184 65 / .3)",
                  transform: `rotate(${wheelAngle}deg)`,
                  transition: spinning ? "transform 3s cubic-bezier(.17,.67,.2,1)" : "none",
                  position: "relative",
                }}>
                  {SEG_COLORS.map((_, i) => {
                    const deg = (360 / SEG_COLORS.length) * i + (360 / SEG_COLORS.length) / 2;
                    return (
                      <div key={i} style={{
                        position: "absolute", top: "50%", left: "50%",
                        transform: `rotate(${deg}deg) translateY(-120px) rotate(-${deg}deg)`,
                        marginLeft: -10, marginTop: -10, width: 20, height: 20,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: "var(--font-mono)",
                      }}>{i === 12 ? "0" : i + 1}</div>
                    );
                  })}
                </div>
                <div style={{
                  position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                  width: 80, height: 80, borderRadius: "50%",
                  background: "radial-gradient(circle at 30% 30%, #FFE3A6, #F5B841 55%, #D39110)",
                  boxShadow: "inset 0 2px 4px rgb(255 255 255 / .5), 0 8px 20px rgb(0 0 0 / .5)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 34, color: "#1A0F00", fontWeight: 900,
                }}>C</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              {([
                { k: "red", label: "Красное", bg: "#D9432A", mult: "×2" },
                { k: "black", label: "Чёрное", bg: "#1A1E2A", mult: "×2" },
                { k: "green", label: "Зелёное", bg: "#34C759", mult: "×14" },
              ] as const).map((c) => (
                <button key={c.k} onClick={() => setColor(c.k)} disabled={spinning}
                  style={{
                    flex: 1, padding: "14px 0", borderRadius: 14,
                    background: c.bg, color: "#fff",
                    border: "none", cursor: spinning ? "not-allowed" : "pointer",
                    boxShadow: color === c.k ? `inset 0 0 0 3px #FFD78C, 0 8px 24px ${c.bg}88` : "inset 0 1px 0 rgb(255 255 255 / .2)",
                    fontWeight: 700, transition: "all 220ms",
                  }}>
                  <div style={{ fontSize: 14 }}>{c.label}</div>
                  <div style={{ fontSize: 11, opacity: .8 }}>{c.mult}</div>
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              {[100, 500, 1000, 5000, 10000].map((v) => (
                <button key={v} onClick={() => setBet(v)} style={{
                  flex: 1, padding: "10px 0", borderRadius: 10,
                  background: bet === v ? "linear-gradient(180deg,#FFD78C,#F5B841)" : "rgb(255 255 255 / .06)",
                  color: bet === v ? "#1A0F00" : "#C8CEDB",
                  border: "none", cursor: "pointer",
                  fontSize: 13, fontWeight: 700, fontFamily: "var(--font-mono)",
                  boxShadow: bet === v ? "inset 0 1px 0 rgb(255 255 255 / .5)" : "none",
                }}>{nf(v)}</button>
              ))}
            </div>

            <Btn tone="amber" size="lg" style={{ width: "100%" }} onClick={doSpin} disabled={spinning}>
              {spinning ? "🎲 Крутится..." : `Крутить за ${nf(bet)} MPL`}
            </Btn>
          </Glass>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          <Glass tier="regular" tint="amber" style={{ padding: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>💎 Подкидной / Coin-flip</div>
            <div style={{ fontSize: 12, color: "#FFE3A6", marginTop: 2, marginBottom: 12 }}>50/50 · ×1.9</div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn tone="amber" size="sm" style={{ flex: 1 }} onClick={() => doFlip("heads")}>Орёл</Btn>
              <Btn tone="glass" size="sm" style={{ flex: 1 }} onClick={() => doFlip("tails")}>Решка</Btn>
            </div>
          </Glass>

          <Glass style={{ padding: 4, maxHeight: 360, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "12px 16px 8px", fontSize: 14, fontWeight: 700 }}>🏆 Hall of fame</div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {hof.length === 0 && <div style={{ padding: 16, color: "var(--fg-4)", fontSize: 13 }}>Пока никто не выиграл крупно.</div>}
              {hof.map((it, i) => (
                <Row key={i}
                  leading={<Avatar handle={it.user} size={26} />}
                  title={<span style={{ fontSize: 13 }}>{it.user}</span>}
                  subtitle={<span style={{ fontSize: 11 }}>{it.game} · {timeAgo(it.created_at)}</span>}
                  trailing={<span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "#9CEBB3", fontWeight: 600 }}>+{nf(it.payout)} MPL</span>}
                />
              ))}
            </div>
          </Glass>
        </div>
      </div>
    </>
  );
}
