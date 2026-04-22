/* Global state store for CobyaCoin web.
   Simulates CBC price movement, mining production, order book, casino, etc.
   Everything ticks on a 1s interval; components subscribe via useStore().
*/

const { useState, useEffect, useMemo, useRef, useCallback } = React;

// ---------- helpers ----------
const nf = (n, d = 0) => {
  const s = Number(n).toFixed(d);
  const [whole, dec] = s.split('.');
  const w = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return dec ? `${w}.${dec}` : w;
};
const rnd = (a, b) => a + Math.random() * (b - a);
const choice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const nowSec = () => Math.floor(Date.now() / 1000);

// ---------- initial state ----------
const seedPrice = 104.28;
const seedHistory = (() => {
  const pts = [];
  let p = 96;
  for (let i = 0; i < 120; i++) {
    p += rnd(-1.4, 1.6);
    p = clamp(p, 80, 120);
    pts.push(p);
  }
  return pts;
})();

const initialState = {
  user: {
    handle: '@societykolyan',
    joined: 'Mar 2024',
    trades: 842,
    cbc: 1204,
    mpl: 128904,
    frozen: 0,
  },
  price: seedPrice,
  prevPrice: seedPrice,
  history: seedHistory,
  circuit: null, // { direction: 'up'|'down', until: ts }
  reserve: {
    active: true,
    liquidityMpl: 412000,
    liquidityCbc: 2904,
  },
  mining: {
    level: 4,
    gpus: 8,
    maxGpus: 40,
    pending: 0, // CBC pending collection
    rate: 0.0032, // CBC / sec / GPU
    lastTick: Date.now(),
  },
  orderBook: [
    { id: 'o1', side: 'sell', user: '@IL76pd', cbc: 48, mpl: 4920, ago: '5h' },
    { id: 'o2', side: 'sell', user: '@Dan9kov', cbc: 7, mpl: 740, ago: '12h' },
    { id: 'o3', side: 'buy', user: '@unlucky_POvelitel', cbc: 120, mpl: 12480, ago: '18h' },
    { id: 'o4', side: 'sell', user: '@kamila', cbc: 22, mpl: 2310, ago: '1h' },
    { id: 'o5', side: 'buy', user: '@vlad_b', cbc: 14, mpl: 1436, ago: '40m' },
    { id: 'o6', side: 'sell', user: '@anon_maple', cbc: 3, mpl: 316, ago: '4m' },
  ],
  trades: [
    { id: 't1', buyer: '@kamila', seller: '@IL76pd', cbc: 12, mpl: 1255, ago: '2m' },
    { id: 't2', buyer: '@societykolyan', seller: '@Dan9kov', cbc: 5, mpl: 523, ago: '8m' },
    { id: 't3', buyer: '@vlad_b', seller: '@anon_maple', cbc: 30, mpl: 3120, ago: '22m' },
  ],
  auction: [
    { id: 'a1', title: 'Кленовый туз', rarity: 'legendary', ends: 3600, bid: 82000, by: '@IL76pd' },
    { id: 'a2', title: 'Монета №001', rarity: 'mythic', ends: 7200, bid: 144000, by: '@societykolyan' },
    { id: 'a3', title: 'Медная GPU', rarity: 'rare', ends: 1800, bid: 9400, by: '@Dan9kov' },
    { id: 'a4', title: 'Стикерпак Кобякоин', rarity: 'common', ends: 5400, bid: 2200, by: '@kamila' },
  ],
  casino: {
    jackpotMpl: 412000,
    lastRoll: null, // { result, color, payout, bet }
    spinning: false,
    wheelAngle: 0,
  },
  feed: [
    { id: 'f1', emoji: '🎫', text: 'Referral applied — bonus 30 000 MPL + 90 CBC.', ago: '3m' },
    { id: 'f2', emoji: '🔔', text: 'The Reserve bought your listing.', ago: '14m' },
    { id: 'f3', emoji: '⛏', text: 'Mining yielded 1.2 CBC overnight.', ago: '2h' },
  ],
  leaderboard: [
    { rank: 1, user: '@societykolyan', cbc: 412908, mpl: 4.1e6, tint: 'amber' },
    { rank: 2, user: '@IL76pd', cbc: 201340, mpl: 2.0e6, tint: 'neutral' },
    { rank: 3, user: '@Dan9kov', cbc: 180202, mpl: 1.8e6, tint: 'maple' },
    { rank: 4, user: '@unlucky_POvelitel', cbc: 128904, mpl: 1.3e6, tint: 'neutral' },
    { rank: 5, user: '@kamila', cbc: 118220, mpl: 1.1e6, tint: 'neutral' },
    { rank: 6, user: '@vlad_b', cbc: 98440, mpl: 980000, tint: 'neutral' },
    { rank: 7, user: '@anon_maple', cbc: 82110, mpl: 830000, tint: 'neutral' },
    { rank: 8, user: '@eva_k', cbc: 74222, mpl: 760000, tint: 'neutral' },
  ],
};

// ---------- store (singleton) ----------
let state = JSON.parse(JSON.stringify(initialState));
// restore from localStorage
try {
  const saved = JSON.parse(localStorage.getItem('cobya:state') || 'null');
  if (saved && saved.user) {
    state.user = { ...state.user, ...saved.user };
    state.mining = { ...state.mining, ...saved.mining };
    state.mining.lastTick = Date.now();
  }
} catch (e) {}

const listeners = new Set();
const notify = () => listeners.forEach((l) => l());
const getState = () => state;
const setState = (updater) => {
  const next = typeof updater === 'function' ? updater(state) : { ...state, ...updater };
  state = next;
  try {
    localStorage.setItem('cobya:state', JSON.stringify({ user: state.user, mining: state.mining }));
  } catch (e) {}
  notify();
};

const useStore = () => {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((x) => x + 1);
    listeners.add(l);
    return () => listeners.delete(l);
  }, []);
  return state;
};

// ---------- actions ----------
const actions = {
  placeOrder({ side, cbc, mpl }) {
    if (!cbc || !mpl) return { ok: false, err: 'Заполни объём и цену.' };
    const u = state.user;
    if (side === 'buy' && u.mpl < mpl) return { ok: false, err: '❌ Недостаточно MPL.' };
    if (side === 'sell' && u.cbc < cbc) return { ok: false, err: '❌ Недостаточно CBC.' };
    setState((s) => {
      const user = { ...s.user };
      if (side === 'buy') { user.mpl -= mpl; user.cbc += cbc; }
      else { user.cbc -= cbc; user.mpl += mpl; }
      user.trades += 1;
      const trade = {
        id: 't' + Date.now(),
        buyer: side === 'buy' ? s.user.handle : '@Reserve',
        seller: side === 'sell' ? s.user.handle : '@Reserve',
        cbc, mpl, ago: 'now',
      };
      const feed = [{ id: 'f' + Date.now(), emoji: '✅', text: `Ордер исполнен — ${side === 'buy' ? 'куплено' : 'продано'} ${cbc} CBC за ${nf(mpl)} MPL.`, ago: 'now' }, ...s.feed].slice(0, 20);
      // nudge price
      const impact = (cbc / 400) * (side === 'buy' ? 1 : -1);
      const newPrice = clamp(s.price + impact, 60, 180);
      return { ...s, user, trades: [trade, ...s.trades].slice(0, 12), feed, price: newPrice, prevPrice: s.price };
    });
    return { ok: true };
  },

  buyGpu() {
    const cost = 320;
    if (state.user.mpl < cost) return { ok: false, err: '❌ Недостаточно MPL.' };
    if (state.mining.gpus >= state.mining.maxGpus) return { ok: false, err: 'Улучши ферму.' };
    setState((s) => ({
      ...s,
      user: { ...s.user, mpl: s.user.mpl - cost },
      mining: { ...s.mining, gpus: s.mining.gpus + 1 },
      feed: [{ id: 'f' + Date.now(), emoji: '⛏', text: `Куплен GPU. Ферма: ${s.mining.gpus + 1}/${s.mining.maxGpus}.`, ago: 'now' }, ...s.feed].slice(0, 20),
    }));
    return { ok: true };
  },

  sellGpu() {
    if (state.mining.gpus <= 0) return { ok: false };
    setState((s) => ({
      ...s,
      user: { ...s.user, mpl: s.user.mpl + 180 },
      mining: { ...s.mining, gpus: s.mining.gpus - 1 },
    }));
    return { ok: true };
  },

  upgradeFarm() {
    const cost = state.mining.level * 1000;
    if (state.user.mpl < cost) return { ok: false, err: '❌ Недостаточно MPL.' };
    setState((s) => ({
      ...s,
      user: { ...s.user, mpl: s.user.mpl - cost },
      mining: { ...s.mining, level: s.mining.level + 1, maxGpus: s.mining.maxGpus + 10 },
      feed: [{ id: 'f' + Date.now(), emoji: '🛠', text: `Ферма повышена до lvl ${s.mining.level + 1}.`, ago: 'now' }, ...s.feed].slice(0, 20),
    }));
    return { ok: true };
  },

  collectMining() {
    const gained = state.mining.pending;
    if (gained <= 0) return { ok: false };
    setState((s) => ({
      ...s,
      user: { ...s.user, cbc: s.user.cbc + gained },
      mining: { ...s.mining, pending: 0 },
      feed: [{ id: 'f' + Date.now(), emoji: '💰', text: `Намайнено +${gained.toFixed(2)} CBC.`, ago: 'now' }, ...s.feed].slice(0, 20),
    }));
    return { ok: true, gained };
  },

  spinRoulette(bet, color) {
    if (state.user.mpl < bet) return { ok: false, err: '❌ Недостаточно MPL.' };
    if (state.casino.spinning) return { ok: false };
    setState((s) => ({ ...s, casino: { ...s.casino, spinning: true } }));
    const pockets = ['red', 'black', 'red', 'black', 'red', 'black', 'red', 'black', 'red', 'black', 'red', 'black', 'green'];
    const landed = choice(pockets);
    const wonMult = landed === color ? (color === 'green' ? 14 : 2) : 0;
    const payout = wonMult * bet;
    const rotations = 5 + Math.random() * 3;
    const pocketIdx = pockets.indexOf(landed);
    const finalAngle = rotations * 360 + (pocketIdx / pockets.length) * 360;
    setState((s) => ({ ...s, casino: { ...s.casino, wheelAngle: s.casino.wheelAngle + finalAngle } }));
    setTimeout(() => {
      setState((s) => ({
        ...s,
        user: { ...s.user, mpl: s.user.mpl - bet + payout },
        casino: {
          ...s.casino,
          spinning: false,
          lastRoll: { result: landed, color: landed, payout, bet, won: payout > 0 },
          jackpotMpl: payout > 0 ? Math.max(50000, s.casino.jackpotMpl - payout * 0.4) : s.casino.jackpotMpl + bet * 0.3,
        },
        feed: [{
          id: 'f' + Date.now(),
          emoji: payout > 0 ? '🎰' : '❌',
          text: payout > 0 ? `Выигрыш +${nf(payout)} MPL (${landed}).` : `Выпало ${landed}. Ставка сгорела.`,
          ago: 'now',
        }, ...s.feed].slice(0, 20),
      }));
    }, 3200);
    return { ok: true };
  },

  bidAuction(id, delta = 500) {
    setState((s) => ({
      ...s,
      user: { ...s.user, mpl: s.user.mpl - (s.auction.find(a => a.id === id).bid + delta) + 0 },
      auction: s.auction.map(a => a.id === id ? { ...a, bid: a.bid + delta, by: s.user.handle } : a),
      feed: [{ id: 'f' + Date.now(), emoji: '📢', text: `Ставка повышена — ${s.auction.find(a => a.id === id).title}.`, ago: 'now' }, ...s.feed].slice(0, 20),
    }));
  },

  redeemPromo(code) {
    if (!code) return { ok: false };
    const bonus = code.toLowerCase() === 'cobya26' ? 50000 : 5000;
    setState((s) => ({
      ...s,
      user: { ...s.user, mpl: s.user.mpl + bonus },
      feed: [{ id: 'f' + Date.now(), emoji: '🎫', text: `Промокод активирован — +${nf(bonus)} MPL.`, ago: 'now' }, ...s.feed].slice(0, 20),
    }));
    return { ok: true, bonus };
  },
};

// ---------- ticker (global) ----------
let tickerStarted = false;
const startTicker = () => {
  if (tickerStarted) return;
  tickerStarted = true;
  setInterval(() => {
    setState((s) => {
      // price random walk
      const drift = rnd(-0.8, 0.85);
      let p = clamp(s.price + drift, 60, 180);
      // circuit breaker
      let circuit = s.circuit;
      if (circuit && Date.now() > circuit.until) circuit = null;
      const hist = [...s.history.slice(1), p];
      // mining accrual
      const now = Date.now();
      const dt = Math.min(5, (now - s.mining.lastTick) / 1000);
      const pending = s.mining.pending + s.mining.rate * s.mining.gpus * dt;
      // order book churn — occasional new listing
      let orderBook = s.orderBook;
      let trades = s.trades;
      if (Math.random() < 0.25) {
        const users = ['@kamila', '@IL76pd', '@vlad_b', '@anon_maple', '@Dan9kov', '@eva_k', '@unlucky_POvelitel'];
        const side = Math.random() > 0.5 ? 'buy' : 'sell';
        const cbc = Math.round(rnd(2, 60));
        const mpl = Math.round(cbc * p + rnd(-20, 20));
        orderBook = [{
          id: 'o' + now,
          side, user: choice(users), cbc, mpl,
          ago: 'just now',
        }, ...orderBook].slice(0, 10);
      }
      if (Math.random() < 0.15) {
        const users = ['@kamila', '@IL76pd', '@vlad_b', '@anon_maple'];
        const cbc = Math.round(rnd(2, 30));
        trades = [{
          id: 't' + now, buyer: choice(users), seller: choice(users), cbc,
          mpl: Math.round(cbc * p),
          ago: 'now',
        }, ...trades].slice(0, 12);
      }
      // auction countdown
      const auction = s.auction.map(a => ({ ...a, ends: Math.max(0, a.ends - 1) }));
      return {
        ...s, price: p, prevPrice: s.price, history: hist, circuit,
        mining: { ...s.mining, pending, lastTick: now },
        orderBook, trades, auction,
      };
    });
  }, 1000);
};

Object.assign(window, { useStore, getState, setState, actions, startTicker, nf, rnd, clamp, initialState });
