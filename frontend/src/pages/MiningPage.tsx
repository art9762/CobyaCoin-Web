import { useEffect, useState } from "react";
import { Glass } from "../components/Glass";
import { Btn } from "../components/Btn";
import { Ticker } from "../components/Ticker";
import { PageHeader, fireWalletRefresh } from "../components/Layout";
import { useMarket } from "../stores/market";
import { useToasts } from "../stores/toast";
import { buyGpu, claimDaily, collect, getDaily, getFarm, sellGpu, upgradeFarm } from "../api/endpoints";
import type { MiningState } from "../types";
import { nf } from "../utils/format";

export function MiningPage() {
  const market = useMarket((s) => s.market);
  const show = useToasts((s) => s.show);
  const [farm, setFarm] = useState<MiningState | null>(null);
  const [daily, setDaily] = useState<{ streak: number; can_claim: boolean; next_in_seconds: number } | null>(null);

  const refresh = () => {
    getFarm().then(setFarm).catch(() => {});
    getDaily().then(setDaily).catch(() => {});
  };

  useEffect(() => {
    refresh();
    // Local extrapolation: update pending between server polls for a live feel.
    const fetchTimer = window.setInterval(refresh, 3000);
    const localTimer = window.setInterval(() => {
      setFarm((f) => f ? { ...f, pending: f.pending + f.rate * f.gpus * 1 } : f);
    }, 1000);
    return () => { window.clearInterval(fetchTimer); window.clearInterval(localTimer); };
  }, []);

  if (!farm || !market) return null;

  const doCollect = async () => {
    try {
      const r = await collect();
      show({ emoji: "💰", text: `+${r.collected_cbc.toFixed(2)} CBC собрано.` });
      refresh();
      fireWalletRefresh();
    } catch (e) {
      show({ emoji: "❌", text: e instanceof Error ? e.message : "ошибка" });
    }
  };
  const doBuy = async () => {
    try {
      const next = await buyGpu();
      setFarm(next);
      show({ emoji: "⛏", text: "GPU установлен." });
      fireWalletRefresh();
    } catch (e) {
      show({ emoji: "❌", text: e instanceof Error ? e.message : "ошибка" });
    }
  };
  const doSell = async () => {
    try {
      const next = await sellGpu();
      setFarm(next);
      show({ emoji: "✅", text: "GPU продан · +180 MPL" });
      fireWalletRefresh();
    } catch (e) {
      show({ emoji: "❌", text: e instanceof Error ? e.message : "ошибка" });
    }
  };
  const doUpgrade = async () => {
    try {
      const next = await upgradeFarm();
      setFarm(next);
      show({ emoji: "🛠", text: `Ферма повышена до lvl ${next.level}.` });
      fireWalletRefresh();
    } catch (e) {
      show({ emoji: "❌", text: e instanceof Error ? e.message : "ошибка" });
    }
  };
  const doClaimDaily = async () => {
    try {
      const r = await claimDaily();
      show({ emoji: "🎁", text: `Стрик ${r.streak}/7 · +${nf(r.reward_mpl)} MPL` });
      refresh();
      fireWalletRefresh();
    } catch (e) {
      show({ emoji: "❌", text: e instanceof Error ? e.message : "ошибка" });
    }
  };

  return (
    <>
      <PageHeader title="Майнинг" sub="Покупай видеокарты, апгрейди ферму, собирай CBC." />
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 360px", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <Glass tier="thick" tint="amber" style={{ padding: 28, borderRadius: 28, position: "relative", overflow: "hidden" }}>
            <div style={{
              position: "absolute", inset: 0, opacity: .18,
              backgroundImage: "repeating-linear-gradient(45deg, transparent 0 20px, rgb(245 184 65 / .6) 20px 22px)",
              animation: "slide 8s linear infinite",
            }} />
            <div style={{ position: "relative" }}>
              <div style={{ fontSize: 11, letterSpacing: ".12em", color: "#FFE3A6", textTransform: "uppercase", fontWeight: 700 }}>
                Ферма · lvl {farm.level}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
                <Ticker value={farm.pending} decimals={3} size={60} flashOnChange={false} />
                <span style={{ fontFamily: "var(--font-mono)", color: "#FFE3A6", fontSize: 20, fontWeight: 700 }}>CBC</span>
                <span style={{ color: "#C8CEDB", fontSize: 13, marginLeft: 8 }}>ожидают сбора</span>
              </div>
              <div style={{ display: "flex", gap: 14, marginTop: 8, flexWrap: "wrap" }}>
                <div><span style={{ fontSize: 11, color: "#9AA2B4", textTransform: "uppercase", letterSpacing: ".08em" }}>GPU</span> <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, marginLeft: 6 }}>{farm.gpus} / {farm.max_gpus}</span></div>
                <div><span style={{ fontSize: 11, color: "#9AA2B4", textTransform: "uppercase", letterSpacing: ".08em" }}>Скорость</span> <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, marginLeft: 6 }}>{farm.hourly.toFixed(2)} CBC/ч</span></div>
                <div><span style={{ fontSize: 11, color: "#9AA2B4", textTransform: "uppercase", letterSpacing: ".08em" }}>В день</span> <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, marginLeft: 6 }}>≈ {nf(farm.daily, 1)} CBC</span></div>
              </div>
              <Btn tone="amber" size="lg" style={{ marginTop: 16 }} onClick={doCollect} disabled={farm.pending < 0.001}>
                💰 Собрать {farm.pending.toFixed(3)} CBC
              </Btn>
            </div>
          </Glass>

          <Glass style={{ padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700 }}>Видеокарты</div>
                <div style={{ fontSize: 12, color: "#9AA2B4", marginTop: 2 }}>Активные GPU подсвечены.</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn tone="glass" size="sm" onClick={doSell}>− Продать GPU</Btn>
                <Btn tone="amber" size="sm" onClick={doBuy}>+ GPU · 320 MPL</Btn>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(10,1fr)", gap: 8 }}>
              {Array.from({ length: farm.max_gpus }).map((_, i) => {
                const on = i < farm.gpus;
                return (
                  <div key={i} style={{
                    aspectRatio: "1 / 1", borderRadius: 10,
                    background: on ? "linear-gradient(180deg,#FFD78C,#F5B841)" : "rgb(255 255 255 / .04)",
                    boxShadow: on ? "inset 0 1px 0 #ffffff90, 0 0 12px #F5B84166" : "inset 0 0 0 1px rgb(255 255 255 / .06)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: on ? "#1A0F00" : "#505868", fontSize: 16,
                    animation: on ? `gpuPulse ${2 + (i % 4) * 0.3}s ease-in-out infinite` : undefined,
                    transition: "all 320ms",
                  }}>
                    {on ? "▣" : ""}
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 18, padding: 16, borderRadius: 16, background: "rgb(0 0 0 / .3)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Улучшить ферму до lvl {farm.level + 1}</div>
                <div style={{ fontSize: 12, color: "#9AA2B4", marginTop: 2 }}>+10 слотов GPU, ×1.2 скорость</div>
              </div>
              <Btn tone="reserve" onClick={doUpgrade}>{nf(farm.level * 1000)} MPL</Btn>
            </div>
          </Glass>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          <Glass style={{ padding: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>⚡ Потенциал</div>
            {([
              ["Ставка CBC/с", (farm.rate * farm.gpus).toFixed(4)],
              ["В час", farm.hourly.toFixed(2)],
              ["В сутки", farm.daily.toFixed(1)],
              ["В неделю", (farm.daily * 7).toFixed(0)],
              ["≈ MPL/день", nf(farm.daily * market.price, 0)],
            ] as const).map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgb(255 255 255 / .06)" }}>
                <span style={{ fontSize: 13, color: "#9AA2B4" }}>{k}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 13 }}>{v}</span>
              </div>
            ))}
          </Glass>

          <Glass tint="violet" style={{ padding: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>🎁 Ежедневный бонус</div>
            <div style={{ fontSize: 12, color: "#D4B8FF", marginBottom: 12 }}>
              Стрик: {daily?.streak ?? 0} дней. {daily?.can_claim ? "Можно забрать сейчас." : "Вернись завтра."}
            </div>
            <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
              {[1, 2, 3, 4, 5, 6, 7].map((d) => {
                const on = d <= (daily?.streak ?? 0);
                return (
                  <div key={d} style={{
                    flex: 1, aspectRatio: "1", borderRadius: 10,
                    background: on ? "linear-gradient(180deg,#D4B8FF,#8A2FFF)" : "rgb(255 255 255 / .06)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700,
                    color: on ? "#0a0016" : "#9AA2B4",
                    boxShadow: on ? "inset 0 1px 0 rgb(255 255 255 / .4)" : "none",
                  }}>{d}</div>
                );
              })}
            </div>
            <Btn tone={daily?.can_claim ? "amber" : "glass"} style={{ width: "100%" }} onClick={doClaimDaily} disabled={!daily?.can_claim}>
              {daily?.can_claim ? "🎁 Забрать" : `Забрано · ${Math.floor((daily?.next_in_seconds ?? 0) / 3600)}ч осталось`}
            </Btn>
          </Glass>
        </div>
      </div>
    </>
  );
}
