# V6 — Personaggi che reagiscono

> **Traccia.** Le decisioni di gioco sono prese; firme, campi e numeri li fissa l'`architetto` leggendo il codice, poi la scheda si esegue.

**Scopo.** I compagni oggi sono una riga di storia e un'abilità. Devono avere opinioni, legami e una faccenda personale; i signori devono poter essere conosciuti.

**Area:** `docs/moduli/ventura.md`.

## Decisioni già prese
- Ogni compagno ha due cose che approva e due che detesta (razziare villaggi, liberare prigionieri, servire un certo regno, perdere uomini, pagare tardi…) e un'intesa o un'antipatia con un altro compagno.
- Il gradimento sale e scende a vista (una riga in cronaca quando cambia); sotto una soglia il compagno parla, poi se ne va portandosi dietro qualche uomo.
- Ogni compagno ha un incarico personale in tre passi, che si apre col gradimento alto e finisce con un premio unico (oggetto o abilità).
- Dialoghi: riuso del motore del racconto (`ARAC`: scene, condizioni, scelte, prove) con testi come dati in `src/avventura/` o in un file dati della Ventura. Niente testo dentro i motori.
- Signori: ricordano cosa hai fatto loro (liberato, sconfitto, tradito). Tre livelli di confidenza che aprono: notizie, favori (lettere di presentazione, prestiti), sostegno (V3 e V4).
- La rivale ha una storia a tappe: tre incontri obbligati lungo la partita, con esiti che dipendono dalle scelte.
- Altri talenti del capitano legati alle persone: Carisma (gradimento), Diplomazia (V3), Fama di cavaliere (tornei, V2).

## Da fissare prima di eseguire (architetto)
- Formato dei capitoli di `ARAC` e come l'orchestratore applica gli effetti `fuori`, per capire cosa serve alla Ventura.
- Dove vivono oggi `COMPAGNI`, `RIVALE`, `TRATTI`, `ABIL` in `28j` e come un compagno entra ed esce dalla compagnia in `28k`.
- Quanto pesano i testi: scriverli è lavoro da modello forte (voce, niente frasi fatte), a blocchi di 2–3 compagni per sessione.
- Conviene spezzare in due schede: V6a meccanica (gradimento, memoria dei signori), V6b testi e incarichi personali.

## Prove da chiedere
- Ogni nodo di ogni dialogo è raggiungibile (come `test_avv_corona.js`).
- Un compagno maltrattato se ne va entro 30 giorni di bot «crudele»; con il bot accorto nessuno se ne va.
- Stesso seme e stesse scelte → stessa storia su due telefoni.

**Fuori scopo:** storie d'amore, voci registrate, ritratti dipinti.
