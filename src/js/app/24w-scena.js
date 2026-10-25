/* ================= CENE CON DELITTO: la messa in scena comune a tutti i kit =================
   Repertorio e regole: docs/GIALLI-SCENA.md. Ogni kit sceglie colori, carattere, atmosfera, suoni, voce ed effetti nei suoi
   dati; qui ci sono i momenti di coinvolgimento uguali per tutti, disegnati FUORI da #app (render() riscrive #app a ogni
   aggiornamento e farebbe ripartire le animazioni):
   - #gia-fondo: immagine del luogo con zoom lento + canvas dell'atmosfera (pioggia, fuoco, lampi, nebbia…), solo sulla TV;
   - #gia-scena: i momenti a tutto schermo (sigla, cast, cartello d'atto, indizio, evento, buste, rivelazione) sulla TV
     e la busta degli indizi nuovi sul telefono.
   La TV regista ha il kit intero (narrazione); le altre TV e i telefoni lavorano con la parte pubblica (G). */
const SCENA = (() => {
  const $id = id => document.getElementById(id);
  const hash = s => {
    let h = 2166136261;
    for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    return h >>> 0;
  };

  /* ---------- ritratto disegnato (finché manca l'immagine): cammeo ovale in carta ritagliata ---------- */
  const PELLI = ['#efcfae', '#e2b48c', '#c99872', '#a8714c', '#7d5236'];
  function scuro(c, k) {
    const n = parseInt(c.slice(1), 16),
      f = x => Math.max(0, Math.min(255, Math.round(x * (1 - k))));
    return (
      '#' +
      [n >> 16, (n >> 8) & 255, n & 255]
        .map(f)
        .map(x => x.toString(16).padStart(2, '0'))
        .join('')
    );
  }
  function ritratto(as, id, pal) {
    as = as || {};
    pal = pal || {};
    const h = hash(id),
      r = i => ((h >>> (i * 3)) & 7) / 7, // 0..1 ripetibile per personaggio
      pelle = as.pelle || PELLI[h % PELLI.length],
      cap = as.capelli || '#3a2a1e',
      abito = as.colore || '#5a4a3a',
      ink = '#1d140e',
      oro = pal.accento || '#d9a93a',
      fondo = pal.fondo || '#1a1210',
      u = 'p' + (h % 1e6),
      rx = 31 + r(1) * 6,
      ry = 39 + r(2) * 5,
      occhi = 11 + r(3) * 4,
      sop = (r(4) - 0.5) * 6,
      bocca = (r(5) - 0.45) * 7,
      t = as.testa || 'corti';
    const dietro = {
      lunghi: `<path d="M${100 - rx - 6} 92 Q${100 - rx - 12} 170 ${100 - rx + 4} 190 L${100 + rx - 4} 190 Q${100 + rx + 12} 170 ${100 + rx + 6} 92 Z" fill="${cap}"/>`,
      cappuccio: `<path d="M38 215 Q40 70 100 52 Q160 70 162 215 Z" fill="${scuro(abito, 0.25)}"/>`,
      velo: `<path d="M46 210 Q52 76 100 58 Q148 76 154 210 Z" fill="${scuro(abito, 0.45)}" opacity=".9"/>`,
      raccolti: `<circle cx="${100 + rx * 0.6}" cy="66" r="15" fill="${cap}"/>`,
    };
    const sopra = {
      corti: `<path d="M${100 - rx - 1} 96 Q${100 - rx} 54 100 56 Q${100 + rx} 54 ${100 + rx + 1} 96 Q${100 + 8} 70 ${100 - rx + 6} 84 Z" fill="${cap}"/>`,
      lunghi: `<path d="M${100 - rx - 2} 100 Q${100 - rx} 52 100 55 Q${100 + rx} 52 ${100 + rx + 2} 100 Q100 66 ${100 - rx - 2} 100 Z" fill="${cap}"/>`,
      raccolti: `<path d="M${100 - rx} 92 Q${100 - rx} 56 100 58 Q${100 + rx} 56 ${100 + rx} 92 Q100 70 ${100 - rx} 92 Z" fill="${cap}"/>`,
      calvo: `<path d="M${100 - rx} 100 q-3 -10 2 -16 M${100 + rx} 100 q3 -10 -2 -16" stroke="${cap}" stroke-width="7" fill="none"/>`,
      cappello: `<ellipse cx="100" cy="70" rx="62" ry="11" fill="${scuro(abito, 0.35)}"/><path d="M70 70 Q72 34 100 34 Q128 34 130 70 Z" fill="${scuro(abito, 0.2)}"/>`,
      cilindro: `<ellipse cx="100" cy="68" rx="50" ry="8" fill="${ink}"/><rect x="74" y="16" width="52" height="54" rx="4" fill="${ink}"/><rect x="74" y="54" width="52" height="7" fill="${abito}"/>`,
      cappuccio: `<path d="M50 200 Q48 78 100 62 Q152 78 150 200 Q140 120 100 108 Q60 120 50 200 Z" fill="${abito}"/><path d="M${100 - rx - 4} 104 Q100 44 ${100 + rx + 4} 104 Q100 70 ${100 - rx - 4} 104 Z" fill="${abito}"/>`,
      fazzoletto: `<path d="M${100 - rx - 3} 96 Q${100 - rx} 50 100 50 Q${100 + rx} 50 ${100 + rx + 3} 96 Q100 74 ${100 - rx - 3} 96 Z" fill="${abito}"/><circle cx="${100 + rx + 4}" cy="84" r="7" fill="${scuro(abito, 0.2)}"/><path d="M${100 + rx + 6} 88 l10 14 l-12 -2 Z" fill="${scuro(abito, 0.2)}"/>`,
      elmo: `<path d="M${100 - rx - 5} 96 Q${100 - rx - 4} 44 100 42 Q${100 + rx + 4} 44 ${100 + rx + 5} 96 Z" fill="#9aa3ad"/><rect x="${100 - rx - 6}" y="88" width="${2 * rx + 12}" height="8" fill="#6f7882"/><rect x="97" y="88" width="6" height="26" fill="#6f7882"/>`,
      velo: `<path d="M${100 - rx - 4} 100 Q${100 - rx} 46 100 46 Q${100 + rx} 46 ${100 + rx + 4} 100 Q100 64 ${100 - rx - 4} 100 Z" fill="${scuro(abito, 0.45)}"/>`,
      piuma: `<ellipse cx="96" cy="66" rx="48" ry="9" fill="${scuro(abito, 0.3)}" transform="rotate(-8 96 66)"/><path d="M74 66 Q76 40 100 40 Q122 40 122 62 Z" fill="${abito}"/><path d="M118 52 Q150 20 168 34 Q146 34 124 60 Z" fill="${oro}"/>`,
    };
    const barba =
      as.barba === 'baffi'
        ? `<path d="M86 125 Q100 117 114 125 Q100 122 86 125 Z" fill="${cap}" stroke="${cap}" stroke-width="3"/>`
        : as.barba
          ? `<path d="M${100 - rx + 3} 112 Q${100 - rx + 6} 152 100 158 Q${100 + rx - 6} 152 ${100 + rx - 3} 112 Q100 140 ${100 - rx + 3} 112 Z" fill="${cap}"/><path d="M88 124 Q100 118 112 124" stroke="${cap}" stroke-width="4" fill="none"/>`
          : '';
    const occ = `<ellipse cx="${100 - occhi}" cy="101" rx="3.4" ry="2.6" fill="${ink}"/><ellipse cx="${100 + occhi}" cy="101" rx="3.4" ry="2.6" fill="${ink}"/>`;
    const brow = `<path d="M${100 - occhi - 7} ${92 - sop} L${100 - occhi + 6} ${92 + sop}" stroke="${scuro(cap, 0.1)}" stroke-width="2.6" stroke-linecap="round"/><path d="M${100 + occhi - 6} ${92 + sop} L${100 + occhi + 7} ${92 - sop}" stroke="${scuro(cap, 0.1)}" stroke-width="2.6" stroke-linecap="round"/>`;
    const viso = `<path d="M100 103 L96 118 Q99 121 103 119" stroke="${scuro(pelle, 0.3)}" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M91 ${130 - bocca / 2} Q100 ${130 + bocca} 109 ${130 - bocca / 2}" stroke="${scuro(pelle, 0.45)}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    return `<svg class="gia-cammeo" viewBox="0 0 200 250" role="img" aria-hidden="true"><defs><radialGradient id="${u}f" cx="50%" cy="40%" r="65%"><stop offset="0" stop-color="${scuro(fondo, -1.2)}"/><stop offset="1" stop-color="${fondo}"/></radialGradient><clipPath id="${u}c"><ellipse cx="100" cy="125" rx="88" ry="116"/></clipPath></defs>
<ellipse cx="100" cy="125" rx="94" ry="122" fill="${oro}"/><ellipse cx="100" cy="125" rx="88" ry="116" fill="url(#${u}f)"/><g clip-path="url(#${u}c)">${dietro[t] || ''}
<path d="M18 260 Q24 196 70 182 L130 182 Q176 196 182 260 Z" fill="${abito}"/><path d="M84 182 L100 206 L116 182 Z" fill="${scuro(abito, 0.35)}"/>
<rect x="89" y="${92 + ry - 10}" width="22" height="34" fill="${scuro(pelle, 0.12)}"/><ellipse cx="100" cy="100" rx="${rx}" ry="${ry}" fill="${pelle}"/>
<ellipse cx="${100 - rx}" cy="104" rx="4" ry="7" fill="${scuro(pelle, 0.1)}"/><ellipse cx="${100 + rx}" cy="104" rx="4" ry="7" fill="${scuro(pelle, 0.1)}"/>
${occ}${brow}${viso}${barba}${sopra[t] || ''}</g><ellipse cx="100" cy="125" rx="88" ry="116" fill="none" stroke="${scuro(oro, 0.4)}" stroke-width="2"/></svg>`;
  }
  // l'immagine del ritratto se c'è, altrimenti il cammeo disegnato
  const volto = (g, pal, cls) =>
    g && g.img
      ? `<img class="gia-volto ${cls || ''}" src="${esc(g.img)}" alt="" loading="lazy">`
      : `<span class="gia-volto ${cls || ''}">${ritratto(g && g.aspetto, (g && (g.id || g.nome)) || '?', pal)}</span>`;

  /* ---------- tema del kit: colori e carattere dei titoli (telefono e TV) ---------- */
  const font = {};
  function tema(s) {
    const sc = (s && s.scena) || {},
      p = sc.palette,
      el = document.documentElement;
    if (p) {
      el.style.setProperty('--gk-fondo', p.fondo);
      el.style.setProperty('--gk-carta', p.carta);
      el.style.setProperty('--gk-ink', p.inchiostro);
      el.style.setProperty('--gk-acc', p.accento);
      el.style.setProperty('--gk-r', p.sangue);
    }
    if (sc.font && !font[sc.font] && window.FontFace) {
      font[sc.font] = 1;
      const fam = 'giallo-' + hash(sc.font);
      new FontFace(fam, `url(${sc.font})`)
        .load()
        .then(f => {
          document.fonts.add(f);
          el.style.setProperty('--gk-font', `'${fam}'`);
        })
        .catch(() => {});
    }
  }
  function senzaTema() {
    const el = document.documentElement;
    ['--gk-fondo', '--gk-carta', '--gk-ink', '--gk-acc', '--gk-r', '--gk-font'].forEach(v =>
      el.style.removeProperty(v)
    );
  }

  /* ---------- voce (la regista parla; le altre TV e i telefoni no) ---------- */
  const V = { on: true, cfg: {}, coda: 0 };
  function dici(t, dopo) {
    try {
      if (!V.on || !window.speechSynthesis || !t) return dopo && setTimeout(dopo, 300);
      const u = new SpeechSynthesisUtterance(t),
        voci = speechSynthesis.getVoices(),
        it =
          voci.find(v => /^it/i.test(v.lang) && /natural|google|neural/i.test(v.name)) ||
          voci.find(v => /^it/i.test(v.lang));
      u.lang = 'it-IT';
      if (it) u.voice = it;
      u.rate = V.cfg.velocita || 0.95;
      u.pitch = V.cfg.tono == null ? 1 : V.cfg.tono;
      V.coda++;
      Snd.duck(true);
      u.onend = u.onerror = () => {
        if (--V.coda <= 0) {
          V.coda = 0;
          Snd.duck(false);
        }
        if (dopo) dopo();
      };
      speechSynthesis.speak(u);
    } catch (e) {
      ERR.n(e);
      if (dopo) dopo();
    }
  }
  function zitto() {
    try {
      speechSynthesis.cancel();
    } catch (e) {
      /* senza voce */
    }
    V.coda = 0;
    Snd.duck(false);
  }

  /* ---------- fondo: luogo con zoom lento + atmosfera su canvas ---------- */
  const A = {
    on: false,
    strati: [],
    cv: null,
    cx: null,
    raf: 0,
    last: 0,
    part: {},
    lampo: 0,
    prossimo: 0,
    flash: 0,
    grana: null,
    pal: {},
  };
  function fondo() {
    let f = $id('gia-fondo');
    if (!f) {
      f = document.createElement('div');
      f.id = 'gia-fondo';
      f.innerHTML = '<div class="gf-img"></div><canvas></canvas><div class="gf-buio"></div>';
      document.body.appendChild(f);
      A.cv = f.querySelector('canvas');
      A.cx = A.cv.getContext('2d');
    }
    return f;
  }
  function luogo(l) {
    const f = fondo(),
      box = f.querySelector('.gf-img'),
      u = (l && l.img) || '';
    if (box.dataset.u === u) return;
    box.dataset.u = u;
    const nuovo = document.createElement('div');
    nuovo.className = 'gf-l' + (u ? ' img' : '');
    if (u) nuovo.style.backgroundImage = `url("${u}")`;
    box.appendChild(nuovo);
    requestAnimationFrame(() => nuovo.classList.add('on'));
    [...box.children].slice(0, -1).forEach(x => {
      x.classList.remove('on');
      setTimeout(() => x.remove(), 2500);
    });
  }
  const R = (a, b) => a + Math.random() * (b - a);
  function parti(k, W, H) {
    const n = { pioggia: 220, neve: 140, braci: 45, polvere: 70, nebbia: 5 }[k] || 0;
    return Array.from({ length: n }, () => ({ x: R(0, W), y: R(0, H), v: R(0.6, 1.4), a: R(0, 6.28), s: R(0.5, 1.6) }));
  }
  function atmosfera(strati, pal) {
    fondo();
    A.pal = pal || {};
    const nuovi = (strati || []).join();
    if (nuovi !== A.strati.join()) {
      A.strati = strati || [];
      A.part = {};
    }
    if (!A.on) {
      A.on = true;
      A.raf = requestAnimationFrame(passo);
    }
  }
  function dimensiona() {
    const W = innerWidth,
      H = innerHeight;
    if (A.cv.width !== W || A.cv.height !== H) {
      A.cv.width = W;
      A.cv.height = H;
      A.part = {};
    }
    return [W, H];
  }
  function granaCv() {
    if (A.grana) return A.grana;
    const c = document.createElement('canvas');
    c.width = c.height = 160;
    const x = c.getContext('2d'),
      d = x.createImageData(160, 160);
    for (let i = 0; i < d.data.length; i += 4) {
      const v = Math.random() * 255;
      d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
      d.data[i + 3] = 255;
    }
    x.putImageData(d, 0, 0);
    return (A.grana = c);
  }
  function passo(ts) {
    if (!A.on) return;
    A.raf = requestAnimationFrame(passo);
    if (document.hidden || ts - A.last < 33) return; // ~30 fotogrammi al secondo bastano
    const dt = Math.min(0.1, (ts - A.last) / 1000);
    A.last = ts;
    const [W, H] = dimensiona(),
      c = A.cx,
      t = ts / 1000,
      acc = A.pal.accento || '#e8a33a',
      has = k => A.strati.includes(k);
    c.clearRect(0, 0, W, H);
    for (const k of A.strati) if (!A.part[k]) A.part[k] = parti(k, W, H);
    if (has('fuoco')) {
      const fl = 0.55 + 0.25 * Math.sin(t * 7.3) * Math.sin(t * 3.1) + 0.1 * Math.sin(t * 17);
      const g = c.createRadialGradient(W * 0.12, H * 1.05, 0, W * 0.12, H * 1.05, H * 1.3);
      g.addColorStop(
        0,
        acc +
          Math.round(70 * fl)
            .toString(16)
            .padStart(2, '0')
      );
      g.addColorStop(1, acc + '00');
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
    }
    if (has('nebbia'))
      for (const p of A.part.nebbia) {
        p.x += p.v * 12 * dt;
        if (p.x > W + 400) p.x = -400;
        const g = c.createRadialGradient(p.x, H * 0.7 + Math.sin(t * 0.2 + p.a) * 40, 0, p.x, H * 0.7, 420);
        g.addColorStop(0, 'rgba(220,225,230,.10)');
        g.addColorStop(1, 'rgba(220,225,230,0)');
        c.fillStyle = g;
        c.fillRect(0, 0, W, H);
      }
    if (has('riflettori'))
      for (let i = 0; i < 2; i++) {
        const ang = Math.sin(t * 0.35 + i * 2.2) * 0.45,
          x0 = W * (0.3 + i * 0.4);
        c.save();
        c.translate(x0, -20);
        c.rotate(ang);
        const g = c.createLinearGradient(0, 0, 0, H * 1.2);
        g.addColorStop(0, 'rgba(255,250,230,.16)');
        g.addColorStop(1, 'rgba(255,250,230,0)');
        c.fillStyle = g;
        c.beginPath();
        c.moveTo(-20, 0);
        c.lineTo(20, 0);
        c.lineTo(H * 0.35, H * 1.2);
        c.lineTo(-H * 0.35, H * 1.2);
        c.fill();
        c.restore();
      }
    if (has('neon')) {
      const a = 0.08 + 0.05 * Math.sin(t * 2.4) + (Math.random() < 0.01 ? -0.06 : 0);
      c.strokeStyle = acc;
      c.globalAlpha = Math.max(0, a);
      c.lineWidth = 60;
      c.strokeRect(0, 0, W, H);
      c.globalAlpha = 1;
    }
    if (has('polvere')) {
      const g = c.createLinearGradient(W * 0.2, 0, W * 0.5, H);
      g.addColorStop(0, 'rgba(255,240,200,.10)');
      g.addColorStop(1, 'rgba(255,240,200,0)');
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(W * 0.25, 0);
      c.lineTo(W * 0.42, 0);
      c.lineTo(W * 0.7, H);
      c.lineTo(W * 0.3, H);
      c.fill();
      c.fillStyle = 'rgba(255,240,210,.5)';
      for (const p of A.part.polvere) {
        p.x += Math.sin(t * 0.5 + p.a) * 6 * dt;
        p.y += (p.v - 0.9) * 8 * dt;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;
        c.globalAlpha = 0.3 + 0.3 * Math.sin(t + p.a);
        c.fillRect(p.x, p.y, p.s * 1.6, p.s * 1.6);
      }
      c.globalAlpha = 1;
    }
    if (has('braci'))
      for (const p of A.part.braci) {
        p.y -= p.v * 38 * dt;
        p.x += Math.sin(t * 2 + p.a) * 14 * dt;
        if (p.y < -10) {
          p.y = H + R(0, 60);
          p.x = R(0, W * 0.5);
        }
        const life = 1 - p.y / H;
        c.fillStyle = `rgba(255,${(130 + p.s * 60) | 0},40,${Math.max(0, 0.9 - life)})`;
        c.beginPath();
        c.arc(p.x, p.y, p.s * 1.8, 0, 6.28);
        c.fill();
      }
    if (has('neve'))
      for (const p of A.part.neve) {
        p.y += p.v * 40 * dt;
        p.x += Math.sin(t + p.a) * 20 * dt;
        if (p.y > H) {
          p.y = -5;
          p.x = R(0, W);
        }
        c.fillStyle = 'rgba(255,255,255,.75)';
        c.beginPath();
        c.arc(p.x, p.y, p.s * 2, 0, 6.28);
        c.fill();
      }
    if (has('pioggia')) {
      c.strokeStyle = 'rgba(190,205,230,.28)';
      c.lineWidth = 1.2;
      c.beginPath();
      for (const p of A.part.pioggia) {
        p.y += p.v * 900 * dt;
        p.x -= p.v * 180 * dt;
        if (p.y > H) {
          p.y = R(-40, 0);
          p.x = R(0, W * 1.2);
        }
        c.moveTo(p.x, p.y);
        c.lineTo(p.x + 5 * p.s, p.y - 24 * p.s);
      }
      c.stroke();
    }
    if (has('lampi')) {
      if (!A.prossimo) A.prossimo = t + R(9, 20);
      if (t > A.prossimo) {
        A.prossimo = t + R(12, 26);
        lampeggia(0.55, REGIA.sono());
      }
    }
    if (A.flash > 0) {
      c.fillStyle = `rgba(235,240,255,${A.flash})`;
      c.fillRect(0, 0, W, H);
      if (A.fulmine) {
        c.strokeStyle = `rgba(255,255,255,${Math.min(1, A.flash * 2)})`;
        c.lineWidth = 3;
        c.beginPath();
        A.fulmine.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
        c.stroke();
      }
      A.flash = Math.max(0, A.flash - dt * 2.2);
      if (!A.flash) A.fulmine = null;
    }
    if (has('vignetta')) {
      const g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,.7)');
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
    }
    if (has('grana')) {
      c.globalAlpha = 0.07;
      c.globalCompositeOperation = 'overlay';
      c.fillStyle = c.createPattern(granaCv(), 'repeat');
      c.save();
      c.translate(R(-80, 0), R(-80, 0));
      c.fillRect(0, 0, W + 80, H + 80);
      c.restore();
      c.globalCompositeOperation = 'source-over';
      c.globalAlpha = 1;
    }
  }
  function lampeggia(forza, suono) {
    const W = innerWidth,
      H = innerHeight;
    A.flash = forza;
    let x = R(W * 0.15, W * 0.85),
      y = 0;
    A.fulmine = [[x, y]];
    while (y < H * 0.6) {
      x += R(-50, 50);
      y += R(20, 60);
      A.fulmine.push([x, y]);
    }
    if (suono) setTimeout(() => Snd.play('gtuono'), R(300, 1200));
  }
  function spegni() {
    A.on = false;
    cancelAnimationFrame(A.raf);
    const f = $id('gia-fondo');
    if (f) f.remove();
    A.cv = A.cx = null;
    A.strati = [];
    A.part = {};
  }

  /* ---------- momenti a tutto schermo (uno alla volta, in coda) ---------- */
  const M = { coda: [], vivo: false, n: 0, visti: [] };
  function palco() {
    let p = $id('gia-scena');
    if (!p) {
      p = document.createElement('div');
      p.id = 'gia-scena';
      document.body.appendChild(p);
    }
    return p;
  }
  // un momento = {html, ms, cls, suono, voce, prima()}: si mostra, si aspetta ms (o la fine della voce), poi il prossimo
  function momento(m) {
    M.coda.push(m);
    if (!M.vivo) avanti();
  }
  function avanti() {
    const m = M.coda.shift(),
      p = palco(),
      gen = ++M.n; // i tempi di un momento saltato non devono chiudere quello dopo
    if (!m) {
      M.vivo = false;
      p.className = '';
      p.innerHTML = '';
      return;
    }
    M.vivo = true;
    M.visti.push(m.cls || '');
    if (M.visti.length > 60) M.visti.shift();
    if (m.prima) m.prima();
    p.className = 'on ' + (m.cls || '');
    p.innerHTML =
      (m.html || '') + (ui.tv && REGIA.sono() ? '<button class="b sm gs-salta" data-a="giasalta">Salta</button>' : '');
    if (m.suono) Snd.play(m.suono);
    let voce = !!m.voce && V.on && REGIA.sono(),
      tempo = false;
    const fine = () => {
      if (gen !== M.n || voce || !tempo) return;
      p.classList.add('via');
      setTimeout(() => gen === M.n && avanti(), 450);
    };
    if (voce)
      dici(m.voce, () => {
        voce = false;
        setTimeout(fine, 600);
      });
    setTimeout(() => {
      tempo = true;
      fine();
    }, m.ms || 3000);
  }
  // la regia salta il momento in corso (o tutta la coda, per esempio il cast quando tutti si conoscono già)
  function salta(tutto) {
    if (tutto) M.coda = [];
    zitto();
    if (M.vivo) avanti();
  }
  function svuota() {
    M.coda = [];
    M.vivo = false;
    const p = $id('gia-scena');
    if (p) p.remove();
  }
  const ROMANI = ['I', 'II', 'III', 'IV', 'V', 'VI'];

  /* ---------- TV: confronta lo stato con quello già visto e mette in scena le novità ---------- */
  const T = { gid: '', fase: '', atto: -2, ev: '', pub: 0, vot: 0, fin: false };
  function tv(s, k) {
    const regista = REGIA.sono(),
      pal = (s.scena && s.scena.palette) || {};
    tema(s);
    V.cfg = (k && k.scena && k.scena.voce) || {};
    const atto = s.atto >= 0 && k ? k.atti[s.atto] : null;
    const sc = (k && k.scena) || {};
    atmosfera(atto && atto.strati ? atto.strati : (sc.atmosfera && sc.atmosfera.strati) || ['vignetta', 'grana'], pal);
    luogo(s.luogo);
    if (regista) {
      Snd.amb(s.fase === 'finale' ? [] : (atto && atto.ambiente) || sc.ambiente || []);
      if (sc.musica && !Snd.__gk) {
        const m = sc.musica;
        Snd.def('kit', {
          sd: 60 / m.bpm / 2,
          bar: 8,
          swing: m.swing || 0,
          prog: m.prog,
          arp: [0, 1, 2, 1, 3, 2, 1, 2],
          lead: m.strumento || 'bell',
          drum: m.ritmo || 'tav',
          mel: m.mel,
        });
        Snd.__gk = 1;
      }
    }
    const nuovo = T.gid !== s.gid;
    if (nuovo) {
      // prima volta che vedo questa serata: se è appena cominciata la presento, altrimenti riparto da dove è
      Object.assign(T, {
        gid: s.gid,
        fase: s.fase,
        atto: s.atto,
        ev: (s.ultimo && s.ultimo.id) || '',
        pub: (s.pubblici || []).length,
        vot: (s.votati || []).length,
        fin: s.fase === 'finale',
      });
      if (s.fase === 'prologo' && regista && k) sigla(s, k);
      return;
    }
    if (s.fase === 'prologo' && T.fase === 'attesa' && regista && k) sigla(s, k);
    if (s.fase === 'atto' && (T.fase !== 'atto' || T.atto !== s.atto)) cartello(s, k);
    if (s.fase === 'accusa' && T.fase !== 'accusa')
      momento({
        cls: 'cartello',
        ms: 5000,
        suono: 'gstacco',
        html: `<div class="gs-c"><small>Il tempo è scaduto</small><h1>L’accusa</h1><p>Ognuno voti in segreto dal proprio telefono</p></div>`,
        voce: 'È il momento di accusare. Votate in segreto dal vostro telefono: chi, come e perché. E il miglior attore della serata.',
      });
    const pub = s.pubblici || [];
    for (const o of pub.slice(T.pub)) indizio(o);
    const ul = s.ultimo;
    if (ul && ul.id !== T.ev && Date.now() - (ul.t || 0) < 120000) evento(ul, s);
    const vot = s.votati || [];
    for (const u of vot.slice(T.vot)) busta(s, u);
    if (s.fase === 'finale' && !T.fin) rivelazione(s, k);
    Object.assign(T, {
      fase: s.fase,
      atto: s.atto,
      ev: (ul && ul.id) || T.ev,
      pub: pub.length,
      vot: vot.length,
      fin: s.fase === 'finale',
    });
  }
  function sigla(s, k) {
    const pal = (s.scena && s.scena.palette) || {};
    momento({
      cls: 'sigla',
      ms: 6000,
      suono: 'gstacco',
      html: `<div class="gs-sigla">${k.media && k.media.copertina ? `<img src="${esc(k.media.copertina)}" alt="">` : ''}<div><small>Questa sera a cena</small><h1>${esc(k.titolo)}</h1>${k.sottotitolo ? `<p>${esc(k.sottotitolo)}</p>` : ''}</div></div>`,
      voce: 'Benvenuti. Questa sera a cena: ' + k.titolo + '.',
    });
    if (s.vittima)
      momento({
        cls: 'cast vittima',
        ms: 4500,
        html: `<div class="gs-cast">${volto(s.vittima, pal, 'grande')}<div><small>La vittima</small><h2>${esc(s.vittima.nome)}</h2><p>${esc(s.vittima.chi)}</p></div></div>`,
        voce: 'La vittima: ' + s.vittima.nome + ', ' + s.vittima.chi + '.',
      });
    (s.giocatori || []).forEach((g, i) =>
      momento({
        cls: 'cast',
        ms: 4200,
        suono: i ? 'gcarta' : 'gbusta',
        html: `<div class="gs-cast">${volto(g, pal, 'grande')}<div><small>${esc(g.nome)} è</small><h2>${esc(g.pg)}</h2><p>${esc(g.ruolo)}</p>${g.costume ? `<p class="gs-costume">${esc(g.costume)}</p>` : ''}</div></div>`,
        voce: g.nome + ' è ' + g.pg + (g.ruolo ? ', ' + g.ruolo : '') + '.',
      })
    );
    momento({
      cls: 'prologo',
      ms: 9000,
      html: `<div class="gs-c"><small>Prologo</small>${k.prologo.map(p => `<p>${esc(p)}</p>`).join('')}</div>`,
      voce: k.prologo.join(' '),
    });
  }
  function cartello(s, k) {
    const a = k ? k.atti[s.atto] : null;
    momento({
      cls: 'cartello',
      ms: 5200,
      suono: 'gstacco',
      html: `<div class="gs-c"><small>Atto ${ROMANI[s.atto] || s.atto + 1}${s.luogo ? ' · ' + esc(s.luogo.nome) : ''}</small><h1>${esc(s.titoloAtto)}</h1></div>`,
      voce: a ? 'Atto ' + (s.atto + 1) + '. ' + a.titolo + '. ' + a.narrazione.join(' ') : '',
    });
  }
  function indizio(o) {
    momento({
      cls: 'carta',
      ms: 7000,
      suono: 'gcarta',
      html: `<article class="gs-ind">${o.img ? `<img src="${esc(o.img)}" alt="">` : ''}<div><small>Indizio pubblico · atto ${o.atto + 1}</small><h2>${esc(o.titolo)}</h2><p>${esc(o.testo)}</p></div></article>`,
      voce: 'Nuovo indizio: ' + o.titolo + '. ' + o.testo,
    });
  }
  const FXS = {
    lampo: 'gtuono',
    campana: 'gcampana',
    orologio: 'gorologio',
    sparo: 'gsparo',
    telegramma: 'gtelegramma',
    buio: 'gbuio',
    tremito: 'gtuono',
  };
  function evento(ul, s) {
    const regista = REGIA.sono(),
      fx = ul.fx || '';
    momento({
      cls: 'evento fx-' + fx,
      ms: fx === 'buio' ? 6500 : 6000,
      suono: regista ? FXS[fx] : '',
      prima: () => {
        if (fx === 'lampo' || fx === 'sparo') lampeggia(fx === 'sparo' ? 0.9 : 0.8, false);
        if (fx === 'tremito') {
          document.documentElement.classList.add('gia-trema');
          setTimeout(() => document.documentElement.classList.remove('gia-trema'), 1200);
        }
      },
      html: `<div class="gs-ev">${fx === 'telegramma' ? '<div class="gs-foglio"></div>' : ''}<p>${esc(ul.testo)}</p>${ul.per ? `<p class="gs-per">${esc(ul.per)}, guarda il telefono</p>` : ''}</div>`,
      voce: ul.testo + (ul.per ? ' ' + ul.per + ', guarda il telefono.' : ''),
    });
  }
  function busta(s, u) {
    const g = (s.giocatori || []).find(x => x.uid === u);
    if (!g) return;
    momento({
      cls: 'busta',
      ms: 1600,
      suono: 'gbusta',
      html: `<div class="gs-busta"><div class="gs-b"></div><p><b>${esc(g.nome)}</b> ha consegnato la sua accusa</p></div>`,
    });
  }
  function rivelazione(s, k) {
    const f = s.finale;
    if (!f) return;
    const pal = (s.scena && s.scena.palette) || {};
    Snd.amb([]);
    momento({ cls: 'buio', ms: 3400, suono: 'grullo', html: '<div class="gs-c"><p>Le luci si spengono…</p></div>' });
    momento({
      cls: 'riflettore',
      ms: 7000,
      html: `<div class="gs-cast">${volto({ img: f.img, aspetto: f.aspetto, id: f.chiId }, pal, 'grande')}<div><small>L’assassino era</small><h1>${esc(f.chi)}</h1>${f.punti && f.punti.franca ? '<p>…e l’ha fatta franca!</p>' : ''}</div></div>`,
      voce: 'L’assassino era ' + f.chi + '.' + (f.punti && f.punti.franca ? ' E l’ha fatta franca!' : ''),
    });
    if (k)
      momento({
        cls: 'prologo',
        ms: 4000,
        html: `<div class="gs-c"><small>Ecco com’è andata</small></div>`,
        voce: k.soluzione.ricostruzione.join(' '),
      });
    const attori = ((f.punti && f.punti.attori) || [])
      .map(u => (s.giocatori || []).find(g => g.uid === u))
      .filter(Boolean);
    if (attori.length)
      momento({
        cls: 'cast',
        ms: 5000,
        suono: 'gapplauso',
        html: `<div class="gs-c"><small>Miglior attore della serata</small><h1>${attori.map(g => esc(g.nome)).join(' e ')}</h1></div>`,
        voce: 'Il premio per il miglior attore va a ' + attori.map(g => g.nome).join(' e ') + '.',
      });
  }

  /* ---------- telefono: busta per ciò che arriva in mano, avvisi della TV ---------- */
  const P = { gid: '', chiavi: null, ev: '', fase: '' };
  function vibra(p) {
    try {
      if (navigator.vibrate) navigator.vibrate(p);
    } catch (e) {
      /* non supportato */
    }
  }
  function telefono(s, mano, io) {
    tema(s);
    const chiavi = Object.keys(mano || {}).filter(k => /^(i-|m-|e-|ob)/.test(k));
    if (P.gid !== s.gid || !P.chiavi) {
      Object.assign(P, {
        gid: s.gid,
        chiavi: chiavi.length || mano.scheda ? new Set(chiavi) : null,
        ev: (s.ultimo && s.ultimo.id) || '',
        fase: s.fase,
      });
      return;
    }
    const nuove = chiavi.filter(k => !P.chiavi.has(k));
    nuove.forEach(k => P.chiavi.add(k));
    const ul = s.ultimo,
      mio = n => n && io && (s.giocatori || []).some(g => g.uid === io && g.nome === n);
    const msg = nuove.filter(k => k.startsWith('e-')),
      ind = nuove.filter(k => k.startsWith('i-') || k.startsWith('m-'));
    if (msg.length) {
      const o = mano[msg[0]];
      vibra([220, 120, 220, 120, 400]);
      Snd.play('gbusta');
      avviso('Messaggio per te', o.titolo, 'indizi', 'privato');
    } else if (ind.length) {
      const o = mano[ind[0]];
      vibra([90, 60, 90]);
      Snd.play('gbusta');
      avviso(
        ind.length > 1 ? ind.length + ' nuovi indizi' : o.da ? o.da + ' ti mostra un indizio' : 'Nuovo indizio',
        ind.length > 1 ? '' : o.titolo,
        'indizi'
      );
    } else if (nuove.some(k => k.startsWith('ob'))) {
      vibra(60);
      avviso('Atto ' + (s.atto + 1), 'Nuovi obiettivi per te', 'obiettivi');
    }
    if (ul && ul.id !== P.ev) {
      P.ev = ul.id;
      if (!mio(ul.per)) {
        vibra(40);
        say('Guarda la TV', 2200);
      }
    }
    if (s.fase !== P.fase) {
      if (s.fase === 'accusa') vibra([60, 40, 60]);
      P.fase = s.fase;
    }
  }
  function avviso(titolo, sotto, tab, cls) {
    const p = palco();
    p.className = 'on tel ' + (cls || '');
    p.innerHTML = `<button class="gs-tbusta" data-a="giabusta" data-v="${tab}"><span class="gs-b"></span><b>${esc(titolo)}</b>${sotto ? `<small>${esc(sotto)}</small>` : ''}<em>Tocca per aprire</em></button>`;
    clearTimeout(avviso.t);
    avviso.t = setTimeout(chiudiAvviso, 9000);
  }
  function chiudiAvviso() {
    const p = $id('gia-scena');
    if (p && p.classList.contains('tel')) {
      p.className = '';
      p.innerHTML = '';
    }
  }

  // fuori dalla partita (o cambio gioco): via tutto
  function via() {
    if (!$id('gia-fondo') && !$id('gia-scena') && !A.on) return;
    spegni();
    svuota();
    zitto();
    Snd.amb([]);
    senzaTema();
    T.gid = P.gid = '';
    P.chiavi = null;
  }

  return {
    ritratto,
    volto,
    tv,
    telefono,
    via,
    chiudiAvviso,
    salta,
    get visti() {
      return M.visti.slice();
    },
    dici,
    zitto,
    get voce() {
      return V.on;
    },
    set voce(v) {
      V.on = !!v;
      if (!v) zitto();
    },
  };
})();
