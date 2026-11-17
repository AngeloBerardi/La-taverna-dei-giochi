---
passo: 42
titolo: Gli incontri del crocevia (testi)
fase: 10
area: testi
dopo: [03]
agente: programmer
modello: opus
impegno: medio
controllo: leggero
file:
  - src/js/motori/28ja-ven-voci.js
---

# Passo 42 — Gli incontri del crocevia (testi)

**In breve.** Trenta scene brevi a scelte per la strada: pellegrini, ponti crollati, disertori, mercanti, villaggi in fiamme. Più le due lettere dell'adunata.

## Scopo

Scrivere le scene che il passo 44 farà capitare ai crocevia, e le lettere che il passo 40 manda al vassallo. Solo dati: nessuna logica.

## Leggi prima

La testa di `28ja-ven-voci.js` (formato, scorciatoie `gr`, `ven`, `oro`, `ba`), una scena `sig-*` come esempio, `GRC` in `28j-ven-dati.js` (cosa ama e detesta ogni compagno), `tests/test_ven_voci.js` (righe 28–47: misure ed effetti noti).

## Decisioni

1. **Dove**: le scene stanno in `scene` come le altre (così `ARAC` le gioca), con id `cro-<nome>`. In più `VVOC.CROCEVIA=[{id,peso,blocco,se}]`, una voce per scena, nell'ordine dei blocchi.
2. **Forma**: parla il narratore (`chi:'_'`); 1–2 nodi; nodo ≤ 280 lettere, scelta ≤ 80; 2–3 scelte, e almeno una senza `se` (sempre possibile). Le scelte finiscono la scena (`fine:true`) o portano al secondo nodo. Seconda persona plurale («vedete», «la compagnia»), tono asciutto come le scene V6c.
3. **Condizioni** `se` (tutte facoltative, valgono insieme): `bioma:['strada'|'piano'|'bosco'|'colle'|'monte']` (da `M.T` 1–4; `strada` = casella con `M.S`), `regno:'tuo'|'amico'|'nemico'` (rispetto al regno della casella, dalla parte di chi servi), `guerra:true|false` (il regno della casella è in guerra), `notte:true|false`, `fama:[min,max]`, `con:['co_x',…]` (almeno uno in compagnia). `peso` da 1 a 3.
4. **Effetti** (solo questi): `oro(n)` con n tra −80 e +120; i noti `grad`, `conf`; i nuovi, già in `VEN.EFF_VOCI` dal passo 04 e applicati dal passo 44:
   - `{t:'ven',k:'uomini',n}`: n da 1 a 4 reclute, oppure −1/−2 uomini persi;
   - `{t:'ven',k:'merce',m,n}`: `m` chiave di `VDAT.MERCI` non da mangiare, n da −6 a +6;
   - `{t:'ven',k:'viveri',n}`: grano, n da −8 a +8;
   - `{t:'ven',k:'gusto',ev}`: `ev` tra `libera`, `cura`, `razzia`, `perdite`, `tributo`, `fuga`, `riscatta`, `sito`, `fame`, `vittoria` (gli eventi di `VEN.reagisci`).
   **Ogni scelta ha almeno un `gusto`**: così i compagni che amano o detestano quel gesto commentano. Una scelta con un costo ha `se:{oro:n}` (monete) quando paga.
5. **Le trenta scene**, due blocchi da 15:
   - **A, strada** (`bioma` comprende `strada`): `cro-pellegrino` (ferito sul ciglio), `cro-ponte` (crollato, guado o giro), `cro-disertore` (chiede di unirsi), `cro-mercante` (affare sospetto), `cro-fiamme` (villaggio che brucia), `cro-carro` (rovesciato, carico intatto), `cro-gabella` (pedaggio abusivo), `cro-messo` (messaggero ferito), `cro-processione`, `cro-forca` (impiccato al crocevia), `cro-giocolieri`, `cro-vedova` (chiede scorta), `cro-mendicanti`, `cro-cavallo` (senza cavaliere), `cro-fiera` (mercato improvvisato).
   - **B, selvaggio** (`bosco`, `colle` o `monte`; metà anche di notte): `cro-lupi`, `cro-eremita`, `cro-bracconiere`, `cro-carbonai`, `cro-cassa` (sepolta), `cro-bivacco` (abbandonato), `cro-frana`, `cro-nebbia`, `cro-sorgente`, `cro-orso`, `cro-legato` (prigioniero a un albero), `cro-imboscata` (si tratta o si fugge, mai battaglia), `cro-cacciatori` (del signore), `cro-santuario`, `cro-fuggiaschi`.
   Almeno 6 scene con `guerra:true`, 4 con `notte:true`, 5 con `con`, 3 con `regno:'nemico'`.
6. **Lettere dell'adunata** (passo 40), parla `signore` (il maresciallo, `{signore}`): `adunata-convoca`, 1 nodo, scelte «Verrò» (`{t:'ven',k:'adunata',v:1}`) e «Non posso» (`v:0`); `adunata-feudo`, 1 nodo con `fine:true`: il re ti toglie il feudo.
7. Niente nomi di marchi né di luoghi veri, niente emoji. La testa del file elenca i nuovi effetti e `CROCEVIA`.

## Prove

`tests/test_ven_p42.js`:
- 30 voci in `VVOC.CROCEVIA`, 15 per blocco, id tutti in `scene`, nessun doppione;
- ogni scena: 1–2 nodi, 2–3 scelte, almeno una senza `se`, ogni scelta con un `gusto` tra quelli ammessi; nodi ≤ 280 e scelte ≤ 80 lettere;
- ogni effetto `ven` in `VEN.EFF_VOCI`, numeri negli intervalli della decisione 4, `merce` con una chiave vera di `VDAT.MERCI`;
- chiavi di `se` solo quelle della decisione 3, valori ammessi; i conteggi minimi della decisione 5;
- niente emoji (nessun carattere sopra U+2FFF) e nessun nome dell'elenco `marchi` di `tests/test_avv_corona.js` (riga 23, copiato nel test), più «Bannerlord» e «Mount»;
- `ARAC.valida(VVOC)` senza errori; `adunata-convoca` e `adunata-feudo` esistono.
- `npm test -- ven_voci` resta verde.

## Fatto quando

Prove verdi; impronta identica (sono solo dati che nessuno chiama ancora).
