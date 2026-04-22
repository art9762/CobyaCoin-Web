import type { CSSProperties, PropsWithChildren, MouseEventHandler } from "react";

export type GlassTier = "thin" | "regular" | "thick";
export type GlassTint = "amber" | "maple" | "reserve" | "success" | "danger" | "violet" | null;

const fills: Record<GlassTier, string> = {
  thin:    "rgb(18 21 32 / .40)",
  regular: "rgb(18 21 32 / .55)",
  thick:   "rgb(12 14 20 / .70)",
};
const blurs: Record<GlassTier, string> = {
  thin:    "saturate(160%) blur(20px)",
  regular: "saturate(180%) blur(30px)",
  thick:   "saturate(200%) blur(40px)",
};
const tints: Record<Exclude<GlassTint, null>, string> = {
  amber:   "rgb(245 184 65 / .18)",
  maple:   "rgb(217 67 42 / .22)",
  reserve: "rgb(58 141 255 / .18)",
  success: "rgb(52 199 89 / .18)",
  danger:  "rgb(255 69 58 / .18)",
  violet:  "rgb(138 47 255 / .22)",
};

interface GlassProps {
  tier?: GlassTier;
  tint?: GlassTint;
  style?: CSSProperties;
  className?: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
}

export function Glass({
  tier = "regular", tint = null, style, className = "", onClick, children,
}: PropsWithChildren<GlassProps>) {
  const bg = tint
    ? `linear-gradient(${tints[tint]}, ${tints[tint]}), ${fills[tier]}`
    : fills[tier];
  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        background: bg,
        backdropFilter: blurs[tier],
        WebkitBackdropFilter: blurs[tier],
        boxShadow:
          "inset 0 0 0 1px rgb(255 255 255 / .12), inset 0 1px 0 rgb(255 255 255 / .22), 0 8px 24px rgb(0 0 0 / .28)",
        borderRadius: 22,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
