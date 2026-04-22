import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { nf } from "../utils/format";

interface TickerProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  size?: number;
  flashOnChange?: boolean;
  style?: CSSProperties;
}

export function Ticker({
  value, decimals = 2, prefix = "", suffix = "", size = 34, flashOnChange = true, style,
}: TickerProps) {
  const prev = useRef(value);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  useEffect(() => {
    if (flashOnChange && prev.current !== value) {
      setFlash(value > prev.current ? "up" : "down");
      const t = setTimeout(() => setFlash(null), 600);
      prev.current = value;
      return () => clearTimeout(t);
    }
    prev.current = value;
  }, [value, flashOnChange]);
  const color = flash === "up" ? "#6EE59E" : flash === "down" ? "#FFB3AE" : "#fff";
  return (
    <span style={{
      fontFamily: "var(--font-mono)",
      fontWeight: 700,
      fontSize: size,
      letterSpacing: "-.02em",
      color,
      transition: "color 600ms var(--ease-smooth)",
      fontVariantNumeric: "tabular-nums",
      ...style,
    }}>
      {prefix}{nf(value, decimals)}{suffix}
    </span>
  );
}
