// Locandiere: saluto, consigli adatti al numero di giocatori, regole, argomenti, ripetibilità.
const assert = require('assert');
const LOC = require('../src/js/motori/24-locandiere.js');
const G = (id, name, range, ok, coop, desc) => ({ id, name, range, ok, coop, desc: desc || 'Descrizione di ' + name + '.' });
const giochi = [G('regicide', 'Regicide', '1–4', true, true), G('uno', 'Uno', '2–6', true, false), G('perudo', 'Perudo', '2–6', true, false),
  G('gang', 'The Gang', '3–6', false, true), G('catan', 'Catan Grande', '3–4', false, false), G('catan2', 'Catan', '3–4', false, false)];
const c = { nome: 'Anna', n: 2, ora: 20, giorno: 100, monete: 55, partite: 4, vittorie: 1, mail: false, giochi };

assert(/^Buonasera, Anna!/.test(LOC.saluto(c)));
assert(/^Buongiorno/.test(LOC.saluto({ ...c, ora: 9 })) && /^Buon pomeriggio/.test(LOC.saluto({ ...c, ora: 15 })) && /^Ancora in piedi/.test(LOC.saluto({ ...c, ora: 2 })));
assert(/Prima volta/.test(LOC.saluto({ ...c, partite: 0 })) && /4 partite e ne hai vinte 1/.test(LOC.saluto(c)));
assert(/Siete in 2/.test(LOC.saluto(c)));

// consigli: solo giochi validi per n, mai uno che non ok
for (let g = 0; g < 40; g++) {
  const r = LOC.risposta('che gioco ci consigli', { ...c, giorno: g });
  assert(/Regicide|Uno|Perudo/.test(r) && !/The Gang|Catan/.test(r), 'consiglio non valido: ' + r);
}
assert(/in squadra/.test(LOC.risposta('qualcosa in squadra', c)) && !/Uno|Perudo/.test(LOC.risposta('qualcosa in squadra', c).split('.')[0]));
assert(/in sfida/.test(LOC.risposta('un gioco per sfidarci a vincere', c)) && !/Regicide/.test(LOC.risposta('un gioco per sfidarci a vincere', c).split('.')[0]));
assert(/non ho giochi cooperativi/.test(LOC.risposta('uno in squadra', { ...c, giochi: giochi.filter(g => !g.coop) })));
// ripetibile: stessa domanda e stesso giorno = stessa risposta; il giorno cambia la proposta
assert.strictEqual(LOC.risposta('che gioco consigli', c), LOC.risposta('che gioco consigli', c));
const set = new Set(); for (let g = 0; g < 30; g++) set.add(LOC.risposta('che gioco consigli', { ...c, giorno: g })); assert(set.size >= 2, 'sempre la stessa proposta');

// regole: riconosce il gioco più lungo («Catan Grande» e non «Catan»)
assert(/^Catan Grande/.test(LOC.risposta('come si gioca a catan grande?', c)));
assert(/^Catan \(/.test(LOC.risposta('spiegami le regole di catan', c)));
assert(/non vale per 2/.test(LOC.risposta('regole di the gang', c)));
assert(/Va bene anche per il vostro numero/.test(LOC.risposta('regole di uno', c)));
assert(/tutti insieme contro il gioco/.test(LOC.risposta('regole di regicide', c)));
assert(/^Uno: /.test(LOC.risposta('uno', c)), 'solo il nome: descrizione');
// argomenti
assert(/10 monete.*ora ne hai 55/.test(LOC.risposta('come guadagno monete?', c)));
assert(/Bottega/.test(LOC.risposta('cosa posso comprare nella bottega', c)));
assert(/ELO/.test(LOC.risposta('come funziona la classifica', c)));
assert(/solo su questo telefono/.test(LOC.risposta('devo cambiare telefono, cosa faccio con il profilo', c)));
assert(/già legato/.test(LOC.risposta('email', { ...c, mail: true })));
assert(/ospiti/.test(LOC.risposta('abbiamo un solo telefono', c)));
assert(/Figurati|Per così poco|boccale/.test(LOC.risposta('grazie!', c)));
assert(/Buonasera/.test(LOC.risposta('ciao', c)));
assert(/consigliarti un gioco/.test(LOC.risposta('aiuto', c)));
assert(/Non ho capito|Questa non la so|fumo/.test(LOC.risposta('quanto è alta la torre eiffel', c)));
assert(/^Buonasera/.test(LOC.risposta('', c)), 'domanda vuota = saluto');
// accenti e punteggiatura
assert.strictEqual(LOC.norm('  Cos’è, il «Perudo»?! '), 'cos e il perudo');
// nessun HTML nelle risposte (la vista usa esc, ma meglio non produrne)
for (const q of ['consigli', 'regole di uno', 'monete', 'classifica', 'account', 'ospiti', 'aiuto', 'boh']) assert(!/[<>]/.test(LOC.risposta(q, c)), q);
assert(LOC.rapide(c).length === 4 && LOC.rapide({ ...c, n: 1 })[1] === 'Un gioco da solo');
console.log('locandiere ok');
