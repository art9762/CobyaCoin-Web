import type { CSSProperties, PropsWithChildren, MouseEventHandler, ButtonHTMLAttributes } from "react";

export type BtnTone = "amber" | "maple" | "reserve" | "success" | "danger" | "glass" | "ghost";
export type BtnSize = "sm" | "md" | "lg";

const tones: Record<BtnTone, { bg: string; color: string; glow: string }> = {
  amber:   { bg: "linear-gradient(180deg,#FFD78C,#F5B841)", color: "#1A0F00", glow: "rgb(245 184 65 / .45)" },
  maple:   { bg: "linear-gradient(180deg,#E8674C,#C23A22)", color: "#fff",    glow: "rgb(217 67 42 / .45)" },
  reserve: { bg: "linear-gradient(180deg,#6FA9FF,#3A8DFF)", color: "#fff",    glow: "rgb(58 141 255 / .45)" },
  success: { bg: "linear-gradient(180deg,#6EE59E,#34C759)", color: "#042b12", glow: "rgb(52 199 89 / .45)" },
  danger:  { bg: "linear-gradient(180deg,#FF7A73,#FF453A)", color: "#fff",    glow: "rgb(255 69 58 / .45)" },
  glass:   { bg: "rgb(18 21 32 / .55)",                    color: "#fff",    glow: "transparent" },
  ghost:   { bg: "transparent",                            color: "#C8CEDB", glow: "transparent" },
};
const sizes: Record<BtnSize, { p: string; fs: number; r: number }> = {
  sm: { p: "8px 12px",  fs: 13, r: 10 },
  md: { p: "12px 18px", fs: 15, r: 14 },
  lg: { p: "16px 22px", fs: 17, r: 16 },
};

interface BtnProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  tone?: BtnTone;
  size?: BtnSize;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  style?: CSSProperties;
}

export function Btn({
  tone = "amber", size = "md", children, onClick, style, disabled, ...rest
}: PropsWithChildren<BtnProps>) {
  const t = tones[tone];
  const sz = sizes[size];
  const shadow =
    tone === "glass"
      ? "inset 0 0 0 1px #ffffff24, inset 0 1px 0 #ffffff38, 0 8px 24px rgb(0 0 0 / .25)"
      : tone === "ghost"
      ? "none"
      : `inset 0 1px 0 rgb(255 255 255 / .55), 0 10px 24px ${t.glow}`;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      {...rest}
      style={{
        background: t.bg,
        color: t.color,
        border: tone === "ghost" ? "1px solid rgb(255 255 255 / .14)" : "none",
        borderRadius: sz.r,
        padding: sz.p,
        fontFamily: "var(--font-sans)",
        fontSize: sz.fs,
        fontWeight: 700,
        letterSpacing: "-.005em",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? .5 : 1,
        boxShadow: shadow,
        backdropFilter: tone === "glass" ? "saturate(180%) blur(30px)" : undefined,
        WebkitBackdropFilter: tone === "glass" ? "saturate(180%) blur(30px)" : undefined,
        transition: "transform 120ms var(--ease-smooth), box-shadow 220ms",
        ...style,
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(.97)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {children}
    </button>
  );
}
