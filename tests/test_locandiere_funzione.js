// Funzione Netlify del locandiere: nessuna rete vera, fetch simulato.
const assert = require('assert');
const F = require('../netlify/functions/locandiere.js');
const post = (corpo, ip) => ({ httpMethod: 'POST', headers: { 'x-nf-client-connection-ip': ip || '1.1.1.1' }, body: typeof corpo === 'string' ? corpo : JSON.stringify(corpo) });
(async () => {
  let chiamate = [];
  globalThis.fetch = async (url, opt) => { chiamate.push({ url, opt, body: JSON.parse(opt.body) }); return { ok: true, status: 200, json: async () => ({ content: [{ type: 'text', text: 'Prova  con <b>tag</b>\nlo Uno, ospite!' }] }) }; };
  delete process.env.ANTHROPIC_API_KEY;
  assert.deepStrictEqual(JSON.parse((await F.handler({ httpMethod: 'GET' })).body), { attivo: false });
  assert.strictEqual((await F.handler(post({ domanda: 'ciao' }))).statusCode, 503, 'senza chiave: non configurato');
  assert.strictEqual(chiamate.length, 0, 'senza chiave non si chiama nessuno');
  process.env.ANTHROPIC_API_KEY = 'chiave-finta';
  assert.deepStrictEqual(JSON.parse((await F.handler({ httpMethod: 'GET' })).body), { attivo: true });
  assert.strictEqual((await F.handler({ httpMethod: 'PUT' })).statusCode, 405);
  assert.strictEqual((await F.handler(post('non json'))).statusCode, 400);
  assert.strictEqual((await F.handler(post({ domanda: '   ' }))).statusCode, 400);
  // richiesta valida: modello, chiave e limiti giusti, testo ripulito
  F._reset();
  const ok = await F.handler(post({ domanda: 'Che gioco ci consigli?\u0000', contesto: { n: 3, nome: 'Anna<script>', giochi: ['Uno', 'Perudo'] } }));
  assert.strictEqual(ok.statusCode, 200);
  assert.strictEqual(JSON.parse(ok.body).testo, 'Prova con b tag /b lo Uno, ospite!', 'tag e a capo ripuliti');
  const c = chiamate[0];
  assert.strictEqual(c.url, 'https://api.anthropic.com/v1/messages');
  assert.strictEqual(c.opt.headers['x-api-key'], 'chiave-finta');
  assert.strictEqual(c.body.model, 'claude-haiku-5-5'); assert(c.body.max_tokens <= 300);
  assert(c.body.system.includes('Uno, Perudo') && c.body.system.includes('3 giocatori') && !c.body.system.includes('<script>'));
  assert.strictEqual(c.body.messages[0].content, 'Che gioco ci consigli?');
  process.env.LOCANDIERE_MODEL = 'altro-modello'; await F.handler(post({ domanda: 'x' }, '2.2.2.2')); assert.strictEqual(chiamate[1].body.model, 'altro-modello'); delete process.env.LOCANDIERE_MODEL;
  // domanda lunga tagliata a 200
  await F.handler(post({ domanda: 'a'.repeat(900) }, '3.3.3.3')); assert.strictEqual(chiamate[2].body.messages[0].content.length, 200);
  // limite di 6 richieste al minuto per indirizzo, gli altri indirizzi non sono toccati
  F._reset(); let codici = []; for (let i = 0; i < 8; i++) codici.push((await F.handler(post({ domanda: 'ciao' }, '9.9.9.9'))).statusCode);
  assert.deepStrictEqual(codici, [200, 200, 200, 200, 200, 200, 429, 429]);
  assert.strictEqual((await F.handler(post({ domanda: 'ciao' }, '8.8.8.8'))).statusCode, 200);
  // errori del servizio e della rete: 502, mai eccezioni
  F._reset();
  globalThis.fetch = async () => ({ ok: false, status: 529, json: async () => ({}) }); assert.strictEqual((await F.handler(post({ domanda: 'ciao' }))).statusCode, 502);
  globalThis.fetch = async () => { throw new Error('rete'); }; assert.strictEqual((await F.handler(post({ domanda: 'ciao' }, '4.4.4.4'))).statusCode, 502);
  globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ content: [] }) }); assert.strictEqual((await F.handler(post({ domanda: 'ciao' }, '5.5.5.5'))).statusCode, 502, 'risposta vuota');
  console.log('locandiere funzione ok');
})().catch(e => { console.error(e); process.exit(1); });
