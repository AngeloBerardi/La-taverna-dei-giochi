/* ================= Kit cifrati (KITC) =================
   Un kit di cena con delitto contiene colpevole, prove e soluzione, ma il repo e il sito sono pubblici. Un kit che deve
   restare segreto sta nel repo SOLO cifrato (src/kit-cifrati/<id>.json): in chiaro ci sono titolo e numero di giocatori,
   il resto (il kit intero, compresso) è cifrato con una frase che sa solo chi organizza. La TV regista chiede la frase una
   volta, apre il kit nel browser e la ricorda su quel computer; ai telefoni arriva soltanto la loro mano, come sempre.
   Cifratura: AES-256-GCM con chiave da PBKDF2-SHA-256 (600 000 giri) e sale casuale; l'id del kit è un dato autenticato,
   quindi un file rinominato o rimescolato non si apre. Solo WebCrypto: nessuna dipendenza, nessun DOM, nessuna rete.
   Uso: `await KITC.cifra(kit, frase)` → busta; `await KITC.apri(busta, frase)` → kit; `KITC.valida(busta)` → [errori].
   Strumento da terminale: `node tools/kit/cifrati.js cifra|apri|frase` (guida in docs/SERATA.md). */
const KITC = (() => {
  const VERSIONE = 1,
    GIRI = 600000,
    ALFABETO = 'abcdefghjkmnpqrstuvwxyz23456789'; // senza lettere che si confondono (i, l, o, 0, 1)

  const aTesto = u => {
    let s = '';
    for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
    return btoa(s);
  };
  const daTesto = t => Uint8Array.from(atob(t), c => c.charCodeAt(0));
  const base64 = t => typeof t === 'string' && t.length > 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(t);
  // una frase si scrive come viene: maiuscole, spazi e trattini non contano
  const normalizza = f =>
    String(f == null ? '' : f)
      .normalize('NFKC')
      .toLowerCase()
      .replace(/[\s-]+/g, '');
  const dati = (id, v) => new TextEncoder().encode('kit-cifrato|' + v + '|' + id);

  async function passa(u8, flusso) {
    return new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(flusso)).arrayBuffer());
  }
  async function chiave(frase, sale, giri) {
    const f = normalizza(frase);
    if (!f) throw new Error('Manca la frase');
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(f), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', hash: 'SHA-256', salt: sale, iterations: giri },
      base,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  // una frase nuova, da scrivere una volta sulla TV: 5 gruppi da 4 lettere e cifre (circa 100 bit)
  function frase() {
    const r = crypto.getRandomValues(new Uint8Array(20));
    const c = Array.from(r, x => ALFABETO[x % ALFABETO.length]);
    return [0, 4, 8, 12, 16].map(i => c.slice(i, i + 4).join('')).join('-');
  }

  // errori della busta (non della frase: quella si controlla solo aprendola)
  function valida(b) {
    const e = [];
    if (!b || typeof b !== 'object') return ['la busta non è un oggetto'];
    if (b.formato !== 'cifrato') e.push('formato diverso da «cifrato»');
    if (b.v !== VERSIONE) e.push('versione non supportata: ' + b.v);
    if (typeof b.id !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(b.id)) e.push('id non valido');
    if (typeof b.titolo !== 'string' || !b.titolo) e.push('manca il titolo');
    if (
      !Array.isArray(b.giocatori) ||
      b.giocatori.length !== 2 ||
      !b.giocatori.every(Number.isInteger) ||
      b.giocatori[0] > b.giocatori[1]
    )
      e.push('giocatori deve essere [minimo, massimo]');
    if (!Number.isInteger(b.giri) || b.giri < 100000 || b.giri > 5000000) e.push('giri fuori misura');
    for (const c of ['sale', 'iv', 'dati']) if (!base64(b[c])) e.push(c + ' non è base64');
    return e;
  }

  // il kit (oggetto) → busta. In chiaro solo ciò che serve all'elenco della TV.
  async function cifra(kit, f, opz) {
    const o = opz || {},
      giri = o.giri || GIRI,
      sale = crypto.getRandomValues(new Uint8Array(16)),
      iv = crypto.getRandomValues(new Uint8Array(12));
    if (!kit || typeof kit.id !== 'string') throw new Error('Il kit non ha un id');
    const zip = await passa(new TextEncoder().encode(JSON.stringify(kit)), new CompressionStream('gzip'));
    const k = await chiave(f, sale, giri);
    const c = new Uint8Array(
      await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: dati(kit.id, VERSIONE) }, k, zip)
    );
    const b = {
      formato: 'cifrato',
      v: VERSIONE,
      id: kit.id,
      titolo: kit.titolo,
      sottotitolo: kit.sottotitolo || '',
      giocatori: kit.giocatori,
      minuti: kit.minuti || 0,
      tono: kit.tono || '',
      giri,
      sale: aTesto(sale),
      iv: aTesto(iv),
      dati: aTesto(c),
    };
    const e = valida(b);
    if (e.length) throw new Error('Busta non valida: ' + e.join('; '));
    return b;
  }

  // busta → kit. Frase sbagliata o busta alterata: sempre lo stesso errore, `sbagliata` = true.
  async function apri(b, f) {
    const e = valida(b);
    if (e.length) throw new Error('Busta non valida: ' + e[0]);
    let kit;
    try {
      const k = await chiave(f, daTesto(b.sale), b.giri);
      const zip = new Uint8Array(
        await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: daTesto(b.iv), additionalData: dati(b.id, b.v) },
          k,
          daTesto(b.dati)
        )
      );
      kit = JSON.parse(new TextDecoder().decode(await passa(zip, new DecompressionStream('gzip'))));
    } catch (x) {
      throw Object.assign(new Error('Frase sbagliata'), { sbagliata: true });
    }
    if (!kit || kit.id !== b.id) throw Object.assign(new Error('Frase sbagliata'), { sbagliata: true });
    return kit;
  }

  return { VERSIONE, GIRI, valida, cifra, apri, frase, normalizza };
})();
if (typeof module !== 'undefined') module.exports = KITC;
