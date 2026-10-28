/* ---- Schermo comune (TV) per i giochi senza scena 3D: Briscola, Scopa, Burraco, Machiavelli, Ultima Carta, Dadi del Bugiardo,
   La Banda, Telepatia, Valle del Raccolto, Miniera dei Nani, Micio Bomba, Bestiole Affamate, Trame di Corte.
   Stesso guscio delle altre TV (LP.shell: QR, stato, classifica e cronaca a destra); al centro un tavolo ovale con i posti
   tutt'intorno (nome, carte coperte, ciò che è pubblico) e in mezzo la parte comune del gioco, disegnata con le carte del gioco.
   Sulla TV NON compare mai un'informazione nascosta: solo il numero delle carte in mano, mai il loro valore (le mani si vedono
   solo quando il gioco le scopre, per esempio alla rivelazione dei dadi). Gli id (#av<i>, #trick, #table, #bdisc, #board, #mtab…)
   sono gli stessi delle viste del telefono, così le animazioni dei giochi trovano i loro bersagli anche qui. */
const TVT = (() => {
  const PC = ['#e0663a', '#3b8fe0', '#4cae5c', '#d9b23a', '#a463e0', '#e05a9a', '#34b5b0', '#b88a52', '#6f7ee8', '#b0b0b0'];
  const pc = i => PC[((i % PC.length) + PC.length) % PC.length];
  const nm = (s, i) => esc(s.names[i]);
  /* posti su un'ellisse: il primo in alto, poi in senso orario */
  function spot(i, n) {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / n;
    return [50 + 41 * Math.cos(a), 50 + 39 * Math.sin(a)];
  }
  /* carte coperte (quante, mai quali) */
  const backs = (n, big) =>
    n > 0
      ? `<div class="tvk-bk ${big ? 'big' : ''}">${Array.from({ length: Math.min(n, big ? 4 : 7) }, () => '<i></i>').join('')}<b>${n}</b></div>`
      : '<div class="tvk-bk none"><b>0</b></div>';
  const pile = (n, label, id) => `<div class="tvk-pile" ${id ? `id="${id}"` : ''}>${backs(n, true)}<small>${label}</small></div>`;
  function seat(s, i, o, side) {
    const [x, y] = spot(i, s.n),
      at = side ? '' : `left:${x}%;top:${y}%;`;
    return `<div class="tvk-seat ${o.act ? 'act' : ''} ${o.out ? 'out' : ''} ${o.cls || ''}" id="av${i}" style="${at}--pc:${o.c || pc(i)}">
      <div class="tvk-nm"><i></i><b>${nm(s, i)}</b></div>${o.tag ? `<em class="tvk-tag">${o.tag}</em>` : ''}${o.body || ''}</div>`;
  }
  /* elenco a destra: righe {n, v, st, c, act} */
  const rows = list =>
    `<ul class="tv3-pl">${list
      .map(
        r =>
          `<li class="${r.act ? 'act' : ''}" style="--pc:${r.c}"><i class="tv3-dot"></i><span class="tv3-n">${r.n}</span><b class="tv3-vp">${r.v ?? ''}</b>${r.st ? `<span class="tv3-st">${r.st}</span>` : ''}</li>`
      )
      .join('')}</ul>`;
  const fine = (ok, title, sub, list) =>
    LP.endH(ok, title, sub, list ? `<ul>${list.map(r => `<li class="${r.w ? 'w' : ''}"><span>${r.n}</span><b>${r.v}</b></li>`).join('')}</ul>` : '');
  /* tabella di fine mano: colonne = squadre o giocatori */
  const tab = (heads, body) =>
    `<table class="tvk-tab"><tr><th></th>${heads.map(h => `<th>${h}</th>`).join('')}</tr>${body
      .map(r => `<tr class="${r.tot ? 'tot' : ''}"><td>${r.l}</td>${r.v.map((v, k) => `<td class="${r.w === k ? 'w' : ''}">${v}</td>`).join('')}</tr>`)
      .join('')}</table>`;
  function page(s, o) {
    document.documentElement.dataset.tv3 = '1';
    const seats = s.names.map((_, i) => seat(s, i, o.seat(i), o.side)).join('');
    /* tavolieri (o.side): i posti in colonna a sinistra, il tabellone occupa il resto */
    const mid = o.side
      ? `<div class="tvk tvk-side" style="--cz:${o.cz || 1}"><div class="tvk-col">${seats}</div><div class="tvk-plan"><div class="tvk-c">${o.center}</div></div></div>`
      : `<div class="tvk ${o.tcls || ''}" style="--cz:${o.cz || 1}"><div class="tvk-felt"></div>${seats}<div class="tvk-c">${o.center}</div></div>`;
    return LP.shell({
      cls: `tvk-pg tvk-${G.g} n${s.n}`,
      logo: esc(GN(G.g)),
      sub: o.sub || '',
      state: o.state || '',
      mid,
      right: (o.right || '') + LP.feedH(s),
      foot: '',
      end: s.over && !ui.anim ? o.end || '' : '',
    });
  }
  const turn = (s, i, txt) => `Tocca a <b>${nm(s, i)}</b>${txt ? ' · ' + txt : ''}`;
  return { pc, nm, backs, pile, rows, fine, tab, page, turn };
})();

/* ================= BRISCOLA ================= */
function briscolaTVH() {
  const s = G,
    T = s.n === 4,
    tr = (ui.view && ui.view.trick) || s.trick,
    w = ui.view ? ui.view.w : -1,
    ts = IT.P(s.trump).s,
    col = i => TVT.pc(T ? i % 2 : i),
    tn = t => esc(IT.teamName(s, t));
  const trick = `<div class="trick tvk-trick" id="trick">${
    tr.map(x => `<div class="tc ${x.p === w ? 'win' : ''}">${icardH(x.c, { attrs: `data-v="${x.c}"` })}<span>${TVT.nm(s, x.p)}</span></div>`).join('') ||
    '<span class="tvk-empty">Il tavolo è vuoto</span>'
  }</div>`;
  const trump = s.deck.length ? `<div class="tvk-trump">${icardH(s.trump)}<small>Briscola</small></div>` : '';
  const center = `<div class="tvk-row">${TVT.pile(s.deck.length, 'Mazzo')}${trump}</div>${trick}`;
  const sv = `<svg class="isv i${ts}" viewBox="0 0 24 24">${ISU[ts]}</svg>`;
  const list = T
    ? [0, 1].map(t => ({ n: tn(t), v: s.taken.filter((_, i) => i % 2 === t).reduce((a, p) => a + p.length, 0), st: '<span>carte prese</span>', c: TVT.pc(t), act: s.cur % 2 === t && !s.over }))
    : s.names.map((n, i) => ({ n: esc(n), v: s.taken[i].length, st: '<span>carte prese</span>', c: col(i), act: i === s.cur && !s.over }));
  const o = s.over;
  const end = o
    ? TVT.fine(o.win != null, o.win != null ? 'Vince ' + (T ? tn(o.win) : TVT.nm(s, o.win)) + '!' : 'Pareggio!', 'Punti contati a fine partita',
        o.scores.map((v, t) => ({ n: T ? tn(t) : TVT.nm(s, t), v: v + ' punti', w: t === o.win })))
    : '';
  return TVT.page(s, {
    sub: `Briscola: <b>${IT.SN[ts]}</b> ${sv} · mazzo ${s.deck.length}`,
    state: o ? 'Partita finita' : TVT.turn(s, s.cur),
    center,
    cz: 1.7,
    seat: i => ({ act: i === s.cur && !o, c: col(i), body: TVT.backs(s.hands[i].length) }),
    right: `<div class="tv3-lt">${T ? 'Coppie' : 'Giocatori'}</div>${TVT.rows(list)}`,
    end,
  });
}
/* ================= SCOPA ================= */
function scopaTVH() {
  const s = G,
    tn = t => esc(IT.teamName(s, t)),
    T = s.n === 4,
    col = i => TVT.pc(T ? i % 2 : i),
    sum = s.phase === 'summary' && s.res && !ui.anim;
  const table = `<div class="table tvk-table" id="table">${
    s.table.map(x => `<div class="tslot">${icardH(x, { attrs: `data-v="${x}"` })}</div>`).join('') || '<span class="tvk-empty">Tavolo vuoto</span>'
  }</div>`;
  const recap = sum
    ? `<div class="tvk-sum"><h3>Fine della mano ${s.round}</h3>${TVT.tab(s.scores.map((_, t) => tn(t)), [
        ...s.res.rows.map(x => ({ l: x.label, v: x.vals, w: x.w })),
        { l: 'Punti mano', v: s.res.pts.map(v => '+' + v), tot: 1 },
        { l: 'Totale', v: s.scores, tot: 1 },
      ])}</div>`
    : '';
  const center = recap || `<div class="tvk-row">${TVT.pile(s.deck.length, 'Mazzo')}</div>${table}`;
  const list = s.scores.map((v, t) => ({
    n: tn(t),
    v,
    st: `<span>prese <b>${s.taken[t].length}</b></span><span>scope <b>${s.scope[t]}</b></span>`,
    c: TVT.pc(t),
    act: (T ? s.cur % 2 : s.cur) === t && !s.over,
  }));
  const o = s.over;
  const end = o
    ? TVT.fine(o.win != null, o.win != null ? 'Vince ' + tn(o.win) + '!' : 'Pareggio!', 'Si giocava a ' + s.target,
        o.scores.map((v, t) => ({ n: tn(t), v: v + ' punti', w: t === o.win })))
    : '';
  return TVT.page(s, {
    sub: `Mano ${s.round} · si gioca a ${s.target}`,
    state: o ? 'Partita finita' : sum ? `Fine mano: <b>${TVT.nm(s, s.cur)}</b> distribuisce` : TVT.turn(s, s.cur),
    center,
    cz: 1.7,
    seat: i => ({ act: i === s.cur && !o && !sum, c: col(i), body: TVT.backs(s.hands[i].length), tag: s.scope[T ? i % 2 : i] ? s.scope[T ? i % 2 : i] + ' scope' : '' }),
    right: `<div class="tv3-lt">Punteggio</div>${TVT.rows(list)}`,
    end,
  });
}
/* ================= BURRACO ================= */
function burracoTVH() {
  const s = G,
    tn = t => esc(IT.teamName(s, t)),
    T = s.n === 4,
    col = i => TVT.pc(i % 2),
    sum = s.phase === 'summary' && s.res && !ui.anim;
  const melds = t =>
    `<div class="tvk-team" style="--pc:${TVT.pc(t)}"><div class="tvk-th"><b>${tn(t)}</b><span>${s.pozzTaken[t] ? 'pozzetto preso' : 'pozzetto da prendere'}</span></div><div class="melds" id="melds${t}">${
      s.melds[t]
        .map(m => {
          const b = BURR.isBurraco(m);
          return `<div class="meld ${b ? (m.wild ? 'bs' : 'bp') : ''}">${m.cards.map(c => bcardH(c, { cls: 'sm' })).join('')}${b ? `<span class="btag">${m.wild ? 'Burraco sporco' : 'Burraco pulito'}</span>` : ''}</div>`;
        })
        .join('') || '<span class="tvk-empty">Nessuna combinazione</span>'
    }</div></div>`;
  const disc = `<div class="pile tvk-disc" id="bdisc"><div class="dfan">${s.disc.slice(-9).map(c => bcardH(c, { cls: 'sm', attrs: `data-v="${c}"` })).join('') || '<span class="tvk-empty">vuoto</span>'}</div><small>Scarti${s.disc.length ? ' · ' + s.disc.length : ''}</small></div>`;
  const r = s.res;
  const row = (l, k) => ({ l, v: r.map(x => (x[k] > 0 && k !== 'cards' ? '+' : '') + x[k]) });
  const recap = sum
    ? `<div class="tvk-sum"><h3>Fine della mano ${s.round}</h3>${TVT.tab([0, 1].map(tn), [
        row('Carte calate', 'cards'), row('Burraco', 'bonus'), row('Chiusura', 'close'), row('Carte in mano', 'hand'), row('Pozzetto non preso', 'pozz'),
        { l: 'Punti mano', v: r.map(x => x.tot), tot: 1 }, { l: 'Totale', v: s.scores, tot: 1 },
      ])}</div>`
    : '';
  const center = recap || `<div class="tvk-row">${TVT.pile(s.deck.length, 'Mazzo')}${disc}</div><div class="tvk-teams">${melds(0)}${melds(1)}</div>`;
  const list = [0, 1].map(t => ({
    n: tn(t),
    v: s.scores[t],
    st: `<span>combinazioni <b>${s.melds[t].length}</b></span><span>${s.pozzTaken[t] ? 'pozzetto preso' : 'pozzetto in attesa'}</span>`,
    c: TVT.pc(t),
    act: s.cur % 2 === t && !s.over,
  }));
  const o = s.over;
  const end = o
    ? TVT.fine(true, 'Vince ' + tn(o.win) + '!', !s.target ? 'Una mano' : 'Si giocava a ' + s.target,
        o.scores.map((v, t) => ({ n: tn(t), v: v + ' punti', w: t === o.win })))
    : '';
  const ph = { draw: 'pesca', play: 'cala o scarta' }[s.phase] || '';
  return TVT.page(s, {
    sub: `Mano ${s.round}${!s.target ? ' · mano singola' : ' · si gioca a ' + s.target}`,
    state: o ? 'Partita finita' : sum ? 'Fine della mano' : TVT.turn(s, s.cur, ph),
    center,
    cz: 1.45,
    tcls: 'tvk-wide',
    seat: i => ({ act: i === s.cur && !o && !sum, c: col(i), body: TVT.backs(s.hands[i].length) }),
    right: `<div class="tv3-lt">Squadre</div>${TVT.rows(list)}`,
    end,
  });
}
/* ================= MACHIAVELLI ================= */
function machTVH() {
  const s = G,
    fresh = new Set((s.ev.find(e => e.t === 'play') || { cards: [] }).cards);
  const melds =
    s.table.map((m, i) => `<div class="mm ok" id="mm${i}"><div class="mmh">${m.map(c => mCardH(c, { cls: fresh.has(c) ? 'nw' : '' })).join('')}</div></div>`).join('') ||
    '<span class="tvk-empty">Il tavolo è vuoto</span>';
  const center = `<div class="mtab tvk-mtab" id="mtab">${melds}</div><div class="tvk-row">${TVT.pile(s.stock.length, 'Tallone')}</div>`;
  const o = s.over;
  const end = o
    ? TVT.fine(o.win != null, o.win != null ? 'Vince ' + TVT.nm(s, o.win) + '!' : 'Pareggio', esc(o.txt || ''),
        s.names.map((n, i) => ({ n: esc(n), v: s.hands[i].length + ' carte in mano', w: (o.winners || []).includes(i) })))
    : '';
  return TVT.page(s, {
    sub: `Giro ${s.turn} · ${s.table.length} combinazioni in tavola`,
    state: o ? 'Partita finita' : TVT.turn(s, s.cur),
    center,
    cz: s.table.length > 8 ? 0.8 : 1,
    tcls: 'tvk-wide',
    seat: i => ({ act: i === s.cur && !o, body: TVT.backs(s.hands[i].length) }),
    right: `<div class="tv3-lt">Carte in mano</div>${TVT.rows(s.names.map((n, i) => ({ n: esc(n), v: s.hands[i].length, c: TVT.pc(i), act: i === s.cur && !o })))}`,
    end,
  });
}
/* ================= ULTIMA CARTA ================= */
function unoTVH() {
  const s = G,
    top = s.discard[s.discard.length - 1],
    o = s.over;
  const center = `<div class="tvk-row tvk-uno">${TVT.pile(s.deck.length, 'Mazzo')}<div class="uturn tvk-uturn" style="--uc:${UCOL[s.color]}"><div class="ucol"></div>${ucardH(top, {
    cls: 'big',
  })}<span class="uarr">${s.dir === 1 ? '↻' : '↺'}</span></div>${s.pend ? `<div class="tvk-pend">+${s.pend}</div>` : ''}</div>
    <div class="tvk-ucol"><i style="background:${UCOL[s.color]}"></i>${UNO.CN[s.color]} · ${s.dir === 1 ? 'senso orario' : 'senso antiorario'}</div>`;
  const tag = i => (s.miss === i ? 'senza ULTIMA!' : s.hands[i].length === 1 ? 'ULTIMA!' : '');
  const end = o
    ? TVT.fine(true, 'Vince ' + TVT.nm(s, o.win) + '!', esc(o.reason || ''), s.names.map((n, i) => ({ n: esc(n), v: (o.scores ? o.scores[i] : s.hands[i].length) + (o.scores ? ' punti' : ' carte'), w: i === o.win })))
    : '';
  const modo = { classic: 'regole classiche', stack: 'con accumulo', sette: 'Sette-Zero', caos: 'accumulo + Sette-Zero' }[s.modo] || '';
  return TVT.page(s, {
    sub: `Mano singola · ${modo}`,
    state: o ? 'Partita finita' : TVT.turn(s, s.cur, s.pend ? 'deve rispondere al +' + s.pend : ''),
    center,
    cz: 1.5,
    seat: i => ({ act: i === s.cur && !o, body: TVT.backs(s.hands[i].length), tag: tag(i), cls: s.hands[i].length === 1 ? 'hot' : '' }),
    right: `<div class="tv3-lt">Carte in mano</div>${TVT.rows(s.names.map((n, i) => ({ n: esc(n), v: s.hands[i].length, c: TVT.pc(i), act: i === s.cur && !o })))}`,
    end,
  });
}
/* ================= DADI DEL BUGIARDO ================= */
function peruTVH() {
  const s = G,
    sum = s.phase === 'summary' && s.res,
    r = s.res,
    o = s.over,
    tot = PERU.total(s);
  const hit = x => r && (x === r.bid.f || (x === 1 && !r.pal && r.bid.f !== 1));
  const cup = i => {
    if (sum) return `<div class="tvk-dice">${r.hands[i].map(d => dieH(d, { cls: hit(d) ? 'hit' : 'miss' })).join('') || '<small>fuori</small>'}</div>`;
    return s.hands[i].length ? `<div class="tvk-cup"><b>${s.hands[i].length}</b><small>dadi</small></div>` : '<div class="tvk-cup out"><small>fuori</small></div>';
  };
  const bid = s.bid
    ? `<div class="tvk-bid"><b>${s.bid.q}</b><span>×</span><i class="tvk-bd">${dieH(s.bid.f)}</i><small>dichiara ${TVT.nm(s, s.bid.p)}</small></div>`
    : '<div class="tvk-bid none"><small>Nessuna dichiarazione: si apre il round</small></div>';
  let center;
  if (sum) {
    const what = r.kind === 'calza' ? 'Calza' : 'Dudo';
    const res = r.loser != null ? `<b>${TVT.nm(s, r.loser)}</b> perde un dado` : r.gain ? `<b>${TVT.nm(s, r.challenger)}</b> recupera un dado` : 'Nessuno perde dadi';
    center = `<div class="tvk-bid"><b>${r.bid.q}</b><span>×</span><i class="tvk-bd">${dieH(r.bid.f)}</i><small>${what} di ${TVT.nm(s, r.challenger)}</small></div><div class="tvk-reveal">Sul tavolo: <b>${r.count}</b> · ${res}</div>`;
  } else center = bid + (s.pal != null ? `<div class="tvk-pal">PALIFICO · ${TVT.nm(s, s.pal)}</div>` : '');
  const end = o ? TVT.fine(true, 'Vince ' + TVT.nm(s, o.win) + '!', esc(o.reason || ''), s.names.map((n, i) => ({ n: esc(n), v: o.scores[i] + ' dadi', w: i === o.win }))) : '';
  return TVT.page(s, {
    sub: `Round ${s.round} · ${tot} dadi in tavola · gli assi sono jolly`,
    state: o ? 'Partita finita' : sum ? 'Si scoprono i dadi' : TVT.turn(s, s.cur, s.bid ? 'rilancia o dice Dudo' : 'apre la dichiarazione'),
    center,
    cz: 1,
    seat: i => ({ act: i === s.cur && !o && !sum, out: !s.hands[i].length && !(sum && r.hands[i].length), body: cup(i), tag: s.bid && s.bid.p === i && !sum ? 'ha dichiarato' : '' }),
    right: `<div class="tv3-lt">Dadi rimasti</div>${TVT.rows(s.names.map((n, i) => ({ n: esc(n), v: s.hands[i].length, c: TVT.pc(i), act: i === s.cur && !o && !sum })))}`,
    end,
  });
}
/* ================= LA BANDA ================= */
function gangTVH() {
  const s = G,
    r = s.round,
    row = s.chips[r],
    o = s.over,
    sum = s.phase === 'summary' && s.res && !ui.anim;
  const vaults = [0, 1, 2].map(i => `<i class="tvk-vault ${i < s.vaults ? 'on' : ''}"></i>`).join('');
  const alarms = Array.from({ length: s.maxAlarm }, (_, i) => `<i class="tvk-alarm ${i < s.alarms ? 'on' : ''}"></i>`).join('');
  const board = `<div class="board tvk-board" id="board">${[0, 1, 2, 3, 4].map(i => (s.board[i] ? `<div class="bslot">${gcardH(s.board[i])}</div>` : '<div class="bslot empty"></div>')).join('')}</div>`;
  const pool = `<div class="tvk-chips">${row.map((p, i) => (p < 0 ? chipH(r, i + 1, { dk: GANG.locked(s, r, i + 1) }) : '<div class="gchip ghost"></div>')).join('')}</div>`;
  /* gettoni davanti a ogni giocatore: quelli dei giri passati e quello del giro in corso */
  const held = i =>
    `<div class="tvk-held">${[0, 1, 2, 3]
      .map(k => {
        const st = s.chips[k].indexOf(i) + 1;
        if (k > r || !st) return '';
        if (s.hidden[k] && k < r) return '<span class="gslot">?</span>';
        return chipH(k, st, { cls: k === r ? 'cur' : 'old' });
      })
      .join('')}</div>`;
  let center = `<div class="tvk-heist"><span class="tvk-vs">${vaults}</span><b>Colpo ${s.heist}</b><span class="tvk-as">${alarms}</span></div>${board}${s.phase === 'chips' ? pool : ''}`;
  if (sum) {
    const x = s.res;
    center = `<div class="tvk-sum"><h3>${x.ok ? 'Caveau aperto!' : 'Allarme!'}</h3><ol class="tvk-gord">${x.order
      .map((p, k) => `<li><b>${TVT.nm(s, p)}</b><span>${x.hands[k].map(c => gcardH(c, { cls: 'sm' })).join('')}</span><em>${esc(GANG.CAT[x.cats[k]] || '')}</em></li>`)
      .join('')}</ol>${x.why ? `<p>${esc(x.why)}</p>` : ''}</div>`;
  }
  const end = o ? TVT.fine(o.win, o.win ? 'Colpo riuscito!' : 'La banda è stata presa', `Caveau aperti ${o.vaults} · allarmi ${o.alarms}`) : '';
  return TVT.page(s, {
    sub: `${GANG.RND_N[Math.min(r, 3)]} · gettoni ${GANG.COL[Math.min(r, 3)]} · caveau ${s.vaults}/3 · allarmi ${s.alarms}/${s.maxAlarm}`,
    state: o ? 'Partita finita' : sum ? 'Si scoprono le mani' : s.phase === 'chips' ? TVT.turn(s, s.cur, 'prende un gettone') : 'La banda si consulta',
    center,
    cz: 1.35,
    seat: i => ({ act: i === s.cur && !o && s.phase === 'chips', body: TVT.backs(s.hands[i].length) + held(i) }),
    right: `<div class="tv3-lt">Il colpo</div>${TVT.rows([
      { n: 'Caveau aperti', v: s.vaults + '/3', c: '#d9b23a' },
      { n: 'Allarmi', v: s.alarms + '/' + s.maxAlarm, c: '#d8342c' },
    ])}`,
    end,
  });
}
/* ================= TELEPATIA (+ ESTREMA) ================= */
function mindTVH() {
  const s = G,
    ph = s.phase,
    o = s.over;
  const pileH = (arr, k) => {
    const last = arr[arr.length - 1];
    if (!last) return `<div class="mpile empty ${k}"><span>${k === 'r' ? '50 ↓' : '1 ↑'}</span></div>`;
    const bl = arr.some(e => e.h);
    return `<div class="mpile ${k}" id="mp${k}">${bl ? mcardH(null) + `<em>${arr.length} coperte</em>` : mcardH(last.c) + `<em>${arr.length}</em>`}</div>`;
  };
  const piles = s.x ? `<div class="mpiles">${pileH(s.wp, 'w')}${pileH(s.rp, 'r')}</div>` : `<div class="mpiles">${pileH(s.wp, 'n')}</div>`;
  const icons = (n, k) => Array.from({ length: Math.max(n, 0) }, () => ic(k, 34)).join('');
  const burn = s.burn.length ? `<div class="tvk-burn"><small>Scartate per errore</small>${s.burn.slice(-10).map(b => mcardH(b.c, { cls: 'xs' })).join('')}</div>` : '';
  const center = `<div class="tvk-lv">Livello <b>${s.level}</b><small>/ ${s.maxLevel}</small></div>${piles}${burn}`;
  const st = { ready: 'Mano sul tavolo: quando tutti sono pronti si parte', play: 'Silenzio… si gioca', starvote: 'Proposta di shuriken: si vota', summary: 'Livello completato' }[ph] || '';
  const end = o ? TVT.fine(o.win, o.win ? 'Telepatia perfetta!' : 'Le vite sono finite', o.win ? 'Tutti i ' + s.maxLevel + ' livelli superati' : esc(o.reason || '')) : '';
  return TVT.page(s, {
    sub: `${s.x ? 'Versione estrema · ' : ''}${s.blind ? 'livello a carte coperte · ' : ''}${s.n} giocatori`,
    state: o ? 'Partita finita' : st,
    center,
    cz: 1.9,
    seat: i => ({ act: ph === 'ready' && s.ready[i], body: TVT.backs(s.hands[i].length), tag: ph === 'ready' ? (s.ready[i] ? 'pronto' : '') : '' }),
    right: `<div class="tv3-lt">Squadra</div><div class="tvk-ls"><span class="tvk-life">${icons(s.lives, 'cuore') || '<small>nessuna vita</small>'}</span><span class="tvk-star">${icons(s.stars, 'star') || '<small>nessuno shuriken</small>'}</span></div>${TVT.rows(
      s.names.map((n, i) => ({ n: esc(n), v: s.hands[i].length, st: '<span>carte in mano</span>', c: TVT.pc(i), act: ph === 'ready' && s.ready[i] }))
    )}`,
    end,
  });
}
/* ================= VALLE DEL RACCOLTO ================= */
function harvTVH() {
  const s = G,
    o = s.over;
  const occ = Object.keys(s.grid).map(k => k.split(',').map(Number));
  if (!occ.length) occ.push([0, 0]);
  const xs = occ.map(c => c[0]),
    ys = occ.map(c => c[1]),
    x0 = Math.min(...xs),
    x1 = Math.max(...xs),
    y0 = Math.min(...ys),
    y1 = Math.max(...ys);
  let gr = '';
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const c = s.grid[x + ',' + y];
      gr += c ? `<div class="hcell">${hcardH(c)}</div>` : '<div class="hcell void"></div>';
    }
  const cols = x1 - x0 + 1,
    rws = y1 - y0 + 1,
    cs = `min(${(46 / Math.max(rws, 3)).toFixed(1)}vh,${(40 / Math.max(cols, 3)).toFixed(1)}vw)`;
  const grid = `<div class="hgrid tvk-hgrid" style="grid-template-columns:repeat(${cols},var(--cs));--cs:${cs}">${gr}</div>`;
  const mk = `<div class="hmarket tvk-hmk">${s.market.map(c => hcardH(c, { cls: 'mk' })).join('') || '<span class="tvk-empty">Mercato vuoto</span>'}<small>Mercato · mazzo ${s.deck.length}</small></div>`;
  const live = (() => {
    try {
      return HARV.score(JSON.parse(JSON.stringify(s))).det.map(d => d.tot);
    } catch (e) {
      return s.names.map(() => 0);
    }
  })();
  const sc = i => (o ? o.scores[i] : live[i]);
  const end = o
    ? TVT.fine(o.win != null, o.win != null ? 'Vince ' + TVT.nm(s, o.win) + '!' : 'Pareggio!', 'La valle è piena', s.names.map((n, i) => ({ n: esc(n), v: o.scores[i] + ' punti', w: (o.tie || []).includes(i) })))
    : '';
  return TVT.page(s, {
    sub: `Valle ${s.dims[0]}×${s.dims[1]} · ${Object.keys(s.grid).length} carte giocate`,
    state: o ? 'Partita finita' : TVT.turn(s, s.cur),
    center: grid + mk,
    side: true,
    seat: i => ({ act: i === s.cur && !o, c: HPC[i], body: `<div class="tvk-farm"><b>${s.farms[i]}</b><small>fattorie</small><b>${sc(i)}</b><small>punti</small></div>` }),
    right: `<div class="tv3-lt">Punti (in corso)</div>${TVT.rows(s.names.map((n, i) => ({ n: esc(n), v: sc(i), st: `<span>fattorie da posare <b>${s.farms[i]}</b></span>`, c: HPC[i], act: i === s.cur && !o })))}`,
    end,
  });
}
/* ================= MINIERA DEI NANI ================= */
function sabotTVH() {
  const s = G,
    o = s.over,
    sum = s.phase === 'summary' && s.res;
  const ks = Object.keys(s.board).map(k => k.split(',').map(Number)),
    xs = ks.map(k => k[0]),
    ys = ks.map(k => k[1]);
  const x0 = Math.min(0, ...xs) - 1,
    x1 = Math.max(8, ...xs) + 1,
    y0 = Math.min(-2, ...ys) - 1,
    y1 = Math.max(2, ...ys) + 1,
    cols = x1 - x0 + 1,
    rws = y1 - y0 + 1;
  let cells = '';
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const b = s.board[x + ',' + y];
      cells += `<div class="cell ${b ? 'full' : ''}" id="cell${x}_${y}">${b ? tileSVG(b.id, b.r, { hidden: b.hidden }) : ''}</div>`;
    }
  const tw = `min(${(60 / rws).toFixed(2)}vh,${(52 / cols).toFixed(2)}vw)`;
  const board = `<div class="mine tvk-mine" style="--tw:${tw}"><div class="grid" style="grid-template-columns:repeat(${cols},var(--tw))">${cells}</div></div>`;
  const TN = { pick: 'piccone', lamp: 'lanterna', cart: 'carrello' };
  const tools = i =>
    SAB.TOOLS.filter(t => s.broken[i][t])
      .map(t => `<span class="tvk-brk">${TN[t]} rotto</span>`)
      .join('') + (s.trap[i] ? '<span class="tvk-brk">in trappola</span>' : '');
  const center = sum ? `<div class="tvk-sum"><h3>Fine del round ${s.round}</h3><p>${esc(s.res.txt || '')}</p></div>${board}` : board;
  const role = i => (sum || o ? SAB.RN[(sum ? s.res.roles : s.roles)[i]] : '');
  const end = o
    ? TVT.fine(true, o.win != null ? 'Vince ' + TVT.nm(s, o.win) + '!' : 'Vincono in ' + o.winners.length, 'Pepite d’oro dopo tre round',
        s.names.map((n, i) => ({ n: esc(n), v: o.scores[i] + ' pepite', w: o.winners.includes(i) })))
    : '';
  return TVT.page(s, {
    sub: `Round ${s.round}/3 · mazzo ${s.deck.length}${s.exp ? ' · espansione' : ''}`,
    state: o ? 'Partita finita' : sum ? 'Il round è finito: si scoprono i ruoli' : TVT.turn(s, s.cur),
    center,
    side: true,
    seat: i => ({ act: i === s.cur && !o && !sum, body: TVT.backs(s.hands[i].length) + `<div class="tvk-tools">${tools(i)}</div>`, tag: role(i) }),
    right: `<div class="tv3-lt">Nani</div>${TVT.rows(
      s.names.map((n, i) => ({ n: esc(n), v: s.hands[i].length, st: tools(i) || '<span>attrezzi in ordine</span>', c: TVT.pc(i), act: i === s.cur && !o && !sum }))
    )}`,
    end,
  });
}
/* ================= MICIO BOMBA ================= */
function kittTVH() {
  const s = G,
    o = s.over,
    al = KITT.alive(s),
    p = s.pend;
  const top = s.discard.length ? kcardH(s.discard[s.discard.length - 1]) : '<div class="kc empty"><b>Scarti</b></div>';
  const what = p
    ? p.k === 'nope'
      ? `Catena di Niet in corso`
      : p.k === 'favor'
        ? `${TVT.nm(s, p.from)} chiede un favore a ${TVT.nm(s, p.to)}`
        : p.k === 'insert'
          ? `${TVT.nm(s, s.cur)} rimette la bomba nel mazzo, dove vuole`
          : ''
    : '';
  const center = `<div class="tvk-row">${TVT.pile(s.deck.length, 'Mazzo', 'kdeck')}<div class="tvk-kdisc">${top}<small>Scarti · ${s.discard.length}</small></div></div>
    <div class="tvk-bomb"><b>${Math.max(al.length - 1, 0)}</b> ${al.length - 1 === 1 ? 'bomba' : 'bombe'} nel mazzo${s.edi === 'imp' ? ` · gattino implodente ${s.impUp ? 'scoperto' : 'coperto'}` : ''}</div>${what ? `<div class="tvk-pend2">${what}</div>` : ''}`;
  const end = o ? TVT.fine(true, 'Vince ' + TVT.nm(s, o.win) + '!', esc(o.reason || ''), s.names.map((n, i) => ({ n: esc(n), v: s.alive[i] ? 'in piedi' : 'esploso', w: i === o.win }))) : '';
  return TVT.page(s, {
    sub: `${al.length} gatti in piedi · ${s.dir === -1 ? 'senso antiorario' : 'senso orario'}`,
    state: o ? 'Partita finita' : TVT.turn(s, s.cur, s.turns > 1 && s.cur === s.turner ? s.turns + ' turni da giocare' : ''),
    center,
    cz: 1.15,
    seat: i => ({ act: i === s.cur && !o, out: !s.alive[i], body: s.alive[i] ? TVT.backs(s.hands[i].length) : '<div class="tvk-boom">esploso</div>', tag: i === s.turner && s.turns > 1 ? '×' + s.turns : '' }),
    right: `<div class="tv3-lt">Gatti</div>${TVT.rows(s.names.map((n, i) => ({ n: esc(n), v: s.alive[i] ? s.hands[i].length : '—', st: s.alive[i] ? '<span>carte in mano</span>' : '<span>esploso</span>', c: TVT.pc(i), act: i === s.cur && !o })))}`,
    end,
  });
}
/* ================= BESTIOLE AFFAMATE ================= */
function petsTVH() {
  const s = G,
    o = s.over,
    res = s.res,
    rnd = s.phase === 'round' && res && !ui.anim;
  const body = i => {
    const shown = rnd ? (res.reveal ? res.reveal[i] : res.hands[i] != null ? res.hands[i] : res.out[i]) : null;
    const pl = s.played[i].map(c => pcardH(c, { cls: 'mini' })).join('') + (s.out[i] != null && !rnd ? pcardH(s.out[i], { cls: 'mini x' }) : '');
    return `${rnd && shown != null ? `<div class="tvk-pshow">${pcardH(shown)}</div>` : s.hands[i] != null ? TVT.backs(1) : ''}<div class="tvk-pplayed">${pl}</div>`;
  };
  const up = s.aside.up.length ? s.aside.up.map(c => pcardH(c, { cls: 'mini' })).join('') : '';
  const center = rnd
    ? `<div class="tvk-sum"><h3>Fine del round ${s.round}</h3><p>${res.win.map(w => TVT.nm(s, w)).join(', ')} ${res.win.length > 1 ? 'vincono' : 'vince'} il gettone</p></div>`
    : `<div class="tvk-row">${TVT.pile(s.deck.length, 'Mazzo')}${up ? `<div class="tvk-aside">${up}<small>Scoperte all’inizio</small></div>` : ''}</div>`;
  const end = o ? TVT.fine(true, 'Vince ' + TVT.nm(s, o.win) + '!', esc(o.reason || ''), s.names.map((n, i) => ({ n: esc(n), v: o.scores[i] + ' gettoni', w: (o.wins || [o.win]).includes(i) }))) : '';
  return TVT.page(s, {
    sub: `Round ${s.round} · si vince a ${s.target} gettoni`,
    state: o ? 'Partita finita' : rnd ? 'Si scoprono le carte' : TVT.turn(s, s.cur),
    center,
    cz: 1.1,
    seat: i => ({ act: i === s.cur && !o && !rnd, out: s.hands[i] == null && !rnd, body: body(i), tag: s.shield[i] && s.hands[i] != null ? 'protetto' : '' }),
    right: `<div class="tv3-lt">Gettoni</div>${TVT.rows(s.names.map((n, i) => ({ n: esc(n), v: s.tok[i], st: `<span>${s.hands[i] == null ? 'fuori dal round' : 'in gioco'}</span>`, c: TVT.pc(i), act: i === s.cur && !o })))}`,
    end,
  });
}
/* ================= TRAME DI CORTE ================= */
function thTVH() {
  const s = G,
    o = s.over;
  const rowH = `<div class="tvk-trow">${s.row.map(t => tcH(t)).join('') || '<span class="tvk-empty">Nessuna carta scoperta in questo turno</span>'}</div>`;
  const center = `<div class="tvk-row">${TVT.pile(s.deck.length, 'Mazzo')}<div class="tvk-tdisc">${s.discard.length ? tcBack() : ''}<small>Scarti · ${s.discard.length}</small></div></div>${rowH}`;
  const stacks = i =>
    `<div class="tvk-stk">${Object.keys(s.stacks[i])
      .map(t => `<span class="${s.stacks[i][t] > 1 ? 'ok' : ''}">${esc(THRONE.NAMES[t])} <b>×${s.stacks[i][t]}</b></span>`)
      .join('') || '<small>nessun mazzetto</small>'}</div>`;
  const end = o ? TVT.fine(true, 'Vince ' + TVT.nm(s, o.win) + '!', esc(o.reason || ''), s.names.map((n, i) => ({ n: esc(n), v: o.scores[i] + ' punti', w: (o.wins || [o.win]).includes(i) }))) : '';
  return TVT.page(s, {
    sub: `Mazzo ${s.deck.length} · scarti ${s.discard.length}`,
    state: o ? 'Partita finita' : TVT.turn(s, s.cur, s.phase === 'overflow' ? 'sceglie cosa scartare' : ''),
    center,
    cz: 1.4,
    seat: i => ({ act: i === s.cur && !o, body: stacks(i) }),
    right: `<div class="tv3-lt">Punti di corte</div>${TVT.rows(s.names.map((n, i) => ({ n: esc(n), v: THRONE.score(s, i), st: `<span>mazzetti <b>${Object.keys(s.stacks[i]).length}</b></span>`, c: TVT.pc(i), act: i === s.cur && !o })))}`,
    end,
  });
}
/* registrazione: sulla TV questi giochi usano la vista qui sopra; LP.reg tiene nascosto il pannello QR di sinistra */
{
  const TVV = {
    briscola: briscolaTVH, scopa: scopaTVH, burraco: burracoTVH, machiavelli: machTVH, uno: unoTVH, perudo: peruTVH, gang: gangTVH,
    mind: mindTVH, mindx: mindTVH, harvest: harvTVH, saboteur: sabotTVH, kittens: kittTVH, pets: petsTVH, trono: thTVH,
  };
  for (const k in TVV) {
    const f = VIEW[k];
    VIEW[k] = () => (ui.tv ? TVV[k]() : f());
    LP.reg[k] = LP.reg[k] || { hide() {} };
  }
}
