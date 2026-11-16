# B1v — Il tavolo dello schieramento (vista)

**Binario** D. **Dopo** B1 unita (legge `VCAM.settori`, `reparti`, ondate). Si vede solo se lo stato ha `s.ond` (cioè con X1 acceso o con `?ven=grandi`).

**Scopo.** A `t===0` lo schermo diventa un tavolo da comandante: campo intero dall'alto, settori disegnati, reparti come gettoni da toccare e mettere, ondate preparate in un foglio. Si capisce tutto senza leggere istruzioni.

**Leggi prima.** `app/24hv-ven-campo.js` (`tocco`, `K.alt`, `K.fuoco`, `K.gruppo`), `app/24hwd-ven-scontro.js` (`campoH`, riquadro `.vn-via`), `css/39jc-ven-campo.css`, `docs/STYLE.md`. Contratti in `B1-schieramento.md`.

**Decisioni già prese.**
1. **Telecamera**: alta, sul campo intero; il proprio lato in basso.
2. **Settori**: rettangoli velati del colore ambra con il nome breve (Sinistra, Centro, Destra, Avanguardia, Altura, Imboscata), disegnati sul terreno. I punti d'ingresso delle ondate sono frecce sul bordo.
3. **Reparti**: sul campo, un gettone di legno sopra ogni reparto (icona del tipo e numero). In basso una fila di carte dei reparti, la stessa grammatica di U4.
   - Toccare una carta, poi il campo: `schiera`.
   - Su ogni carta: «Dividi» e il segno della formazione (tocco = cambia).
   - Trascinare una carta su un'altra dello stesso tipo: `unisci`.
4. **Foglio «Ondate»** (al massimo 58%):
   - due caselle d'ondata; in ognuna le truppe ancora libere per tipo con `−`/`+` (passi di 5);
   - ingresso a tre bottoni (Retro, Fianco sinistro, Fianco destro);
   - momento a tre bottoni («Al mio segnale», «Quando la linea cede» con 50/30%, «Dopo» 1/2/3 minuti);
   - ordine d'ingresso (Carica, Tieni, Seguimi).
   - In alto il conto: «In campo 96/110 · Ondate 40 · Riserva 14».
5. **Chi si schiera per primo**: se sei secondo, i gettoni nemici sono già visibili; se sei primo, i nemici si vedono come ombre fino al «Pronto», poi si muovono nel loro schieramento in 1 s (animazione).
6. Unico ottone: **Pronto** (in compagnia: «Pronto 1/3», e si parte quando tutti sono pronti, come le altre scelte comuni).
7. In battaglia le ondate preparate «Al mio segnale» compaiono come bottoni nella fascia di U4 («Ondata 1 · 24»). Finché U4 non è unita, stanno in una riga sopra i comandi di oggi.
8. Con la TV accesa il tavolo va sulla TV; i telefoni mostrano carte e foglio.

**Stato e contratti.** Solo vista: `K.tavolo` (vero a `t===0` con reparti), `K.selR`. Nessun `data-v` di oggi cambia; nuovi: `vrep:N`, `vdiv:N`, `vfm:N`, `vond:apri`, `vond:N:t:+|-`, `vond:N:ing:K`, `vond:N:q:K:V`, `vpronto`, `vondata:N`.

**Prove.**
- Scenario nuovo `ventura_schiera` con `?ven=grandi`, contro un signore da 150:
  - dividi i fanti e metti una metà a sinistra;
  - prepara un'ondata di cavalieri dal fianco destro «Al mio segnale», premi Pronto;
  - dopo 10 s premi l'ondata e controlla che compaiano cavalieri vicino al bordo destro.
- A 360×640 tutti i bersagli sono ≥ 44 px e un solo ottone è visibile.
- Due screenshot a 390 px (tavolo e foglio ondate), guardati dal modello forte.

**Fuori scopo.** IA nemica (B2), HUD della battaglia (U4).

**Fatto quando.** Lo scenario passa e gli screenshot sono approvati.
