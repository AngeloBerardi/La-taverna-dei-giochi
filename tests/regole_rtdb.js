// Interprete delle regole del Realtime Database (il sottoinsieme che usa database.rules.json), per i test.
// NON sostituisce l'emulatore di Firebase (qui non è scaricabile): applica la semantica documentata, in modo conservativo.
//  - .read / .write: valgono se è vera la regola di UN QUALSIASI nodo lungo il percorso (si ereditano verso il basso);
//  - .validate: deve essere vera in ogni nodo con dati non nulli lungo il percorso scritto e in tutti i nodi sotto di esso;
//  - nelle espressioni: auth, data (prima), newData (dopo), root (prima), now, $variabili del percorso, e i metodi degli snapshot.
// Un percorso senza una regola che lo permetta è negato.
const fs = require('fs'), path = require('path');
if (!String.prototype.matches) Object.defineProperty(String.prototype, 'matches', { value(re) { return re.test(String(this)); }, enumerable: false });

const clone = v => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
const spezza = p => String(p).split('/').filter(Boolean);
const leggi = (t, segs) => { let v = t; for (const s of segs) { if (v === null || typeof v !== 'object' || !(s in v)) return null; v = v[s]; } return v === undefined ? null : v; };
function pota(o) { for (const k of Object.keys(o)) { const v = o[k]; if (v && typeof v === 'object') { pota(v); if (!Object.keys(v).length) delete o[k]; } } }
function scrivi(t, segs, val) {
  if (!segs.length) return clone(val);
  const c = clone(t) || {}; let v = c;
  for (let i = 0; i < segs.length - 1; i++) { if (v[segs[i]] === null || typeof v[segs[i]] !== 'object') v[segs[i]] = {}; v = v[segs[i]]; }
  const ultimo = segs[segs.length - 1];
  if (val === null || val === undefined) delete v[ultimo]; else v[ultimo] = clone(val);
  pota(c); return c;
}
function snap(t, segs) {
  const val = () => leggi(t, segs), figlio = p => snap(t, segs.concat(spezza(p)));
  return {
    val, exists: () => val() !== null, child: figlio, parent: () => snap(t, segs.slice(0, -1)), hasChild: p => figlio(p).exists(),
    hasChildren: a => { const v = val(); if (v === null || typeof v !== 'object') return false; const ks = Object.keys(v); return a && a.length ? a.every(k => ks.includes(k)) : ks.length > 0; },
    isString: () => typeof val() === 'string', isNumber: () => typeof val() === 'number', isBoolean: () => typeof val() === 'boolean',
  };
}
function valuta(espr, c) {
  try { return !!new Function('auth', 'data', 'newData', 'root', 'now', '$v', 'with($v){return (' + espr + ');}')(c.auth, c.data, c.newData, c.root, Date.now(), c.vars); }
  catch (e) { return false; }
}
// sotto-regola per la chiave: nome esatto, altrimenti la variabile $qualcosa
function figlioRegola(nodo, chiave) {
  if (nodo[chiave] && typeof nodo[chiave] === 'object' && chiave[0] !== '.') return { nodo: nodo[chiave], vars: {} };
  const v = Object.keys(nodo).find(k => k[0] === '$' && typeof nodo[k] === 'object');
  return v ? { nodo: nodo[v], vars: { [v]: chiave } } : null;
}
function catena(regole, segs) {
  let nodo = regole.rules, vars = {}; const ris = [{ nodo, segs: [], vars: {} }];
  for (let i = 0; i < segs.length; i++) {
    const f = figlioRegola(nodo, segs[i]); if (!f) break;
    nodo = f.nodo; vars = { ...vars, ...f.vars }; ris.push({ nodo, segs: segs.slice(0, i + 1), vars: { ...vars } });
  }
  return ris;
}
const contesto = (prima, dopo, segs, vars, auth) => ({ auth: auth ? { uid: auth } : null, data: snap(prima, segs), newData: snap(dopo, segs), root: snap(prima, []), vars });

// può `auth` (uid o null) scrivere `valore` (null = cancellare) nel percorso, dato l'albero attuale?
function puoScrivere(regole, albero, percorso, valore, auth) {
  const segs = spezza(percorso), dopo = scrivi(albero, segs, valore), ch = catena(regole, segs);
  let ok = false;
  for (const c of ch) if (typeof c.nodo['.write'] === 'string' && valuta(c.nodo['.write'], contesto(albero, dopo, c.segs, c.vars, auth))) { ok = true; break; }
  if (!ok) return { ok: false, motivo: 'write negato' };
  for (const c of ch) if (typeof c.nodo['.validate'] === 'string' && leggi(dopo, c.segs) !== null && !valuta(c.nodo['.validate'], contesto(albero, dopo, c.segs, c.vars, auth)))
    return { ok: false, motivo: 'validate negato in /' + c.segs.join('/') };
  const ultimo = ch[ch.length - 1];
  if (ultimo.segs.length === segs.length) {
    const scendi = (nodo, sg, vars) => {
      const v = leggi(dopo, sg); if (v === null || typeof v !== 'object') return null;
      for (const k of Object.keys(v)) {
        const f = figlioRegola(nodo, k); if (!f) continue;
        const sg2 = sg.concat(k), vr = { ...vars, ...f.vars };
        if (typeof f.nodo['.validate'] === 'string' && !valuta(f.nodo['.validate'], contesto(albero, dopo, sg2, vr, auth))) return 'validate negato in /' + sg2.join('/');
        const r = scendi(f.nodo, sg2, vr); if (r) return r;
      }
      return null;
    };
    const err = scendi(ultimo.nodo, ultimo.segs, ultimo.vars); if (err) return { ok: false, motivo: err };
  }
  return { ok: true };
}
function puoLeggere(regole, albero, percorso, auth) {
  const segs = spezza(percorso);
  for (const c of catena(regole, segs)) if (typeof c.nodo['.read'] === 'string' && valuta(c.nodo['.read'], contesto(albero, albero, c.segs, c.vars, auth))) return { ok: true };
  return { ok: false, motivo: 'read negato' };
}
const carica = () => JSON.parse(fs.readFileSync(path.join(__dirname, '../database.rules.json'), 'utf8'));
// albero da un archivio piatto { 'a/b/c': valore }
function albero(piatto) { let t = {}; for (const [k, v] of piatto) t = scrivi(t, spezza(k), v); return t; }
module.exports = { carica, puoScrivere, puoLeggere, albero, scrivi, leggi };
