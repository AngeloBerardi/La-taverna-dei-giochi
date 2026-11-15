# V1 — Salvare e riprendere la partita in compagnia

**Scopo.** Oggi la partita in compagnia vive finché la stanza resta aperta. Deve potersi riprendere un altro giorno, e una partita in solitario
deve potersi «portare in compagnia» (e tornare in solitario).

**Area:** `docs/moduli/ventura.md`. **Leggi prima:** `motori/28m-ven-stanza.js` (`nuova`, `act`, `copia`), `VEN.apri`/`migra`/`nuovo` (campi `cap`, `soci`) in `28k`,
`app/24hx-ven-stanza.js` (`nuova`, `sync`, `giro`), `salva` e `ST_K` in `app/24hw-ventura.js`; come esempio di ripresa `AST.apri` e `p.rip` in `app/24hm-avv-stanza.js`.

## Decisioni già prese
- Si salva **solo il mondo** (`G.w`), mai una battaglia in corso: se `G.b` c'è, il salvataggio resta quello di prima.
- Il salvataggio sta **sul telefono di ogni giocatore seduto** (chiave `ven-salv-coop`), così chiunque può riaprire la stanza. Niente account in questa scheda.
- Si scrive a ogni alba (evento `giorno`), all'uscita da un luogo e a fine battaglia: gli stessi momenti del solitario.
- Forma: `{v:1, w:<mondo senza ev>, nomi:[…], n, giorno}`. Il solitario (`ven-salv`) è già un mondo: vale come `rip` con `n:1`.
- Ripresa con un numero diverso di giocatori: i capitani sono `[w.cap, …w.soci]`. Posti in più → capitani nuovi in coda a `soci` (massimo 4 in tutto).
  Posti in meno → i capitani senza giocatore restano in `soci` ma **non scendono in campo** (non contano in `VEN.capi` per la battaglia).
- I nomi dei capitani salvati restano; il posto si assegna per ordine di seduta, non per nome.
- Da compagnia a solitario: «Continua da solo» copia `ven-salv-coop.w` in `ven-salv` (chiede conferma se `ven-salv` esiste).

## Stato e contratti
- `VST.apri(rip, n, names)` **nuova** → `{s}` oppure `{err}`: usa `VEN.apri(rip.w||rip)`, sistema `soci` come sopra, rende `G` come `VST.nuova`. Errori: «Salvataggio non leggibile».
- `VST.nuova(n, names, o)`: se `o.rip` chiama `apri`. `VST.salvabile(G)` **nuova** → oggetto da scrivere, o `null` se c'è battaglia.
- In `w` un campo `attivi` (numero di capitani con giocatore), letto da `VEN.capi`; assente = tutti (i salvataggi vecchi non cambiano).
- `VenStanza`: `X.rip` (scelta fatta prima di creare la partita), `salva()` chiamata da `sync` quando cambia `giorno`/`dentro`/fine battaglia.

## Passi
1. `28m`: `apri`, `salvabile`, `o.rip` in `nuova`; `28k`: `attivi` in `capi`. Test in `tests/test_ven_stanza.js`.
2. `24hx`: `salva()`, lettura di `ven-salv-coop` e `ven-salv`; prima dell'avvio, se esiste un salvataggio, carta con «Riprendi la compagnia (giorno N)», «Porta la partita in solitario», «Nuova».
3. `24hw`: nella pagina iniziale del solitario, «Continua da solo la partita in compagnia» se `ven-salv-coop` esiste.
4. Scenario `ventura_stanza_ripresa` in `tools/test-browser/run.py` (copia l'impianto di `sc_ventura_stanza`).
5. `RULES.ventura` e `docs/rules/ventura.md`: due righe; riga dell'area; `docs/VENTURA.md` (toglie «la stanza vive finché è aperta»).

## Prove
- Motore: `apri(salvabile(G))` rende un `G` il cui `w` è uguale (JSON) a quello salvato, a parte `ev`; 2→3 giocatori aggiunge un socio; 3→1 lascia `attivi:1`
  e `VEN.campo` mette in campo un solo capitano; un salvataggio v1 del solitario si apre; con battaglia in corso `salvabile` rende `null`.
- Browser: due telefoni giocano fino al giorno 2, escono; riaprono la stanza, «Riprendi»: stesso giorno, stesse monete, stessi uomini su entrambi.

**Fuori scopo:** salvataggio sull'account, più salvataggi, ripresa a metà battaglia.

**Fatto quando:** i test sopra passano; `npm run verifica` verde; scenari `ventura` tutti verdi; nessun cambiamento per chi gioca solo.
