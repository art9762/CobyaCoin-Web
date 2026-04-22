interface MarkProps { size?: number; spin?: boolean }

export function CoinMark({ size = 40, spin = false }: MarkProps) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 999,
      background: "radial-gradient(circle at 30% 30%, #FFE3A6, #F5B841 55%, #D39110 100%)",
      boxShadow: "inset 0 2px 4px rgb(255 255 255 / .5), inset 0 -4px 8px rgb(0 0 0 / .3), 0 6px 16px rgb(245 184 65 / .4)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#1A0F00", fontSize: size * 0.5, fontWeight: 900,
      fontFamily: "var(--font-sans)",
      animation: spin ? "coinSpin 12s linear infinite" : undefined,
      flexShrink: 0,
    }}>C</div>
  );
}

export function MapleMark({ size = 28 }: MarkProps) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 999,
      background: "radial-gradient(circle at 30% 30%, #FFC4B3, #D9432A 60%, #8B2515 100%)",
      boxShadow: "inset 0 2px 4px rgb(255 255 255 / .4), 0 4px 12px rgb(217 67 42 / .4)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontSize: size * 0.55, flexShrink: 0,
    }}>🍁</div>
  );
}
