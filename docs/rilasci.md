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

## Rilascio 3: comandanti (acceso nel passo 34)

Acceso con `VDAT.ACCESO.consiglio=true`. Impronta accesa `docs/passi/impronte/consiglio.txt`, torneo `tools/avventura/torneo-comandanti.js`, regole in `docs/rules/ventura.md` e `RULES.ventura`.

Per chi gioca cambia:
- rango dei comandanti (da sprovveduto a leggendario) visibile prima dello scontro;
- nemici che pensano per rango, dottrina e carattere: alture, riserve, rotazioni, trappole, memoria delle tue abitudini; sotto le frecce aspettano solo se i loro tiratori reggono lo scambio;
- a tempo scaduto gli uomini in riserva contano come vivi: l'esercito più grande non perde più una battaglia senza scontri;
- prima della battaglia: esploratori, scelta del campo, alba, notte, imboscata, pali, retroguardia.

## Rilascio 4: nuova campagna (in attesa, interruttore spento)

Il passo 38 ha preparato l'accensione (`VDAT.ACCESO.mondo2`, impronta accesa `docs/passi/impronte/mondo2.txt`, stemma con 12 figure) ma l'interruttore resta spento, come chiede il passo se le prove d'insieme non reggono. Bot a 120 giorni su 6 semi (1-6), regni vivi (esclusi i caduti) al giorno 121:
- Recluta: 9, 9, 9, 9, 7, 6 (attesi 4-7);
- Condottiero: seme 2 con 3 regni, seme 4 con la compagnia ridotta a 1 uomo (rovina);
- Leggenda: 3-5 regni, semi 1 e 2 in rovina (ammessa).
In più, con l'interruttore acceso falliscono 15 test rapidi che chiamano `VEN.nuovo(seme)` e si aspettano il mondo vecchio (assedio, diplomazia, mondo, p02, p07, p13, p17, p23, p27, p33, p36, personaggi, regno, stanza, voci): vanno portati a `mondo2=false` in un passo che li possa toccare.
Le regole dei passi 07, 17, 23, 27, 33, 35, 36 non sono ancora copiate in `docs/rules/ventura.md` né in `RULES.ventura`: si fa all'accensione.
