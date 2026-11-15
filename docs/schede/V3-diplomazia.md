# V3 — Alleanze, tregue e guerre decise dal giocatore

> **Fatta** (PR 120, rivista dopo). Sotto, al posto delle domande per l'architetto, i contratti come sono nel codice.

**Scopo.** Oggi guerre e paci tra i regni cambiano da sole. Il giocatore deve poterle muovere: da mercenario poco, da vassallo di più, da sovrano del tutto.

**Area:** `docs/moduli/ventura.md`.

## Decisioni già prese
- Tre stati tra due regni: guerra, pace, **alleanza** (nuovo). Gli alleati non si attaccano, si soccorrono negli assedi e combattono insieme se si incontrano.
- Le alleanze durano almeno 20 giorni e si rompono solo con un preavviso di 3 giorni (evento in cronaca).
- Il giocatore agisce parlando con un re nella sala della sua capitale: «Proponi pace con…», «Proponi alleanza con…», «Chiedi guerra a…».
- L'esito è un conto, non un dado nascosto: amicizia col regno, fama, tratto del re, forza relativa dei due regni, guerre già in corso. Il pannello mostra i fattori a favore e contro.
- Peso della parola: capitano libero solo doni e tributi; mercenario a contratto può chiedere pace; vassallo può proporre tutto; sovrano (V4) decide per il proprio regno.
- I regni fanno alleanze anche da soli, di rado, contro chi sta vincendo troppo (freno alla valanga).

## Contratti (come eseguiti)
- `s.alleanza[chiave(a,b)] = {da, rompe}` (`rompe` 0 = nessun preavviso); assente nei v2 vecchi, `VEN.apri` lo crea vuoto. Guerra e alleanza non convivono.
- `VEN.alleate`, `alleatoDi`, `dominante` (quota ≥ `DIPL.QUOTA_DOM` di luoghi o di forza), `forzaRegno`, `proposta(s,tipo,a,b)` → `{tipo,a,b,f:[{n,v}],tot,ok}` o `{err}`, senza dadi.
- `fai {a:'proponi', tipo:'pace'|'alleanza'|'guerra'|'rompi', f}` nella capitale del proprio re; poi `s.parola[re] = giorno + DIPL.ATTESA` (3). Errori in italiano da `proposta`.
- IA in `giornoNuovo` (ogni 4 giorni: alleanze contro il dominante o un nemico comune, rotture con preavviso, più guerra al dominante); `pensa`: soccorso con `soccorre`
  (stesso regno, o alleato **in guerra con chi assedia**); `oraNuova`: gli alleati vicini entrano nella mischia dalla stessa parte. Numeri in `VDAT.DIPL`.

## Prove da chiedere
- Due alleati non si combattono mai in 60 giorni di bot; un'alleanza non dura meno di 20 giorni.
- Stesso seme, stessa proposta → stesso esito; il pannello elenca gli stessi fattori usati dal conto.
- In 20 semi nessun regno supera il 60% dei luoghi dei regni prima del giorno 60 più spesso di oggi. Il mondo lasciato a sé conquista poco: il freno si prova
  in `test_ven_diplomazia.js` con un regno messo apposta a metà dei luoghi.

**Fuori scopo:** matrimoni, spie, trattati commerciali.
