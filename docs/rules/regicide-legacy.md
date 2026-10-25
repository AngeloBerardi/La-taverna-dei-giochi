# Regicide Legacy (id `rlegacy`)
**1–4 giocatori** · **30–45 min a missione, 12 missioni** · **coop / solitario, campagna legacy** · **Marchio**: «Regicide Legacy» è di Badgers From Mars. Usiamo il nome solo per indicare il gioco; personaggi, luoghi, nemici, storia, testi e grafica sono nostri.

Motore: `src/js/motori/36-regicide-legacy.js` (`RLEG`). Vista telefono: `app/22o-regicide-legacy.js`; tavolo 3D low-poly sullo schermo comune: `app/24u-regicide-legacy-tv.js`.

## Cosa sappiamo dell'originale (fonti in fondo)
- Party di 40 eroi (asso–10 di quattro classi) + giullari. Classi al posto dei semi: **Guerriero** (ascia, nero: danno doppio), **Paladino** (scudo, grigio: riduce la forza del nemico), **Chierico** (pozione, rosso: gli scarti tornano nella riserva), **Bardo** (liuto, giallo: si pesca). Gli assi sono **animali da compagnia** (forza 1, si abbinano a un'altra carta); combo **di parentela**: carte di pari forza, totale ≤ 10.
- Turno in 4 passi come Regicide: attacco → incantesimi (Chierico prima del Bardo) → danno (Guerriero ×2) → colpo del nemico (il Paladino riduce, si scartano carte per almeno la forza). Il nemico è immune all'abilità della sua classe.
- Novità rispetto al base: chiunque può iniziare; **Fingersi morti** (con la mano piena puoi scartarla tutta per parare qualsiasi colpo); il **giullare** si gioca da solo al centro, qualcuno lo reclama e attacca sopra di lui ignorando le immunità; nel solitario due giullari speciali (forza 8, classe a scelta, ignorano le immunità).
- Limite di mano / giullari: 1 giocatore 8/0, 2 → 7/0, 3 → 6/1, 4 → 5/2.
- Campagna di 12 missioni, ognuna con nemici propri, regole nuove e premi; il party è permanente (aggiunte, adesivi, carte strappate); pile **bandite** e **zona missione**; **corruzione** (un eroe estratto a sorte diventa corrotto: ignora le immunità ma a ogni uso brucia una carta); **mercenari** comprati con l'oro guadagnato perdendo; quattro **reliquie**; classi avanzate (Mago, Razziatore, Guardiano, Druido, Cantore), **belve**, **pellegrini**; dopo la campagna una modalità rigiocabile con nemici, ostacoli e aiuti casuali.

## La nostra versione (meccaniche ricostruite, dettagli nostri)
I contenuti delle singole buste non sono pubblici nel dettaglio: le missioni seguono l'ossatura nota (nemici e quantità per missione, classe introdotta, reliquia), le regole speciali sono nostre.

| # | Missione (nostro nome) | Nemici (forza/vita) | Novità |
|---|---|---|---|
| 1 | Chiamata alle armi · Cripta dei Giudici | 4×10/20, 4×15/30, 4×20/40 | regole base · premio: Flauto della Stirpe (combo fino a 15) |
| 2 | Ombra e nebbia · Caverna Umbra | Idra: 6 teste 10/20 | una testa non finita col danno esatto ricresce una volta (10/10); le teste finite col danno esatto vengono bandite |
| 3 | Lezioni di fiamma · Accademia | 4×10, 2×15, 1×20 «Fusioni» con due immunità | entrano i **Maghi** (A–10, blu); pila dei banditi |
| 4 | Fusione oscura · Laboratorio | 12 Esperimenti | +1 forza per ogni carta bandita (max +5) · premio: Fischietto Scarlatto, **Belve**, **Tronco** (8, senza classe) |
| 5 | Alti e potenti · Bosco Cremisi | 4×10, 4×15 Sporigeni | entrano **Razziatori** (3,5,7,10) e **Lira** (7, Bardo); **corruzione**; chi cede brucia la prima carta della riserva · premio: adesivo ascia su Tronco |
| 6 | Frammenti di memoria · Giardino | 4×15, 4×20 Statue | entrano i **Guardiani** (3,5,7,9); le carte giocate contro una statua vengono bandite (non gli animali) · premio: Emblema Azzurro |
| 7 | Racconti di rinascita · Pozzo delle Lacrime | 12 Stagnini | entrano i **Druidi** (3,5,7,9); **zona missione** |
| 8 | Venti del caos · Orlo del Cielo | 6 Troll 10/20, 6 Viverne 25/50 | entrano **Cantori** (3,5,7,9), **Pellegrini** (4×2–7) e il Cucciolo; a ogni nuovo nemico ognuno passa una carta a caso a sinistra |
| 9 | Speranza dalle ceneri · Tempio dei Due Semi | 4×15, 5×20 | si comincia con 30 carte in 3 pile della zona missione: **sacrifica** una carta della mano per recuperarne una; il danno esatto ne riporta un'altra · si ottiene la Madre Sempreverde |
| 10 | Orgoglio e caduta · Rovine del Tempio | 8 Traditori presi dal party (forza +8) | immuni alla loro classe, con un potere legato all'icona |
| 11 | Discesa nel buio · Caverne del Marciume | 4 Giustizieri 10/20 + Tronco corrotto 20/40 | entra **Edera** (6, Chierico); alla vittoria Edera muore (carta strappata) e Tronco rinasce con il potere dell'Albero |
| 12 | Dalla decadenza alla crescita · Trono | 4×15, 4×20 Mutati + Lira corrotta 25/80 | Lira è immune a liuto e scudo, ogni attacco perde 3 danni, e a ogni colpo brucia una carta della riserva |

Dopo la 12: **Spedizione libera** (12 nemici casuali dai pool delle missioni, un ostacolo e un aiuto a caso, party della campagna).

### Classi
| Codice | Classe | Icona | Abilità (a forza totale dell'attacco) |
|---|---|---|---|
| G | Guerriero | ascia nera | danno ×2 |
| P | Paladino | scudo grigio | forza del nemico −X (resta finché il nemico vive) |
| C | Chierico | pozione rossa | rimescola gli scarti, X carte in fondo alla riserva |
| B | Bardo | liuto giallo | pesca X a giro, saltando chi ha la mano piena |
| M | Mago | stella blu | scopri X carte della riserva, scegline una da aggiungere all'attacco (forza e abilità), le altre negli scarti; mago e carta scelta vengono banditi quando il nemico cade |
| R | Razziatore | fungo nero | danno ×2 (con l'ascia ×4); divora 0–3 carte dalla cima della riserva (bandite) e aggiunge la forza più alta, senza abilità |
| S | Guardiano | pietra grigia | il nemico non colpisce dopo questo attacco |
| D | Druido | piuma rossa | tutti gli scarti tornano in fondo alla riserva (mescolati), i pellegrini vengono banditi |
| T | Cantore | tamburo giallo | ognuno pesca ⌈X/2⌉; chi supera il limite scarta le carte più deboli |
| W | Albero (solo Tronco rinato) | albero | Guerriero + Paladino + Chierico + Bardo, ignora le immunità |

Belve (una per missione, scelta prima di iniziare): si abbinano a una carta e ne copiano la forza (aggiungono la propria classe). Mercenari (dopo la prima sconfitta, oro 1, poi +2, +3…; valgono solo per il tentativo): Gemelli 2/5 (1 oro), Veterani 12 (2), Custodi 19 senza classe (4), Lupo selvatico (animale con le 4 abilità base, 3), Giullare extra (3).

Corruzione (dalla missione 5): dopo il 2º e il 6º nemico caduto si estrae un valore 1–10 e una classe base; l'eroe corrispondente diventa corrotto per sempre (bordo viola): la sua abilità ignora le immunità, ma ogni volta che lo giochi la prima carta della riserva viene bandita (con la Madre Sempreverde bruci invece la carta più debole della tua mano).

Zona missione (missione 7): quando scarti per un colpo, la carta che ha esattamente il prossimo valore della scala (asso, 2, 3…) va nella zona invece che negli scarti; ogni carta non-pellegrino nella zona dà +1 alla forza del nemico; al 10 la scala si chiude: scarti in fondo alla riserva (pellegrini banditi) e la zona torna negli scarti.

## Casi limite
- Giullare: va giocato da solo; poi si sceglie chi lo reclama (anche chi l'ha giocato); il suo attacco successivo ignora tutte le immunità; il Paladino di quell'attacco resta valido nei turni seguenti.
- Fingersi morti: solo con la mano esattamente al limite; vale qualunque sia la somma.
- Nemico finito col danno esatto: in cima alla riserva come carta (forza e classe, niente vita), salvo regole di missione.
- Si perde se non puoi parare il colpo o se non puoi né attaccare né cedere (tutti gli altri hanno ceduto e la tua mano è vuota).
- La campagna si salva su ogni telefono al tavolo a fine missione (`localStorage` `rl-camp`); chi avvia porta la propria.

## Test del motore
`tests/test_regicide_legacy.js`: conservazione delle carte in ogni missione, azioni non valide → `{err}`, combo e giullare, fingersi morti, mago/razziatore/guardiano/druido/cantore, corruzione, zona missione, mercenari, campagna completa 1→12 con il bot che vince ogni missione entro qualche tentativo, bot casuale che perde.

## Fonti
- Regolamento riassunto: https://rulespal.com/regicide-legacy/rulebook
- Contenuto delle scatole per missione: https://talkingshelfspace.com/regicide-legacy-repacking-resetting-guide/
- Recensione con meccaniche (classi avanzate, reliquie, zona missione, corruzione): https://hiewandboardgames.blogspot.com/2026/08/regicide-legacy-review-and-photo-book.html
- Recensioni: https://spacebiff.com/2026/05/05/regicide-legacy/ · https://gusandco.net/2025/11/26/regicide-legacy-critique-jeu-cooperatif/
