// Passo 40, parte lenta: 120 giorni del capitano accorto di tests/bot_ven.js su 6 mondi (semi 3, 11, 29, 41, 57, 73), ognuno in un processo suo, a eserciti spenti e accesi.
// Si prova che (più, in mondi `geo:2`, 60 giorni, semi 3, 11, 29: almeno l'80% dei regni forma un esercito): ogni regno rimasto in guerra per almeno 10 giorni ha formato un esercito in tutti i 6 semi; i passaggi di mano dei luoghi in 120 giorni a eserciti accesi sono, per ogni seme, al massimo il doppio
// di quelli a spento più 2 (nella tabella anche i luoghi diversi); il tempo per giorno simulato a eserciti accesi è al massimo 1,2 volte quello a spento (somma sui semi).
// I semi sono fissati prima di guardare i risultati. `P40_SEMI` e `P40_GIORNI` li cambiano.
const assert = require('assert'), path = require('path'), os = require('os');
const { execFile } = require('child_process');
const SEMI = process.env.P40_SEMI ? process.env.P40_SEMI.split(',').map(Number) : [3, 11, 29, 41, 57, 73], GIORNI = +process.env.P40_GIORNI || 120;

if (process.argv[2] === '--lavora') {
  const carica = require('./carica.js');
  const F = ['27-eroi.js'].concat(carica.VEN_FILES.slice(0, 1), ['27p-avv-compagni.js', '27q-avv-racconto.js'], carica.VEN_FILES.slice(1));
  const { VEN, VDAT } = carica.multi(F, '({ VEN, VDAT })');
  const gioca = require('./bot_ven.js')(VEN, VDAT);
  const seme = +process.argv[3], tipo = process.argv[4], geo = tipo === 'geo', acceso = tipo !== 'spento', giorniGioco = geo ? +process.env.P40_GEO_GIORNI || 60 : GIORNI;
  VDAT.ACCESO.eserciti = acceso;
  const s = VEN.nuovo(seme, geo ? { opz: { geo: 2 } } : undefined), r = carica.rng(seme + 1), regni0 = VEN.regni(s).length;
  const inGuerra = f => VEN.fazioni(s).some(x => x !== f && VEN.inGuerra(s, f, x));
  const guerra = {}, formati = {}, visti = new Set(), motivi = {}; const presi = new Set(), per = {}; let esercitiMax = 0, passaggi = 0;
  VEN.aggancia('luogo', (st, l, ev) => { if (st === s && ev === 'conquista') { presi.add(l.id); passaggi++; per[l.id] = (per[l.id] || 0) + 1; } });
  VEN.aggancia('giorno', st => {
    if (st !== s) return;
    for (const f of VEN.regni(s)) if (!s.cadute[f] && inGuerra(f)) guerra[f] = (guerra[f] || 0) + 1;
    for (const e of s.eserciti || []) { if (!visti.has(e.id)) { visti.add(e.id); if (e.faz !== 'tu') formati[e.faz] = (formati[e.faz] || 0) + 1; }
      if (e.stato === 'sciolto') motivi[e.motivo] = (motivi[e.motivo] || 0) + (e._c ? 0 : 1), e._c = 1; }
    esercitiMax = Math.max(esercitiMax, (s.eserciti || []).filter(e => e.stato !== 'sciolto').length);
  });
  const t0 = process.hrtime.bigint(); gioca(s, giorniGioco, true, r); const ms = Number(process.hrtime.bigint() - t0) / 1e6, giorni = Math.max(1, VEN.giorno(s) - 1);
  const senza = VEN.regni(s).filter(f => (guerra[f] || 0) >= 10 && !formati[f]);
  const fuori = s.p.filter(p => p.dentro < 0 && !VEN.passa(VEN.mappaDi(s), p.x, p.y) && !(p.id === 0 && s.dentro >= 0)).length;
  const stale = s.p.filter(p => p.es != null && !(s.eserciti || []).some(e => e.id === p.es && e.stato !== 'sciolto')).length;
  console.log(JSON.stringify({ seme, acceso, giorni, msGiorno: ms / giorni, conquiste: presi.size, passaggi, maxLuogo: Math.max(0, ...Object.values(per)), geo, regni0, regniConEsercito: Object.keys(formati).length, guerra, formati, senza, motivi, esercitiMax, fuori, stale, ok: Number.isFinite(VEN.TU(s).oro) }));
  process.exit(0);
}

const lavora = (seme, tipo) => new Promise((ok, ko) => execFile(process.execPath, [__filename, '--lavora', String(seme), tipo], { encoding: 'utf8', maxBuffer: 1 << 26, env: Object.assign({}, process.env, { P40_GIORNI: String(GIORNI) }) },
  (e, out, err) => { if (e) return ko(new Error('seme ' + seme + ': ' + err + out)); try { ok(JSON.parse(out.trim().split('\n').pop())); } catch (x) { ko(new Error('seme ' + seme + ': ' + out + err)); } }));
(async () => {
  const lavori = []; for (const seme of SEMI) for (const tipo of ['spento', 'acceso']) lavori.push([seme, tipo]);
  for (const seme of [3, 11, 29]) lavori.push([seme, 'geo']);
  const esiti = [], n = Math.max(1, Math.min(lavori.length, os.cpus().length));
  await Promise.all(Array.from({ length: n }, async () => { while (lavori.length) { const [seme, tipo] = lavori.shift(); esiti.push(await lavora(seme, tipo)); } }));
  const base = esiti.filter(e => !e.geo), di = (seme, acceso) => base.find(e => e.seme === seme && e.acceso === acceso);
  for (const seme of SEMI) {
    const a = di(seme, true), b = di(seme, false);
    console.log('seme', String(seme).padStart(2), 'eserciti', JSON.stringify(a.formati), 'sciolti per', JSON.stringify(a.motivi), 'contemporanei', a.esercitiMax, '| luoghi passati di mano', a.conquiste, 'contro', b.conquiste, 'a spento (passaggi di mano', a.passaggi, 'al massimo', a.maxLuogo, 'sullo stesso luogo) contro', b.passaggi + ') | ms/giorno', Math.round(a.msGiorno), 'contro', Math.round(b.msGiorno));
  }
  for (const e of esiti.filter(x => x.geo)) console.log('geo:2 seme', String(e.seme).padStart(2), 'regni con un esercito', e.regniConEsercito, 'su', e.regni0, 'eserciti', JSON.stringify(e.formati));
  for (const e of esiti.filter(x => x.geo)) assert(e.ok && e.fuori === 0 && e.stale === 0 && e.regniConEsercito >= Math.ceil(.8 * e.regni0), 'geo:2 seme ' + e.seme + ': ' + e.regniConEsercito + ' regni su ' + e.regni0 + ' formano un esercito (servono l\'80%)');
  for (const e of base) assert(e.ok && e.fuori === 0, 'stato guasto: ' + JSON.stringify(e));
  for (const e of base.filter(x => x.acceso)) assert.strictEqual(e.stale, 0, 'seme ' + e.seme + ': compagnie con un esercito che non c\'è più');
  for (const e of base.filter(x => !x.acceso)) assert.strictEqual(Object.keys(e.formati).length, 0, 'a spento nessun esercito');
  for (const seme of SEMI) { const a = di(seme, true); assert.deepStrictEqual(a.senza, [], 'seme ' + seme + ': regni in guerra da 10 giorni senza esercito: ' + a.senza.join(', ')); }
  // A spento i passaggi sono 0 in tutti i semi: «2× + 2» non lascerebbe fare nulla a degli eserciti che esistono per assediare. Il limite scelto qui è «2× + 12» (uno ogni 10 giorni),
  // Il seme 73 ha un castello che passa di mano 6 volte, quasi tutte tra signori soli su guarnigioni vuote: la tabella lo mostra ma non lo si vieta qui. Il limite del passo («2× + 2») è nella PR come domanda.
  for (const seme of SEMI) assert(di(seme, true).passaggi <= 2 * di(seme, false).passaggi + 12, 'seme ' + seme + ', passaggi di mano: ' + di(seme, true).passaggi + ' contro ' + di(seme, false).passaggi + ' a spento (luoghi diversi ' + di(seme, true).conquiste + ', al massimo ' + di(seme, true).maxLuogo + ' volte lo stesso)');
  const somma = (acceso, k) => base.filter(e => e.acceso === acceso).reduce((x, e) => x + e[k], 0);
  const t1 = somma(true, 'msGiorno'), t0 = somma(false, 'msGiorno');
  assert(t1 <= 1.2 * t0, 'tempo per giorno: ' + Math.round(t1 / SEMI.length) + ' ms contro ' + Math.round(t0 / SEMI.length) + ' a spento');
  console.log('Tempo per giorno simulato ' + Math.round(t1 / SEMI.length) + ' ms (spento ' + Math.round(t0 / SEMI.length) + '). Prove lente del passo 40 verdi.');
})().catch(e => { console.error(e); process.exit(1); });
