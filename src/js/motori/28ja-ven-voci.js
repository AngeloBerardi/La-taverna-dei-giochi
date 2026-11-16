/* ---- Compagnia di ventura, dialoghi (V6b): i testi delle scene, come dati. Nessuna logica: la legge VEN (28k) e le fa girare ARAC (27q). ----
   `VVOC` è un capitolo del motore di racconto: {id, titolo, personaggi, bandiere, ingressi, scene}. Le scene non hanno `dove`: le avvia il mondo (VEN.accoda).
   Nomi delle scene (solo a-z0-9-): `<c>-lamento`, `<c>-addio`, `<c>-inc-1..3` (<c> = id del compagno senza `co_`), `volpe-1..3`, `sig-<tratto>-<livello>` (livelli 1..3).
   Le scene leggono solo i fatti che il mondo copia in `bandiere` prima di ogni mossa: grad-<c> (gradimento), inc-<c> (passi compiuti), con-<c> (in compagnia), serve-<regno>, fama, tappa, giorno,
   più le bandiere che impostano da sé (volpe-patto, volpe-odio, volpe-debito).
   Effetti del mondo: {t:'ven',k:'grad',id,n} · {k:'via',id} · {k:'passo',id} · {k:'premio',id} · {k:'scontro'} · {k:'conf',n} · {k:'tappa'}; {t:'oro',n}. Elenco in VEN.EFF_VOCI.
   PROVV: i testi qui sotto sono provvisori e brevi (servono a provare il motore): V6c li riscrive. */
const VVOC=(()=>{
 const D=typeof VDAT!=='undefined'?VDAT:require('./28j-ven-dati.js');
 const personaggi={_:{nome:''},rv_volpe:{nome:D.RIVALE.nome.replace(/^la /,'La ')},signore:{nome:'Il signore'}};
 for(const c of D.COMPAGNI)personaggi[c.id]={nome:c.nome};
 // scorciatoie per scrivere le scene: fine di scena, effetti
 const gr=(id,n)=>({t:'ven',k:'grad',id,n}),ven=(k,x)=>Object.assign({t:'ven',k},x||{}),oro=n=>({t:'oro',n});
 const scene={
  // PROVV
  'berta-lamento':{inizio:'a',nodi:{
   a:{chi:'co_berta',testo:'«Capitano, le botte le prendo volentieri, ma così non resto. Mi serve una ragione per restare.»',scelte:[
    {t:'Hai ragione. Le cose cambieranno.',effetti:[gr('co_berta',10)],fine:true},
    {t:'Tieni, per il disturbo.',se:{oro:40},effetti:[oro(-40),gr('co_berta',6)],fine:true},
    {t:'Se non ti sta bene, la porta è là.',effetti:[gr('co_berta',-8)],fine:true}]}}},
  'berta-addio':{inizio:'a',nodi:{a:{chi:'co_berta',testo:'«Me ne vado. Non ti serbo rancore, capitano: ma l\'ascia la porto altrove.»',fine:true}}},
  'berta-inc-1':{inizio:'a',nodi:{
   a:{chi:'co_berta',testo:'«Capitano, a Roccadoro ho steso un conte, ed è per questo che porto l\'ascia da sola. Voglio rimettere piede in città a testa alta. Mi ci porti?»',scelte:[
    {t:'Andiamo a Roccadoro, insieme.',effetti:[gr('co_berta',4),ven('passo',{id:'co_berta'})],fine:true},
    {t:'Dimmi prima cosa ti aspetta laggiù.',vai:'b'}]},
   b:{chi:'co_berta',testo:'«Niente di buono, ma niente di peggio di quel che ho già visto. Se ci sei tu, mi basta.»',scelte:[
    {t:'Allora si parte.',effetti:[gr('co_berta',2),ven('passo',{id:'co_berta'})],fine:true}]}}},
  'berta-inc-2':{inizio:'a',nodi:{
   a:{chi:'co_berta',testo:'«Roccadoro mi ha riabbracciata, quasi. Ora voglio dimostrare che quest\'ascia serve: battiamo un signore di Valdoro in campo aperto, e che si sappia chi era in prima fila.»',scelte:[
    {t:'Sarà fatto.',effetti:[gr('co_berta',3),ven('passo',{id:'co_berta'})],fine:true},
    {t:'Prima servono più uomini. Ma ci sto.',effetti:[gr('co_berta',1),ven('passo',{id:'co_berta'})],fine:true}]}}},
  'berta-inc-3':{inizio:'a',nodi:{
   a:{chi:'co_berta',testo:'«L\'ultimo conto: un covo di predoni, di quelli veri. Poi smetto di cercare scuse.»',scelte:[
    {t:'Li stanaremo.',effetti:[gr('co_berta',3),ven('passo',{id:'co_berta'})],fine:true},
    {t:'Se è l\'ultimo, d\'accordo.',effetti:[ven('passo',{id:'co_berta'})],fine:true}]}}},
  'volpe-1':{inizio:'a',nodi:{
   a:{chi:'rv_volpe',testo:'«Così sei tu il capitano di cui si parla. Io sono la Volpe Rossa, e la strada è larga abbastanza per due compagnie. Per ora.»',scelte:[
    {t:'Larga anche per un patto.',vai:'b'},
    {t:'La mia strada la tengo da solo.',vai:'c'}]},
   b:{chi:'rv_volpe',testo:'«Un patto, dunque. Ricordatene quando ti servirà.»',effetti:[{t:'bandiera',id:'volpe-patto'},ven('tappa')],fine:true},
   c:{chi:'rv_volpe',testo:'«Come vuoi. Non dire che non ti ho teso la mano.»',effetti:[{t:'bandiera',id:'volpe-odio'},ven('tappa')],fine:true}}},
  'volpe-2':{inizio:'a',nodi:{
   a:{chi:'rv_volpe',testo:'«Rieccomi. Sai com\'è, le strade si incrociano.»',scelte:[
    {t:'Il nostro patto vale: dividiamo il bottino.',se:'volpe-patto',vai:'b'},
    {t:'Non ho nulla da spartire con te.',se:{non:'volpe-patto'},vai:'c'},
    {t:'Mi serve un favore, Volpe.',vai:'d'}]},
   b:{chi:'rv_volpe',testo:'«Brava gente, chi mantiene i patti. Tieni la tua parte.»',effetti:[oro(80),ven('tappa')],fine:true},
   c:{chi:'rv_volpe',testo:'«Allora ricordati che anch\'io ho memoria.»',effetti:[{t:'bandiera',id:'volpe-odio'},ven('tappa')],fine:true},
   d:{chi:'rv_volpe',testo:'«Un favore? Lo farò. E poi mi dovrai qualcosa.»',effetti:[{t:'bandiera',id:'volpe-debito'},ven('tappa')],fine:true}}},
  'volpe-3':{inizio:'a',nodi:{
   a:{chi:'rv_volpe',testo:'«Ultima volta che ti incrocio, capitano. Finiamola: con l\'acciaio, con un dono, o con una stretta di mano.»',scelte:[
    {t:'Con l\'acciaio.',vai:'b'},
    {t:'Dammi la tua cavalla, come pegno.',se:'volpe-patto',vai:'c'},
    {t:'Una stretta di mano, e basta.',vai:'d'}]},
   b:{chi:'rv_volpe',testo:'«Che sia, allora.»',effetti:[ven('scontro'),ven('tappa')],fine:true},
   c:{chi:'rv_volpe',testo:'«Prendila. Ti servirà più che a me.»',effetti:[ven('premio',{id:'rv_volpe'}),ven('tappa')],fine:true},
   d:{chi:'rv_volpe',testo:'«Una mano è tutto ciò che resta, quando non si sa chi vince.»',effetti:[ven('tappa')],fine:true}}}
 };
 // bandiere (i fatti copiati dal mondo) e ingressi (ogni scena può essere avviata dal mondo): calcolati dai nomi
 const bandiere=['fama','tappa','giorno'].concat(D.REGNI.map(f=>'serve-'+f));
 for(const c of D.COMPAGNI){const k=c.id.slice(3);bandiere.push('grad-'+k,'inc-'+k,'con-'+k)}
 return{id:'ventura',titolo:'Voci della compagnia',personaggi,bandiere,ingressi:Object.keys(scene),scene}})();
if(typeof module!=='undefined')module.exports=VVOC;
