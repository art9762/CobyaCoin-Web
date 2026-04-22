interface AvatarProps {
  handle: string;
  size?: number;
  src?: string;
}

export function Avatar({ handle, size = 32, src }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src} alt=""
        width={size} height={size}
        style={{
          width: size, height: size, borderRadius: 999, objectFit: "cover",
          boxShadow: "inset 0 1px 0 rgb(255 255 255 / .3)",
          flexShrink: 0, display: "block",
        }}
      />
    );
  }
  const seed = [...handle].reduce((a, c) => a + c.charCodeAt(0), 0);
  const h1 = (seed * 37) % 360;
  const h2 = (h1 + 40) % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: 999,
      background: `linear-gradient(135deg, hsl(${h1} 70% 60%), hsl(${h2} 70% 45%))`,
      boxShadow: "inset 0 1px 0 rgb(255 255 255 / .3)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontSize: size * 0.38, fontWeight: 700, flexShrink: 0,
    }}>
      {handle.replace("@", "").charAt(0).toUpperCase() || "?"}
    </div>
  );
}
