import { useEffect, useState } from "react";
import { Glass } from "../components/Glass";
import { Btn } from "../components/Btn";
import { Chip } from "../components/Chip";
import { RarityBadge } from "../components/RarityBadge";
import { Lift } from "../components/Lift";
import { PageHeader, fireWalletRefresh } from "../components/Layout";
import { useToasts } from "../stores/toast";
import { bidLot, createLot, listLots } from "../api/endpoints";
import type { AuctionLot } from "../types";
import { nf, countdownSecondsTo, fmtTime } from "../utils/format";

const colors: Record<string, string> = {
  common: "#505868", rare: "#3A8DFF", legendary: "#F5B841", mythic: "#8A2FFF",
};
const tints: Record<string, "reserve" | "amber" | "violet" | null> = {
  common: null, rare: "reserve", legendary: "amber", mythic: "violet",
};

export function AuctionPage() {
  const show = useToasts((s) => s.show);
  const [lots, setLots] = useState<AuctionLot[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [_, setTick] = useState(0);
  const [form, setForm] = useState({
    title: "", description: "", rarity: "rare",
    image_emoji: "🎴", start_bid: 5000, duration_hours: 24,
  });

  const refresh = () => listLots().then(setLots).catch(() => {});
  useEffect(() => {
    refresh();
    const t = window.setInterval(refresh, 8000);
    const c = window.setInterval(() => setTick((x) => x + 1), 1000);
    return () => { window.clearInterval(t); window.clearInterval(c); };
  }, []);

  const doBid = async (lot: AuctionLot) => {
    const amount = lot.current_bid + 500;
    try {
      await bidLot(lot.id, amount);
      show({ emoji: "📢", text: `Ставка +500 MPL — ${lot.title}.` });
      refresh();
      fireWalletRefresh();
    } catch (e) {
      show({ emoji: "❌", text: e instanceof Error ? e.message : "ошибка" });
    }
  };

  const doCreate = async () => {
    try {
      await createLot({ ...form, start_bid: Number(form.start_bid) });
      show({ emoji: "✅", text: "Лот отправлен на модерацию. Ожидай подтверждения." });
      setShowCreate(false);
      refresh();
    } catch (e) {
      show({ emoji: "❌", text: e instanceof Error ? e.message : "ошибка" });
    }
  };

  return (
    <>
      <PageHeader title="Аукцион" sub="NFT-лоты от игроков. Ставки идут в MPL, минимальный шаг +500." right={
        <Btn tone="glass" onClick={() => setShowCreate((v) => !v)}>+ Выставить лот</Btn>
      } />

      {showCreate && (
        <Glass style={{ padding: 18, marginBottom: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 10 }}>
            <input placeholder="Название" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              style={fieldStyle} />
            <select value={form.rarity} onChange={(e) => setForm({ ...form, rarity: e.target.value })} style={fieldStyle}>
              <option value="common">Common</option>
              <option value="rare">Rare</option>
              <option value="legendary">Legendary</option>
              <option value="mythic">Mythic</option>
            </select>
            <input placeholder="Эмодзи" value={form.image_emoji} onChange={(e) => setForm({ ...form, image_emoji: e.target.value })} style={fieldStyle} />
            <input placeholder="Старт, MPL" type="number" value={form.start_bid}
              onChange={(e) => setForm({ ...form, start_bid: Number(e.target.value) })} style={fieldStyle} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: 10, marginTop: 10 }}>
            <input placeholder="Описание (необязательно)" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} style={fieldStyle} />
            <input placeholder="Часов" type="number" value={form.duration_hours}
              onChange={(e) => setForm({ ...form, duration_hours: Number(e.target.value) })} style={fieldStyle} />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <Btn tone="amber" onClick={doCreate}>Выставить</Btn>
            <Btn tone="glass" onClick={() => setShowCreate(false)}>Отменить</Btn>
          </div>
        </Glass>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {lots.length === 0 && (
          <Glass style={{ padding: 36, textAlign: "center", color: "var(--fg-3)" }}>
            Пока нет активных лотов.
          </Glass>
        )}
        {lots.map((a) => {
          const secondsLeft = countdownSecondsTo(a.ends_at);
          return (
            <Lift key={a.id}>
              <Glass tint={tints[a.rarity] ?? null} style={{ padding: 0, overflow: "hidden" }}>
                <div style={{
                  height: 180,
                  background: `radial-gradient(circle at 30% 30%, ${colors[a.rarity]}44, transparent 70%), linear-gradient(135deg, ${colors[a.rarity]}22, rgb(0 0 0 / .4))`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  position: "relative", borderBottom: "1px solid rgb(255 255 255 / .06)",
                }}>
                  <div style={{ fontSize: 68, filter: `drop-shadow(0 8px 20px ${colors[a.rarity]}88)` }}>
                    {a.image_emoji}
                  </div>
                  <div style={{ position: "absolute", top: 12, left: 12 }}><RarityBadge rarity={a.rarity} /></div>
                  <div style={{ position: "absolute", top: 12, right: 12 }}>
                    <Chip tint={secondsLeft < 300 ? "danger" : "neutral"}>⏱ {fmtTime(secondsLeft)}</Chip>
                  </div>
                </div>
                <div style={{ padding: 16 }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{a.title}</div>
                  <div style={{ fontSize: 12, color: "#9AA2B4", marginTop: 2 }}>
                    Лидер: {a.current_bidder_handle ?? "—"} · Автор: {a.creator_handle}
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: 12, gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "#9AA2B4", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700 }}>
                        Текущая ставка
                      </div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700 }}>
                        {nf(a.current_bid)} <span style={{ fontSize: 12, color: "#D9432A" }}>MPL</span>
                      </div>
                    </div>
                    <Btn tone="amber" size="sm" onClick={() => doBid(a)}>+500</Btn>
                  </div>
                </div>
              </Glass>
            </Lift>
          );
        })}
      </div>
    </>
  );
}

const fieldStyle: React.CSSProperties = {
  padding: "10px 12px", borderRadius: 10,
  background: "rgb(0 0 0 / .3)", border: "1px solid rgb(255 255 255 / .1)",
  color: "#fff", fontSize: 14, outline: "none",
};
