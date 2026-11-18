---
passo: 47
titolo: Il «Pronto» per posto in compagnia
fase: 7
area: battaglia
dopo: [11, 19]
agente: programmer
modello: sonnet
impegno: medio
controllo: forte
file:
  - src/js/motori/28m-ven-stanza.js
  - src/js/app/24hwd-ven-scontro.js
---

# Passo 47 — Il «Pronto» per posto in compagnia

> **Domanda per l'utente (da chiudere prima di eseguire il passo).** La sequenza dei passi non ammette un passo in mezzo (né «19b»): rinumerare 29–46 toccherebbe una trentina di file e i commenti in `src/`. Ho scelto il numero 47 con fase 7. Perché `npm run passi` torni verde servono due righe in `tools/passi/controlla.js`: togliere l'errore «fase prima della fase del passo precedente» e cambiare «`d >= p.n`» in «`d === p.n`» (la dipendenza vale già per fase). Il permesso di modificare quello strumento non l'ho avuto: autorizzi la modifica? Senza, il piano resta rosso per 47 (fase) e per il 29 (dipende da 47).

**In breve.** Nel tavolo dello schieramento ogni capitano preme il suo «Pronto»: il bottone dice «Pronto 1/3» e la battaglia parte da sola quando lo hanno premuto tutti.

**Acceso da.** `VDAT.ACCESO.grandi` (e solo se i capitani sono più d'uno). Spento, resta il flag unico di oggi.

## Scopo

Oggi in compagnia basta un «Pronto» e ogni telefono riparte da sé. Ora il lato `a` è pronto quando lo sono tutti i posti, e si vede quanti mancano. Il passo è in fase 7 perché deve stare prima del rilascio 29, che accende `grandi`; il numero 47 è solo l'ordine di creazione.

## Leggi prima

`motori/28m-ven-stanza.js`: `prima`, `pronto`, `act` (rami `b-pronto` e `b-via`), `Object.assign(VCAM,…)`; `motori/28l-ven-campo.js` solo la riga con `s.pronto={a:false,b:false}` e `formazione` (legge `s.pronto[l]`): **non si tocca** (35 KB). `app/24hwd-ven-scontro.js`: `tavoloBasso`, `azione` (`vpronto`) dal passo 19. `app/24hx-ven-stanza.js`: `VenStanza.seat`, `manda`.

## Decisioni

1. Tutto in `28m` (28l ha il tetto di 35 KB e non cambia di un byte). Percorso nuovo solo se `VDAT.ACCESO.grandi` e `s.capi.length>1` e `l==='a'`; altrimenti `pronto` fa ciò che fa oggi.
2. `s.pronto.a` resta il lato pronto, ma diventa vero solo quando **tutti** i posti lo sono: così `formazione`, `tavolo()` e l'IA del passo 21 non cambiano.
3. I posti sono i capitani in campo: `m=Math.max(1,s.capi.length)`, il posto `i` è `u.seat===i`. Chi preme «Pronto» può ancora schierare finché non lo sono tutti.
4. Quando l'ultimo preme, `act` mette `s.b.via=true`: parte su ogni telefono dalla stessa mossa. Nessun telefono manda più `b-via` dopo il Pronto.
5. `b-via` a `t===0`, con `attesa(s)`, dà errore: non si parte con qualcuno non pronto.
6. Un telefono spento non blocca la compagnia: il posto 0 può premere «Parti comunque» (`b-pronto` con `o.forza`) e tutti i posti diventano pronti.
7. Vista: bottone «Pronto» se non l'ho premuto, «Pronto n/m» (spento) se aspetto gli altri; solo il posto 0, dopo il suo Pronto e con `n<m`, vede «Parti comunque» (secondario). Un solo ottone. Quando `b.pronto.a` diventa vero e `k.tvT` è vuoto, `k.tvT=k.t+1.2` (i nemici si muovono 1 s). Da soli, o con interruttore spento, resta il percorso del passo 19.
8. Niente «Annulla il Pronto» e niente TV (`24hwe`) in questo passo.

## Stato e contratti

Nuovo campo facoltativo `s.pronti`: array di `m` booleani, creato al primo Pronto (assente = nessuno). Un vecchio salvataggio con `s.pronto.a===true` e senza `pronti` vale «tutti pronti». Funzioni, in `28m`, aggiunte a `VCAM`:
- `VCAM.pronti(s)` (nuova) → `{n,m,tutti}`; `n=m` se `s.pronto.a`, altrimenti i veri di `s.pronti`.
- `VCAM.pronto(s,l,seat,forza)` (esistente, due argomenti in più): `seat` assente = 0. Evento `{t:'pronto',l,seat,n,m}`.
- `VCAM.attesa(s)` (nuova) → testo o `null`: «Aspettate gli altri: Pronto n/m» se percorso nuovo, `s.pronto` esiste, `t===0` e `!s.pronto.a`.

Errori: «Hai già premuto Pronto» · «Non hai un capitano in campo» (`seat≥m`) · «Solo il capo della compagnia può partire senza gli altri» (`forza` da un posto ≠ 0) · l'errore di `attesa` su `b-via`.

Il salvataggio non cambia versione. Nessun `Math.random` né `Date.now`.

## Prove

`tests/test_ven_p47.js`, scheda come `test_ven_p11.js` con `capi` di 3, `VDAT.ACCESO.grandi=true`:
- posti 1, 0, 2 premono: `pronti` dà `{1,3,false}`, `{2,3,false}`, `{3,3,true}`; `s.pronto.a` è falso, falso, vero; `via` diventa vero solo all'ultimo;
- `b-via` dopo due Pronto dà «Aspettate gli altri: Pronto 2/3»; il posto 1 che ripreme: «Hai già premuto Pronto»; posto 3: «Non hai un capitano in campo»;
- `forza` dal posto 1: errore; dal posto 0: `pronti` `{3,3,true}` e `via` vero;
- due telefoni, stesse mosse: stati identici (`JSON.stringify`); un solo capitano: parte subito, uguale a oggi;
- interruttore spento, 3 capitani, Pronto dal posto 1: `s.pronto.a` vero, `s.pronti` assente, `via` falso (come `test_ven_p11.js`);
- salvataggio vecchio (`pronto.a` vero, niente `pronti`): `pronti` dà `{3,3,true}`; i `fixture/ven/` si aprono;
- `node tools/avventura/impronta.js --controlla` uguale a `main`; `28l` resta di 35724 byte.

Scenario `scenari/p47.py` con `?ven=grandi`: tavolo come nel p19, poi stato con 3 capitani e Pronto dal posto 1: il bottone dice «Pronto 1/3», un solo ottone, bersagli ≥ 44 px a 360×640.

## Regole per il giocatore

Ogni capitano preme il suo «Pronto» quando ha finito di schierare. Il bottone mostra quanti sono pronti, per esempio «Pronto 1/3». La battaglia parte da sola quando lo sono tutti. Se un compagno non risponde, il capo della compagnia può toccare «Parti comunque».

## Fuori scopo

Annullare il Pronto, il tavolo sulla TV, il Pronto dell'IA (passo 21), tempo massimo di attesa.

## Fatto quando

- [ ] Il test e lo scenario passano; l'impronta a interruttori spenti è identica a `main`.
- [ ] Solo `28m` e `24hwd` toccati, oltre ai file propri.
