---
passo: 44
titolo: Gli incontri del crocevia (motore)
fase: 11
area: mondo
dopo: [42]
agente: programmer
modello: sonnet
impegno: medio
controllo: forte
file:
  - src/js/motori/28kq-ven-crocevia.js
---

# Passo 44 — Gli incontri del crocevia (motore)

**In breve.** Ai crocevia e nei luoghi selvaggi capitano piccoli fatti a scelte: è il nome del gioco che diventa gioco.

> **Traccia**: la completa il passo 03 (architetto). Fino ad allora qui ci sono le decisioni di gioco, non le firme.

## Scopo

La strada tra due luoghi non è vuota: ai crocevia e nei luoghi selvaggi capitano piccoli fatti a scelte (un pellegrino ferito, un ponte crollato, un disertore che chiede di unirsi, un mercante che offre un affare sospetto, un villaggio che brucia). È il nome del gioco che diventa gioco.

## Decisioni

1. 30 scene brevi (2–3 scelte, 1–2 nodi) in `VVOC.CROCEVIA`, ognuna con condizioni (bioma, regno, guerra, notte, fama, compagni presenti) e peso. Effetti solo con quelli già esistenti (`oro`, `ven`: grad, premio, scontro, passo, conf…) più tre nuovi: `uomini` (reclute), `merce`, `viveri`.
2. Al più una scena ogni 2 giorni di cammino, solo quando la compagnia attraversa un incrocio di strade (`M.S` con ≥ 3 vicini) o una casella di bosco/monte lontana dai luoghi; estrazione dal seme (ripetibile). Mai la stessa scena due volte in 30 giorni.
3. Le scene toccano i gusti dei compagni (V6a: ama/odia): la scelta muove il gradimento, così i compagni «commentano» con una riga.
4. In compagnia risponde chiunque, come le altre scene; sulla TV la scena in grande.

## Prove

Da fissare nel passo 03. Bot 60 giorni: 20–35 scene viste per seme, nessuna ripetuta entro 30 giorni; test di forma dei testi (lunghezza, niente marchi, niente emoji) come in `test_ven_voci.js`.

## Regole per il giocatore

Le scrive chi esegue, **in questo file**, a lavoro finito: 3–6 righe per chi gioca, parole nostre, niente numeri interni. Le copierà nelle regole il passo del rilascio.
