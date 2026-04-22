import type { CSSProperties, PropsWithChildren } from "react";

export function Lift({
  children, amount = 4, style,
}: PropsWithChildren<{ amount?: number; style?: CSSProperties }>) {
  return (
    <div
      style={{ transition: "transform 300ms var(--ease-smooth)", ...style }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = `translateY(-${amount}px)`; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {children}
    </div>
  );
}
