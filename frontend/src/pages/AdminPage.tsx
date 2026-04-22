import { useEffect, useState } from "react";
import { Glass } from "../components/Glass";
import { Btn } from "../components/Btn";
import { Chip } from "../components/Chip";
import { PageHeader } from "../components/Layout";
import { useToasts } from "../stores/toast";
import {
  adminBan, adminCreatePromo, adminDisablePromo, adminGrant,
  adminLots, adminModerateLot, adminPromos, adminSetJackpot, adminStats, adminUsers,
} from "../api/endpoints";
import { nf } from "../utils/format";

type Tab = "users" | "promos" | "lots" | "jackpot" | "stats";

export function AdminPage() {
  const show = useToasts((s) => s.show);
  const [tab, setTab] = useState<Tab>("stats");

  return (
    <>
      <PageHeader title="Админ-панель" sub="Модерация и настройки платформы." right={
        <Glass style={{ padding: 4, borderRadius: 14 }}>
          <div style={{ display: "flex" }}>
            {([["stats", "Статистика"], ["users", "Юзеры"], ["promos", "Промокоды"], ["lots", "Лоты"], ["jackpot", "Джекпот"]] as const).map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} style={{
                padding: "8px 16px", borderRadius: 10, border: "none",
                background: tab === k ? "linear-gradient(180deg,#6FA9FF,#3A8DFF)" : "transparent",
                color: tab === k ? "#fff" : "#C8CEDB",
                fontWeight: 700, fontSize: 13, cursor: "pointer",
              }}>{l}</button>
            ))}
          </div>
        </Glass>
      } />

      {tab === "stats" && <AdminStats />}
      {tab === "users" && <AdminUsers show={show} />}
      {tab === "promos" && <AdminPromos show={show} />}
      {tab === "lots" && <AdminLots show={show} />}
      {tab === "jackpot" && <AdminJackpot show={show} />}
    </>
  );
}

type ShowFn = (t: { emoji?: string; text: string }) => void;

function AdminStats() {
  const [s, setS] = useState<Awaited<ReturnType<typeof adminStats>> | null>(null);
  useEffect(() => {
    adminStats().then(setS).catch(() => {});
    const t = window.setInterval(() => adminStats().then(setS).catch(() => {}), 10_000);
    return () => window.clearInterval(t);
  }, []);
  if (!s) return null;
  const cards: Array<[string, string | number, string]> = [
    ["Пользователи",         s.users,                   "#FFE3A6"],
    ["Активные ордеры",      s.active_orders,           "#9CEBB3"],
    ["Всего сделок",         s.trades,                  "#BFD7FF"],
    ["Спинов в казино",      s.casino_spins,            "#D4B8FF"],
    ["Эмиссия CBC",          nf(s.supply_cbc, 2),       "#F5B841"],
    ["Эмиссия MPL",          nf(s.supply_mpl, 0),       "#D9432A"],
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
      {cards.map(([k, v, c]) => (
        <Glass key={k} style={{ padding: 18 }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700, color: "#9AA2B4" }}>{k}</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 28, fontWeight: 800, marginTop: 6, color: c }}>{v}</div>
        </Glass>
      ))}
    </div>
  );
}

function AdminUsers({ show }: { show: ShowFn }) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Awaited<ReturnType<typeof adminUsers>>>([]);
  const refresh = () => adminUsers(q).then(setRows).catch(() => {});
  useEffect(() => { refresh(); }, [q]);

  const ban = async (id: number, is_banned: boolean) => {
    const reason = is_banned ? prompt("Причина бана?") ?? "policy" : "";
    try { await adminBan(id, is_banned, reason); show({ emoji: "✅", text: is_banned ? "Забанен" : "Разбанен" }); refresh(); }
    catch (e) { show({ emoji: "❌", text: e instanceof Error ? e.message : "ошибка" }); }
  };
  const grant = async (id: number) => {
    const mpl = Number(prompt("Сколько MPL выдать?") ?? 0);
    const cbc = Number(prompt("Сколько CBC выдать?") ?? 0);
    if (!mpl && !cbc) return;
    try { await adminGrant(id, mpl, cbc, "admin grant"); show({ emoji: "✅", text: "Выдано" }); refresh(); }
    catch (e) { show({ emoji: "❌", text: e instanceof Error ? e.message : "ошибка" }); }
  };

  return (
    <>
      <Glass style={{ padding: 12, marginBottom: 14 }}>
        <input placeholder="Поиск по @handle…" value={q} onChange={(e) => setQ(e.target.value)}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 10, background: "rgb(0 0 0 / .3)",
            border: "1px solid rgb(255 255 255 / .12)", color: "#fff", outline: "none", fontSize: 14 }} />
      </Glass>
      <Glass style={{ padding: 4 }}>
        <div style={{ display: "grid", gridTemplateColumns: "50px 1fr 120px 120px 180px", padding: "12px 16px",
          fontSize: 11, textTransform: "uppercase", color: "#9AA2B4", fontWeight: 700, letterSpacing: ".08em" }}>
          <div>ID</div><div>Handle</div>
          <div style={{ textAlign: "right" }}>CBC</div>
          <div style={{ textAlign: "right" }}>MPL</div>
          <div style={{ textAlign: "right" }}>Действия</div>
        </div>
        {rows.map((u) => (
          <div key={u.id} style={{
            display: "grid", gridTemplateColumns: "50px 1fr 120px 120px 180px", alignItems: "center",
            padding: "12px 16px", borderTop: "1px solid rgb(255 255 255 / .05)",
            background: u.is_banned ? "rgb(255 69 58 / .08)" : "transparent",
          }}>
            <div style={{ fontFamily: "var(--font-mono)", color: "#9AA2B4" }}>{u.id}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{u.handle}</span>
              {u.is_admin && <Chip tint="reserve">admin</Chip>}
              {u.is_banned && <Chip tint="danger">banned</Chip>}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", textAlign: "right" }}>{nf(u.cbc, 2)}</div>
            <div style={{ fontFamily: "var(--font-mono)", textAlign: "right" }}>{nf(u.mpl)}</div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Btn tone="glass" size="sm" onClick={() => grant(u.id)}>+</Btn>
              <Btn tone={u.is_banned ? "glass" : "danger"} size="sm" onClick={() => ban(u.id, !u.is_banned)}>
                {u.is_banned ? "Разбан" : "Бан"}
              </Btn>
            </div>
          </div>
        ))}
      </Glass>
    </>
  );
}

function AdminPromos({ show }: { show: ShowFn }) {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof adminPromos>>>([]);
  const [form, setForm] = useState({ code: "", mpl_bonus: 5000, cbc_bonus: 0, uses: 100, per_user: 1 });
  const refresh = () => adminPromos().then(setRows).catch(() => {});
  useEffect(() => { refresh(); }, []);
  const create = async () => {
    try {
      await adminCreatePromo(form);
      show({ emoji: "✅", text: "Промокод создан." });
      setForm({ ...form, code: "" });
      refresh();
    } catch (e) { show({ emoji: "❌", text: e instanceof Error ? e.message : "ошибка" }); }
  };
  return (
    <>
      <Glass style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 10 }}>
          <input placeholder="CODE" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} style={fieldStyle} />
          <input placeholder="MPL" type="number" value={form.mpl_bonus} onChange={(e) => setForm({ ...form, mpl_bonus: Number(e.target.value) })} style={fieldStyle} />
          <input placeholder="CBC" type="number" value={form.cbc_bonus} onChange={(e) => setForm({ ...form, cbc_bonus: Number(e.target.value) })} style={fieldStyle} />
          <input placeholder="Uses" type="number" value={form.uses} onChange={(e) => setForm({ ...form, uses: Number(e.target.value) })} style={fieldStyle} />
          <input placeholder="Per user" type="number" value={form.per_user} onChange={(e) => setForm({ ...form, per_user: Number(e.target.value) })} style={fieldStyle} />
        </div>
        <div style={{ marginTop: 10 }}>
          <Btn tone="reserve" onClick={create}>Создать промокод</Btn>
        </div>
      </Glass>
      <Glass style={{ padding: 4 }}>
        {rows.map((p) => (
          <div key={p.id} style={{
            display: "grid", gridTemplateColumns: "1fr 120px 120px 120px 140px",
            alignItems: "center", padding: "10px 16px",
            borderTop: "1px solid rgb(255 255 255 / .05)",
            opacity: p.active ? 1 : 0.5,
          }}>
            <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{p.code}</div>
            <div style={{ fontFamily: "var(--font-mono)", textAlign: "right" }}>{nf(p.mpl_bonus)} MPL</div>
            <div style={{ fontFamily: "var(--font-mono)", textAlign: "right" }}>{p.cbc_bonus} CBC</div>
            <div style={{ fontFamily: "var(--font-mono)", textAlign: "right" }}>{p.uses_remaining} / ×{p.per_user}</div>
            <div style={{ textAlign: "right" }}>
              {p.active && <Btn tone="danger" size="sm" onClick={() => adminDisablePromo(p.id).then(refresh)}>Отключить</Btn>}
              {!p.active && <Chip tint="neutral">off</Chip>}
            </div>
          </div>
        ))}
      </Glass>
    </>
  );
}

function AdminLots({ show }: { show: ShowFn }) {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof adminLots>>>([]);
  const refresh = () => adminLots().then(setRows).catch(() => {});
  useEffect(() => { refresh(); }, []);
  const moderate = async (id: number, status: string, featured?: boolean) => {
    try { await adminModerateLot(id, status, featured); show({ emoji: "✅", text: status }); refresh(); }
    catch (e) { show({ emoji: "❌", text: e instanceof Error ? e.message : "ошибка" }); }
  };
  return (
    <Glass style={{ padding: 4 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 140px 140px 240px",
        padding: "12px 16px", fontSize: 11, textTransform: "uppercase", color: "#9AA2B4", fontWeight: 700, letterSpacing: ".08em" }}>
        <div>Название</div><div>Редкость</div>
        <div style={{ textAlign: "right" }}>Ставка</div>
        <div style={{ textAlign: "right" }}>Статус</div>
        <div style={{ textAlign: "right" }}>Действия</div>
      </div>
      {rows.map((l) => (
        <div key={l.id} style={{
          display: "grid", gridTemplateColumns: "1fr 120px 140px 140px 240px", alignItems: "center",
          padding: "10px 16px", borderTop: "1px solid rgb(255 255 255 / .05)",
        }}>
          <div>{l.title}{l.is_featured && <Chip tint="amber" style={{ marginLeft: 8 }}>featured</Chip>}</div>
          <div style={{ fontSize: 12, color: "#C8CEDB" }}>{l.rarity}</div>
          <div style={{ fontFamily: "var(--font-mono)", textAlign: "right" }}>{nf(l.current_bid)} MPL</div>
          <div style={{ fontFamily: "var(--font-mono)", textAlign: "right", color: l.status === "active" ? "#9CEBB3" : "#C8CEDB" }}>{l.status}</div>
          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
            {l.status !== "active" && <Btn tone="success" size="sm" onClick={() => moderate(l.id, "active")}>Активировать</Btn>}
            {l.status === "active" && <Btn tone="glass" size="sm" onClick={() => moderate(l.id, "active", !l.is_featured)}>{l.is_featured ? "−Feature" : "+Feature"}</Btn>}
            {l.status !== "rejected" && <Btn tone="danger" size="sm" onClick={() => moderate(l.id, "rejected")}>Отклонить</Btn>}
          </div>
        </div>
      ))}
    </Glass>
  );
}

function AdminJackpot({ show }: { show: ShowFn }) {
  const [mpl, setMpl] = useState(412_000);
  const save = async () => {
    try { await adminSetJackpot(mpl); show({ emoji: "✅", text: "Джекпот обновлён" }); }
    catch (e) { show({ emoji: "❌", text: e instanceof Error ? e.message : "ошибка" }); }
  };
  return (
    <Glass style={{ padding: 22 }}>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Установить сумму джекпота</div>
      <input type="number" value={mpl} onChange={(e) => setMpl(Number(e.target.value))}
        style={{ ...fieldStyle, width: 260, fontSize: 22 }} />
      <div style={{ marginTop: 12 }}>
        <Btn tone="reserve" onClick={save}>Сохранить</Btn>
      </div>
    </Glass>
  );
}

const fieldStyle: React.CSSProperties = {
  padding: "10px 12px", borderRadius: 10,
  background: "rgb(0 0 0 / .3)", border: "1px solid rgb(255 255 255 / .1)",
  color: "#fff", fontSize: 14, outline: "none",
};
