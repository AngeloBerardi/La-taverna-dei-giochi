#!/usr/bin/env node
// Controlla e racconta il piano dei passi (docs/passi/NN-*.md).
//   npm run passi                      controlla tutto il piano (numeri, fasi, dipendenze, file, sezioni, PROMPT.md aggiornato)
//   npm run passi -- --fase 3          i passi della fase 3, con modello, impegno e controllo (aggiungi --json per l'orchestratore)
//   npm run passi -- --diff 07         il ramo corrente tocca solo i file permessi al passo 07?
//   npm run passi -- --pronto 07       i passi da cui dipende il 07 sono già uniti in main?
//   npm run passi -- --scrivi          riscrive docs/passi/PROMPT.md dal piano
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const ROOT = path.join(__dirname, '../..'), DIR = path.join(ROOT, 'docs/passi');
const REPO = 'AngeloBerardi/La-taverna-dei-giochi';
const ENUM = {
  modello: ['haiku', 'sonnet', 'opus', 'fable'], impegno: ['basso', 'medio', 'alto'],
  controllo: ['leggero', 'forte', 'visivo', 'forte+visivo'], agente: ['programmer', 'artist', 'architetto'],
  area: ['fondamenta', 'battaglia', 'mondo', 'viste', 'testi', 'rilascio', 'progetto'],
};
// Il manifest lo toccano solo i passi di fondamenta (01 e 02 in righe lontane, 04 da solo nella sua fase).
const MANIFEST_OK = new Set([1, 2, 4]);
const MAXFASE = 5;
// Controllo: livello → chi lo fa, con che modello e impegno (vedi LEGGIMI.md).
const CONTROLLI = {
  leggero: { modello: 'haiku', impegno: 'basso' }, forte: { modello: 'opus', impegno: 'alto' },
  visivo: { modello: 'opus', impegno: 'basso' }, 'forte+visivo': { modello: 'opus', impegno: 'alto' },
};
const NOMI = { haiku: 'Haiku 5.5', sonnet: 'Sonnet 5.5', opus: 'Opus 5.5', fable: 'Fable 5.2' };
const EFFORT = { basso: 'low', medio: 'medium', alto: 'high' };

function leggi() {
  const passi = [];
  for (const f of fs.readdirSync(DIR).filter(f => /^\d\d-.*\.md$/.test(f)).sort()) {
    const t = fs.readFileSync(path.join(DIR, f), 'utf8'), m = t.match(/^---\n([\s\S]*?)\n---\n/);
    if (!m) { passi.push({ f, err: 'manca il blocco iniziale ---' }); continue; }
    const p = { f, testo: t, file: [] }; let lista = null;
    for (const r of m[1].split('\n')) {
      if (/^\s+- /.test(r) && lista) { p[lista].push(r.replace(/^\s+- /, '').trim()); continue; }
      const kv = r.match(/^(\w+):\s*(.*)$/); if (!kv) continue;
      const [, k, v] = kv; lista = null;
      if (v === '') { p[k] = []; lista = k; }
      else if (/^\[.*\]$/.test(v)) p[k] = v.slice(1, -1).split(',').map(x => x.trim()).filter(Boolean).map(Number);
      else p[k] = /^\d+$/.test(v) ? Number(v) : v;
    }
    p.n = p.passo;
    passi.push(p);
  }
  return passi;
}
const pad = n => String(n).padStart(2, '0');
const propri = p => [`docs/passi/${p.f}`, `tests/test_ven_p${pad(p.n)}*.js`, `tools/test-browser/scenari/p${pad(p.n)}.py`];
const re = g => new RegExp('^' + g.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*') + '$');
let _ls;
function universo(passi) {
  if (!_ls) { try { _ls = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean); } catch (e) { _ls = []; } }
  const s = new Set(_ls); for (const p of passi) for (const g of p.file || []) if (!g.includes('*')) s.add(g);
  return [...s];
}
function espandi(globs, U) { const out = new Set(); for (const g of globs) { if (!g.includes('*')) { out.add(g); continue; } const r = re(g); for (const f of U) if (r.test(f)) out.add(f); } return out; }

function controlla(passi) {
  const err = [], avv = [], per = {}, U = universo(passi);
  passi.forEach((p, i) => {
    const q = `passo ${p.f}`;
    if (p.err) { err.push(`${q}: ${p.err}`); return; }
    if (p.n !== i + 1) err.push(`${q}: numero ${p.n}, atteso ${i + 1} (i passi vanno in sequenza, senza buchi)`);
    if (!p.f.startsWith(pad(p.n) + '-')) err.push(`${q}: il nome del file non comincia con ${pad(p.n)}-`);
    if (i && p.fase < passi[i - 1].fase) err.push(`${q}: fase ${p.fase} prima della fase ${passi[i - 1].fase} del passo precedente`);
    for (const [k, vals] of Object.entries(ENUM)) if (!vals.includes(p[k])) err.push(`${q}: ${k} «${p[k]}» non è tra ${vals.join(', ')}`);
    for (const d of p.dopo || []) {
      const dp = passi[d - 1];
      if (!dp || d >= p.n) err.push(`${q}: dipende da ${pad(d)}, che non viene prima`);
      else if (dp.fase >= p.fase) err.push(`${q}: dipende da ${pad(d)} della fase ${dp.fase}, deve stare in una fase precedente`);
    }
    for (const s of ['**In breve.**', '## Scopo', '## Prove']) if (!p.testo.includes(s)) err.push(`${q}: manca «${s}»`);
    if (!p.testo.includes('## Fatto quando') && !p.testo.includes('**Traccia**')) err.push(`${q}: manca «## Fatto quando»`);
    if ((p.file || []).includes('src/manifest.json') && !MANIFEST_OK.has(p.n)) err.push(`${q}: il manifest lo toccano solo i passi ${[...MANIFEST_OK].join(', ')} (i file vuoti li crea il passo 04)`);
    if (p.testo.includes('**Traccia**') && p.n > 3) avv.push(`${q}: è ancora una traccia (la completa il passo 03)`);
    (per[p.fase] = per[p.fase] || []).push(p);
  });
  for (const [f, ps] of Object.entries(per)) {
    if (ps.length > MAXFASE) err.push(`fase ${f}: ${ps.length} passi, al massimo ${MAXFASE}`);
    const di = new Map();
    for (const p of ps) for (const x of espandi([...(p.file || []), ...propri(p)], U)) {
      if (x === 'src/manifest.json') continue;
      if (di.has(x)) err.push(`fase ${f}: ${x} è toccato sia dal passo ${pad(di.get(x))} sia dal ${pad(p.n)}`); else di.set(x, p.n);
    }
  }
  return { err, avv };
}

function uniti() {
  try {
    const out = execSync(`gh api --paginate "repos/${REPO}/pulls?state=closed&per_page=100" --jq '.[] | select(.merged_at) | .head.ref'`, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return new Set(out.split('\n').map(r => (r.match(/^passo\/(\d\d)-/) || [])[1]).filter(Boolean).map(Number));
  } catch (e) {
    try { const l = execSync('git log origin/main --oneline -n 2000', { cwd: ROOT, encoding: 'utf8' }); return new Set([...l.matchAll(/Passo (\d\d)\b/g)].map(m => Number(m[1]))); }
    catch (e2) { return null; }
  }
}

function riga(p) {
  const c = CONTROLLI[p.controllo];
  return { passo: pad(p.n), titolo: p.titolo, fase: p.fase, area: p.area, file: p.f, agente: p.agente, modello: p.modello, impegno: p.impegno, effort: EFFORT[p.impegno],
    controllo: p.controllo, controlloModello: c.modello, controlloImpegno: c.impegno, controlloEffort: EFFORT[c.impegno], dopo: (p.dopo || []).map(pad) };
}

function prompt(passi) {
  const fasi = [...new Set(passi.map(p => p.fase))];
  const L = ['# Prompt per partire', '', 'Generato da `npm run passi -- --scrivi`: non modificarlo a mano.', '',
    'Per ogni fase c\'è **un solo prompt**: lo scrivi in una chat nuova di Claude Code e l\'orchestratore apre da sé una sessione per ogni passo (in parallelo, ognuna col suo modello), fa i controlli e ti restituisce le PR da unire.',
    'Se preferisci fare a mano, ogni passo ha la sua riga: una chat nuova per riga, col modello indicato.', ''];
  for (const f of fasi) {
    const ps = passi.filter(p => p.fase === f);
    L.push(`## Fase ${f}`, '', 'Chat nuova · **Sonnet 5.5 · impegno basso** · scrivi:', '', '```', `/fase ${f}`, '```', '', '<details><summary>A mano, un passo per chat</summary>', '',
      '| Passo | Modello · impegno | Prompt | Controllo (chat nuova, dopo la PR) |', '|---|---|---|---|');
    for (const p of ps) {
      const c = CONTROLLI[p.controllo];
      L.push(`| ${pad(p.n)} ${p.titolo} | ${NOMI[p.modello]} · ${p.impegno} | \`/passo ${pad(p.n)}\` | ${NOMI[c.modello]} · ${c.impegno}: \`/controllo ${pad(p.n)}\` |`);
    }
    L.push('', '</details>', '', `**Unione**: appena una PR della fase ha il controllo «APPROVATO», uniscila (l'ordine non conta: i file non si sovrappongono). Quando sono unite tutte, passa alla fase ${f + 1 <= fasi[fasi.length - 1] ? f + 1 : '— fine del piano'}.`, '');
  }
  return L.join('\n');
}

function main() {
  const a = process.argv.slice(2), passi = leggi(), arg = k => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : null; };
  if (a.includes('--fase')) {
    const f = Number(arg('--fase')), ps = passi.filter(p => p.fase === f).map(riga);
    if (a.includes('--json')) return console.log(JSON.stringify(ps, null, 1));
    for (const r of ps) console.log(`${r.passo}  ${r.titolo}  ·  ${r.agente} ${r.modello}/${r.impegno}  ·  controllo ${r.controllo} (${r.controlloModello}/${r.controlloImpegno})  ·  dopo [${r.dopo.join(', ')}]`);
    return;
  }
  if (a.includes('--pronto')) {
    const n = Number(arg('--pronto')), p = passi[n - 1], ok = uniti();
    if (!p) { console.error('passo sconosciuto'); process.exit(2); }
    if (!ok) { console.log('Non riesco a leggere le PR unite (gh o git log): controlla a mano', (p.dopo || []).map(pad).join(', ')); process.exit(0); }
    const manca = (p.dopo || []).filter(d => !ok.has(d));
    if (manca.length) { console.log(`Passo ${pad(n)} NON pronto: mancano in main ${manca.map(pad).join(', ')}`); process.exit(1); }
    return console.log(`Passo ${pad(n)} pronto: ${(p.dopo || []).map(pad).join(', ') || 'nessuna dipendenza'} già uniti.`);
  }
  if (a.includes('--diff')) {
    const n = Number(arg('--diff')), p = passi[n - 1];
    if (!p) { console.error('passo sconosciuto'); process.exit(2); }
    let tocc = [];
    try { tocc = execSync('git diff --name-only origin/main...HEAD', { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean); }
    catch (e) { console.error('git diff non riuscito: fai prima git fetch origin main'); process.exit(2); }
    const ok = [...(p.file || []), ...propri(p)].map(re), fuori = tocc.filter(f => !ok.some(r => r.test(f)));
    if (fuori.length) { console.log(`Passo ${pad(n)}: file fuori dal permesso:\n  ${fuori.join('\n  ')}\nSe servono davvero, fermati e spiegalo nella PR.`); process.exit(1); }
    return console.log(`Passo ${pad(n)}: ${tocc.length} file toccati, tutti permessi.`);
  }
  if (a.includes('--json')) return console.log(JSON.stringify(passi.map(riga), null, 1));
  const testo = prompt(passi), dest = path.join(DIR, 'PROMPT.md');
  if (a.includes('--scrivi')) { fs.writeFileSync(dest, testo); console.log('scritto docs/passi/PROMPT.md'); }
  const { err, avv } = controlla(passi);
  if (!a.includes('--scrivi') && (!fs.existsSync(dest) || fs.readFileSync(dest, 'utf8') !== testo)) err.push('docs/passi/PROMPT.md non è aggiornato: npm run passi -- --scrivi');
  avv.forEach(x => console.log('avviso:', x));
  if (err.length) { err.forEach(x => console.log('ERRORE:', x)); process.exit(1); }
  const fasi = new Set(passi.map(p => p.fase)).size;
  console.log(`PIANO OK: ${passi.length} passi in ${fasi} fasi, nessun file condiviso dentro una fase.`);
}
main();
