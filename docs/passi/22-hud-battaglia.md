---
passo: 22
titolo: HUD della battaglia: reparti, ondate, mini-mappa
fase: 6
area: viste
dopo: [19, 16]
agente: programmer
modello: sonnet
impegno: medio
controllo: visivo
file:
  - src/js/app/24hwd-ven-scontro.js
  - src/js/app/24hv-ven-campo.js
  - src/css/39jc-ven-campo.css
---

# Passo 22 — HUD della battaglia: reparti, ondate, mini-mappa

**In breve.** In battaglia lo schermo è del campo: una sola fascia per reparti, ordini e ondate, il morale di ogni reparto in vista, una mini-mappa per sapere dov'è ciascuno.

## Scopo

In battaglia lo schermo è del campo: i comandi stanno in una fascia sola, si vede quale gruppo cede, una piccola mappa dice dove sono tutti.

## Oggi

In alto due barre senza nome (forze e vita del capitano) con velocità e pausa. In basso due file: Tutti/Fanti/Tiratori/Cavalieri e Carica/Tieni/Seguimi/Avanti/Indietro/Grido: circa il 25% dello schermo.

## Leggi prima

`app/24hwd-ven-scontro.js` (`campoH`), `app/24hv-ven-campo.js` (`K`, `numeri`, `tocco`), `css/39jc-ven-campo.css`, `VCAM.gruppi`, `VCAM.forme`, e dopo il passo 16 `VCAM.morali`. Dipende dal passo 11 (lo schieramento usa questa fascia) e meglio dopo il passo 16.

## Decisioni

1. **Barra alta (56 px)**: a sinistra il nostro stendardo + numero, a destra il loro; in mezzo la barra delle forze. Sotto, sottile, la vita del capitano con il suo nome. Pausa e velocità come nel mondo (passo 08).
2. **Fascia bassa unica (128 px)**. Riga 1: le **carte dei reparti** (da `VCAM.reparti`; senza reparti sono i tre gruppi di oggi), fino a 6, scorrevoli in orizzontale, larghe ~120 px. Ogni carta ha: icona, numero, formazione come piccolo segno grafico (non come parola), **barra del morale** (verde → ambra → rosso, lampeggia quando sta per rompersi), **fatica** come ombra sulla carta e **faretra** per i tiratori. In fondo alla fila le ondate «Al mio segnale», come carte d'ottone scuro con il numero e l'ingresso (tocco = `vondata:N`). Toccare una carta la sceglie; toccarla di nuovo cambia formazione (come oggi `cgr:g`). Tocco lungo = tutti. Riga 2 = cinque ordini come icone con nome sotto (Carica, Tieni, Seguimi, Avanza, Ripiega) + Grido d'ottone a destra con l'anello della ricarica.
3. **Mini-mappa** 72×120 px nell'angolo in alto a destra sotto la barra: rettangolo del campo, puntini ambra (nostri) e rosso scuro (loro) a gruppi (un puntino per gruppo, grande secondo gli uomini), il riquadro della telecamera. Toccarla sposta la telecamera lì (`VenCampo.centra`). Disegnata su un `<canvas>` 2D aggiornato 4 volte al secondo.
4. **Sul campo**: il gruppo scelto ha l'anello sotto i piedi più chiaro; l'ancora dell'ordine «Tieni» si vede come bandierina finché il gruppo non la raggiunge.
5. Gli avvisi (`.vn-avv`) in battaglia: al più due righe, sopra la fascia bassa, spariscono in 2,5 s.

6. Bottone «Vista del comandante» nella barra alta: porta la camera al livello lontano del passo 26.

## Stato e contratti

Nessun campo nel motore. In `VenCampo`: `minimappa(cv)` (disegna), `K.selG` già c'è come `K.gruppo`. I `data-v` restano: `cgr:*`, `cord:*`, `cgrido`, `cpausa`, `cvel` (gli scenari li usano).

## Ordine di lavoro

1. barra alta.
2. carte dei gruppi + ordini.
3. mini-mappa.
4. anello e bandierina.
5. CSS, controlli a 360×640.

## Prove

Scenari esistenti verdi (stessi `data-v`). Scenario `scenari/p22.py`: altezza della fascia bassa ≤ 140 px a 390×844; la mini-mappa ha un pixel ambra e uno rosso scuro. Screenshot in mischia a 390 px.

## Fuori scopo

Regia della telecamera (passo 31).

## Fatto quando

Il campo occupa almeno il 70% dell'altezza; scenari verdi; screenshot guardato.
