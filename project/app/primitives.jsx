/* Liquid-glass primitives for CobyaCoin web. Exposes components globally. */

const Glass = ({ tier = 'regular', tint, style, className = '', children, onClick, ...rest }) => {
  const fills = {
    thin: 'rgb(18 21 32 / .40)',
    regular: 'rgb(18 21 32 / .55)',
    thick: 'rgb(12 14 20 / .70)'
  };
  const blurs = {
    thin: 'saturate(160%) blur(20px)',
    regular: 'saturate(180%) blur(30px)',
    thick: 'saturate(200%) blur(40px)'
  };
  const tints = {
    amber: 'rgb(245 184 65 / .18)',
    maple: 'rgb(217 67 42 / .22)',
    reserve: 'rgb(58 141 255 / .18)',
    success: 'rgb(52 199 89 / .18)',
    danger: 'rgb(255 69 58 / .18)',
    violet: 'rgb(138 47 255 / .22)'
  };
  const bg = tint
    ? `linear-gradient(${tints[tint]}, ${tints[tint]}), ${fills[tier]}`
    : fills[tier];
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        background: bg,
        backdropFilter: blurs[tier],
        WebkitBackdropFilter: blurs[tier],
        boxShadow:
          'inset 0 0 0 1px rgb(255 255 255 / .12), inset 0 1px 0 rgb(255 255 255 / .22), 0 8px 24px rgb(0 0 0 / .28)',
        borderRadius: 22,
        ...style
      }}
      {...rest}
    >
      {children}
    </div>
  );
};

const Btn = ({ tone = 'amber', size = 'md', children, onClick, style, disabled }) => {
  const tones = {
    amber: { bg: 'linear-gradient(180deg,#FFD78C,#F5B841)', color: '#1A0F00', glow: 'rgb(245 184 65 / .45)' },
    maple: { bg: 'linear-gradient(180deg,#E8674C,#C23A22)', color: '#fff', glow: 'rgb(217 67 42 / .45)' },
    reserve: { bg: 'linear-gradient(180deg,#6FA9FF,#3A8DFF)', color: '#fff', glow: 'rgb(58 141 255 / .45)' },
    success: { bg: 'linear-gradient(180deg,#6EE59E,#34C759)', color: '#042b12', glow: 'rgb(52 199 89 / .45)' },
    danger: { bg: 'linear-gradient(180deg,#FF7A73,#FF453A)', color: '#fff', glow: 'rgb(255 69 58 / .45)' },
    glass: { bg: 'rgb(18 21 32 / .55)', color: '#fff', glow: 'transparent' },
    ghost: { bg: 'transparent', color: '#C8CEDB', glow: 'transparent' }
  };
  const sizes = {
    sm: { p: '8px 12px', fs: 13, r: 10 },
    md: { p: '12px 18px', fs: 15, r: 14 },
    lg: { p: '16px 22px', fs: 17, r: 16 }
  };
  const t = tones[tone];
  const sz = sizes[size];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: t.bg,
        color: t.color,
        border: tone === 'ghost' ? '1px solid rgb(255 255 255 / .14)' : 'none',
        borderRadius: sz.r,
        padding: sz.p,
        fontFamily: 'SF Pro Display, Geist, -apple-system, sans-serif',
        fontSize: sz.fs,
        fontWeight: 700,
        letterSpacing: '-.005em',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? .5 : 1,
        boxShadow:
          tone === 'glass'
            ? 'inset 0 0 0 1px #ffffff24, inset 0 1px 0 #ffffff38, 0 8px 24px rgb(0 0 0 / .25)'
            : tone === 'ghost' ? 'none'
            : `inset 0 1px 0 rgb(255 255 255 / .55), 0 10px 24px ${t.glow}`,
        backdropFilter: tone === 'glass' ? 'saturate(180%) blur(30px)' : 'none',
        WebkitBackdropFilter: tone === 'glass' ? 'saturate(180%) blur(30px)' : 'none',
        transition: 'transform 120ms cubic-bezier(.22,1,.36,1), box-shadow 220ms',
        ...style
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(.97)')}
      onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
    >
      {children}
    </button>
  );
};

const Chip = ({ tint = 'neutral', children, style }) => {
  const tints = {
    neutral: { bg: 'rgb(255 255 255 / .10)', color: '#fff' },
    amber: { bg: 'rgb(245 184 65 / .22)', color: '#FFE3A6' },
    maple: { bg: 'rgb(217 67 42 / .22)', color: '#FFC4B3' },
    reserve: { bg: 'rgb(58 141 255 / .22)', color: '#BFD7FF' },
    success: { bg: 'rgb(52 199 89 / .22)', color: '#9CEBB3' },
    danger: { bg: 'rgb(255 69 58 / .22)', color: '#FFB3AE' },
    violet: { bg: 'rgb(138 47 255 / .22)', color: '#D4B8FF' }
  };
  const t = tints[tint];
  return (
    <span
      style={{
        padding: '4px 10px',
        borderRadius: 999,
        background: t.bg,
        color: t.color,
        fontSize: 12,
        lineHeight: '16px',
        fontWeight: 600,
        fontFamily: 'SF Pro Text, Geist, sans-serif',
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        ...style
      }}
    >
      {children}
    </span>
  );
};

// area sparkline / line chart
const Chart = ({ data, color = '#F5B841', width = 800, height = 220, fill = true, showAxis = false }) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = Math.max(1, max - min);
  const padTop = 16, padBot = showAxis ? 28 : 8;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * width,
    height - ((v - min) / span) * (height - padTop - padBot) - padBot
  ]);
  const d = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const area = `${d} L${width},${height} L0,${height} Z`;
  const id = `chart-${color.replace('#', '')}`;
  const last = pts[pts.length - 1];
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ overflow: 'visible', display: 'block' }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".45" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* grid */}
      {showAxis && [0.25, 0.5, 0.75].map((y, i) => (
        <line key={i} x1="0" y1={padTop + (height - padTop - padBot) * y} x2={width} y2={padTop + (height - padTop - padBot) * y}
          stroke="rgb(255 255 255 / .06)" strokeDasharray="2 4" />
      ))}
      {fill && <path d={area} fill={`url(#${id})`} />}
      <path d={d} stroke={color} strokeWidth="1.75" fill="none" strokeLinejoin="round" strokeLinecap="round" />
      {/* last-price dot */}
      <circle cx={last[0]} cy={last[1]} r="4" fill={color} />
      <circle cx={last[0]} cy={last[1]} r="9" fill={color} opacity="0.2">
        <animate attributeName="r" values="4;14;4" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values=".4;0;.4" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
};

// Animated value — counts up / flashes on change
const Ticker = ({ value, decimals = 2, prefix = '', suffix = '', style, flashOnChange = true, size = 34 }) => {
  const prev = useRef(value);
  const [flash, setFlash] = useState(null);
  useEffect(() => {
    if (flashOnChange && prev.current !== value) {
      setFlash(value > prev.current ? 'up' : 'down');
      const t = setTimeout(() => setFlash(null), 600);
      prev.current = value;
      return () => clearTimeout(t);
    }
    prev.current = value;
  }, [value, flashOnChange]);
  const c = flash === 'up' ? '#6EE59E' : flash === 'down' ? '#FFB3AE' : '#fff';
  return (
    <span style={{
      fontFamily: 'JetBrains Mono, SF Mono, monospace',
      fontWeight: 700,
      fontSize: size,
      letterSpacing: '-.02em',
      color: c,
      transition: 'color 600ms cubic-bezier(.22,1,.36,1)',
      fontVariantNumeric: 'tabular-nums',
      ...style
    }}>
      {prefix}{nf(value, decimals)}{suffix}
    </span>
  );
};

const Row = ({ leading, title, subtitle, trailing, onClick, style }) => (
  <div
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px', cursor: onClick ? 'pointer' : 'default',
      borderRadius: 14, transition: 'background 220ms',
      ...style
    }}
    onMouseEnter={(e) => onClick && (e.currentTarget.style.background = 'rgb(255 255 255 / .04)')}
    onMouseLeave={(e) => onClick && (e.currentTarget.style.background = 'transparent')}
  >
    {leading !== undefined && <div style={{ flexShrink: 0 }}>{leading}</div>}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        color: '#fff', fontSize: 15, lineHeight: '20px', fontWeight: 600,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
      }}>{title}</div>
      {subtitle && (
        <div style={{ color: '#9AA2B4', fontSize: 13, lineHeight: '17px', marginTop: 1 }}>
          {subtitle}
        </div>
      )}
    </div>
    {trailing !== undefined && <div style={{ flexShrink: 0, textAlign: 'right' }}>{trailing}</div>}
  </div>
);

// avatar via deterministic gradient based on handle
const Avatar = ({ handle, size = 32 }) => {
  const seed = [...handle].reduce((a, c) => a + c.charCodeAt(0), 0);
  const h1 = (seed * 37) % 360;
  const h2 = (h1 + 40) % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: 999,
      background: `linear-gradient(135deg, hsl(${h1} 70% 60%), hsl(${h2} 70% 45%))`,
      boxShadow: 'inset 0 1px 0 rgb(255 255 255 / .3)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontSize: size * 0.38, fontWeight: 700, flexShrink: 0
    }}>
      {handle.replace('@', '').charAt(0).toUpperCase()}
    </div>
  );
};

// Coin mark (CBC) — animated
const CoinMark = ({ size = 40, spin = false }) => (
  <div style={{
    width: size, height: size, borderRadius: 999,
    background: 'radial-gradient(circle at 30% 30%, #FFE3A6, #F5B841 55%, #D39110 100%)',
    boxShadow: 'inset 0 2px 4px rgb(255 255 255 / .5), inset 0 -4px 8px rgb(0 0 0 / .3), 0 6px 16px rgb(245 184 65 / .4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#1A0F00', fontSize: size * 0.5, fontWeight: 900,
    fontFamily: 'SF Pro Display, Geist, serif',
    animation: spin ? 'coinSpin 12s linear infinite' : 'none',
    flexShrink: 0
  }}>
    C
  </div>
);

const MapleMark = ({ size = 28 }) => (
  <div style={{
    width: size, height: size, borderRadius: 999,
    background: 'radial-gradient(circle at 30% 30%, #FFC4B3, #D9432A 60%, #8B2515 100%)',
    boxShadow: 'inset 0 2px 4px rgb(255 255 255 / .4), 0 4px 12px rgb(217 67 42 / .4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontSize: size * 0.55, flexShrink: 0
  }}>🍁</div>
);

// Toast
const useToasts = () => {
  const [toasts, setToasts] = useState([]);
  const show = (t) => {
    const id = Date.now() + Math.random();
    setToasts((x) => [...x, { id, ...t }]);
    setTimeout(() => setToasts((x) => x.filter((y) => y.id !== id)), 3200);
  };
  return { toasts, show };
};

const ToastStack = ({ toasts }) => (
  <div style={{
    position: 'fixed', bottom: 24, right: 24, zIndex: 100,
    display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none'
  }}>
    {toasts.map((t) => (
      <div key={t.id} style={{
        background: 'rgb(12 14 20 / .82)',
        backdropFilter: 'saturate(200%) blur(40px)',
        WebkitBackdropFilter: 'saturate(200%) blur(40px)',
        boxShadow: 'inset 0 0 0 1px rgb(255 255 255 / .14), inset 0 1px 0 rgb(255 255 255 / .28), 0 20px 48px rgb(0 0 0 / .5)',
        borderRadius: 14, padding: '12px 16px',
        color: '#fff', fontSize: 14, fontWeight: 500,
        minWidth: 240, maxWidth: 340,
        display: 'flex', alignItems: 'center', gap: 10,
        animation: 'toastIn .35s cubic-bezier(.22,1,.36,1)'
      }}>
        {t.emoji && <span style={{ fontSize: 18 }}>{t.emoji}</span>}
        <span style={{ flex: 1 }}>{t.text}</span>
      </div>
    ))}
  </div>
);

// RarityBadge for NFT auction
const RarityBadge = ({ rarity }) => {
  const rarities = {
    common: { label: 'Common', color: '#9AA2B4', tint: 'neutral' },
    rare: { label: 'Rare', color: '#3A8DFF', tint: 'reserve' },
    legendary: { label: 'Legendary', color: '#F5B841', tint: 'amber' },
    mythic: { label: 'Mythic', color: '#D4B8FF', tint: 'violet' }
  };
  const r = rarities[rarity];
  return <Chip tint={r.tint}>★ {r.label}</Chip>;
};

// Tag cards/items with magnetic hover lift
const Lift = ({ children, amount = 4, style }) => {
  const ref = useRef();
  return (
    <div ref={ref} style={{ transition: 'transform 300ms cubic-bezier(.22,1,.36,1)', ...style }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = `translateY(-${amount}px)`)}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
    >
      {children}
    </div>
  );
};

// Countdown formatter
const fmtTime = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}ч ${m}м`;
  return `${m}:${String(sec).padStart(2, '0')}`;
};

Object.assign(window, {
  Glass, Btn, Chip, Chart, Ticker, Row, Avatar, CoinMark, MapleMark,
  useToasts, ToastStack, RarityBadge, Lift, fmtTime
});
