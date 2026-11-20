/* ---- Compagnia di ventura, la sfida al capo (passo 35). Dopo 28ke, prima di 28l. ----
   Prima di una battaglia contro un signore, un capobanda o la Volpe, il capitano ne sfida il capo a duello davanti alle schiere (arena dei tornei, uno contro uno).
   Si attacca ai ganci `anteprima` (il bottone `sfida`), `scelta` (`sfida`, `sfida:K`, `sfida:p`, `sfida:p:K`: K = capitano che sfida, `p` = posta in palio),
   `scheda` (durante il duello è la scheda dell'arena; poi morale e capo ferito della battaglia vera) ed `esito` (gestisce il risultato del duello).
   Agisce solo con `VDAT.ACCESO.consiglio` (rilascio 3). `s.incontro.sfida` ∈ undefined|'duello'|'vinta'|'persa'|'rifiutata' (facoltativo); `inc.sfk` = capitano, `inc.posta` = monete in palio.
   `VEN.sfidaOk(s,{posta,k})` → {ok,f:[{n,v}],tx,err?}: il conto in chiaro dell'accettazione, senza dadi.
   Motore puro: niente Math.random, Date.now, pow/exp/log né trigonometria. */
Object.assign(VDAT,{SFIDA:{
 POSTA:100,LIV_CRUDELE:5,FAMA:5,                    // l'avido accetta se metti in palio 100 monete (le paga chi perde); il crudele conta per sé il livello 5
 MOR_VINTA:-20,MOR_PERSA:-15,MOR_RIFIUTO:-10,       // morale iniziale: del nemico dopo un duello vinto, del tuo dopo uno perso, del nemico se rifiuta davanti ai suoi
 CAPO_FERITO:.5,PERSA_PF:.5,                        // il capo sconfitto parte con la metà della vita; chi perde combatte a metà fino a sera
 BANDA_RESA:.5}});                                  // contro i predoni la banda si arrende: metà del bottino di una vittoria
Object.assign(VEN,(()=>{const{D,L,MURA,P,TU,aggiungi,capi,giorno,limitePrig}=VEN._,S=VDAT.SFIDA;
 const attivo=()=>!!VDAT.ACCESO.consiglio;
 const maius=t=>t.charAt(0).toUpperCase()+t.slice(1);
 // ---------- chi c'è da sfidare ----------
 // il capo del primo nemico: {k:'sig'|'riv'|'pre', faz, nome, p?, sg?, cb?, luogo?} · {assedio:true} se è un assedio · null se non c'è nessuno
 function capoDi(s){const inc=s.incontro;if(!inc)return null;
  if(inc.tipo==='assalto'){const l=s.l[inc.lid];if(!l)return null;if(MURA[l.tipo])return{assedio:true};
   const cb=l.tipo==='covo'&&l.boss&&l.g.some(e=>e.t===l.boss&&e.n>0)?D.CAPIBANDA.find(c=>c.id===l.boss):null;return cb?{k:'pre',faz:'pre',nome:maius(cb.nome),cb,luogo:l}:null}
  if(inc.tipo!=='nemico')return null;const p=VEN.schieramenti(s).nem[0];if(!p)return null;
  if(p.k==='sig'&&s.sig[p.sig])return{k:'sig',faz:p.faz,nome:s.sig[p.sig].nome,p,sg:s.sig[p.sig]};
  if(p.k==='riv')return{k:'riv',faz:p.faz,nome:maius(D.RIVALE.nome),p};
  if(p.k==='pre'){const cb=D.CAPIBANDA[p.id%D.CAPIBANDA.length];return{k:'pre',faz:'pre',nome:'Il capo di '+p.nome,cb,p}}
  return null}
 // ---------- accetta? Un conto in chiaro, senza dadi ----------
 function sfidaOk(s,o){o=o||{};const inc=s.incontro,c=capoDi(s),cs=capi(s),k=o.k|0,cap=cs[k];
  const no=err=>({ok:false,f:[],tx:'',err});
  if(!inc||!c)return no('Qui non c\'è nessun capo da sfidare');if(c.assedio)return no('Non durante un assedio');if(inc.sfida)return no('Hai già sfidato');if(!cap)return no('Capitano sconosciuto');
  if(c.k!=='sig')return{ok:true,f:[{n:c.k==='riv'?'La Volpe non rifiuta una sfida':'Un capobanda non rifiuta davanti ai suoi',v:1}],tx:'«Un duello? Vieni avanti.»'};
  const t=c.sg.tratto,f=[];
  if(t==='prode')return{ok:true,f:[{n:'Prode: non rifiuta una sfida',v:1}],tx:'«Una sfida! Era ora.»'};
  if(t==='crudele'){const suo=c.sg.liv!=null?c.sg.liv:S.LIV_CRUDELE;f.push({n:'Livello suo',v:suo},{n:'Livello di '+cap.nome,v:-cap.liv});const ok=suo>=cap.liv;
   return{ok,f,tx:ok?'«Ti spezzo davanti a tutti.»':'«Non perdo tempo con chi ne sa più di me.»'}}
  if(t==='avido'){const ok=!!o.posta;return{ok,f:[{n:'Posta in palio (la paga chi perde)',v:ok?S.POSTA:0},{n:'Posta chiesta',v:-S.POSTA}],tx:ok?'«Cento monete? Affare fatto.»':'«Per l\'onore non mi muovo. Metti cento monete sul tavolo e ne parliamo.»',posta:S.POSTA}}
  return{ok:false,f:[{n:'Prudente: non rischia la testa',v:-1}],tx:'«Non rischio la testa per il tuo orgoglio.»'}}   // prudente (e ogni indole che non conosciamo)
 // ---------- il duello: la scheda dell'arena ----------
 function statCapo(s,c){const base=c.k==='sig'?VDAT.SIG_CAMPO:c.k==='riv'?VDAT.VOLPE_CAMPO:c.cb?D.TR[c.cb.id]:null,r=VEN.rg(s,c.faz);
  const asp=c.k==='riv'?D.RIVALE.asp:c.cb?D.TR[c.cb.id].asp:{elmo:'bacinetto',arma:'spada',scudo:'tondo',cor:3,mant:1,col:r.col};
  return{nome:c.nome,pf:base.pf,att:base.att,dif:base.dif,dan:base.dan,rit:12,perf:0,git:0,vel:10,asp}}
 function schedaDuello(s){const inc=s.incontro,c=capoDi(s),cap=capi(s)[inc.sfk|0]||capi(s)[0],st=VEN.statArena(cap),ora=s.t%P.GIORNO/60;
  const io=s.ferito===giorno(s)?Object.assign({},st,{pf:Math.max(1,Math.round(st.pf*S.PERSA_PF))}):st;
  return{seme:(s.rng^s.t)|0,tipo:'arena',terreno:1,bioma:0,notte:VEN.notte(s),ora,scena:{meteo:'sereno',strada:false,pend:0,costa:null,vicino:null},a:[],
   b:[{p:-100,t:'pre_f2',n:1,st:statCapo(s,c)}],faza:'tu',fazb:c.faz,noma:s.nome,nomb:c.nome,cap:io,capi:[io],morale:55}}
 // ---------- l'anteprima: il bottone ----------
 const STATO={duello:'Hai lanciato la sfida: il duello viene prima della battaglia.',vinta:'Il capo è stato battuto in duello: la sua schiera trema.',
  persa:'Hai perso il duello: ti porti dietro le ferite e le schiere ti guardano storto.',rifiutata:'Il capo ha rifiutato davanti ai suoi: la sua schiera mormora.'};
 VEN.aggancia('anteprima',(s,a)=>{if(!attivo()||!a.loro||!a.scelte||!s.incontro)return;const inc=s.incontro;
  if(inc.sfida){a.avvisi.push(STATO[inc.sfida]);
   if(inc.sfida==='duello')for(const x of a.scelte){if(x.k==='attacca'){x.tx='Combatti il duello';x.info='Davanti alle schiere, a piedi, uno contro uno.'}else if(x.k==='auto'){x.tx='Risolvi il duello';x.info='Lasci decidere ai dadi.'}}
   return}
  const c=capoDi(s);if(!c||c.assedio)return;const cs=capi(s),oro=TU(s).oro;
  cs.forEach((cap,k)=>{const o=sfidaOk(s,{k,posta:c.k==='sig'&&c.sg.tratto==='avido'}),posta=c.k==='sig'&&c.sg.tratto==='avido';
   const tx=(cs.length>1?'Sfida con '+cap.nome:'Sfida il capo');const conto=o.f.map(x=>x.n+(x.v?' ('+(x.v>0?'+':'')+x.v+')':'')).join(' · ');
   const info='Duello a piedi, davanti alle schiere. '+(posta?'Metti in palio '+S.POSTA+' monete: le paga chi perde. ':'')+conto+'.';
   const ok=!posta||oro>=S.POSTA;a.scelte.push({k:['sfida'].concat(posta?['p']:[],k?[k]:[]).join(':'),tx,info,ok,perche:ok?undefined:'Servono '+S.POSTA+' monete',oro:posta?S.POSTA:undefined})})});
 // ---------- la scelta ----------
 VEN.aggancia('scelta',(s,v)=>{if(typeof v!=='string'||v.split(':')[0]!=='sfida'||!attivo())return;if(s.rac&&s.rac.scena)return{err:'Prima rispondi'};
  const q=v.split(':').slice(1),posta=q[0]==='p',k=+(posta?q[1]:q[0])||0,c=capoDi(s),o=sfidaOk(s,{k,posta});if(o.err)return{err:o.err};
  const inc=s.incontro,tu=TU(s),cap=capi(s)[k];
  if(c.k==='sig'&&c.sg.tratto==='avido'&&!posta)return{err:o.tx};
  if(posta&&tu.oro<S.POSTA)return{err:'Servono '+S.POSTA+' monete'};
  if(!o.ok){inc.sfida='rifiutata';L(s,c.nome+' rifiuta la sfida: '+o.tx,'male');return{s}}
  inc.sfida='duello';inc.sfk=k;inc.posta=posta?S.POSTA:0;L(s,cap.nome+' sfida '+c.nome+' davanti alle schiere: '+o.tx,'guerra');return{s}});
 // ---------- la scheda: il duello, poi la battaglia vera ----------
 // `capoB` ferito: 28kr lo assegna dopo di noi (con `true` o `'volpe'`); per non farci sovrascrivere lo teniamo come proprietà che ignora le riassegnazioni
 function capoFerito(s,sc,c){if(!VDAT.ACCESO.grandi||!c||c.k==='pre')return;const base=c.k==='riv'?VDAT.VOLPE_CAMPO:VDAT.SIG_CAMPO,v=Object.assign({},c.k==='riv'?base:null,{pf:Math.max(1,Math.round(base.pf*S.CAPO_FERITO))});
  Object.defineProperty(sc,'capoB',{get:()=>v,set:()=>{},enumerable:true,configurable:true})}
 VEN.aggancia('scheda',(s,sc)=>{if(!attivo()||!sc||!s.incontro)return;const inc=s.incontro;if(inc.tipo==='arena')return;
  if(inc.sfida==='duello'&&capoDi(s)&&!capoDi(s).assedio)return schedaDuello(s);
  const mi=Object.assign({a:0,b:0},sc.morIni);let t=false;
  if(inc.sfida==='vinta'){mi.b+=S.MOR_VINTA;t=true;capoFerito(s,sc,capoDi(s))}else if(inc.sfida==='persa'){mi.a+=S.MOR_PERSA;t=true}else if(inc.sfida==='rifiutata'){mi.b+=S.MOR_RIFIUTO;t=true}
  if(t)sc.morIni=mi});
 // ---------- l'esito del duello ----------
 VEN.aggancia('esito',(s,riep)=>{const inc=s.incontro;if(!attivo()||!inc||inc.sfida!=='duello')return;const c=capoDi(s);if(!c||c.assedio)return;
  const tu=TU(s),vinto=riep.vince==='a',cap=capi(s)[inc.sfk|0]||capi(s)[0];
  const out={vince:riep.vince,id:s.uid++,morti:0,feriti:0,oro:0,xp:0,prig:0,fama:0,bottino:[],oggetti:[],promo:false,presa:null,livello:false,sfida:vinto?'vinta':'persa'};
  if(vinto){inc.sfida='vinta';s.fama+=S.FAMA;out.fama=S.FAMA;s.stat.sfide=(s.stat.sfide||0)+1;
   if(c.k==='pre'){   // la banda getta le armi: una vittoria senza caduti, con metà del bottino, e il capobanda in catene
    L(s,cap.nome+' batte '+c.nome+': i predoni gettano le armi.','bene');const r=VEN.esito(s,{vince:'a',cad:[]});if(r.err)return r;
    const o=r.out,meta=Math.floor(o.oro*(1-S.BANDA_RESA));tu.oro-=meta;o.oro-=meta;s.fama+=S.FAMA;o.fama+=S.FAMA;o.sfida='resa';
    if(s.prig.reduce((x,e)=>x+e.n,0)<limitePrig(s)){aggiungi(s.prig,c.cb.id,1);o.prig++;L(s,c.nome+' è tuo prigioniero.','bene')}
    return r}
   L(s,cap.nome+' batte '+c.nome+' in duello (+'+S.FAMA+' fama): la sua schiera trema.','bene')}
  else{inc.sfida='persa';s.ferito=giorno(s);const pag=inc.posta?Math.min(inc.posta,tu.oro):0;if(pag){tu.oro-=pag;out.oro=-pag;if(c.p)c.p.oro+=pag}
   L(s,cap.nome+' perde il duello con '+c.nome+(pag?' e paga '+pag+' monete':'')+': fino a sera combatte a metà delle forze.','male')}
  s.ult=out;s.ev.push({t:'esito',out});return{s,out}});
 return{sfidaOk,capoSfida:capoDi}})());
