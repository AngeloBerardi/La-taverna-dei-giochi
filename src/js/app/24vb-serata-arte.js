/* ================= CENA CON DELITTO: la messa in scena («il fascicolo») =================
   Pezzi di disegno usati dalle viste di 24va-serata.js: sigilli di ceralacca, arco del giorno, anello del tempo, volti,
   colori delle famiglie. Solo markup e SVG: nessuna regola del gioco passa di qui. Stile in css/45a-serata.css,
   direzione artistica in docs/SERATA-STILE.md. */
const SRA = {
  // un colore per famiglia (in ordine di kit): serve a riconoscerle a colpo d'occhio su TV e telefono
  COL: ['#f2c12e', '#5fb3a8', '#e07a5f', '#9b8bd0', '#8fbf6a', '#6fa3d8', '#d98bb0', '#c9a46a'],
  fam(g, fid) {
    const i = (g.famiglie || []).findIndex(f => f.id === fid);
    return SRA.COL[(i < 0 ? 0 : i) % SRA.COL.length];
  },
  // la palette del kit (tema.palette) sopra i colori di riserva del CSS, più la classe del momento del giorno
  stile(g) {
    const pal = (g.tema && g.tema.palette) || {};
    return Object.entries({ fondo: '--sr-fondo', carta: '--sr-carta', inchiostro: '--sr-ink', accento: '--sr-acc', sangue: '--sr-rosso' })
      .filter(([c]) => pal[c])
      .map(([c, v]) => v + ':' + pal[c])
      .join(';');
  },
  aria: g => ' sr-m-' + ((g.mom && g.mom.id) || 'attesa') + ' sr-f-' + (g.fase || 'casting'),
  volto(nome, col, cls) {
    const i = (String(nome || '?').trim()[0] || '?').toUpperCase();
    return `<span class="sr-volto ${cls || ''}" style="--fc:${col || 'var(--sr-acc)'}" aria-hidden="true">${esc(i)}</span>`;
  },
  // ---- sigilli: ceralacca con il simbolo del kit; risolto = spezzato in due ----
  SIMB: {
    orologio: '<circle cx="12" cy="13" r="6.5"/><path d="M12 9.5V13l2.6 1.6M10 3.5h4M12 3.5v3"/>',
    lanterna: '<path d="M9 8h6l1.6 9H7.4zM10 8V5.4h4V8M8 20h8M12 11.5v3M12 5.4V3"/>',
    chiave: '<circle cx="8" cy="8" r="3.8"/><path d="M10.8 10.8L20 20M15.6 15.6l-2.2 2.2M18.4 18.4l-2 2"/>',
    lettera: '<path d="M4 7h16v11H4zM4 7l8 6 8-6"/>',
    coltello: '<path d="M5 19l3-3M8 16L19 5c1 3 0 7-6 10z"/>',
    moneta: '<circle cx="12" cy="12" r="7"/><path d="M12 8v8M9.6 10h3.4a1.6 1.6 0 0 1 0 3.2h-2a1.6 1.6 0 0 0 0 3.2h3.6"/>',
    cuore: '<path d="M12 19.5L4.6 12a4.4 4.4 0 0 1 7.4-4.6A4.4 4.4 0 0 1 19.4 12z"/>',
    occhio: '<path d="M2.5 12c3-5 6-7 9.5-7s6.5 2 9.5 7c-3 5-6 7-9.5 7s-6.5-2-9.5-7z"/><circle cx="12" cy="12" r="2.6"/>',
    lucchetto: '<path d="M6.5 11h11v9h-11zM8.6 11V8a3.4 3.4 0 0 1 6.800 0v3M12 14.5v2.400"/>',
  },
  cera() {
    // bordo ondulato della ceralacca: 14 gobbe attorno a un cerchio
    let d = '';
    for (let i = 0; i <= 28; i++) {
      const a = (i / 28) * Math.PI * 2,
        r = i % 2 ? 27.5 : 24.6,
        x = (30 + Math.cos(a) * r).toFixed(1),
        y = (30 + Math.sin(a) * r).toFixed(1);
      d += (i ? 'L' : 'M') + x + ' ' + y;
    }
    return d + 'Z';
  },
  sigillo(x) {
    const s = SRA.SIMB[x.simbolo] || SRA.SIMB.lucchetto,
      svg = c =>
        `<svg class="${c}" viewBox="0 0 60 60"><path d="${SRA.CERA}" class="sr-ce"/><circle cx="30" cy="30" r="19" class="sr-ce2"/>` +
        `<g transform="translate(15 15) scale(1.25)" class="sr-ce3">${s}</g></svg>`;
    return `<li class="${x.on ? 'on' : 'off'}"><span class="sr-cera" aria-hidden="true">${svg('sx')}${svg('dx')}</span><b>${esc(x.id)}</b><small>${x.on ? esc(x.nome) : 'risolto'}</small></li>`;
  },
  // ---- arco del giorno: alba, mezzodì, notte; l'astro sta sul momento in corso ----
  arco(g) {
    const m = g.mom && g.mom.id,
      P = { mattina: [24, 37], pomeriggio: [100, 11], sera: [176, 37] },
      ord = ['mattina', 'pomeriggio', 'sera'],
      qui = ord.indexOf(m);
    const nodi = ord
      .map((id, i) => (i === qui ? '' : `<circle cx="${P[id][0]}" cy="${P[id][1]}" r="${i < qui ? 3.4 : 3}" class="${i < qui ? 'fatto' : 'poi'}"/>`))
      .join('');
    let astro = '';
    if (qui >= 0) {
      const [x, y] = P[m];
      astro =
        m === 'sera'
          ? `<path d="M${x + 5} ${y - 9}a9.5 9.5 0 1 0 5 16a8 8 0 0 1 -5 -16z" class="luna"/>`
          : `<g class="sole"><circle cx="${x}" cy="${y}" r="7"/>${[0, 45, 90, 135, 180, 225, 270, 315]
              .map(a => `<path d="M${x} ${y - 10}v-4" transform="rotate(${a} ${x} ${y})"/>`)
              .join('')}</g>`;
    }
    return `<svg class="sr-arco" viewBox="0 0 200 64" aria-hidden="true"><path d="M8 60A92 54 0 0 1 192 60" class="via"/><path d="M0 60h200" class="terra"/>${nodi}${astro}</svg>`;
  },
  // ---- anello del tempo: si svuota come un orologio; la durata piena viene dal kit (sulla TV) o dal primo sguardo ----
  TOT: {},
  anello(fino, extra) {
    if (!fino) return '';
    const D = SER.D,
      a = D && D.k && G.atto && D.k.atti[G.atto.i],
      min = a && G.mom && a[G.mom.id] && a[G.mom.id].minuti,
      resta = Math.max(1000, fino - Date.now());
    SRA.TOT[fino] = Math.max(SRA.TOT[fino] || 0, min ? min * 60000 : 0, resta);
    return `<div class="sr-anello" data-giro="${fino}" style="--p:${Math.min(1, resta / SRA.TOT[fino]).toFixed(3)}"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="54" class="b"/>`
      + `<circle cx="60" cy="60" r="46" class="t" pathLength="120" stroke-dasharray="0.7 9.3"/><circle cx="60" cy="60" r="54" class="p" pathLength="100" transform="rotate(-90 60 60)"/></svg>`
      + `<div>${SER.timerH(fino, 'sr-timer sr-big')}${extra || ''}</div></div>`;
  },
  tick() {
    for (const el of document.querySelectorAll('[data-giro]')) {
      const f = +el.dataset.giro,
        p = Math.max(0, Math.min(1, (f - Date.now()) / (SRA.TOT[f] || 1)));
      el.style.setProperty('--p', p.toFixed(3));
      el.classList.toggle('sr-ultimo', f - Date.now() <= 60000);
    }
  },
  // le animazioni d'ingresso partono una volta sola: la pagina si ridisegna a ogni mossa, ma un foglio arriva una volta
  VISTI: {},
  nuovo(chiave) {
    const ora = Date.now(),
      t = SRA.VISTI[chiave] || (SRA.VISTI[chiave] = ora);
    return ora - t < 1500 ? ' sr-nuovo' : '';
  },
  // strati d'atmosfera della TV: nebbia che scorre, grana, vignetta
  fumo: '<div class="sr-aria" aria-hidden="true"><i></i><i></i><b></b></div>',
};
SRA.CERA = SRA.cera();
