# Cantari di Ventura — Piano C: la Compagnia di ventura (mondo libero)

Decisione dell'utente (14 novembre 2026): la modalità Avventura diventa **un gioco di comando di truppe in un mondo libero**
(mappa strategica + battaglie campali), adatto al telefono, con potenzialità di multiplayer. Non più una campagna con trama:
la campagna a capitoli (piani A e B) resta nella pagina Avventura come secondo modo, intatta.

Scelte prese in autonomia (l'utente ha lasciato mano libera): il capitano **combatte in mezzo alle truppe**; grafica 3D a pixel
d'arte con telecamera ortografica; un solo salvataggio sul telefono.

## Stato: C1 fatto (questa PR)
| Pezzo | File | Note |
|---|---|---|
| Dati (fazioni, 36 truppe, merci, equipaggiamento, compagni) | `motori/28j-ven-dati.js` (`VDAT`) | unica fonte dei numeri |
| Mondo libero | `motori/28k-ven-mondo.js` (`VEN`) + `tests/test_ven_mondo.js`, bot `tests/bot_ven.js` | mappa dal seme, A*, signori con IA, guerre, assedi, razzie, economia, incarichi, servizio e feudi, prigionia |
| Battaglia campale | `motori/28l-ven-campo.js` (`VCAM`) + `tests/test_ven_campo.js` | istanti da 100 ms, ordini ai gruppi, capitano, muro e varchi, rinforzi, rotta, `risolvi` |
| Bottega grafica | `app/24ht-ven-arte.js` (`VenArte`) | bersaglio piccolo, scatto sui pixel, contorni, solidi, schiere a istanze, stendardi, particelle, luce dell'ora |
| Mappa 3D | `app/24hu-ven-mappa.js` (`VenMappa`) | terreno, mare, boschi, strade, luoghi, compagnie, etichette, gesti |
| Battaglia 3D | `app/24hv-ven-campo.js` (`VenCampo`) | figure animate, frecce, polvere, mura d'assedio |
| Partita, HUD, pannelli | `app/24hw-ventura.js` (`Ven`), `css/39j-ventura.css` (`vn-`) | comando `data-a="ven"`, salvataggio `ven-salv` |
| Regole | `RULES.ventura` (07d), `docs/rules/ventura.md` | |

## Il ciclo di gioco
Mappa libera → reclute nei villaggi → predoni, carovane e signori → bottino, prigionieri, commercio → fama e amicizie coi regni →
contratto da mercenario → vassallo con feudo, oppure fortezze proprie → assedi → regni che cadono. I regni vivono da soli:
i signori pattugliano, inseguono, fuggono, razziano, assediano, soccorrono; guerre e paci cambiano ogni pochi giorni.

## Regole di progetto
- Motori puri e ripetibili: niente `Math.random`, `Date.now`, trigonometria (solo + − × ÷ e radice). Lo controlla `test_ven_campo.js`.
- Lo stato del mondo è JSON; la mappa si rigenera dal seme (`VEN.mappa`), quindi i salvataggi sono piccoli.
- Il tempo scorre solo in `VEN.passo`: 1 istante = 1 minuto; la vista ne chiede 8 al secondo a ×1.
- La risoluzione automatica gioca la battaglia vera (`VCAM.risolvi`): stessi numeri della battaglia giocata.
- Tarature col bot: `node tools/avventura/ventura.js --giorni 60 --semi 3,11,29`.

## Misure del bot (60 giorni, capitano accorto)
Compagnia 40–60 uomini, fama 100–170, 30–70 battaglie vinte, nessun seme in rovina; il capitano sconsiderato perde più di quanto vince.
I regni cambiano confini da soli in circa due partite su tre. Battaglie giocate: 30–90 secondi di scontro a ×1 più l'avvicinamento.

## Multiplayer: cosa è pronto e cosa manca
- Pronto: motori deterministici con dado nello stato; ordini come dati (`VEN.ordina`, `VCAM.ordina`); alleati in battaglia già
  previsti (`all` nell'incontro, righe con `p` = compagnia); nessuna dipendenza dall'orologio del telefono.
- C2 (prossimo): **co-op nello stesso mondo**, un capitano a testa in stanza live (`R.mode='rt'`, come `AvvStanza`): più compagnie
  `k:'tu'` nello stato, il tempo avanza quando tutti hanno una meta o aspettano, battaglie condivise con un gruppo a testa, TV come mappa.
- C3: **mondo persistente a distanza** su Firestore (partite asincrone): ognuno gioca le sue giornate, il mondo avanza a giorni.
- C4: banda contro banda, con un arbitro che simula.

## Da fare dopo C1
- Salvataggio sull'account (oggi solo sul telefono) e più salvataggi.
- Ripiego senza WebGL (oggi la modalità chiede il 3D).
- Aspetto del capitano dall'eroe dell'account; tornei in città; signori con cui parlare (riuso di `ARAC` per dialoghi e incarichi).
- Prestazioni misurate su telefoni veri: in ufficio è provata solo in Chromium senza scheda grafica.
- Vista TV dedicata.
