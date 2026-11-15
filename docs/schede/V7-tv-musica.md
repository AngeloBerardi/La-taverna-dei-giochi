# V7 — Vista TV della stanza, musica e suoni propri

> **Traccia.** Le decisioni di gioco sono prese; firme, campi e numeri li fissa l'`architetto` leggendo il codice, poi la scheda si esegue.

**Scopo.** Con la TV accesa la mappa sta sul televisore e i telefoni fanno da comandi. E la Ventura deve avere la sua musica: oggi prende in prestito i suoni dell'Avventura.

**Area:** `docs/moduli/ventura.md`.

## Decisioni già prese
- TV in sola visione (lo è già: `ui.tv` in `24hx`). Mostra la mappa larga con la compagnia al centro, la cronaca, i capitani seduti; in battaglia tutto il campo.
- Sui telefoni, con la TV accesa, la mappa resta ma il telefono privilegia i pannelli (luogo, zaino, compagnia) e gli ordini.
- Musica a partitura come il resto del gioco, quattro temi: viaggio di giorno, notte e accampamento, città, battaglia; un motivo breve per vittoria e sconfitta.
- Suoni propri: passi della compagnia, mercato, zoccoli, corno della carica, cozzo, frecce, grido, moneta. La scelta di cosa suonare sta in una tabella pura con il suo test, come `AAUD`.
- Qualità della TV: il bersaglio a pixel più grande, stesse regole di `ven-q`.

## Da fissare prima di eseguire (architetto)
- Come le altre viste trattano `html[data-tv]` (per esempio `css/39g-stanza.css`) e come si registra una vista TV.
- Come sono fatte le tabelle di `motori/28c-avv-audio.js` e il tramite con `Snd`, da imitare per la Ventura.
- Scenario browser con 1 TV e 2 telefoni: copiare l'impianto di `avv_tv`.

## Prove da chiedere
- La TV non manda mai mosse; due telefoni e una TV mostrano lo stesso giorno e le stesse monete.
- Ogni evento del mondo e della battaglia ha un suono nella tabella (test che scorre gli eventi).
- Screenshot della TV a 1280×720 guardato una volta.

**Fuori scopo:** voce narrante, colonna sonora registrata.
