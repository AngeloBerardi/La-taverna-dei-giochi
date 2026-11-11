/* ================= CENA CON DELITTO: la messa in scena («il tascabile giallo») =================
   Pezzi di disegno usati dalle viste di 24va-serata.js: il tondo (la vignetta viva della copertina, con l'anello del tempo),
   le domande del caso col loro bollo, i volti, i colori delle famiglie. Solo markup e SVG: nessuna regola del gioco passa di qui.
   Stile in css/45a-serata.css, direzione artistica in docs/SERATA-STILE.md. */
const SRA = {
  // un colore per famiglia (in ordine di kit): serve a riconoscerle a colpo d'occhio su TV e telefono
  // colori pieni: devono leggersi sia sul giallo della copertina sia sulla carta della pagina (il rosso è riservato al tondo)
  COL: ['#1f3c88', '#1e6b4a', '#6b2d6b', '#9a4a14', '#0f5c6b', '#a01f5b', '#3d4a1a', '#4a3a6b'],
  fam(g, fid) {
    const i = (g.famiglie || []).findIndex(f => f.id === fid);
    return SRA.COL[(i < 0 ? 0 : i) % SRA.COL.length];
  },
  // la palette del kit (tema.palette) sopra i colori di riserva del CSS, più la classe del momento del giorno
  stile(g) {
    const pal = (g.tema && g.tema.palette) || {};
    return Object.entries({ fondo: '--sr-notte', carta: '--sr-carta', inchiostro: '--sr-ink', accento: '--sr-giallo', sangue: '--sr-rosso' })
      .filter(([c]) => pal[c])
      .map(([c, v]) => v + ':' + pal[c])
      .join(';');
  },
  aria: g => ' sr-m-' + ((g.mom && g.mom.id) || 'attesa') + ' sr-f-' + (g.fase || 'casting'),
  volto(nome, col, cls) {
    const i = (String(nome || '?').trim()[0] || '?').toUpperCase();
    return `<span class="sr-volto ${cls || ''}" style="--fc:${col || 'var(--sr-ink)'}" aria-hidden="true">${esc(i)}</span>`;
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
    const simb = SRA.SIMB[x.simbolo] || SRA.SIMB.lucchetto;
    return `<li class="${x.on ? 'on' : 'off'}"><span class="sr-cera" aria-hidden="true"><svg viewBox="0 0 60 60"><path d="${SRA.CERA}" class="sr-ce"/>`
      + `<g transform="translate(15 15) scale(1.25)" class="sr-ce3">${x.on ? simb : '<path d="M5 12.5l4.5 4.5L19 7.5"/>'}</g></svg></span>`
      + `<span><b>${esc(x.domanda || x.nome || x.id)}</b><small>${x.on ? esc(x.domanda ? x.nome : 'da scoprire') : 'risolto'}</small></span></li>`;
  },
  // ---- il tondo: la vignetta viva della copertina. Uno scoglio col faro: il cielo dice il momento del giorno, di notte il faro gira,
  // l'anello rosso attorno si consuma col tempo (pieno = nessun conto alla rovescia). `dentro` è ciò che sta scritto sopra la scena.
  TOT: {},
  SCENA:
    '<rect width="200" height="200" class="sr-cielo"/><ellipse cx="100" cy="132" rx="150" ry="46" class="sr-alone"/>'
    + '<g class="sr-stelle"><circle cx="34" cy="38" r="1.3"/><circle cx="70" cy="22" r="1"/><circle cx="96" cy="46" r="1.2"/><circle cx="168" cy="34" r="1.2"/><circle cx="182" cy="74" r="1"/><circle cx="22" cy="80" r="1"/></g>'
    + '<circle r="15" class="sr-astro"/><path d="M0 0L-190 -38L-190 22Z" class="sr-fascio" transform="translate(121 62)"/>'
    + '<rect y="132" width="200" height="70" class="sr-mare"/><path d="M14 146q7-4 14 0t14 0M150 152q7-4 14 0t14 0M40 172q7-4 14 0t14 0M118 182q7-4 14 0t14 0" class="sr-onde"/>'
    + '<path d="M44 150C52 134 70 126 88 122L102 114L138 112C152 118 166 132 174 150C140 158 80 158 44 150Z" class="sr-nero"/>'
    + '<path d="M113 114L116.500 66h9L129 114Z" class="sr-torre"/><path d="M114.800 92h12.400l.4 7h-13.200zM115.900 74h10.200l.3 6h-10.800z" class="sr-nero"/>'
    + '<path d="M114 66h14v-9h-14zM112 57L121 46L130 57Z" class="sr-nero"/><rect x="117" y="59" width="8" height="5.500" class="sr-lume"/>'
    + '<path d="M82 122V108l8-6.500 8 6.500v12Z" class="sr-nero"/><rect x="87.500" y="110" width="4.600" height="5" class="sr-lume"/>'
    + '<g class="sr-nebbia"><ellipse cx="60" cy="140" rx="70" ry="7"/><ellipse cx="150" cy="126" rx="60" ry="6"/></g>',
  tondo(fino, dentro, cls) {
    let p = 1;
    if (fino) {
      const D = SER.D,
        a = D && D.k && G.atto && D.k.atti[G.atto.i],
        min = a && G.mom && a[G.mom.id] && a[G.mom.id].minuti,
        resta = Math.max(1000, fino - Date.now());
      SRA.TOT[fino] = Math.max(SRA.TOT[fino] || 0, min ? min * 60000 : 0, resta);
      p = Math.min(1, resta / SRA.TOT[fino]);
    }
    const id = 'srt' + (cls || 'tv');
    return `<div class="sr-tondo ${cls || ''}"${fino ? ` data-giro="${fino}"` : ''} style="--p:${p.toFixed(3)}"><svg viewBox="0 0 200 200" aria-hidden="true"><clipPath id="${id}"><circle cx="100" cy="100" r="93"/></clipPath>`
      + `<g clip-path="url(#${id})">${SRA.SCENA}</g><circle cx="100" cy="100" r="95" class="sr-giro0"/><circle cx="100" cy="100" r="95" class="sr-giro" pathLength="100" transform="rotate(-90 100 100)"/></svg>`
      + `${dentro ? `<div>${dentro}</div>` : ''}</div>`;
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
};
SRA.CERA = SRA.cera();
