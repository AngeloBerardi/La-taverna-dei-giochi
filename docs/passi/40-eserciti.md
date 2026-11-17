---
passo: 40
titolo: Eserciti dei regni e adunate
fase: 10
area: mondo
dopo: [27, 03]
agente: programmer
modello: sonnet
impegno: alto
controllo: forte
file:
  - src/js/motori/28kn-ven-eserciti.js
---

# Passo 40 — Eserciti dei regni e adunate

**In breve.** In guerra i signori si radunano dietro un maresciallo e marciano insieme; da vassallo vieni convocato.

**Acceso da.** `VDAT.ACCESO.eserciti` (rilascio 5, passo 46). Spento, nessun ascoltatore fa nulla e `s.eserciti` non nasce.

## Scopo

In guerra i signori non vagano più da soli: un maresciallo del regno chiama l'adunata, i signori si radunano e marciano insieme su un obiettivo (assedio, soccorso, razzia). Da vassallo vieni convocato; puoi seguire l'esercito e combattere con lui; da sovrano lo chiami tu.

## Leggi prima

`docs/passi/04-ganci.md` (ganci `giorno`, `scontro`, `incontro`, `scheda`, `fatto`, `effetto`; `VEN.decidi`, `VEN.molt` con `marcia`, `VEN._`); `pensa` e `oraNuova` in `28ka`; `faiRegno` (`aduna`) in `28kd`; `contatti` in `28k`. Le scene `adunata-*` le scrive il passo 42.

## Decisioni

1. **Tutto in `28kn-ven-eserciti.js`**, numeri in testa al file: `VDAT.ESERCITI={NASCE:.35,MIN:3,MAX:6,RAGGIO:6,ADUNA:2,DURATA:15,META:.5,LONTANO:40,STRETTI:1.4,AIUTO:3,PRESENTE:2,ENTRO:4,FIDUCIA:5,PAGA:3,IGNORA:-10,FEUDO:3}`.
2. **Stato** (facoltativo, assente = nessun esercito): `s.eserciti=[{id,faz,capo,membri:[pid],obiettivo:{tipo,lid},stato,da,f0}]`, `stato` ∈ `'aduna'|'marcia'|'assedia'|'sciolto'`, `da` giorno di nascita, `f0` somma di `VEN.forza` all'inizio; sulla parte `p.es=id`. Da vassallo `s.convoca={eid,fino,presente}` e `s.disobb` (contatore, assente = 0). Gli id vengono da `s.uid++`.
3. **Nascita** (ascoltatore di `giorno`): per ogni regno `f` di `VEN.regni(s)` in guerra con qualcuno (`VEN.inGuerra`) e senza esercito vivo, con probabilità `NASCE` (dal `rnd` del mondo): servono almeno `MIN` signori liberi di `f` (`k:'sig'`, non prigionieri, `!p.sc`, senza `p.es`). **Maresciallo**: il signore con la `VEN.forza` più alta (+20 per punto di `sg.esp` se esiste); il re solo se il regno ha meno di 4 signori. **Membri**: fino a `MAX` (maresciallo compreso), i più vicini entro `RAGGIO` caselle dal maresciallo.
4. **Obiettivo**, scelto alla nascita e alla fine di ogni obiettivo raggiunto: un proprio luogo assediato entro `LONTANO` → `soccorso`; altrimenti il luogo murato nemico più vicino entro `LONTANO` con forza della guarnigione × `P.MURA` < 1,2 × forza dell'esercito → `assedio`; altrimenti il villaggio nemico non saccheggiato più vicino → `razzia`; nessuno → si scioglie.
5. **Movimento** (`VEN.decidi` composto): `aduna` → i membri vanno dal maresciallo, che resta fermo; dopo `ADUNA` giorni `marcia`, e chi non è arrivato lascia l'esercito. `marcia` → il maresciallo riceve `ia.st=obiettivo.tipo`, `ia.a=obiettivo.lid` e la decisione di oggi fa il resto; un membro oltre `STRETTI` caselle va dal maresciallo, altrimenti copia `ia.st` e `ia.a` del maresciallo (così entra nello stesso assedio). Con `l.ass` dell'esercito → `assedia`. `VEN.molt(s,'marcia',{p})` del maresciallo = il minimo, tra i membri, di velocità del membro / velocità del maresciallo (con una guardia contro la ricorsione).
6. **Scioglimento** (in `giorno`): obiettivo compiuto (luogo preso, saccheggiato, assedio tolto), `DURATA` giorni da `da`, forza sotto `META`·`f0`, maresciallo perso, o pace con tutti. `stato='sciolto'` per un giorno (la vista mostra il segnalino che si disfa), poi l'esercito è tolto e `p.es` cancellato.
7. **In battaglia**: ascoltatore di `scontro` → i membri entro `AIUTO` caselle, liberi, entrano nello stesso lato; di `incontro` → idem in `inc.pid` (così `VEN.campo` li somma da sé nelle ondate e nella riserva), con il **maresciallo messo per primo**; ascoltatore di `scheda` → se il maresciallo è tra i nemici, `capoB` è lui (formato del passo 16). Chi gioca si unisce a una mischia dell'esercito come oggi (incontro `mischia`).
8. **Da vassallo** (`s.servizio.tipo==='vas'`): quando nasce un esercito del tuo re, `s.convoca={eid,fino:giorno+ENTRO,presente:false}` e `VEN.accoda(s,'adunata-convoca',sg del maresciallo)`. Sei presente se arrivi entro `PRESENTE` caselle dal maresciallo prima di `fino`. Allo scioglimento: presente → `relaz` +`FIDUCIA` col re e `PAGA`×uomini monete; assente → `relaz` `IGNORA` e `s.disobb++`; a `FEUDO` disobbedienze perdi il feudo (i luoghi con `sig===-2` tornano come in `lascia`) e la scena `adunata-feudo`. Effetto nuovo `{t:'ven',k:'adunata',v:0|1}` (gancio `effetto`): `v:0` è «non vengo», conta subito come assente.
9. **Da sovrano**: ascoltatore di `fatto` per `{a:'aduna'}` riuscita (l'adunata di oggi è già fatta dal nucleo): mette `ia.fine=s.t+DURATA` giorni e un esercito `{faz:'tu',capo:0,obiettivo:null,stato:'marcia'}` che segue te (il nucleo li fa già seguire).

## Stato e contratti

`s.eserciti`, `p.es`, `s.convoca`, `s.disobb` (tutti facoltativi). `VEN.esercitoDi(s,pid)` (nuova) → l'esercito o `null`; `VEN.eserciti(s)` (nuova) → `[{id,faz,capo,n,x,y,stato}]` per la vista (`n` = uomini, posizione del maresciallo).

## Prove

- `tests/test_ven_p40.js` (acceso in memoria):
  - (a) seme 3, guerra imposta tra due regni: entro 5 giorni ognuno ha un esercito di 3–6 membri, maresciallo non re;
  - (b) dopo 2 giorni `stato==='marcia'`; un signore messo a 10 caselle non ne fa parte;
  - (c) a 15 giorni l'esercito è sciolto e nessun `p.es` resta;
  - (d) uno scontro con un membro tira dentro gli altri entro 3 caselle; un `incontro` ha il maresciallo per primo;
  - (e) vassallo presente: relazione +5 e oro +3×uomini; tre assenze: nessun luogo con `sig===-2`;
  - (f) sovrano: `aduna` dà un esercito `faz:'tu'` e signori con `ia.fine` a 15 giorni;
  - (g) spento: dopo 60 giorni `s.eserciti` è assente; i salvataggi di `tests/fixture/ven/` si aprono e girano 10 giorni acceso.
- Impronta identica.
- `tests/test_ven_p40_lento.js`, semi 3, 11, 29, 41, 57, 73, bot 120 giorni, acceso: ogni regno in guerra per almeno 10 giorni ha formato un esercito in 6 semi su 6; luoghi passati di mano ≤ 2× quelli a spento + 2; tempo per giorno simulato ≤ 1,2× quello a spento (nella PR i numeri).

## Regole per il giocatore

Le scrive chi esegue, **in questo file**, a lavoro finito: 3–6 righe per chi gioca, parole nostre, niente numeri interni. Le copierà nelle regole il passo del rilascio.

## Fuori scopo

Il segnalino sulla mappa (lo disegna il passo 45 dai dati di `VEN.eserciti`), i testi delle lettere (passo 42).

## Fatto quando

Prove verdi, impronta identica.
