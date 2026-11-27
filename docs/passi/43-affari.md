---
passo: 43
titolo: Affari della compagnia: botteghe e carovane
fase: 11
area: mondo
dopo: [36, 41]
agente: programmer
modello: sonnet
impegno: alto
controllo: forte
file:
  - src/js/motori/28kp-ven-affari.js
---

# Passo 43 — Affari della compagnia: botteghe e carovane

**In breve.** Qualcosa di tuo lavora mentre combatti: una bottega che rende, una carovana tua che commercia. La guerra può rovinarle.

**Acceso da.** I mondi nuovi (`s.geo===2`): nei mondi vecchi le azioni rispondono «Qui non si fanno affari».

## Scopo

Qualcosa di tuo lavora mentre combatti: una bottega in città rende ogni settimana, una carovana tua porta merci tra due città. La guerra può rovinare entrambe.

## Leggi prima

`docs/passi/04-ganci.md` (ganci `azione`, `giorno`, `luogo`; `VEN.decidi`, `VEN._` con `nuovaP`, `vai`, `togliUomini`); `docs/passi/36-economia.md` (scorte che cambiano); `VEN.prezzo`, `VEN.rendite`, `pensa` (carovane) e `sconfitta` in `28k*`.

## Decisioni

1. **Tutto in `28kp-ven-affari.js`**, numeri in testa: `VDAT.AFFARI={BOTTEGHE:3,CAROVANE:2,SCORTA:10,CAPITALE:300,MERCENARIO:100,CARICO:20,SOSTA:300,TIPI:{…}}`. Tipi di bottega (legati alle merci di `VDAT.MERCI`), per settimana:
   | id | nome | compra | vende | costo | affitto |
   |---|---|---|---|---|---|
   | `tintoria` | Tintoria | 6 lana | 3 velluto | 1000 | 60 |
   | `armeria` | Armeria | 6 ferro | 6 attrezzi | 800 | 50 |
   | `birrificio` | Birrificio | 10 grano | 6 vino | 350 | 30 |
2. **Stato** (facoltativo): `s.botteghe=[{lid,k,da,ultima}]` (`da` giorno d'acquisto, `ultima` resa dell'ultima settimana); carovane come parti `k:'car'`, `faz:'tu'`, `mia:true`, `casa:-1`, `rotta:[lidA,lidB]`, `porta:{m,q}`, più `s.carovane=[{pid,capo,da}]` per accorgersi di quelle perdute. `s.affari={sett}` (totale dell'ultima settimana). Un compagno capocarovana ha `s.compagni[id]=-3`.
3. **Bottega** (gancio `azione`, dentro una città):
   - `{a:'bottega',k}`: errori in ordine «Qui non si fanno affari» (mondo vecchio o non città), «Non in una città nemica» (`VEN.nemiche(s,VEN.lato(s),l.faz)`), «Hai già 3 botteghe», «Qui ne hai già una», «Servono N monete»;
   - `{a:'vendibottega'}`: rende metà del costo.
   - **Resa** al giorno di paga (gancio `giorno`, `g%P.PAGA_GIORNI===1`): q = min(1, scorta della materia / quantità); compra round(n·q) dalla scorta del luogo a `VEN.prezzo(s,l,m,1)`, vende round(n·q) a `VEN.prezzo(s,l,m,-1)` e lo aggiunge alla scorta; resa = vendita − acquisto − affitto, anche negativa (l'oro non scende sotto 0).
   - **Confisca**: ogni giorno, una bottega in una città nemica di `VEN.lato(s)` è persa, con riga nel diario.
4. **Carovana** (gancio `azione`, dentro la città A, città o porto non nemico):
   - `{a:'carovana',verso:lidB,capo:'co_x'|'mer'}`: errori «Qui non si fanno affari», «Hai già 2 carovane», «Meta non valida» (B uguale ad A, non città o porto, nemica), «Servono 10 uomini di scorta», «Il compagno non è con te», «Servono N monete» (300, +100 col mercenario). Toglie a te i 10 uomini di grado più basso (mai compagni) e il compagno; la parte nasce dentro A con `oro=CAPITALE`.
   - **Movimento** (`VEN.decidi` composto, solo per `p.mia`): in città vende ciò che porta; sceglie la merce non da mangiare con il guadagno più alto (prezzo di vendita nell'altra città − prezzo d'acquisto qui), se positivo, e ne compra fino a `CARICO` con il suo oro; dopo `SOSTA` minuti parte per l'altra città della rotta. Predoni e nemici la vedono come oggi le carovane dei regni.
   - **Utili**: al giorno di paga, l'oro della carovana oltre `CAPITALE` passa a te.
   - **Perdita**: se la parte non c'è più, riga nel diario; il compagno torna a A (`s.compagni[id]=lidA`) col gradimento −8.
   - `{a:'richiama',pid}` dentro una delle due città: la carovana si scioglie, oro e uomini tornano a te.
5. **Resoconto** al giorno di paga: una riga sola nel diario («Affari della settimana: +N monete»), `s.affari.sett=N` ed evento `{t:'affari',oro:N}`; la riga nella barra delle monete la mostra il passo 45 da `VEN.affari`.

## Stato e contratti

`s.botteghe`, `s.carovane`, `s.affari` e i campi delle parti, tutti facoltativi. `VEN.affari(s)` (nuova) → `{botteghe:[{lid,k,nome,ultima}],carovane:[{pid,nome,da,a,oro}],sett}`; `VEN.tipiBottega(s,l)` (nuova) → `[{k,nome,costo,stima,err}]`, dove `stima` è la resa della settimana ai prezzi di oggi.

## Prove

- `tests/test_ven_p43.js` (mondo con `s.geo=2`):
  - (a) gli errori di `bottega` e `carovana` nell'ordine; quarta bottega e terza carovana rifiutate;
  - (b) seme 3, la bottega con la `stima` più alta tra tutte le città: la somma delle rese copre il costo tra il giorno 30 e il 50 (se non torna, si ritoccano solo `costo` e `affitto`);
  - (c) una città che passa a un regno nemico: la bottega sparisce entro un giorno;
  - (d) 20 semi, carovana con un solo uomo tra due città e 3 bande di predoni messe sulla strada: perduta entro 10 giorni in almeno 10 semi; il compagno torna nella città A;
  - (e) `richiama` restituisce oro e uomini; mondo vecchio: «Qui non si fanno affari»; i salvataggi di `tests/fixture/ven/` si aprono.
- Impronta identica.
- `tests/test_ven_p43_lento.js`, semi 3, 11, 29, 120 giorni: un bot che non combatte mai (3 botteghe e 2 carovane appena può, poi riposa in città) chiude con oro ≤ 2× quello di `bot_ven.js` sullo stesso seme.

## Regole per il giocatore

In una città amica puoi comprare una bottega: ogni settimana compra una materia e vende un manufatto, e la differenza, tolto l'affitto, entra nella tua borsa (o ne esce, se la città è a corto di scorte). Ne tieni poche, una per città, e puoi rivenderla per metà prezzo.
Da una città o da un porto puoi anche mandare una carovana tua verso un'altra città: porta con sé una piccola scorta, un capo (un compagno o un mercenario) e un po' di monete, e fa avanti e indietro comprando dove costa poco e vendendo dove rende. Ogni settimana ciò che ha guadagnato oltre il capitale viene a te.
La guerra le rovina: una bottega in una città che passa al nemico è confiscata, una carovana presa dai predoni è perduta e il compagno che la guidava torna a casa scoraggiato. Dalle sue città puoi richiamarla e riavere uomini e monete.
Non fanno ricchi da soli: sono un aiuto mentre combatti, non un'alternativa.

## Fatto quando

Prove verdi, impronta identica.
