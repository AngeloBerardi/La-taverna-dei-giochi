# Cantari di Ventura — Piano C: la Compagnia di ventura (mondo libero)

Decisione dell'utente (14 novembre 2026): la modalità Avventura diventa **un gioco di comando di truppe in un mondo libero**
(mappa strategica + battaglie campali), adatto al telefono, con potenzialità di multiplayer. Non più una campagna con trama:
la campagna a capitoli (piani A e B) resta nella pagina Avventura come secondo modo, intatta.

Scelte prese in autonomia (l'utente ha lasciato mano libera): il capitano **combatte in mezzo alle truppe**; grafica 3D a pixel
d'arte con telecamera ortografica; un solo salvataggio sul telefono.

## Stato: C1 (mondo e battaglia), C2 (co-op in stanza) e approfondimento fatti
| Pezzo | File | Note |
|---|---|---|
| Dati | `motori/28j-ven-dati.js` (`VDAT`) | unica fonte dei numeri: 5 regni, truppe e `aspetto(tid)`, catalogo oggetti `OGG` (6 posti, pregio 1–4), botteghe, offerte uniche delle capitali, bottino dei siti, 10 compagni, 6 capibanda, la rivale, tratti dei signori |
| Mondo libero | `motori/28k-ven-mondo.js` (`VEN`) + `tests/test_ven_mondo.js`, bot `tests/bot_ven.js` | mappa 128×128 dal seme (97 luoghi), A*, signori con IA e tratti, guerre, assedi, economia, incarichi, zaino ed equipaggiamento, siti nascosti da scoprire e assaltare, porti, monasteri, locande, meteo, stato v2 con `migra` |
| Battaglia campale | `motori/28l-ven-campo.js` (`VCAM`) + `tests/test_ven_campo.js` | istanti da 100 ms, ordini ai gruppi, più capitani (`capU`), muro e varchi, rinforzi, rotta, `risolvi`; nebbia e pioggia pesano sul tiro |
| Stanza in compagnia | `motori/28m-ven-stanza.js` (`VST`) + `tests/test_ven_stanza.js`, `app/24hx-ven-stanza.js` (`VenStanza`) | 1–4 capitani, una compagnia; ogni telefono simula in locale e manda mosse con posto e tempo raggiunto |
| Bottega grafica | `app/24ht-ven-arte.js` (`VenArte`) | bersaglio piccolo, scatto sui pixel, contorni, solidi, `Schiera` a pezzi (elmi, armi, scudi, mantelli, barde), stendardi, particelle, luce dell'ora, nebbia |
| Mappa 3D | `app/24hu-ven-mappa.js` (`VenMappa`) | terreno e boschi a tasselli, stile per cultura, modelli di porto, monastero, locanda, rovine, covo, carta del mondo |
| Battaglia 3D | `app/24hv-ven-campo.js` (`VenCampo`) | il campo segue bioma, pendenza, costa, strada, luogo vicino, ora e meteo; figure vestite secondo truppa ed equipaggiamento |
| Partita, HUD, pannelli | `app/24hw-ventura.js` (`Ven`), `css/39j-ventura.css` (`vn-`) | comando `data-a="ven"`, salvataggio `ven-salv` |
| Regole | `RULES.ventura` (07d), `docs/rules/ventura.md` | |

### Approfondimento (dal riscontro dell'utente del 15 novembre)
- **Campi di battaglia**: `VEN.campo()` passa `scena:{meteo,strada,pend,costa,vicino}` e `ora`; `VenCampo.scena()` costruisce terreno, acqua, case, mura, rovine, palizzate, fuochi e tempo di conseguenza.
- **Aspetto**: ogni truppa ha la sua tavola (`VDAT.aspetto`), il capitano veste ciò che indossa (`VEN.statCap(cap).asp`), i compagni hanno `asp` proprio; dischetto ambra = tuoi, rosso scuro = nemici.
- **Zaino**: arma, scudo, armatura, elmo, cavallo, cimelio. Le armi cambiano il modo di combattere (a due mani, asta contro cavalli, arco per tirare dal capitano, mazza che fora le corazze). Gli oggetti vengono da botteghe (scorte che girano), offerta unica di ogni capitale, bottino, rovine, capibanda, incarichi.
- **Personaggi unici**: 10 compagni con luogo e storia, 6 capibanda nei covi, la Volpe Rossa che gira il mondo, signori con un tratto che cambia come trattano.
- **Mondo**: quattro volte l'area di prima; porti (traversate), monasteri (cure, benedizione), locande (voci, compagni), rovine e covi (assalti).

### Prestazioni (misurate, Chromium senza scheda grafica, 390×844)
Costruzione della mappa 0,3 s; circa 330 mila triangoli a fotogramma contro 1,16 milioni prima di accendere lo scarto dei boschi fuori campo
(in r128 `InstancedMesh` nasce con `frustumCulled=false`: va acceso a mano con una sfera propria). 5,5 fotogrammi/s contro i 4,5 della mappa piccola di prima.

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

## Misure del bot (60 giorni, capitano accorto, semi 3, 11, 29)
Compagnia 40–46 uomini, fama 147–231, 21–40 battaglie vinte, nessun seme in rovina; il capitano sconsiderato perde più di quanto vince.
Battaglie giocate: 30–90 secondi di scontro a ×1 più l'avvicinamento.

## Multiplayer
- **C2 fatto**: co-op in stanza live (`R.mode='rt'`). Stato `G={w,b,vel,nb,sim:true}`: `w` è il mondo di VEN, `b.c` la battaglia di VCAM. Chiunque dà la meta e compra; ognuno ha il suo capitano (abilità ed equipaggiamento propri) e in battaglia guida solo quello; gli ordini ai gruppi sono di tutti. La battaglia parte quando qualcuno dà il via, la pausa è comune.
- Le mosse passano da `SYNC.mossa` (gioco simultaneo: se la stanza è andata avanti la mossa si rigioca sullo stato nuovo); ogni tanto parte un punto fermo `tempo`.
- C3: **mondo persistente a distanza** su Firestore (partite asincrone). C4: banda contro banda.

## Da fare
- Alleanze tra regni decise dal giocatore, altri talenti, dialoghi più lunghi con signori e compagni (riuso di `ARAC`).
- Vista TV dedicata per la stanza; salvataggio sull'account (oggi solo sul telefono, e la stanza vive finché è aperta).
- Ripiego senza WebGL (oggi la modalità chiede il 3D).
- Prestazioni e co-op su telefoni veri: provati solo in Chromium senza scheda grafica, la co-op con due telefoni simulati.
