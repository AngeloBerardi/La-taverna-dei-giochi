# Fascicolo: indagine d'archivio
**2–8 telefoni** (dipende dal fascicolo) · **25–170 minuti** · **Indagine cooperativa nella stessa stanza, con lo schermo comune** · **Licenza/marchio**: genere libero (scatole d'indagine, stanze di fuga); casi, testi e personaggi nostri. Progetto e formato: `docs/FASCICOLI.md`.

Fonte del testo `RULES.fascicolo` in `src/js/app/07d-regole.js`.

## Preparazione
- Lo schermo comune fa da regista: Impostazioni → Schermo comune, poi «Fai da regista» sulla TV.
- Un telefono con profilo a testa. Le specialità (Archivio, Scientifica, Testimoni, Luoghi) si distribuiscono nell'ordine del fascicolo: con meno di quattro telefoni se ne ha più di una, con di più si raddoppiano.

## Svolgimento
1. Capitoli (2-4): apertura letta dalla TV, indagine a tempo, poi pochi minuti per consegnare, poi la TV rivela le risposte una alla volta.
2. Azioni: proiettare (max 3 sulla TV), unire le metà (entro un minuto), collegare reperti propri o sulla TV, aprire serrature, cercare in archivio, analizzare, interrogare, esaminare zone.
3. Ore d'indagine: le azioni costano ore; ogni capitolo ne aggiunge; una risposta sbagliata ne toglie.
4. Risposte: proposta di chiunque, pareri sì/no, consegna solo del caposquadra (a rotazione).

## Fine e punteggio
- Stelle per ogni risposta giusta (alcune domande valgono di più), per le prove a sostegno dell'accusa, e una ogni due ore avanzate.
- Grado finale dalla tabella del fascicolo; epilogo pieno, parziale o fallito secondo l'accusa.

## Casi limite
- Una metà non unita entro un minuto torna in attesa.
- Nei minuti della consegna non si spendono più ore.
- In pausa si fermano il timer del capitolo e il laboratorio.
- Se la TV si spegne, un altro schermo riprende dallo stato salvato.

## Test del motore
`tests/test_fascicolo.js`: kit validi e quattordici kit rotti; da min a max giocatori la squadra brava raggiunge il grado più alto e quella a caso fa peggio; nessun segreto nel pubblico né nella mano sbagliata; metà, laboratorio, pausa, consegna, doppio tocco.
