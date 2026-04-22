import type { CSSProperties, PropsWithChildren } from "react";

export type ChipTint = "neutral" | "amber" | "maple" | "reserve" | "success" | "danger" | "violet";

const tints: Record<ChipTint, { bg: string; color: string }> = {
  neutral: { bg: "rgb(255 255 255 / .10)", color: "#fff" },
  amber:   { bg: "rgb(245 184 65 / .22)",  color: "#FFE3A6" },
  maple:   { bg: "rgb(217 67 42 / .22)",   color: "#FFC4B3" },
  reserve: { bg: "rgb(58 141 255 / .22)",  color: "#BFD7FF" },
  success: { bg: "rgb(52 199 89 / .22)",   color: "#9CEBB3" },
  danger:  { bg: "rgb(255 69 58 / .22)",   color: "#FFB3AE" },
  violet:  { bg: "rgb(138 47 255 / .22)",  color: "#D4B8FF" },
};

export function Chip({
  tint = "neutral", children, style,
}: PropsWithChildren<{ tint?: ChipTint; style?: CSSProperties }>) {
  const t = tints[tint];
  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: 999,
        background: t.bg,
        color: t.color,
        fontSize: 12,
        lineHeight: "16px",
        fontWeight: 600,
        fontFamily: "var(--font-sans)",
        whiteSpace: "nowrap",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        ...style,
      }}
    >
      {children}
    </span>
  );
}
