# M4 — Gli incontri del crocevia (traccia)

> **Traccia**: il formato esiste già (scene di `ARAC`/`VVOC`, V6b); l'`architetto` fissa i ganci, il modello forte scrive i testi.

**Scopo.** La strada tra due luoghi non è vuota: ai crocevia e nei luoghi selvaggi capitano piccoli fatti a scelte (un pellegrino ferito, un ponte crollato, un disertore che chiede di unirsi, un mercante che offre un affare sospetto, un villaggio che brucia). È il nome del gioco che diventa gioco.

**Decisioni di gioco.**
1. 30 scene brevi (2–3 scelte, 1–2 nodi) in `VVOC.CROCEVIA`, ognuna con condizioni (bioma, regno, guerra, notte, fama, compagni presenti) e peso. Effetti solo con quelli già esistenti (`oro`, `ven`: grad, premio, scontro, passo, conf…) più tre nuovi: `uomini` (reclute), `merce`, `viveri`.
2. Al più una scena ogni 2 giorni di cammino, solo quando la compagnia attraversa un incrocio di strade (`M.S` con ≥ 3 vicini) o una casella di bosco/monte lontana dai luoghi; estrazione dal seme (ripetibile). Mai la stessa scena due volte in 30 giorni.
3. Le scene toccano i gusti dei compagni (V6a: ama/odia): la scelta muove il gradimento, così i compagni «commentano» con una riga.
4. In compagnia risponde chiunque, come le altre scene; sulla TV la scena in grande.

**Prove da fissare.** Bot 60 giorni: 20–35 scene viste per seme, nessuna ripetuta entro 30 giorni; test di forma dei testi (lunghezza, niente marchi, niente emoji) come `test_ven_voci.js`.

**Modello.** Architetto forte (ganci), forte (testi, in due blocchi da 15), Sonnet (motore e vista).
