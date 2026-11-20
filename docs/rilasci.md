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

Il passo 29 ha preparato l'accensione (`VDAT.ACCESO.grandi`, gancio `scheda` in `28kr`, impronta `docs/passi/impronte/grandi.txt`) ma l'interruttore resta spento: con i bot a 60 giorni i semi 3 e 5 vanno in rovina (0 uomini), mentre 11, 29 e 7 reggono. Casi separati, dettagli e riproduzione nell'issue #187.
- Seme 5: due battaglie perse, anche senza comandante nemico, che finiscono con zero caduti per parte.
- Seme 3: la compagnia muore di fame dopo l'ultima vittoria (forse solo rumore del bot).

Le regole dei passi 06, 11, 16, 19, 22, 26, 28, 47 non sono ancora copiate in `docs/rules/ventura.md` né in `RULES.ventura`: si fa all'accensione.

Quando si accende, per chi gioca cambia:
- fino a 110 uomini per lato (70 con la taglia media) e campo più largo;
- reparti da dividere prima del «Via», settori di schieramento e ondate dai bordi;
- morale per reparto, fatica e frecce contate;
- un signore o la Volpe portano in campo il loro comandante;
- ogni compagno porta una dote ai suoi uomini vicini; in compagnia ogni capitano preme il suo «Pronto».

## Rilascio 3: comandanti (in attesa, interruttore spento)

Il passo 34 ha preparato l'accensione (`VDAT.ACCESO.consiglio`, impronta `docs/passi/impronte/consiglio.txt`, `tools/avventura/torneo-comandanti.js`) ma l'interruttore resta spento: acceso, falliscono quattro test e il torneo esce dai limiti (scala 1>0 78%, 2>1 55%, 3>2 57%, 4>3 52%; diagonale in regola). Dettagli nell'issue del rilascio.

Le regole dei passi 12, 21, 25, 30, 32 si copiano in `docs/rules/ventura.md` e `RULES.ventura` all'accensione.

Quando si accende, per chi gioca cambia:
- rango dei comandanti (da sprovveduto a leggendario) visibile prima dello scontro;
- nemici che pensano per rango, dottrina e carattere: alture, riserve, rotazioni, trappole, memoria delle tue abitudini;
- prima della battaglia: esploratori, scelta del campo, alba, notte, imboscata, pali, retroguardia.
