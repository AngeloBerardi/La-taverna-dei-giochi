---
passo: 37
titolo: Il peso della mischia
fase: 9
area: viste
dopo: [31]
agente: artist
modello: sonnet
impegno: medio
controllo: visivo
file:
  - src/js/app/24ht-ven-arte.js
  - src/js/app/24hv-ven-campo.js
  - src/js/motori/28n-ven-audio.js
---

# Passo 37 — Il peso della mischia

**In breve.** Lo scontro si sente: polvere sotto le cariche, caduti a terra, stendardi dei reparti, frecce che si vedono, il rumore che cresce. Sempre pixel d'arte, senza sangue.

## Scopo

Lo scontro si sente: polvere sotto le cariche, caduti che restano a terra, stendardi dei gruppi, frecce che si vedono, scintille sui colpi forti, il rumore della mischia che cresce. Sempre pixel d'arte, senza sangue.

## Leggi prima

`app/24ht-ven-arte.js` (`Schiera`, `Stendardi`, `Particelle`, budget e qualità `ven-q`), `app/24hv-ven-campo.js` (`eventi`, `passo`), `motori/28n-ven-audio.js` (`CAMPO`, `MAX_CAMPO`), regole di r128 in `docs/moduli/ventura.md`. Dipende dal passo 31.

## Decisioni

1. **Caduti**: un'unità `ko` resta a terra (stessa figura, ruotata e scurita del 35%), al più 80 (le più vecchie spariscono in 1 s); `via` (fuggiti) spariscono come oggi. Pochi triangoli: le figure a terra passano alla `Schiera` a istanze dei caduti.
2. **Polvere**: ogni cavaliere che corre (`ca>.3`) lascia 1 sbuffo ogni 6 istanti; ogni `colpo` di carica 6 sbuffi; colore del terreno schiarito. In pioggia niente polvere, schizzi.
3. **Stendardi dei gruppi**: la prima unità viva di ogni gruppo porta un'asta con la bandierina del colore del lato (riuso di `Stendardi`); se cade passa alla successiva. Il comandante nemico (passo 16) ha lo stendardo grande.
4. **Frecce**: ogni `tiro` disegna un tratto di 3 pixel che vola lungo un arco (altezza proporzionale alla distanza) per `vt` istanti; quelle mancate restano piantate a terra 4 s.
5. **Colpi**: scintilla bianca di 2 fotogrammi sui `crit`; il lampo e la scossa di oggi restano solo per cariche ≥ 3 colpi.
6. **Suono**: un tappeto di mischia la cui intensità segue il numero di `colpo` nell'ultimo secondo (tre livelli) in `VAUD.CAMPO` (**suoni qui**), sotto il limite `MAX_CAMPO`.
7. **Budget**: con qualità `media`, triangoli a fotogramma ≤ +15% rispetto a oggi in mischia piena; con `bassa` niente frecce piantate né polvere.

## Prove

Scenari esistenti verdi (contesto perso e ripreso compreso). Scenario `scenari/p37.py`: dopo 10 s di mischia `VenCampo.K.caduti` > 0 e `renderer.info.render.triangles` ≤ 1,15 × la misura presa sullo stesso seme prima di questo passo (scritta nella PR). `tests/test_ven_p37.js`: tre livelli del tappeto. Due screenshot (mischia e dopo la rotta) a 390 px, guardati dal modello forte.

## Fuori scopo

Sangue, corpi smembrati, nuove animazioni dei soldati.

## Fatto quando

Prove verdi, screenshot approvati.
