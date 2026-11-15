# V6c — Le voci: testi di compagni, signori e della Volpe

**Scopo.** Scrivere le scene che V6b sa far girare: ogni compagno ha una voce sua, un lamento, un addio e un incarico in tre passi; i signori parlano secondo l'indole; la Volpe ha la sua storia.

**Prima:** V6b in `main`. **Modello: forte** (è scrittura, non codice). **Tre sessioni, tre PR**, una per blocco; `/scheda V6c` e dire quale blocco:
1. la Volpe (`volpe-1..3`) + Berta, Lapo, Ghino · 2. Isabetta, Ulfredo, Diamante, Temu · 3. Suor Nera, Brando, Fosca + i signori (`sig-<tratto>-<livello>`, 15 scene brevi).

**Leggi prima:** `motori/28ja-ven-voci.js` (le scene di prova: il formato è quello), in `motori/28j-ven-dati.js` solo `COMPAGNI`, `RIVALE`, `TRATTI` (`d`, `ama`, `odia`, `lega`, `saluto`); i contratti di `docs/schede/V6b-dialoghi.md` (nomi delle scene, effetti `ven`, fatti leggibili).

## Decisioni già prese
- Voce: italiano asciutto da cronaca di ventura, battute corte, niente frasi fatte né spiegoni; ogni compagno si riconosce senza leggerne il nome (Berta sbrigativa, Lapo mite e ironico, Ulfredo da piazza d'armi, Isabetta fa i conti…).
  Il tono parte da `d` e da ciò che ama e detesta; il legame con l'altro compagno si sente almeno in una battuta.
- Misure: nodo ≤ 280 lettere (il motore ne accetta 700: sul telefono sono troppe); 3–6 nodi per scena; 2–3 scelte per bivio, mai una scelta «giusta» evidente; ogni scelta costa o rende qualcosa (gradimento, oro, un altro compagno che reagisce).
- `<c>-lamento`: dice cosa non gli va (le due cose che detesta, in parole sue); uscite: promessa (`grad +8`, bandiera `<c>-promessa`: se ricade, l'addio è più duro), denaro (`oro -80`, `grad +12`), alzata di spalle (`grad -4`).
- `<c>-addio`: una scena sola, breve, senza scelte che lo trattengano (se n'è già andato); può lasciare una riga di diario.
- Incarico personale: tre passi che usano il mondo che c'è (`luogo`, `vinci`, `sito`, `porta`), legati alla storia in `d`; il terzo ha una scelta vera con due finali, entrambi col premio ma con gradimento e bandiere diversi.
  Premi unici, uno per compagno: metà `{abil:1}`, metà un oggetto nuovo di qualità 4 in `OGG` (nome nostro, numeri in linea con gli `u_*` esistenti).
- La Volpe: `volpe-1` la presenta e apre patto, sfida o disprezzo; `volpe-2` raccoglie (colpo in società se c'è il patto, uno sgarbo se c'è odio, un debito se l'hai aiutata); `volpe-3` chiude in scontro, dono o tregua secondo le bandiere. Sorride sempre: non si spiega mai.
- Signori: tre scene per indole, una per livello di confidenza (notizie, favori, sostegno); brevi, due scelte al massimo, coerenti col `saluto`.
- Niente marchi, niente citazioni di opere, niente testo dentro i motori.

## Passi (per blocco)
1. Scrivi le scene in `28ja-ven-voci.js` (via le `PROVV` del blocco). 2. Completa `inc` e `premio` dei compagni del blocco in `28j` (e gli oggetti nuovi in `OGG`).
3. `npm test -- ven_voci` (validatore e visita di tutte le scelte). 4. Rileggi ad alta voce: se due compagni si potrebbero scambiare una battuta, riscrivila. 5. `docs/rules/ventura.md` solo se cambia una regola.

## Prove
- `ARAC.valida(VVOC)` → `[]`; ogni scena del blocco esiste coi nomi di V6b; nessun nodo oltre 280 lettere (aggiungi il controllo a `tests/test_ven_voci.js` al primo blocco).
- Ogni incarico si compie col bot accorto entro 40 giorni dall'apertura, in 3 semi (test lento `test_ven_voci_bot.js`).
- `index.html` cresce al più di 60 KB a blocchi finiti (`npm run check`, poi `wc -c dist/index.html` prima e dopo).

**Fuori scopo:** chiacchierate libere al bivacco, storie d'amore, ritratti, voci registrate.

## Fatto quando
- [ ] le prove del blocco · [ ] nessun testo `PROVV` rimasto nel blocco · [ ] `npm run verifica` verde.
