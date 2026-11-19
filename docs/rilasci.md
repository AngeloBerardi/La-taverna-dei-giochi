# Rilasci

## Rilascio 1: interfaccia

Cosa cambia per chi gioca:
- L'HUD del mondo ha cinque riquadri con etichetta e il foglio Compagnia a metà schermo.
- L'incontro mostra due stendardi faccia a faccia, con un solo bottone d'ottone.
- La città è una piazza di tessere (Mercato, Taverna, Armaiolo…) e il mercato un banco a righe da 56 px.
- Il menu Avventura mette in primo piano la Compagnia di ventura, con il foglio «Nuova campagna» e le difficoltà.
- Tutto provato a 390×844 e 360×640, senza errori in console.

Difetti trovati (non corretti qui): #170 (ottoni multipli e bersagli piccoli nel menu), #171 (bottone Via sotto i 44 px), #175 (foglio Nuova campagna: sei ottoni, ? e + piccoli), #176 (bottone Avanti dell'esito sotto i 44 px). La prova fallisce su ogni difetto non in questo elenco.

La prova avvia la battaglia con Via, la porta a termine (velocità x4) e fotografa il velo di fine.

## Rilascio 2: grandi battaglie (in attesa, interruttore spento)

Il passo 29 ha preparato l'accensione (`VDAT.ACCESO.grandi`, gancio `scheda` in `28kr`, impronta `docs/passi/impronte/grandi.txt`) ma l'interruttore resta spento: con i bot a 60 giorni i semi 3 e 5 vanno in rovina (0 uomini; nei semi 11 e 29 e a interruttore spento no). Nelle battaglie perse (anche senza comandante nemico) la partita si chiude con zero caduti per parte. Le regole dei passi 06, 11, 16, 19, 22, 26, 28, 47 non sono ancora copiate in `docs/rules/ventura.md` né in `RULES.ventura`: si fa all'accensione.

Quando si accende, per chi gioca cambia:
- fino a 110 uomini per lato (70 con la taglia media) e campo più largo;
- reparti da dividere prima del «Via», settori di schieramento e ondate dai bordi;
- morale per reparto, fatica e frecce contate;
- un signore o la Volpe portano in campo il loro comandante;
- ogni compagno porta una dote ai suoi uomini vicini; in compagnia ogni capitano preme il suo «Pronto».
