import type { CSSProperties, ReactNode } from "react";

interface RowProps {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  onClick?: () => void;
  style?: CSSProperties;
}

export function Row({ leading, title, subtitle, trailing, onClick, style }: RowProps) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "12px 16px", cursor: onClick ? "pointer" : "default",
        borderRadius: 14, transition: "background 220ms",
        ...style,
      }}
      onMouseEnter={(e) => { if (onClick) e.currentTarget.style.background = "rgb(255 255 255 / .04)"; }}
      onMouseLeave={(e) => { if (onClick) e.currentTarget.style.background = "transparent"; }}
    >
      {leading !== undefined && <div style={{ flexShrink: 0 }}>{leading}</div>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          color: "#fff", fontSize: 15, lineHeight: "20px", fontWeight: 600,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>{title}</div>
        {subtitle !== undefined && (
          <div style={{ color: "#9AA2B4", fontSize: 13, lineHeight: "17px", marginTop: 1 }}>
            {subtitle}
          </div>
        )}
      </div>
      {trailing !== undefined && <div style={{ flexShrink: 0, textAlign: "right" }}>{trailing}</div>}
    </div>
  );
}
