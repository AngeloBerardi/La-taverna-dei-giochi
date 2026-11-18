/* ---- Compagnia di ventura, Corte: diplomazia (`proposta`), regno, lealtà dei signori, feudi, conquista, vittoria. Motore puro, senza DOM né rete. ----
   Estensione di VEN (28k): aggiunge le sue funzioni allo stesso oggetto; gli aiutanti del nucleo arrivano da `VEN._`,
   le funzioni degli altri file si chiamano `VEN.nome(...)`. Piano: docs/passi/01-spacca-mondo.md. */
Object.assign(VEN,(()=>{
 const{D,L,M0,MURA,P,TU,abil,aggiungi,alleate,alleatoDi,chiave,dist,fazioni,forza,forzaTr,giorno,inGuerra,leva,nomeF,nuovaP,part,relaz,rnd,togliUomini,viva}=VEN._;
 // forza di un regno: guarnigioni (con le mura) e compagnie dei suoi signori; il dominante è chi tiene troppo (quota di luoghi dei regni o di forza)
 const forzaRegno=(s,f)=>s.l.filter(l=>l.faz===f).reduce((x,l)=>x+forzaTr(l.g)*(MURA[l.tipo]?P.MURA:1),0)+s.p.filter(p=>p.k==='sig'&&p.faz===f).reduce((x,p)=>x+forza(p),0)+(f==='tu'?forza(TU(s)):0);
 function dominante(s){const vivi=fazioni(s).filter(f=>viva(s,f));if(vivi.length<3)return null;const nl=vivi.map(f=>s.l.filter(l=>l.faz===f).length),fr=vivi.map(f=>forzaRegno(s,f)),tl=nl.reduce((a,b)=>a+b,0),tf=fr.reduce((a,b)=>a+b,0);let m=null,mq=0;
  vivi.forEach((f,i)=>{const q=Math.max(tl?nl[i]/tl:0,tf?fr[i]/tf:0);if(q>mq){mq=q;m=f}});return mq>=D.DIPL.QUOTA_DOM?{f:m,quota:mq}:null}
 const guerreDi=(s,f)=>fazioni(s).filter(x=>x!==f&&viva(s,x)&&inGuerra(s,f,x)).length;
 // la proposta di chi gioca al re `a` riguardo al regno `b` ('pace' | 'alleanza' | 'guerra' | 'rompi'): un conto con i fattori in chiaro, lo stesso che usa `fai`.
 // Ritorna {tipo,a,b,f:[{n,v}],tot,ok} oppure {err}. Non tira dadi e non tocca lo stato.
 function proposta(s,tipo,a,b){const X=D.DIPL,sov=b==='tu'&&!!s.corona&&!s.servizio,srv=sov?{faz:'tu',tipo:'re'}:s.servizio;
  if(!srv)return{err:'Un capitano senza bandiera non ha voce presso i re'};
  if(sov&&(tipo==='guerra'||tipo==='rompi'))return{err:'Per la guerra e per le rotture usa le tue azioni'};
  if(!X.BASE.hasOwnProperty(tipo)&&tipo!=='rompi')return{err:'Proposta sconosciuta'};
  if(!VEN.regni(s).includes(a)||!(VEN.regni(s).includes(b)||sov)||a===b)return{err:'Regno sconosciuto'};
  if(!sov&&srv.faz!==a)return{err:'Parli per chi servi: qui non hai voce'};
  if(!sov&&srv.tipo==='mer'&&tipo!=='pace')return{err:'Un mercenario a contratto può chiedere solo la pace'};
  if(s.cadute[a]||(!sov&&s.cadute[b]))return{err:'Quel regno è caduto'};
  if(s.parola&&s.parola[a]>giorno(s))return{err:VEN.rg(s,a).re+' ti riceverà di nuovo il giorno '+s.parola[a]};
  const guerra=inGuerra(s,a,b),al=alleate(s,a,b);
  if(tipo==='pace'&&!guerra)return{err:'Non siete in guerra con '+nomeF(s,b)};
  if(tipo==='alleanza'){if(guerra)return{err:'Prima la pace: con '+nomeF(s,b)+' siete in guerra'};if(al)return{err:'Siete già alleati'};if(alleatoDi(s,a)||alleatoDi(s,b))return{err:'Uno dei due ha già un alleato'}}
  if(tipo==='guerra'){if(guerra)return{err:'Siete già in guerra'};if(al)return{err:'Sono vostri alleati: rompete prima l\'alleanza'}}
  if(tipo==='rompi'){if(!al)return{err:'Non siete alleati'};if(s.alleanza[chiave(a,b)].rompe)return{err:'La rottura è già annunciata'};return{tipo,a,b,f:[],tot:0,ok:true}}
  const peso=X.PESO[srv.tipo],f=[],aggiungi=(n,v)=>{v=Math.round(v*10)/10;if(v)f.push({n,v})},re=s.sig.find(x=>x.faz===a&&x.re),tr=D.TRATTI[re&&re.tratto];
  aggiungi(tipo==='pace'?'Il re non ha nulla da perdere':'Diffidenza del re',X.BASE[tipo]);
  aggiungi('Amicizia col regno',peso*s.rel[a]/X.AMICIZIA);
  aggiungi('Fama della compagnia',peso*Math.min(s.fama,X.FAMA_MAX)/X.FAMA);
  if(!sov)aggiungi('Opinione di '+nomeF(s,b)+' su di te',(tipo==='guerra'?-1:1)*peso*s.rel[b]/(2*X.AMICIZIA));
  if(tr&&tr.dipl)aggiungi('Indole del re ('+tr.nome+')',tr.dipl[tipo]);
  const fa=forzaRegno(s,a),fb=forzaRegno(s,b),rel=fa+fb>0?(fb-fa)/(fa+fb):0;
  aggiungi(tipo==='guerra'?'Forza relativa: '+(rel<0?'sei più forte':'sei più debole'):'Forza relativa',(tipo==='guerra'?-1:1)*X.FORZA*rel);
  aggiungi(tipo==='pace'?'Stanchezza di guerra':tipo==='guerra'?'Guerre già in corso':'Nemici da fronteggiare',X.GUERRE[tipo]*guerreDi(s,a));
  aggiungi('Diplomazia del capitano',.4*abil(s,'diplomazia'));
  aggiungi('Sostegno dei signori',D.SIG.SOSTEGNO*Math.min(D.SIG.MAX_SOST,s.sig.filter(x=>x.faz===a&&VEN.confidenza(s,x)>=3).length));
  const dom=dominante(s);
  if(tipo==='alleanza'){const c=fazioni(s).filter(x=>x!==a&&x!==b&&viva(s,x)&&inGuerra(s,a,x)&&inGuerra(s,b,x)).length;aggiungi('Nemico in comune',X.COMUNE*c);if(dom&&dom.f!==a&&dom.f!==b)aggiungi(nomeF(s,dom.f)+' vince troppo',X.DOMINANTE)}
  if(tipo==='guerra'&&dom&&dom.f===b)aggiungi(nomeF(s,b)+' vince troppo',X.DOMINANTE);
  const tot=Math.round(f.reduce((x,y)=>x+y.v,0)*10)/10;return{tipo,a,b,f,tot,ok:tot>=0}}
 function conquista(s,l,faz,sigId){const prima=l.faz,persi=prima==='tu'?[l,...s.l.filter(v=>v.capo===l.id&&!MURA[v.tipo])].map(v=>v.sig).filter(x=>x>=0):[];l.faz=faz;l.sig=sigId;l.ass=null;l.rel=0;for(const v of s.l)if(v.capo===l.id&&!MURA[v.tipo]){v.faz=faz;v.sig=sigId}
  L(s,l.nome+' cade: ora è '+(faz==='tu'?'tua':'di '+VEN.rg(s,faz).breve)+'.','guerra');s.ev.push({t:'conquista',lid:l.id,faz});
  if(prima!=='tu'&&VEN.regni(s).includes(prima)&&!s.l.some(x=>x.faz===prima&&MURA[x.tipo])){s.cadute[prima]=giorno(s);L(s,VEN.rg(s,prima).nome+' non ha più mura: il regno è caduto.','guerra');
   const suoi=s.sig.filter(sg=>sg.faz===prima);
   for(const sg of s.sig)if(sg.faz===prima){const p=part(s,sg.pid);if(sg.re||!p){if(p)VEN.rimuovi(s,p);sg.pid=-1}else daEsule(s,sg,p)}for(const v of s.l)if(v.faz===prima){v.faz=faz;v.sig=sigId}
   VEN.ganci('regno-cade',s,prima,faz,suoi)}
  if(prima==='tu'&&s.corona){if(s.l.some(x=>x.faz==='tu'&&MURA[x.tipo])){const sd=s.l[s.corona.sede];if(!sd||sd.faz!=='tu'){const n=s.l.find(x=>x.faz==='tu'&&MURA[x.tipo]);s.corona.sede=n.id}}else cadeCorona(s)}
  if(prima==='tu'&&s.corona)for(const id of new Set(persi))perdeFeudo(s,id);
  VEN.vittoria(s);VEN.ganci('luogo',s,l,'conquista')}
 // un signore senza più regno (o senza feudo) diventa esule: gira da neutrale e dopo ESILIO giorni sparisce, a meno che tu non lo convinca
 function daEsule(s,sg,p){sg.cult=sg.cult||sg.faz;sg.esule=sg.cult;sg.esilio=giorno(s)+D.REGNO.ESILIO;sg.faz='neu';if(p){p.faz='neu';p.dentro=-1;p.via=[];p.ia={st:'esilio',t:0}}}
 // la corona cade con l'ultima fortezza: guerre e alleanze del regno finiscono, i signori diventano esuli, i compagni investiti tornano con te
 function cadeCorona(s){const g=giorno(s),tu=TU(s);L(s,'Cade l\'ultima fortezza: il regno '+s.corona.nome+' è finito.','guerra');s.corona=null;
  for(const k of Object.keys(s.guerra))if(k.split('|').includes('tu'))delete s.guerra[k];for(const k of Object.keys(s.alleanza||{}))if(k.split('|').includes('tu'))delete s.alleanza[k];
  for(const sg of s.sig)if(sg.faz==='tu'||sg.comp){const p=part(s,sg.pid);if(sg.comp){if(p)VEN.rimuovi(s,p);sg.pid=-1;aggiungi(tu.tr,sg.comp,1);s.compagni[sg.comp]=-1;sg.faz='neu';sg.comp=null;sg.esilio=0;sg.esule=null}else daEsule(s,sg,p)}
  for(const l of s.l)if(l.faz==='tu'&&l.sig>=0)l.sig=-1;s.ev.push({t:'corona-cade'})}
 function confinanti(s){return VEN.regni(s).filter(f=>!s.cadute[f]&&s.l.some(l=>l.faz===f&&s.l.some(m=>m.faz==='tu'&&dist(l,m)<=D.REGNO.CONFINE)))}
 // vittoria: tutte le capitali (le città) in mano tua con la corona, o del tuo re se sei vassallo; si scrive una volta sola e la partita continua
 function vittoria(s){if(s.vinta)return;const cap=s.l.filter(l=>l.tipo==='citta');if(!cap.length)return;let come=null;
  if(s.corona&&cap.every(l=>l.faz==='tu'))come='re';else if(s.servizio&&s.servizio.tipo==='vas'&&cap.every(l=>l.faz===s.servizio.faz))come='vassallo';
  if(!come)return;s.vinta={g:giorno(s),come};if(s.geo===2)s.vinta.unif=true;   // nei mondi a molti regni è l'«Unificatore»
  L(s,come==='re'?'Tutte le capitali sono tue: '+s.corona.nome+' unifica le terre.':'Il tuo sovrano tiene tutte le capitali: le terre sono unite.','bene');s.ev.push({t:'vittoria',come})}
 // aggredire gente di un regno: l'opinione crolla e, con la corona, è guerra (cade l'eventuale alleanza)
 function inimica(s,f){relaz(s,f,Math.min(-30-s.rel[f],-30));if(s.corona){delete s.alleanza[chiave('tu',f)];s.guerra[chiave('tu',f)]=true;delete s.corona.minacce[f]}}
 // lealtà di un signore che valuta di passare a te in cambio del feudo `lid`: un conto con i fattori in chiaro, senza dadi ({f,tot,ok} oppure {err})
 function lealta(s,sid,lid){const sg=s.sig[sid],l=s.l[lid],P2=D.REGNO.PASSA;
  if(!s.corona)return{err:'Non hai un regno'};if(!sg||sg.faz==='tu')return{err:'Non è un signore da convincere'};if(sg.re)return{err:'Un sovrano non si piega così'};
  if(!l||l.faz!=='tu'||l.sig>=0)return{err:'Serve un tuo luogo tenuto da offrire in feudo'};if(l.id===s.corona.sede)return{err:'La sede del regno resta tua'};
  const f=[],ag=(n,v)=>{v=Math.round(v*10)/10;if(v)f.push({n,v})},t=D.TRATTI[sg.tratto],reg=VEN.regni(s).includes(sg.faz);
  ag('Giuramento al suo signore',P2.BASE);if(sg.faz==='neu'&&sg.esule)ag('Senza più patria',P2.ESULE);if(t)ag('Indole ('+t.nome+')',t.passa||0);
  ag('Amicizia personale',(sg.am||0)/P2.AMICIZIA);ag('Fama della compagnia',Math.min(s.fama,P2.FAMA_MAX)/P2.FAMA);
  if(reg&&s.l.filter(x=>x.faz===sg.faz&&MURA[x.tipo]).length<=2)ag('Il suo regno è debole',P2.DEBOLE);if(reg&&inGuerra(s,sg.faz,'tu'))ag('In guerra col tuo regno',P2.GUERRA);
  ag('Il feudo offerto ('+l.tipo+')',P2.FEUDO[l.tipo]||0);
  const tot=Math.round(f.reduce((x,y)=>x+y.v,0)*10)/10;return{f,tot,ok:tot>=0}}
 function daiFeudo(s,l,sid){l.sig=sid;for(const v of s.l)if(v.capo===l.id&&!MURA[v.tipo])v.sig=sid}
 // un signore passa a te nell'incontro: i suoi luoghi restano senza signore, lui prende il feudo offerto e porta con sé le sue truppe
 function passaA(s,p,lid){const sg=p.k==='sig'?s.sig[p.sig]:null;if(!sg)return{err:'Non è un signore'};const R=lealta(s,sg.id,lid);if(R.err)return R;if(!R.ok)return{err:sg.nome+' rifiuta: il conto dà '+R.tot+' (serve 0)'};
  const l=s.l[lid],vecchia=sg.faz;sg.cult=sg.cult||(VEN.regni(s).includes(vecchia)?vecchia:sg.esule||vecchia);for(const x of s.l)if(x.sig===sg.id)x.sig=-1;
  sg.faz=p.faz='tu';sg.esule=null;sg.esilio=0;sg.casa=lid;daiFeudo(s,l,sg.id);p.via=[];p.fermo=0;p.ia={st:'giro',t:0};if(VEN.regni(s).includes(vecchia))relaz(s,vecchia,-15);
  L(s,sg.nome+' giura a '+s.corona.nome+' e riceve '+l.nome+'.','bene');s.ev.push({t:'passa',sid:sg.id});s.incontro=null;return{s}}
 // ---------- azioni nei luoghi ----------
 // regno (V4): fondare un regno nella propria fortezza (città o castello tuo, fama e monete) e le prime mosse dei confinanti
 function fondaRegno(s,z,l,dentro,mio){const R=D.REGNO,tu=TU(s),r=rnd(s),g=giorno(s);
  if(s.corona)return{err:'Hai già un regno'};if(s.servizio)return{err:'Prima sciogli il tuo legame'};
  if(!dentro||!mio||l.faz!=='tu'||(l.tipo!=='citta'&&l.tipo!=='castello'))return{err:'Serve una tua città o un tuo castello, e devi essere dentro'};
  if(s.fama<R.FAMA)return{err:'Serve fama '+R.FAMA};if(tu.oro<R.ORO)return{err:'Servono '+R.ORO+' monete'};
  const nome=String(z.nome==null?'':z.nome).trim().slice(0,24);if(!nome)return{err:'Dai un nome al regno'};const st=z.stend==null?0:z.stend|0;if(!(st>=0&&st<R.STENDARDI.length))return{err:'Stendardo sconosciuto'};
  tu.oro-=R.ORO;s.corona={nome,stend:st,da:g,sede:l.id,malc:0,minacce:{}};const conf=confinanti(s);
  for(const f of VEN.regni(s)){if(s.cadute[f])continue;const vic=conf.includes(f);
   if(vic&&s.rel[f]>=R.AMICO){relaz(s,f,5);L(s,nomeF(s,f)+' propone pace a '+nome+'.','bene')}
   else if(s.rel[f]<=-25){s.guerra[chiave('tu',f)]=true;L(s,nomeF(s,f)+' ti dichiara guerra.','guerra')}
   else if(vic)s.corona.minacce[f]=g+1+Math.floor(r()*R.GUERRA_ENTRO)}
  L(s,'Fondi il regno «'+nome+'»: '+l.nome+' ne è la sede.','bene');s.ev.push({t:'regno'});return{s}}
 // le azioni del sovrano, valide ovunque: feudi (sid=-2: lo tieni tu), compagni investiti, adunata dei signori, guerra e rottura di un'alleanza
 function faiRegno(s,z){const tu=TU(s),g=giorno(s),R=D.REGNO,r=rnd(s);
  if(z.a==='feudo'){const l=s.l[z.lid];if(!l||l.faz!=='tu')return{err:'Non è un luogo tuo'};if(l.id===s.corona.sede)return{err:'La sede del regno resta tua'};
   if(l.capo>=0&&!MURA[l.tipo]&&s.l[l.capo].faz==='tu')return{err:'Va dato insieme alla sua fortezza'};
   const sid=z.sid==null?-2:z.sid|0;let sg=null;if(sid>=0){sg=s.sig[sid];if(!sg||sg.faz!=='tu')return{err:'Non è un tuo signore'}}else if(sid!==-2)return{err:'Signore sconosciuto'};
   const prima=l.sig>=0?l.sig:-1;if(prima===sid||(prima<0&&sid===-2))return{err:'È già così'};
   daiFeudo(s,l,sid);if(prima>=0)perdeFeudo(s,prima);L(s,sg?l.nome+' va in feudo a '+sg.nome+'.':l.nome+' resta in mano tua.','bene');return{s}}
  if(z.a==='investi'){const l=s.l[z.lid],T=D.TR[z.t],e=tu.tr.find(e=>e.t===z.t);if(!T||!T.compagno)return{err:'Non è un compagno'};if(!e||e.n<1)return{err:'Il compagno non è con te'};
   if(!l||l.faz!=='tu'||l.sig>=0)return{err:'Serve un tuo luogo tenuto'};if(l.id===s.corona.sede)return{err:'La sede del regno resta tua'};
   const co=D.COMPAGNI.find(x=>x.id===z.t),cult=M0(s,l);togliUomini(tu.tr,z.t,1);
   const sg={id:s.sig.length,nome:co.nome,faz:'tu',casa:l.id,pid:-1,prig:null,torna:0,re:false,tratto:D.TRATTI_ID[s.sig.length%D.TRATTI_ID.length],cult,comp:co.id,mem:{lib:0,sconf:0,trad:0,fav:0,g:-99}};s.sig.push(sg);
   const p=nuovaP(s,'sig','tu',co.nome,l.x,l.y,leva(cult,R.TRUPPE_COMP,r),{oro:150,sig:sg.id,dentro:l.id});sg.pid=p.id;daiFeudo(s,l,sg.id);s.compagni[co.id]=-3;
   L(s,co.nome+' è investito di '+l.nome+': ora è signore.','bene');return{s}}
  if(z.a==='aduna'){let n=0;for(const p of s.p)if(p.k==='sig'&&p.faz==='tu'){p.dentro=-1;p.via=[];p.ia={st:'adunata',t:0,fine:s.t+R.ADUNATA*P.GIORNO};n++}
   if(!n)return{err:'Non hai signori'};L(s,'Chiami a raccolta i tuoi signori: ti raggiungeranno ('+n+').');return{s}}
  if(z.a==='dichiara'){const f=z.f;if(!VEN.regni(s).includes(f)||s.cadute[f])return{err:'Regno sconosciuto'};if(inGuerra(s,'tu',f))return{err:'Siete già in guerra'};if(alleate(s,'tu',f))return{err:'Sono tuoi alleati: rompi prima l\'alleanza'};
   s.guerra[chiave('tu',f)]=true;delete s.corona.minacce[f];relaz(s,f,-10);L(s,'Dichiari guerra a '+nomeF(s,f)+'.','guerra');return{s}}
  if(z.a==='rompi'){const al=s.alleanza&&s.alleanza[chiave('tu',z.f)];if(!al)return{err:'Non siete alleati'};if(al.rompe)return{err:'La rottura è già annunciata'};
   al.rompe=Math.max(g+D.DIPL.PREAVVISO,al.da+D.DIPL.MIN);L(s,'Annunci la rottura dell\'alleanza con '+nomeF(s,z.f)+': finirà il giorno '+al.rompe+'.','guerra');return{s}}
  return{err:'Azione sconosciuta'}}
 // tolto l'ultimo feudo, il signore diventa esule
 function perdeFeudo(s,sid){if(s.l.some(l=>l.faz==='tu'&&l.sig===sid))return;const sg=s.sig[sid],p=sg&&part(s,sg.pid);if(!sg)return;daEsule(s,sg,p);L(s,sg.nome+' resta senza feudo e se ne va in esilio.','male')}
 return{forzaRegno,dominante,proposta,conquista,confinanti,vittoria,inimica,lealta,passaA,fondaRegno,faiRegno}})());
