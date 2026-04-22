/* Screens for CobyaCoin web — Dashboard, Exchange, Mining, Auction, Casino, Leaderboard, Profile */

// ====================== DASHBOARD ======================
const Dashboard = ({ toast, goto }) => {
  const s = useStore();
  const pct = ((s.price - s.prevPrice) / s.prevPrice * 100);
  const up = s.price >= s.history[0];
  const dayPct = ((s.price - s.history[0]) / s.history[0] * 100);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20 }}>
      {/* LEFT: price + chart + market depth */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Glass tier="thick" tint="amber" style={{ padding: 28, borderRadius: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, marginBottom: 14, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <CoinMark size={30} spin />
              <span style={{ fontSize: 12, color: '#FFE3A6', textTransform: 'uppercase', letterSpacing: '.12em', fontWeight: 700, whiteSpace: 'nowrap' }}>CBC / MPL · Курс Центробанка</span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <Btn tone="amber" onClick={() => goto('trade')}>↓ Купить CBC</Btn>
              <Btn tone="maple" onClick={() => goto('trade')}>↑ Продать</Btn>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
            <Ticker value={s.price} decimals={2} size={68} />
            <span style={{ color: '#FFE3A6', fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 600 }}>MPL</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
            <Chip tint={up ? 'success' : 'danger'}>{up ? '▲' : '▼'} {nf(Math.abs(dayPct), 2)}% · 24ч</Chip>
            <span style={{ fontSize: 13, color: '#C8CEDB' }}>Тик: {pct >= 0 ? '+' : ''}{nf(pct, 3)}%</span>
            {s.circuit && <Chip tint="danger">🔒 Планка</Chip>}
          </div>
          <div style={{ margin: '16px -28px -28px', padding: '0 4px' }}>
            <Chart data={s.history} color="#F5B841" height={220} showAxis />
          </div>
        </Glass>

        {/* Market depth / live book */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Glass style={{ padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 17, fontWeight: 700 }}>Биржа · покупка</span>
              <Chip tint="success">{s.orderBook.filter(o => o.side === 'buy').length}</Chip>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {s.orderBook.filter(o => o.side === 'buy').slice(0, 5).map((o, i) => (
                <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10,
                  background: `linear-gradient(90deg, rgb(52 199 89 / ${.02 + (5 - i) * 0.03}) 0%, transparent 100%)` }}>
                  <Avatar handle={o.user} size={24} />
                  <span style={{ fontSize: 13, color: '#fff', flex: 1 }}>{o.user}</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#9CEBB3' }}>{o.cbc} CBC</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#C8CEDB', width: 90, textAlign: 'right' }}>{nf(o.mpl)} MPL</span>
                </div>
              ))}
            </div>
          </Glass>
          <Glass style={{ padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 17, fontWeight: 700 }}>Биржа · продажа</span>
              <Chip tint="danger">{s.orderBook.filter(o => o.side === 'sell').length}</Chip>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {s.orderBook.filter(o => o.side === 'sell').slice(0, 5).map((o, i) => (
                <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10,
                  background: `linear-gradient(90deg, rgb(255 69 58 / ${.02 + (5 - i) * 0.03}) 0%, transparent 100%)` }}>
                  <Avatar handle={o.user} size={24} />
                  <span style={{ fontSize: 13, color: '#fff', flex: 1 }}>{o.user}</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#FFB3AE' }}>{o.cbc} CBC</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#C8CEDB', width: 90, textAlign: 'right' }}>{nf(o.mpl)} MPL</span>
                </div>
              ))}
            </div>
          </Glass>
        </div>
      </div>

      {/* RIGHT: portfolio + feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Glass tier="thick" style={{ padding: 22, borderRadius: 24 }}>
          <div style={{ fontSize: 12, color: '#9AA2B4', letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 700 }}>Портфель</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
            <Ticker value={s.user.mpl + s.user.cbc * s.price} decimals={0} size={36} flashOnChange={false} />
            <span style={{ color: '#D9432A', fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 600 }}>MPL</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
            <div style={{ padding: 14, borderRadius: 14, background: 'rgb(245 184 65 / .12)', boxShadow: 'inset 0 0 0 1px rgb(245 184 65 / .22)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CoinMark size={18} /><span style={{ fontSize: 11, color: '#FFE3A6', fontWeight: 700, letterSpacing: '.08em' }}>CBC</span>
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20, fontWeight: 700, marginTop: 6 }}>{nf(s.user.cbc)}</div>
              <div style={{ fontSize: 11, color: '#C8CEDB', marginTop: 2 }}>≈ {nf(s.user.cbc * s.price)} MPL</div>
            </div>
            <div style={{ padding: 14, borderRadius: 14, background: 'rgb(217 67 42 / .12)', boxShadow: 'inset 0 0 0 1px rgb(217 67 42 / .22)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapleMark size={18} /><span style={{ fontSize: 11, color: '#FFC4B3', fontWeight: 700, letterSpacing: '.08em' }}>MPL</span>
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20, fontWeight: 700, marginTop: 6 }}>{nf(s.user.mpl)}</div>
              <div style={{ fontSize: 11, color: '#C8CEDB', marginTop: 2 }}>Кленовые листья</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 14 }}>
            {[
              { icon: '↓', label: 'Купить', to: 'trade', tone: 'amber' },
              { icon: '↑', label: 'Продать', to: 'trade', tone: 'maple' },
              { icon: '⛏', label: 'Майнинг', to: 'mine', tone: 'glass' },
              { icon: '🎰', label: 'Казино', to: 'play', tone: 'glass' }
            ].map(a => (
              <Btn key={a.label} tone={a.tone} size="sm" onClick={() => goto(a.to)} style={{ padding: '10px 4px', fontSize: 12 }}>
                <div style={{ fontSize: 18, marginBottom: 2 }}>{a.icon}</div>
                {a.label}
              </Btn>
            ))}
          </div>
        </Glass>

        <Glass tier="regular" tint="reserve" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(180deg,#6FA9FF,#3A8DFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🏛</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Центробанк активен</div>
              <div style={{ fontSize: 12, color: '#BFD7FF', marginTop: 2 }}>Ликвидность {nf(s.reserve.liquidityMpl / 1000, 1)}k MPL · {nf(s.reserve.liquidityCbc)} CBC</div>
            </div>
            <div style={{ width: 10, height: 10, borderRadius: 999, background: '#34C759', boxShadow: '0 0 12px #34C759' }} />
          </div>
        </Glass>

        {/* Live feed */}
        <Glass style={{ padding: 4, minHeight: 220, maxHeight: 320, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 16px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 15, fontWeight: 700 }}>Лента событий</span>
            <Chip tint="amber">live</Chip>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 4px 8px' }}>
            {s.feed.slice(0, 10).map(f => (
              <Row key={f.id}
                leading={<span style={{ fontSize: 20 }}>{f.emoji}</span>}
                title={<span style={{ fontSize: 13, fontWeight: 500 }}>{f.text}</span>}
                subtitle={<span style={{ fontSize: 11 }}>{f.ago}</span>}
              />
            ))}
          </div>
        </Glass>
      </div>
    </div>
  );
};

// ====================== TRADE / EXCHANGE ======================
const Exchange = ({ toast }) => {
  const s = useStore();
  const [side, setSide] = useState('buy');
  const [amount, setAmount] = useState('12');
  const [price, setPrice] = useState(s.price.toFixed(2));
  const [tab, setTab] = useState('book'); // book | trades
  const total = Number(amount || 0) * Number(price || 0);

  const place = () => {
    const r = actions.placeOrder({ side, cbc: Number(amount), mpl: total });
    if (r.ok) toast({ emoji: '✅', text: `Ордер на ${side === 'buy' ? 'покупку' : 'продажу'} исполнен.` });
    else toast({ emoji: '❌', text: r.err });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
      {/* LEFT: chart + order form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Glass tier="thick" style={{ padding: 22, borderRadius: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <CoinMark size={30} />
              <div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>CBC / MPL</div>
                <div style={{ fontSize: 12, color: '#9AA2B4' }}>Торговая пара Центробанка</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Ticker value={s.price} decimals={2} size={30} />
              <div style={{ fontSize: 12, color: '#9AA2B4' }}>MPL за 1 CBC</div>
            </div>
          </div>
          <div style={{ margin: '10px -22px -22px' }}>
            <Chart data={s.history} color="#F5B841" height={200} showAxis />
          </div>
        </Glass>

        <Glass style={{ padding: 20 }}>
          {/* Buy/Sell toggle */}
          <div style={{ display: 'flex', gap: 6, padding: 4, borderRadius: 14, background: 'rgb(0 0 0 / .3)', marginBottom: 16 }}>
            {['buy', 'sell'].map(sd => (
              <button key={sd} onClick={() => setSide(sd)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
                  background: side === sd ? (sd === 'buy' ? 'linear-gradient(180deg,#6EE59E,#34C759)' : 'linear-gradient(180deg,#FF7A73,#FF453A)') : 'transparent',
                  color: side === sd ? (sd === 'buy' ? '#042b12' : '#fff') : '#C8CEDB',
                  fontWeight: 700, fontSize: 14, cursor: 'pointer', letterSpacing: '.04em', textTransform: 'uppercase',
                  boxShadow: side === sd ? 'inset 0 1px 0 rgb(255 255 255 / .55)' : 'none',
                  transition: 'all 220ms'
                }}>{sd === 'buy' ? 'Купить CBC' : 'Продать CBC'}</button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ padding: 14, borderRadius: 14, background: 'rgb(0 0 0 / .28)', boxShadow: 'inset 0 0 0 1px rgb(255 255 255 / .06)' }}>
              <div style={{ fontSize: 11, color: '#9AA2B4', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '.08em' }}>Объём</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} inputMode="decimal"
                  style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontFamily: 'JetBrains Mono, monospace', fontSize: 26, fontWeight: 700 }} />
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#F5B841', fontSize: 14 }}>CBC</span>
              </div>
            </div>
            <div style={{ padding: 14, borderRadius: 14, background: 'rgb(0 0 0 / .28)', boxShadow: 'inset 0 0 0 1px rgb(255 255 255 / .06)' }}>
              <div style={{ fontSize: 11, color: '#9AA2B4', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '.08em' }}>Цена</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                <input value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ''))} inputMode="decimal"
                  style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontFamily: 'JetBrains Mono, monospace', fontSize: 26, fontWeight: 700 }} />
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#D9432A', fontSize: 14 }}>MPL</span>
              </div>
            </div>
          </div>

          {/* % quick fill */}
          <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
            {[25, 50, 75, 100].map(p => (
              <button key={p} onClick={() => {
                const avail = side === 'buy' ? s.user.mpl / Number(price || s.price) : s.user.cbc;
                setAmount(String(Math.floor(avail * p / 100)));
              }} style={{
                flex: 1, padding: '8px 0', borderRadius: 10,
                border: '1px solid rgb(255 255 255 / .1)', background: 'rgb(255 255 255 / .04)',
                color: '#C8CEDB', fontSize: 13, fontWeight: 600, cursor: 'pointer'
              }}>{p}%</button>
            ))}
          </div>

          <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: 'rgb(0 0 0 / .3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 13, color: '#9AA2B4' }}>Итого</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 700 }}>
                {nf(total)} <span style={{ fontSize: 13, color: '#D9432A' }}>MPL</span>
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <span style={{ fontSize: 12, color: '#9AA2B4' }}>Комиссия Центробанка</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>10%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 12, color: '#9AA2B4' }}>Доступно</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
                {side === 'buy' ? `${nf(s.user.mpl)} MPL` : `${nf(s.user.cbc)} CBC`}
              </span>
            </div>
          </div>

          <Btn tone={side === 'buy' ? 'success' : 'danger'} size="lg" style={{ width: '100%', marginTop: 14 }} onClick={place}>
            {side === 'buy' ? '↓ Купить' : '↑ Продать'} {amount || 0} CBC
          </Btn>
        </Glass>
      </div>

      {/* RIGHT: book / trades */}
      <Glass style={{ padding: 4, display: 'flex', flexDirection: 'column', maxHeight: 760 }}>
        <div style={{ padding: '14px 16px 8px', display: 'flex', gap: 6 }}>
          {[['book', 'Стакан'], ['trades', 'Сделки']].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              padding: '6px 12px', borderRadius: 10, border: 'none',
              background: tab === k ? 'rgb(245 184 65 / .22)' : 'transparent',
              color: tab === k ? '#FFE3A6' : '#9AA2B4',
              fontSize: 13, fontWeight: 700, cursor: 'pointer'
            }}>{l}</button>
          ))}
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: '0 4px 8px' }}>
          {tab === 'book' && s.orderBook.map(o => (
            <Row key={o.id}
              leading={<Avatar handle={o.user} size={28} />}
              title={<span style={{ fontSize: 13 }}>{o.user}</span>}
              subtitle={<span style={{ fontSize: 11 }}>{o.side === 'buy' ? '🟢 покупка' : '🔴 продажа'} · {o.ago}</span>}
              trailing={<div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, fontSize: 13, color: o.side === 'buy' ? '#9CEBB3' : '#FFB3AE' }}>{o.cbc} CBC</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#C8CEDB' }}>{nf(o.mpl)} MPL</div>
              </div>}
            />
          ))}
          {tab === 'trades' && s.trades.map(t => (
            <Row key={t.id}
              leading={<span style={{ fontSize: 18 }}>⇄</span>}
              title={<span style={{ fontSize: 13 }}>{t.buyer} ← {t.seller}</span>}
              subtitle={<span style={{ fontSize: 11 }}>{t.ago}</span>}
              trailing={<div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, fontSize: 13 }}>{t.cbc} CBC</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#C8CEDB' }}>{nf(t.mpl)} MPL</div>
              </div>}
            />
          ))}
        </div>
      </Glass>
    </div>
  );
};

// ====================== MINING ======================
const Mining = ({ toast }) => {
  const s = useStore();
  const dailyRate = s.mining.rate * s.mining.gpus * 86400;

  const collect = () => {
    const r = actions.collectMining();
    if (r.ok) toast({ emoji: '💰', text: `+${r.gained.toFixed(2)} CBC собрано.` });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Hero — big mining rig */}
        <Glass tier="thick" tint="amber" style={{ padding: 28, borderRadius: 28, position: 'relative', overflow: 'hidden' }}>
          {/* Scrolling pattern */}
          <div style={{
            position: 'absolute', inset: 0, opacity: .18,
            backgroundImage: 'repeating-linear-gradient(45deg, transparent 0 20px, rgb(245 184 65 / .6) 20px 22px)',
            animation: 'slide 8s linear infinite'
          }} />
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 11, letterSpacing: '.12em', color: '#FFE3A6', textTransform: 'uppercase', fontWeight: 700 }}>Ферма · lvl {s.mining.level}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 8 }}>
              <Ticker value={s.mining.pending} decimals={3} size={60} flashOnChange={false} />
              <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#FFE3A6', fontSize: 20, fontWeight: 700 }}>CBC</span>
              <span style={{ color: '#C8CEDB', fontSize: 13, marginLeft: 8 }}>ожидают сбора</span>
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
              <div><span style={{ fontSize: 11, color: '#9AA2B4', textTransform: 'uppercase', letterSpacing: '.08em' }}>GPU</span> <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{s.mining.gpus} / {s.mining.maxGpus}</span></div>
              <div><span style={{ fontSize: 11, color: '#9AA2B4', textTransform: 'uppercase', letterSpacing: '.08em' }}>Скорость</span> <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{(s.mining.rate * s.mining.gpus * 3600).toFixed(2)} CBC/ч</span></div>
              <div><span style={{ fontSize: 11, color: '#9AA2B4', textTransform: 'uppercase', letterSpacing: '.08em' }}>В день</span> <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>≈ {nf(dailyRate, 1)} CBC</span></div>
            </div>
            <Btn tone="amber" size="lg" style={{ marginTop: 16 }} onClick={collect} disabled={s.mining.pending < 0.001}>
              💰 Собрать {s.mining.pending.toFixed(3)} CBC
            </Btn>
          </div>
        </Glass>

        {/* GPU grid */}
        <Glass style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700 }}>Видеокарты</div>
              <div style={{ fontSize: 12, color: '#9AA2B4', marginTop: 2 }}>Клик по слоту — подробности</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn tone="glass" size="sm" onClick={() => {
                const r = actions.sellGpu();
                if (r.ok) toast({ emoji: '✅', text: 'GPU продан · +180 MPL' });
              }}>− Продать GPU</Btn>
              <Btn tone="amber" size="sm" onClick={() => {
                const r = actions.buyGpu();
                if (r.ok) toast({ emoji: '⛏', text: 'GPU установлен.' });
                else toast({ emoji: '❌', text: r.err });
              }}>+ GPU · 320 MPL</Btn>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10,1fr)', gap: 8 }}>
            {Array.from({ length: s.mining.maxGpus }).map((_, i) => {
              const on = i < s.mining.gpus;
              return (
                <div key={i} style={{
                  aspectRatio: '1 / 1', borderRadius: 10,
                  background: on ? 'linear-gradient(180deg,#FFD78C,#F5B841)' : 'rgb(255 255 255 / .04)',
                  boxShadow: on ? 'inset 0 1px 0 #ffffff90, 0 0 12px #F5B84166' : 'inset 0 0 0 1px rgb(255 255 255 / .06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: on ? '#1A0F00' : '#505868', fontSize: 16,
                  animation: on ? `gpuPulse ${2 + (i % 4) * 0.3}s ease-in-out infinite` : 'none',
                  transition: 'all 320ms'
                }}>
                  {on ? '▣' : ''}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 18, padding: 16, borderRadius: 16, background: 'rgb(0 0 0 / .3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Улучшить ферму до lvl {s.mining.level + 1}</div>
              <div style={{ fontSize: 12, color: '#9AA2B4', marginTop: 2 }}>+10 слотов GPU, ×1.2 скорость</div>
            </div>
            <Btn tone="reserve" onClick={() => {
              const r = actions.upgradeFarm();
              if (r.ok) toast({ emoji: '🛠', text: `Ферма повышена.` });
              else toast({ emoji: '❌', text: r.err });
            }}>{nf(s.mining.level * 1000)} MPL</Btn>
          </div>
        </Glass>
      </div>

      {/* RIGHT */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Glass style={{ padding: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>⚡ Потенциал</div>
          {[
            ['Ставка CBC/с', (s.mining.rate * s.mining.gpus).toFixed(4)],
            ['В час', (s.mining.rate * s.mining.gpus * 3600).toFixed(2)],
            ['В сутки', dailyRate.toFixed(1)],
            ['В неделю', (dailyRate * 7).toFixed(0)],
            ['≈ MPL/день', nf(dailyRate * s.price, 0)]
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgb(255 255 255 / .06)' }}>
              <span style={{ fontSize: 13, color: '#9AA2B4' }}>{k}</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, fontSize: 13 }}>{v}</span>
            </div>
          ))}
        </Glass>

        <Glass tint="violet" style={{ padding: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>🎁 Ежедневный бонус</div>
          <div style={{ fontSize: 12, color: '#D4B8FF', marginBottom: 12 }}>Забирай каждые 24ч. Стрик: 6 дней.</div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
            {[1, 2, 3, 4, 5, 6, 7].map(d => (
              <div key={d} style={{
                flex: 1, aspectRatio: '1', borderRadius: 10,
                background: d <= 6 ? 'linear-gradient(180deg,#D4B8FF,#8A2FFF)' : 'rgb(255 255 255 / .06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
                color: d <= 6 ? '#0a0016' : '#9AA2B4',
                boxShadow: d <= 6 ? 'inset 0 1px 0 rgb(255 255 255 / .4)' : 'none'
              }}>{d}</div>
            ))}
          </div>
          <Btn tone="glass" style={{ width: '100%' }} onClick={() => toast({ emoji: '🎁', text: 'Бонус заберёшь завтра.' })}>Забрано сегодня</Btn>
        </Glass>
      </div>
    </div>
  );
};

Object.assign(window, { Dashboard, Exchange, Mining });
