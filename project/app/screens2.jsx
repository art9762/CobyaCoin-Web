/* Auction, Casino, Leaderboard, Profile screens */

// ====================== AUCTION ======================
const Auction = ({ toast }) => {
  const s = useStore();
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-.02em' }}>Аукцион</h1>
          <p style={{ color: '#9AA2B4', marginTop: 4 }}>NFT-лоты от игроков. Ставки идут в MPL, минимальный шаг +500.</p>
        </div>
        <Btn tone="glass">+ Выставить лот</Btn>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 16 }}>
        {s.auction.map(a => {
          const tints = { common: 'neutral', rare: 'reserve', legendary: 'amber', mythic: 'violet' };
          const colors = { common: '#505868', rare: '#3A8DFF', legendary: '#F5B841', mythic: '#8A2FFF' };
          return (
            <Lift key={a.id}>
              <Glass tint={tints[a.rarity]} style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{
                  height: 180,
                  background: `radial-gradient(circle at 30% 30%, ${colors[a.rarity]}44, transparent 70%), linear-gradient(135deg, ${colors[a.rarity]}22, rgb(0 0 0 / .4))`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative', borderBottom: '1px solid rgb(255 255 255 / .06)'
                }}>
                  <div style={{ fontSize: 68, filter: `drop-shadow(0 8px 20px ${colors[a.rarity]}88)` }}>
                    {a.rarity === 'mythic' ? '💠' : a.rarity === 'legendary' ? '🏆' : a.rarity === 'rare' ? '🎴' : '📦'}
                  </div>
                  <div style={{ position: 'absolute', top: 12, left: 12 }}><RarityBadge rarity={a.rarity} /></div>
                  <div style={{ position: 'absolute', top: 12, right: 12 }}><Chip tint="neutral">⏱ {fmtTime(a.ends)}</Chip></div>
                </div>
                <div style={{ padding: 16 }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{a.title}</div>
                  <div style={{ fontSize: 12, color: '#9AA2B4', marginTop: 2 }}>Лидер: {a.by}</div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, color: '#9AA2B4', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700 }}>Текущая ставка</div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 700 }}>{nf(a.bid)} <span style={{ fontSize: 12, color: '#D9432A' }}>MPL</span></div>
                    </div>
                    <Btn tone="amber" size="sm" onClick={() => {
                      actions.bidAuction(a.id);
                      toast({ emoji: '📢', text: `Ставка +500 MPL — ${a.title}.` });
                    }}>+500</Btn>
                  </div>
                </div>
              </Glass>
            </Lift>
          );
        })}
      </div>
    </div>
  );
};

// ====================== CASINO ======================
const Casino = ({ toast }) => {
  const s = useStore();
  const [bet, setBet] = useState(500);
  const [color, setColor] = useState('red');
  const segments = 13;
  const segColors = ['red', 'black', 'red', 'black', 'red', 'black', 'red', 'black', 'red', 'black', 'red', 'black', 'green'];

  const spin = () => {
    const r = actions.spinRoulette(bet, color);
    if (!r.ok) toast({ emoji: '❌', text: r.err || 'Уже крутится.' });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Glass tier="thick" tint="maple" style={{ padding: 28, borderRadius: 28, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#FFC4B3', textTransform: 'uppercase', letterSpacing: '.12em', fontWeight: 700 }}>Джекпот недели</div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 10, marginTop: 6 }}>
            <Ticker value={s.casino.jackpotMpl} decimals={0} size={56} flashOnChange={false} />
            <span style={{ color: '#FFC4B3', fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 700 }}>MPL</span>
          </div>
          <div style={{ fontSize: 13, color: '#C8CEDB', marginTop: 4 }}>Розыгрыш каждую пятницу · 24 участника в пуле</div>
        </Glass>

        {/* Roulette wheel */}
        <Glass tier="thick" style={{ padding: 28, borderRadius: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.02em' }}>🎰 Рулетка</div>
              <div style={{ fontSize: 13, color: '#9AA2B4', marginTop: 2 }}>красный/чёрный ×2 · зелёный ×14</div>
            </div>
            {s.casino.lastRoll && (
              <Chip tint={s.casino.lastRoll.won ? 'success' : 'danger'}>
                {s.casino.lastRoll.won ? `✅ +${nf(s.casino.lastRoll.payout)}` : `❌ ${s.casino.lastRoll.result}`} MPL
              </Chip>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24, position: 'relative' }}>
            <div style={{ position: 'relative', width: 320, height: 320 }}>
              {/* Pointer */}
              <div style={{
                position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)',
                width: 0, height: 0,
                borderLeft: '10px solid transparent', borderRight: '10px solid transparent',
                borderTop: '18px solid #FFD78C',
                filter: 'drop-shadow(0 4px 8px rgb(245 184 65 / .6))',
                zIndex: 3
              }} />
              <div style={{
                width: 320, height: 320, borderRadius: '50%',
                background: 'conic-gradient(' + segColors.map((c, i) => {
                  const deg = 360 / segments;
                  const bg = c === 'red' ? '#D9432A' : c === 'black' ? '#1A1E2A' : '#34C759';
                  return `${bg} ${i * deg}deg ${(i + 1) * deg}deg`;
                }).join(', ') + ')',
                boxShadow: 'inset 0 0 0 6px rgb(245 184 65 / .8), inset 0 0 0 8px rgb(0 0 0 / .5), 0 20px 48px rgb(0 0 0 / .5), 0 0 60px rgb(245 184 65 / .3)',
                transform: `rotate(${s.casino.wheelAngle}deg)`,
                transition: s.casino.spinning ? 'transform 3s cubic-bezier(.17,.67,.2,1)' : 'none',
                position: 'relative'
              }}>
                {/* Numbers */}
                {segColors.map((c, i) => {
                  const deg = (360 / segments) * i + (360 / segments) / 2;
                  return (
                    <div key={i} style={{
                      position: 'absolute', top: '50%', left: '50%',
                      transform: `rotate(${deg}deg) translateY(-120px) rotate(-${deg}deg)`,
                      marginLeft: -10, marginTop: -10, width: 20, height: 20,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace'
                    }}>{i === 12 ? '0' : i + 1}</div>
                  );
                })}
              </div>
              {/* Center */}
              <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                width: 80, height: 80, borderRadius: '50%',
                background: 'radial-gradient(circle at 30% 30%, #FFE3A6, #F5B841 55%, #D39110)',
                boxShadow: 'inset 0 2px 4px rgb(255 255 255 / .5), 0 8px 20px rgb(0 0 0 / .5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 34, color: '#1A0F00', fontWeight: 900
              }}>C</div>
            </div>
          </div>

          {/* Color picker */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            {[
              { k: 'red', label: 'Красное', bg: '#D9432A', mult: '×2' },
              { k: 'black', label: 'Чёрное', bg: '#1A1E2A', mult: '×2' },
              { k: 'green', label: 'Зелёное', bg: '#34C759', mult: '×14' }
            ].map(c => (
              <button key={c.k} onClick={() => setColor(c.k)} disabled={s.casino.spinning}
                style={{
                  flex: 1, padding: '14px 0', borderRadius: 14,
                  background: c.bg, color: '#fff',
                  border: 'none', cursor: s.casino.spinning ? 'not-allowed' : 'pointer',
                  boxShadow: color === c.k ? `inset 0 0 0 3px #FFD78C, 0 8px 24px ${c.bg}88` : 'inset 0 1px 0 rgb(255 255 255 / .2)',
                  fontWeight: 700, transition: 'all 220ms'
                }}>
                <div style={{ fontSize: 14 }}>{c.label}</div>
                <div style={{ fontSize: 11, opacity: .8 }}>{c.mult}</div>
              </button>
            ))}
          </div>

          {/* Bet chips */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {[100, 500, 1000, 5000, 10000].map(v => (
              <button key={v} onClick={() => setBet(v)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10,
                  background: bet === v ? 'linear-gradient(180deg,#FFD78C,#F5B841)' : 'rgb(255 255 255 / .06)',
                  color: bet === v ? '#1A0F00' : '#C8CEDB',
                  border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
                  boxShadow: bet === v ? 'inset 0 1px 0 rgb(255 255 255 / .5)' : 'none'
                }}>{nf(v)}</button>
            ))}
          </div>

          <Btn tone="amber" size="lg" style={{ width: '100%' }} onClick={spin} disabled={s.casino.spinning || s.user.mpl < bet}>
            {s.casino.spinning ? '🎲 Крутится...' : `Крутить за ${nf(bet)} MPL`}
          </Btn>
        </Glass>
      </div>

      {/* Right sidebar: jackpot list + mini games */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Glass tier="regular" tint="amber" style={{ padding: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>💎 Подкидной / Coin-flip</div>
          <div style={{ fontSize: 12, color: '#FFE3A6', marginTop: 2, marginBottom: 12 }}>50/50 · ×1.9</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn tone="amber" size="sm" style={{ flex: 1 }} onClick={() => {
              const won = Math.random() > 0.5;
              const delta = won ? bet * 0.9 : -bet;
              setState(st => ({ ...st, user: { ...st.user, mpl: st.user.mpl + delta } }));
              toast({ emoji: won ? '✅' : '❌', text: won ? `+${nf(bet * 0.9)} MPL` : `−${nf(bet)} MPL` });
            }}>Орёл</Btn>
            <Btn tone="glass" size="sm" style={{ flex: 1 }} onClick={() => {
              const won = Math.random() > 0.5;
              const delta = won ? bet * 0.9 : -bet;
              setState(st => ({ ...st, user: { ...st.user, mpl: st.user.mpl + delta } }));
              toast({ emoji: won ? '✅' : '❌', text: won ? `+${nf(bet * 0.9)} MPL` : `−${nf(bet)} MPL` });
            }}>Решка</Btn>
          </div>
        </Glass>

        <Glass style={{ padding: 4, maxHeight: 320, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 16px 8px', fontSize: 14, fontWeight: 700 }}>🏆 Hall of fame</div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {[
              ['@IL76pd', '+124 000 MPL', '2м назад'],
              ['@kamila', '+48 000 MPL', '15м'],
              ['@vlad_b', '+12 500 MPL', '28м'],
              ['@eva_k', '+8 200 MPL', '1ч'],
              ['@anon_maple', '+4 100 MPL', '2ч']
            ].map(([u, w, a]) => (
              <Row key={u}
                leading={<Avatar handle={u} size={26} />}
                title={<span style={{ fontSize: 13 }}>{u}</span>}
                subtitle={<span style={{ fontSize: 11 }}>{a}</span>}
                trailing={<span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#9CEBB3', fontWeight: 600 }}>{w}</span>}
              />
            ))}
          </div>
        </Glass>
      </div>
    </div>
  );
};

// ====================== LEADERBOARD ======================
const Leaderboard = () => {
  const s = useStore();
  const [tab, setTab] = useState('cbc');
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-.02em' }}>Топ игроков</h1>
          <p style={{ color: '#9AA2B4', marginTop: 4 }}>Лучшие по балансу, активности и удаче за последние 7 дней.</p>
        </div>
        <Glass style={{ padding: 4, borderRadius: 14 }}>
          <div style={{ display: 'flex' }}>
            {[['cbc', 'CBC'], ['mpl', 'MPL'], ['active', 'Активность']].map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} style={{
                padding: '8px 18px', borderRadius: 10, border: 'none',
                background: tab === k ? 'linear-gradient(180deg,#FFD78C,#F5B841)' : 'transparent',
                color: tab === k ? '#1A0F00' : '#C8CEDB',
                fontWeight: 700, fontSize: 13, cursor: 'pointer'
              }}>{l}</button>
            ))}
          </div>
        </Glass>
      </div>

      {/* Top 3 podium */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr 1fr', gap: 16, alignItems: 'end', marginBottom: 20 }}>
        {[s.leaderboard[1], s.leaderboard[0], s.leaderboard[2]].map((p, i) => {
          const rank = p.rank;
          const tints = { 1: 'amber', 2: 'neutral', 3: 'maple' };
          const heights = { 1: 180, 2: 150, 3: 130 };
          return (
            <Lift key={p.user}>
              <Glass tint={tints[rank]} style={{ padding: 22, textAlign: 'center', height: heights[rank], display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 4 }}>{rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}</div>
                <Avatar handle={p.user} size={rank === 1 ? 56 : 44} />
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: -44 }}>
                  <Avatar handle={p.user} size={rank === 1 ? 56 : 44} />
                </div>
                <div style={{ fontSize: rank === 1 ? 17 : 15, fontWeight: 700, marginTop: 8 }}>{p.user}</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: rank === 1 ? 20 : 16, marginTop: 4 }}>
                  {nf(tab === 'mpl' ? p.mpl : p.cbc)} <span style={{ fontSize: 11, color: tab === 'mpl' ? '#FFC4B3' : '#FFE3A6' }}>{tab === 'mpl' ? 'MPL' : 'CBC'}</span>
                </div>
              </Glass>
            </Lift>
          );
        })}
      </div>

      <Glass style={{ padding: 4 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 140px 140px 90px', padding: '12px 16px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', color: '#9AA2B4', fontWeight: 700 }}>
          <div>#</div><div>Игрок</div><div style={{ textAlign: 'right' }}>CBC</div><div style={{ textAlign: 'right' }}>MPL</div><div style={{ textAlign: 'right' }}>Тренд</div>
        </div>
        {s.leaderboard.map(p => (
          <div key={p.user} style={{
            display: 'grid', gridTemplateColumns: '60px 1fr 140px 140px 90px', alignItems: 'center',
            padding: '12px 16px', borderTop: '1px solid rgb(255 255 255 / .05)',
            background: p.user === s.user.handle ? 'rgb(245 184 65 / .08)' : 'transparent'
          }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: p.rank <= 3 ? '#F5B841' : '#9AA2B4' }}>#{p.rank}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar handle={p.user} size={32} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{p.user}{p.user === s.user.handle && <Chip tint="amber" style={{ marginLeft: 8 }}>ты</Chip>}</div>
                <div style={{ fontSize: 11, color: '#9AA2B4' }}>{Math.round(p.cbc / 1000)} сделок</div>
              </div>
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', textAlign: 'right', fontWeight: 600 }}>{nf(p.cbc)}</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', textAlign: 'right', fontWeight: 600, color: '#C8CEDB' }}>{nf(p.mpl)}</div>
            <div style={{ textAlign: 'right' }}>
              <Chip tint={Math.random() > 0.5 ? 'success' : 'danger'}>
                {Math.random() > 0.5 ? '▲' : '▼'} {nf(Math.random() * 20, 1)}%
              </Chip>
            </div>
          </div>
        ))}
      </Glass>
    </div>
  );
};

// ====================== PROFILE ======================
const Profile = ({ toast }) => {
  const s = useStore();
  const [promo, setPromo] = useState('');
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Glass tier="thick" style={{ padding: 28, borderRadius: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <Avatar handle={s.user.handle} size={80} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.02em' }}>{s.user.handle}</div>
              <div style={{ fontSize: 13, color: '#9AA2B4', marginTop: 4 }}>В системе с {s.user.joined} · {nf(s.user.trades)} сделок</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                <Chip tint="amber">⭐ Trader</Chip>
                <Chip tint="reserve">🏛 Reserve partner</Chip>
                <Chip tint="violet">💎 Holder 1y</Chip>
              </div>
            </div>
            <Btn tone="glass" size="sm">Изменить</Btn>
          </div>
        </Glass>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {[
            { k: 'CBC баланс', v: nf(s.user.cbc), sub: `≈ ${nf(s.user.cbc * s.price)} MPL`, tint: 'amber' },
            { k: 'MPL баланс', v: nf(s.user.mpl), sub: 'Доступно к выводу', tint: 'maple' },
            { k: 'PnL 7д', v: '+12.4%', sub: '+58 420 MPL', tint: 'success' }
          ].map(x => (
            <Glass key={x.k} tint={x.tint} style={{ padding: 18 }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700, color: '#C8CEDB' }}>{x.k}</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 26, fontWeight: 700, marginTop: 6 }}>{x.v}</div>
              <div style={{ fontSize: 12, color: '#C8CEDB', marginTop: 2 }}>{x.sub}</div>
            </Glass>
          ))}
        </div>

        <Glass style={{ padding: 4 }}>
          <div style={{ padding: '14px 16px 6px', fontSize: 17, fontWeight: 700 }}>⚙ Настройки</div>
          {[
            ['🔔', 'Уведомления', 'Push · email', 'Вкл.'],
            ['🔒', 'Двухфакторная защита', 'Telegram-код', 'Активна'],
            ['💳', 'Способы вывода', '2 карты, 1 кошелёк', '›'],
            ['🎫', 'Реферальная программа', '12 приглашённых · 36 000 MPL', 'COBYA-KLN'],
            ['🌐', 'Язык интерфейса', 'Русский', 'RU / EN'],
            ['🔓', 'Разлогиниться', 'Последний вход: сегодня', '›']
          ].map(([ic, t, sub, tr], i) => (
            <div key={i}>
              <Row leading={<span style={{ fontSize: 22 }}>{ic}</span>} title={t} subtitle={sub}
                trailing={<span style={{ color: '#F5B841', fontSize: 13, fontWeight: 600 }}>{tr}</span>}
                onClick={() => {}} />
              {i < 5 && <div style={{ height: 1, background: 'rgb(255 255 255 / .06)', marginLeft: 16 }} />}
            </div>
          ))}
        </Glass>
      </div>

      {/* Right: promo + referral + activity */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Glass tint="violet" style={{ padding: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>🎫 Промокод</div>
          <div style={{ fontSize: 12, color: '#D4B8FF', marginTop: 2, marginBottom: 12 }}>Введи код — получи бонус в MPL.</div>
          <input value={promo} onChange={(e) => setPromo(e.target.value)} placeholder="COBYA-..."
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 12,
              background: 'rgb(0 0 0 / .3)', border: '1px solid rgb(255 255 255 / .1)',
              color: '#fff', fontSize: 14, fontFamily: 'JetBrains Mono, monospace',
              outline: 'none', marginBottom: 10, boxSizing: 'border-box'
            }} />
          <Btn tone="amber" style={{ width: '100%' }} onClick={() => {
            const r = actions.redeemPromo(promo);
            if (r.ok) { toast({ emoji: '✅', text: `+${nf(r.bonus)} MPL зачислено.` }); setPromo(''); }
            else toast({ emoji: '❌', text: 'Код не найден.' });
          }}>Активировать</Btn>
          <div style={{ fontSize: 11, color: '#9AA2B4', marginTop: 8, textAlign: 'center' }}>Попробуй: <code style={{ color: '#FFD78C' }}>COBYA26</code></div>
        </Glass>

        <Glass style={{ padding: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>🎫 Твоя ссылка</div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 12px', borderRadius: 10,
            background: 'rgb(0 0 0 / .3)', boxShadow: 'inset 0 0 0 1px rgb(255 255 255 / .08)'
          }}>
            <span style={{ flex: 1, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#FFD78C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>cobya.coin/r/kln2026</span>
            <button onClick={() => { navigator.clipboard?.writeText('cobya.coin/r/kln2026'); toast({ emoji: '✅', text: 'Ссылка скопирована.' }); }}
              style={{ border: 'none', background: 'rgb(245 184 65 / .22)', color: '#FFE3A6', padding: '6px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Копировать</button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 12, color: '#9AA2B4' }}>
            <span>Бонус за друга</span><span style={{ color: '#fff', fontWeight: 600 }}>30 000 MPL + 90 CBC</span>
          </div>
        </Glass>

        <Glass style={{ padding: 4, maxHeight: 320, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 16px 8px', fontSize: 14, fontWeight: 700 }}>История активности</div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {s.feed.slice(0, 12).map(f => (
              <Row key={f.id} leading={<span style={{ fontSize: 18 }}>{f.emoji}</span>}
                title={<span style={{ fontSize: 13, fontWeight: 500 }}>{f.text}</span>}
                subtitle={<span style={{ fontSize: 11 }}>{f.ago}</span>} />
            ))}
          </div>
        </Glass>
      </div>
    </div>
  );
};

Object.assign(window, { Auction, Casino, Leaderboard, Profile });
