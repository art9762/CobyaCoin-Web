import { useToasts } from "../stores/toast";

export function ToastStack() {
  const toasts = useToasts((s) => s.toasts);
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 100,
      display: "flex", flexDirection: "column", gap: 10, pointerEvents: "none",
    }}>
      {toasts.map((t) => (
        <div key={t.id} style={{
          background: "rgb(12 14 20 / .82)",
          backdropFilter: "saturate(200%) blur(40px)",
          WebkitBackdropFilter: "saturate(200%) blur(40px)",
          boxShadow: "inset 0 0 0 1px rgb(255 255 255 / .14), inset 0 1px 0 rgb(255 255 255 / .28), 0 20px 48px rgb(0 0 0 / .5)",
          borderRadius: 14, padding: "12px 16px",
          color: "#fff", fontSize: 14, fontWeight: 500,
          minWidth: 240, maxWidth: 360,
          display: "flex", alignItems: "center", gap: 10,
          animation: "toastIn .35s var(--ease-smooth)",
        }}>
          {t.emoji && <span style={{ fontSize: 18 }}>{t.emoji}</span>}
          <span style={{ flex: 1 }}>{t.text}</span>
        </div>
      ))}
    </div>
  );
}
