export function nf(n: number, d = 0): string {
  if (!Number.isFinite(n)) return "—";
  const s = Number(n).toFixed(d);
  const [whole, dec] = s.split(".");
  const w = whole.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return dec ? `${w}.${dec}` : w;
}

export function fmtTime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}ч ${m}м`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function countdownSecondsTo(iso: string): number {
  const t = new Date(iso).getTime();
  return Math.max(0, Math.floor((t - Date.now()) / 1000));
}

export function timeAgo(iso: string): string {
  const d = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (d < 60) return "сейчас";
  if (d < 3600) return `${Math.floor(d / 60)}м`;
  if (d < 86400) return `${Math.floor(d / 3600)}ч`;
  return `${Math.floor(d / 86400)}д`;
}
