# V3 — Alleanze, tregue e guerre decise dal giocatore

> **Traccia.** Le decisioni di gioco sono prese; firme, campi e numeri li fissa l'`architetto` leggendo il codice, poi la scheda si esegue.

**Scopo.** Oggi guerre e paci tra i regni cambiano da sole. Il giocatore deve poterle muovere: da mercenario poco, da vassallo di più, da sovrano del tutto.

**Area:** `docs/moduli/ventura.md`.

## Decisioni già prese
- Tre stati tra due regni: guerra, pace, **alleanza** (nuovo). Gli alleati non si attaccano, si soccorrono negli assedi e combattono insieme se si incontrano.
- Le alleanze durano almeno 20 giorni e si rompono solo con un preavviso di 3 giorni (evento in cronaca).
- Il giocatore agisce parlando con un re nella sala della sua capitale: «Proponi pace con…», «Proponi alleanza con…», «Chiedi guerra a…».
- L'esito è un conto, non un dado nascosto: amicizia col regno, fama, tratto del re, forza relativa dei due regni, guerre già in corso. Il pannello mostra i fattori a favore e contro.
- Peso della parola: capitano libero solo doni e tributi; mercenario a contratto può chiedere pace; vassallo può proporre tutto; sovrano (V4) decide per il proprio regno.
- I regni fanno alleanze anche da soli, di rado, contro chi sta vincendo troppo (freno alla valanga).

## Da fissare prima di eseguire (architetto)
- Come è fatto `s.guerra` e dove l'IA dichiara guerra e pace (`giornoNuovo`), per aggiungere `alleanza` senza rompere `nemiche`.
- Dove l'IA dei signori sceglie i bersagli (`pensa`) e il soccorso agli assedi.
- Migrazione: i salvataggi v2 senza alleanze devono aprirsi (campo assente = nessuna).
- Azioni nuove di `fai` e loro errori; passano già dalla stanza in compagnia.

## Prove da chiedere
- Due alleati non si combattono mai in 60 giorni di bot; un'alleanza non dura meno di 20 giorni.
- Stesso seme, stessa proposta → stesso esito; il pannello elenca gli stessi fattori usati dal conto.
- In 20 semi nessun regno supera il 60% dei luoghi prima del giorno 60 più spesso di oggi.

**Fuori scopo:** matrimoni, spie, trattati commerciali.
