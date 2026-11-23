/* ---- Compagnia di ventura, IA del mondo: i signori che girano, le guerre e le paci, i predoni e le carovane, gli scontri tra IA, il giorno e l'ora che passano. Motore puro, senza DOM né rete. ----
   Estensione di VEN (28k): aggiunge le sue funzioni allo stesso oggetto; gli aiutanti del nucleo arrivano da `VEN._`,
   le funzioni degli altri file si chiamano `VEN.nome(...)`. Piano: docs/passi/01-spacca-mondo.md. */
Object.assign(VEN,(()=>{
 const{D,G,L,M0,MERCATO,MURA,P,TU,abil,aggiungi,alleate,alleatoDi,chiave,cultura,dist,fazioni,forza,forzaTr,giorno,inGuerra,leva,limite,nemiche,nomeF,nuovaP,ostile,part,rnd,somma,togliUomini,uomini,via,vicinoOk,vista,viva}=VEN._;
 // la forza di una compagnia nei conti automatici tra IA: il moltiplicatore `forza` di VEN.molt vale 1 finché nessuno lo cambia
 const forzaIA=(s,p)=>forza(p)*VEN.molt(s,'forza',{p});
 // ---------- diplomazia (V3) ----------
 // chi soccorre un assedio: i signori del regno assediato, e gli alleati solo se sono in guerra con chi assedia (altrimenti resterebbero lì a guardare)
 const soccorre=(s,p,l)=>l.faz===p.faz||(alleate(s,l.faz,p.faz)&&!!l.ass&&nemiche(s,p.faz,l.ass.faz));
 // firmata un'alleanza, le mischie in corso tra i due regni si sciolgono: nessuno resta schierato contro il suo alleato
 function scioglieScontri(s,a,b){const fz=ids=>ids.map(id=>part(s,id)).filter(Boolean).map(p=>p.faz);
  for(const sc of s.scontri.slice()){const A=fz(sc.a),B=fz(sc.b);if((A.includes(a)&&B.includes(b))||(A.includes(b)&&B.includes(a))){for(const p of s.p)if(p.sc===sc.id){p.sc=0;p.via=[]}s.scontri.splice(s.scontri.indexOf(sc),1)}}}
 // chiude le guerre tra due regni: gli assedi dell'uno contro l'altro cadono
 function faiPace(s,a,b){delete s.guerra[chiave(a,b)];for(const l of s.l)if(l.ass&&(l.ass.faz===a||l.ass.faz===b))l.ass=null}
 function nascePredoni(s,r,vicinoA){const M=VEN.mappaDi(s),c=vicinoA||M.covi[Math.floor(r()*M.covi.length)],g=giorno(s),pos=vicinoOk(M,c[0]+(r()-.5)*3,c[1]+(r()-.5)*3);
  const grossa=r()<.22,punti=(22+r()*30+Math.min(150,g*2.1))*(grossa?1.7:1)*VEN.molt(s,'predoni',{});return nuovaP(s,'pre','pre',(grossa?'Masnada: ':'')+D.NOMI.bande[Math.floor(r()*D.NOMI.bande.length)],pos[0],pos[1],leva('pre',punti,r),{oro:20+Math.floor(r()*60)})}
 function nasceCarovana(s,l,r){const p=nuovaP(s,'car',l.faz,'Carovana di '+l.nome,l.x,l.y,leva(VEN.cult(s,l.faz),38+r()*20,r),{oro:150+Math.floor(r()*200),casa:l.id,dentro:l.id});p.ia={st:'sosta',t:s.t+60+Math.floor(r()*600)};return p}
 // ---------- il cervello degli altri ----------
 function vai(s,p,x,y,M){p.via=via(M,p.x,p.y,x,y);p.ia.mx=x;p.ia.my=y}
 function rifugio(s,p){let m=null,md=1e9;for(const l of s.l){if(!MURA[l.tipo]||l.faz!==p.faz||l.ass)continue;const d=dist(l,p);if(d<md){md=d;m=l}}return m}
 function decidi(s,p,M){const ia=p.ia,r=rnd(s),tu=TU(s);if(p.sc)return;if(p.fermo){if(s.t>=p.fermo)p.fermo=0;else return}
  if(p.k==='car'){if(p.dentro>=0){if(s.t>=ia.t){const altre=s.l.filter(l=>(l.tipo==='citta'||l.tipo==='porto')&&l.id!==p.dentro&&!nemiche(s,p.faz,l.faz));if(!altre.length){ia.t=s.t+600;return}
      const da=s.l[p.dentro],a=altre[Math.floor(r()*altre.length)];let bene=null,mx=0;for(const m of Object.keys(da.scorte))if(da.scorte[m]-(a.scorte[m]||0)>mx){mx=da.scorte[m]-(a.scorte[m]||0);bene=m}
      if(bene){const q=Math.min(12,Math.floor(mx/2));da.scorte[bene]-=q;p.porta={m:bene,q}}p.dentro=-1;ia.st='viaggio';ia.a=a.id;vai(s,p,a.x,a.y,M)}}
    else{const a=s.l[ia.a];if(!a||nemiche(s,p.faz,a.faz)){const c=s.l[p.casa];ia.a=c.id;vai(s,p,c.x,c.y,M)}else if(dist(p,a)<.7){p.dentro=a.id;p.x=a.x;p.y=a.y;if(p.porta){a.scorte[p.porta.m]=(a.scorte[p.porta.m]||0)+p.porta.q;p.porta=null}a.prosp=Math.min(100,a.prosp+1);ia.st='sosta';ia.t=s.t+300+Math.floor(r()*400)}else if(!p.via.length)vai(s,p,a.x,a.y,M)}return}
  // chi vedo
  const mia=forza(p);let preda=null,pv=0,minaccia=null,mv=0;
  if(p.dentro<0)for(const q of s.p){if(q===p||q.dentro>=0||!ostile(s,p,q))continue;if(q.id===0&&s.prigioniero)continue;const d=dist(p,q);if(d>6.5)continue;const f=forza(q);
    const os=p.k==='sig'?((D.TRATTI[(s.sig[p.sig]||{}).tratto]||{}).osa||1):1;if(f>mia*1.25*os){if(d<4.5&&f>mv){mv=f;minaccia=q}}else if(f<mia*.85*os||q.k==='car'){const val=(q.k==='car'?2:1)*(7-d);if(val>pv){pv=val;preda=q}}}
  if(p.k==='pre'||p.k==='riv'){if(minaccia&&!p.cov){ia.st='fuga';const G=M.G||128,M2=M,x=p.x+(p.x-minaccia.x)*2,y=p.y+(p.y-minaccia.y)*2;const v=vicinoOk(M2,Math.max(2,Math.min(G-2,x)),Math.max(2,Math.min(G-2,y)));vai(s,p,v[0],v[1],M);return}
   if(preda){ia.st='caccia';ia.b=preda.id;vai(s,p,preda.x,preda.y,M);return}
   if(ia.st==='caccia')ia.st='giro';if(!p.via.length){const c=p.cov||M.covi[Math.floor(r()*M.covi.length)];const v=vicinoOk(M,c[0]+(r()-.5)*12,c[1]+(r()-.5)*12);vai(s,p,v[0],v[1],M)}return}
  // signori
  const sg=s.sig[p.sig],casa=s.l[sg.casa],osa=(D.TRATTI[sg.tratto]||{}).osa||1;
  // esuli: senza terra né bandiera, girano finché l'esilio non scade; i signori radunati dal sovrano lo raggiungono
  if(p.faz==='neu'){ia.st='esilio';if(!p.via.length&&p.dentro<0){const G=M.G||128,v=vicinoOk(M,Math.max(2,Math.min(G-2,p.x+(r()-.5)*8)),Math.max(2,Math.min(G-2,p.y+(r()-.5)*8)));vai(s,p,v[0],v[1],M)}return}
  if(p.faz==='tu'&&ia.st==='adunata'){if(s.t>=ia.fine){ia.st='giro';p.via=[]}else{p.dentro=-1;if(dist(p,tu)>1.4){if(!p.via.length||s.t%60<20)vai(s,p,tu.x,tu.y,M)}else p.via=[];return}}
  if(p.dentro>=0){const l=s.l[p.dentro];if(l.ass)return;const pieno=forza(p)>=(sg.re?170:110);
   if(!pieno&&p.oro>=20&&s.t%120<20){const t=cultura(s,p)+'_'+(r()<.5?'f1':r()<.5?'f2':'t2');aggiungi(p.tr,t,1);p.oro-=12}
   if(s.t>=(ia.t||0)&&(pieno||r()<.02)){p.dentro=-1;ia.st='giro';ia.t=0}return}
  if(minaccia){const l=rifugio(s,p);ia.st='fuga';if(l){ia.a=l.id;if(dist(p,l)<.7){entraSig(s,p,l);return}vai(s,p,l.x,l.y,M)}return}
  if(preda&&ia.st!=='assedio'){ia.st='caccia';ia.b=preda.id;vai(s,p,preda.x,preda.y,M);return}
  if(ia.st==='caccia'||ia.st==='fuga'){ia.st='giro';p.via=[]}
  if(mia<(sg.re?80:55)){const l=rifugio(s,p)||casa;ia.st='casa';if(dist(p,l)<.7&&l.faz===p.faz){entraSig(s,p,l);ia.t=s.t+P.GIORNO}else if(!p.via.length)vai(s,p,l.x,l.y,M);return}
  if(ia.st==='assedio'){const l=s.l[ia.a];if(!l||!nemiche(s,p.faz,l.faz)){ia.st='giro';return}if(dist(p,l)<.9){p.via=[];if(!l.ass){l.ass={faz:p.faz,da:s.t,pid:[p.id]};L(s,p.nome+' cinge d\'assedio '+l.nome+'.','guerra')}else if(l.ass.faz===p.faz&&!l.ass.pid.includes(p.id))l.ass.pid.push(p.id)}else if(!p.via.length)vai(s,p,l.x,l.y,M);return}
  if(ia.st==='razzia'){const l=s.l[ia.a];if(!l||!nemiche(s,p.faz,l.faz)||l.sacc>giorno(s)){ia.st='giro';return}
   if(dist(p,l)<.8){p.via=[];if(!ia.t)ia.t=s.t+300;else if(s.t>=ia.t){l.sacc=giorno(s)+5;l.prosp=Math.max(5,l.prosp-18);l.rec=0;p.oro+=120;ia.st='giro';ia.t=0;L(s,p.nome+' mette a sacco '+l.nome+'.','guerra');VEN.ganci('luogo',s,l,'razzia')}}else if(!p.via.length)vai(s,p,l.x,l.y,M);return}
  if(ia.st==='soccorso'){const l=s.l[ia.a];if(!l||!l.ass||!soccorre(s,p,l)){ia.st='giro';return}if(!p.via.length)vai(s,p,l.x,l.y,M);return}
  if(p.via.length)return;
  // scelta nuova
  const ass=s.l.find(l=>l.ass&&soccorre(s,p,l)&&dist(l,p)<22);if(ass&&r()<.7){ia.st='soccorso';ia.a=ass.id;vai(s,p,ass.x,ass.y,M);return}
  const nem=s.l.filter(l=>l.faz!=='tu'?nemiche(s,p.faz,l.faz):nemiche(s,p.faz,'tu'));
  if(nem.length&&r()<.6){const x=r();if(x<.45){const bers=nem.filter(l=>MURA[l.tipo]).sort((a,b)=>dist(a,p)-dist(b,p))[0];
     if(bers&&(mia>forzaTr(bers.g)*P.MURA*.75||bers.ass&&bers.ass.faz===p.faz)&&dist(bers,p)<34){ia.st='assedio';ia.a=bers.id;vai(s,p,bers.x,bers.y,M);return}}
    const vil=nem.filter(l=>l.tipo==='villaggio'&&l.sacc<=giorno(s)).sort((a,b)=>dist(a,p)-dist(b,p))[0];if(vil&&dist(vil,p)<26){ia.st='razzia';ia.a=vil.id;ia.t=0;vai(s,p,vil.x,vil.y,M);return}}
  const miei=s.l.filter(l=>l.faz===p.faz);if(!miei.length){const v=vicinoOk(M,casa.x,casa.y);vai(s,p,v[0],v[1],M);return}const m=miei[Math.floor(r()*miei.length)];ia.st='giro';const v=vicinoOk(M,m.x+(r()-.5)*4,m.y+(r()-.5)*4);vai(s,p,v[0],v[1],M)}
 function entraSig(s,p,l){p.dentro=l.id;p.x=l.x;p.y=l.y;p.via=[];p.ia.st='casa';p.ia.t=s.t+600}
 // ---------- ore e giorni ----------
 function oraNuova(s){const r=rnd(s),M=VEN.mappaDi(s);
  // scontri tra compagnie che non sei tu
  for(const a of s.p){if(a.id===0||a.dentro>=0||a.sc)continue;for(const b of s.p){if(b.id<=a.id||b.dentro>=0||b.sc||!ostile(s,a,b)||dist(a,b)>P.CONTATTO)continue;
    const sc={id:s.uid++,x:(a.x+b.x)/2,y:(a.y+b.y)/2,a:[a.id],b:[b.id],fa:forzaIA(s,a),fb:forzaIA(s,b)};a.sc=b.sc=sc.id;a.via=[];b.via=[];
    for(const c of s.p){if(c.id===0||c.dentro>=0||c.sc||c.k!=='sig'||dist(c,sc)>P.CONTATTO*4)continue;const pa=alleate(s,c.faz,a.faz)&&ostile(s,c,b),pb=alleate(s,c.faz,b.faz)&&ostile(s,c,a);if(pa||pb){(pa?sc.a:sc.b).push(c.id);c.sc=sc.id;c.via=[]}}
    sc.fa=sc.a.reduce((x,id)=>x+forzaIA(s,part(s,id)),0);sc.fb=sc.b.reduce((x,id)=>x+forzaIA(s,part(s,id)),0);VEN.ganci("scontro",s,sc);s.scontri.push(sc);break}}
  for(const sc of s.scontri.slice())giraScontro(s,sc,r);
  // assedi degli altri
  for(const l of s.l){const a=l.ass;if(!a)continue;a.pid=a.pid.filter(id=>{const p=part(s,id);return p&&!p.sc&&p.dentro<0&&dist(p,l)<1.6});
   if(!a.pid.length||!nemiche(s,a.faz,l.faz==='tu'?'tu':l.faz)){l.ass=null;continue}
   if(s.t-a.da>=P.ASSEDIO_IA_ORE*60)VEN.assalto(s,l,r)}
  // l'assedio di chi gioca
  if(s.assedio&&s.t>=s.assedio.pronto&&!s.incontro){const tu=TU(s);tu.ord=null;s.incontro={tipo:'assalto',lid:s.assedio.lid};s.ev.push({t:'incontro'})}
  // rovine e covi si scoprono passando vicino
  {const tu=TU(s),v=vista(s)*.75;if(!s.prigioniero)for(const l of s.l)if(l.noto===false&&dist(l,tu)<v){l.noto=true;L(s,'Avete scoperto '+l.nome+'.','bene');s.ev.push({t:'scoperta',lid:l.id})}}
  // i feriti si rimettono
  const med=abil(s,'medicina');for(const e of TU(s).tr)if(e.f>0&&r()<.06+med*.02)e.f--;
  for(const l of s.l)if(l.ass==null)for(const e of l.g)if(e.f>0)e.f--;
  VEN.ganci("ora",s);VEN.ganci("vedi",s)}
 function perdite(tr,quota,r){for(const e of tr.slice()){let via=0;for(let k=0;k<e.n;k++)if(r()<quota)via++;if(via)togliUomini(tr,e.t,via)}}
 function giraScontro(s,sc,r){const A=sc.a.map(id=>part(s,id)).filter(Boolean),B=sc.b.map(id=>part(s,id)).filter(Boolean);const fa=A.reduce((x,p)=>x+forzaIA(s,p),0),fb=B.reduce((x,p)=>x+forzaIA(s,p),0);
  if(!A.length||!B.length||fa<=0||fb<=0){chiudiScontro(s,sc,fa>fb?'a':'b');return}
  const qa=.2*fb/(fa+fb)*(.6+r()*.8),qb=.2*fa/(fa+fb)*(.6+r()*.8);for(const p of A)perdite(p.tr,qa,r);for(const p of B)perdite(p.tr,qb,r);
  const na=A.reduce((x,p)=>x+forzaIA(s,p),0),nb=B.reduce((x,p)=>x+forzaIA(s,p),0);if(na<sc.fa*.35||nb<sc.fb*.35||na<=0||nb<=0)chiudiScontro(s,sc,na/sc.fa>nb/sc.fb?'a':'b')}
 function chiudiScontro(s,sc,vince){const i=s.scontri.indexOf(sc);if(i>=0)s.scontri.splice(i,1);const V=(vince==='a'?sc.a:sc.b).map(id=>part(s,id)).filter(Boolean),S=(vince==='a'?sc.b:sc.a).map(id=>part(s,id)).filter(Boolean);
  for(const p of V){p.sc=0;p.oro+=40;promuoviIA(p)}for(const p of S){p.sc=0;if(V[0])V[0].oro+=Math.floor(p.oro*.6);sconfitta(s,p,V[0]?V[0].faz:null)}
  if(V[0]&&S[0]&&(V[0].k==='sig'||S[0].k==='sig')&&dist(TU(s),sc)<vista(s))L(s,V[0].nome+' ha battuto '+S[0].nome+'.','guerra')}
 function promuoviIA(p){for(const e of p.tr.slice()){const su=D.TR[e.t].su;if(su.length&&e.n>=3){const k=Math.max(1,Math.floor(e.n*.15));togliUomini(p.tr,e.t,k);aggiungi(p.tr,su[e.n%su.length],k)}}}
 // una compagnia battuta: i predoni e le carovane spariscono, il signore ripara a casa (o resta prigioniero) e ricomincia
 function sconfitta(s,p,daFaz,preso){const r=rnd(s);if(p.k==='pre'){rimuovi(s,p);return}
  if(p.k==='car'){const c=s.l[p.casa];rimuovi(s,p);if(c){c.prosp=Math.max(5,c.prosp-6);c.carTorna=giorno(s)+4}return}
  if(p.k==='riv'){const C=s.l.filter(l=>l.tipo==='citta'),c=C[Math.floor(r()*C.length)],v=vicinoOk(VEN.mappaDi(s),c.x+3,c.y+2);p.tr=leva('mer',70,r);aggiungi(p.tr,D.RIVALE.id,1);p.x=v[0];p.y=v[1];p.via=[];p.fermo=s.t+P.GIORNO*3;p.ia={st:'giro',t:0};return}
  // un esule battuto sparisce; se è un tuo compagno investito, torna nella compagnia come a fine esilio (prima andava perso)
  if(p.faz==='neu'){rimuovi(s,p);const se=s.sig[p.sig];se.pid=-1;if(se.comp){aggiungi(TU(s).tr,se.comp,1);s.compagni[se.comp]=-1;L(s,se.nome+' rientra nella compagnia.');se.comp=null;se.esule=null}return}
  const sg=s.sig[p.sig];let casa=s.l[sg.casa];if(!casa||casa.faz!==sg.faz){casa=s.l.find(l=>l.faz===sg.faz&&l.tipo!=='villaggio');if(casa)sg.casa=casa.id}
  if(!casa){rimuovi(s,p);sg.pid=-1;return}
  p.tr=leva(cultura(s,p),18+r()*12,r);p.oro=Math.max(60,Math.floor(p.oro*.4));p.x=casa.x;p.y=casa.y;p.dentro=casa.id;p.via=[];p.ia={st:'casa',t:s.t+P.GIORNO*(preso?5:2)};if(preso)sg.prig=preso}
 function rimuovi(s,p){const i=s.p.indexOf(p);if(i>0)s.p.splice(i,1);for(const q of s.incarichi)if(q.pid===p.id&&!q.fatto)q.pid=-1}
 function giornoNuovo(s){const r=rnd(s),tu=TU(s),g=giorno(s);
  if(s.torneo&&s.torneo.giorno<g)VEN.chiudiTorneo(s,'Il torneo di '+s.l[s.torneo.lid].nome+' è finito');
  // viveri
  if(!s.prigioniero){let serve=Math.ceil(uomini(tu)/6*VEN.molt(s,"viveri",{p:tu}));const cibi=Object.keys(tu.merci).filter(m=>D.MERCI[m].cibo&&tu.merci[m]>0);let k=0;
   while(serve>0&&cibi.some(m=>tu.merci[m]>0)){const m=cibi[k++%cibi.length];if(tu.merci[m]>0){tu.merci[m]--;serve--}}
   const fame=serve>0,varia=cibi.length;let meta=50+abil(s,'comando')*2+somma(s,'morale')+varia*4+Math.min(20,s.slancio)-(fame?35:0)-Math.max(0,uomini(tu)-limite(s))*3-(s.corona&&s.corona.malc>=60?s.corona.malc/10:0);
   tu.mor=Math.round(tu.mor+(meta-tu.mor)*.3);s.slancio=Math.max(0,s.slancio-2);
   if(fame){L(s,'La compagnia non ha da mangiare: il morale crolla.','male');VEN.reagisci(s,'fame')}
   if(tu.mor<25&&uomini(tu)>1){const e=tu.tr.filter(e=>!D.TR[e.t].compagno).sort((a,b)=>D.TR[a.t].t-D.TR[b.t].t)[0];if(e){const k2=Math.max(1,Math.floor(e.n*.2));togliUomini(tu.tr,e.t,k2);L(s,k2+' uomini disertano nella notte.','male')}}
   const ad=abil(s,'addestra');if(ad)for(const e of tu.tr)if(D.TR[e.t].su.length)e.xp=(e.xp||0)+e.n*ad*.7;
   // paga ogni sette giorni
   if(g%P.PAGA_GIORNI===1&&g>1){const dovuto=VEN.paga(s),rendita=VEN.rendite(s);tu.oro+=rendita;if(rendita)L(s,'Rendite e soldo: +'+rendita+' monete.','bene');
    if(tu.oro>=dovuto){tu.oro-=dovuto;if(dovuto)L(s,'Giorno di paga: '+dovuto+' monete agli uomini.');VEN.gradPaga(s,true)}else{tu.oro=0;tu.mor=Math.max(0,tu.mor-25);L(s,'Non hai di che pagare gli uomini: malcontento.','male');VEN.gradPaga(s,false)}}}
  VEN.debiti(s);VEN.addii(s);VEN.vociDelGiorno(s);
  // economia e reclute
  for(const l of s.l){if(MERCATO[l.tipo]){const prod=D.PRODUCE[VEN.regni(s).includes(l.faz)?VEN.cult(s,l.faz):M0(s,l)]||[],fermo=l.sacc>g;for(const m of Object.keys(D.MERCI)){const mio=prod.includes(m),cibo=D.MERCI[m].cibo;
     let d=mio||(l.tipo==='porto'&&m==='pesce')?(fermo?0:4):cibo&&l.tipo!=='citta'?(fermo?0:3):-1;l.scorte[m]=Math.max(0,Math.min(120,(l.scorte[m]||0)+d+(r()<.3?1:0)))}}
   if(l.tipo==='villaggio'&&l.sacc<=g)l.rec=Math.min(Math.floor((8+Math.floor(l.rel/10))*VEN.molt(s,"reclute",{lid:l.id})),l.rec+(r()<.5+l.prosp/200?1:0)+(l.rel>20?1:0));
   if(l.sacc<=g&&l.prosp<70&&r()<.3)l.prosp++;
   if(MURA[l.tipo]&&VEN.regni(s).includes(l.faz)&&!l.ass&&forzaTr(l.g)<(l.tipo==='citta'?300:170)&&r()<.5)aggiungi(l.g,VEN.cult(s,l.faz)+'_'+(r()<.5?'f2':r()<.6?'t2':'f1'),1);
   if((l.tipo==='citta'||l.tipo==='porto')&&l.carTorna&&g>=l.carTorna&&VEN.regni(s).includes(l.faz)){l.carTorna=0;nasceCarovana(s,l,r)}
   if(g%7===0)VEN.rinnova(s,l,r)}
  // signori: tasse e prigionieri che tornano
  for(const p of s.p.slice())if(p.k==='sig'){p.oro+=30;const sg=s.sig[p.sig];if(sg.prig&&sg.prig!=='tu'&&p.ia.t<=s.t)sg.prig=null;
   if(p.faz==='neu'&&sg.esilio&&g>=sg.esilio){rimuovi(s,p);sg.pid=-1;sg.esule=null;if(sg.comp){aggiungi(tu.tr,sg.comp,1);s.compagni[sg.comp]=-1;L(s,sg.nome+' rientra nella compagnia.');sg.comp=null}}}
  for(const l of s.l)if(l.faz==='tu'&&l.sig>=0){const sg=s.sig[l.sig],p=sg&&part(s,sg.pid);if(p)p.oro+=Math.round(VEN.renditaL(l)/7)}
  // predoni nuovi
  if(s.p.filter(p=>p.k==='pre').length<P.PRED_MAX-s.stat.covi*2&&r()<.7*VEN.molt(s,'predoni',{})){const vivi=s.l.filter(l=>l.tipo==='covo'&&l.g.length);if(vivi.length){const c=vivi[Math.floor(r()*vivi.length)];nascePredoni(s,r,[c.x,c.y])}}
  {const x=r();s.meteo=x<.62?'sereno':x<.87?'pioggia':'nebbia'}
  if(g%7===0){const rv=s.p.find(p=>p.k==='riv');if(rv&&forza(rv)<420)for(const e of leva('mer',26,r))aggiungi(rv.tr,e.t,e.n)}
  // regno (V4): il malcontento sale con i luoghi tenuti oltre il tetto; i confinanti che non hanno firmato l'alleanza ti dichiarano guerra alla scadenza
  if(s.corona){const c=s.corona,R=D.REGNO,tenuti=s.l.filter(l=>l.faz==='tu'&&l.sig<0).length;c.malc=Math.max(0,Math.min(100,c.malc+(tenuti>R.TENUTI?(tenuti-R.TENUTI)*R.MALC_SU:-R.MALC_GIU)));
   for(const f of Object.keys(c.minacce)){if(g<c.minacce[f])continue;delete c.minacce[f];if(!s.cadute[f]&&!inGuerra(s,'tu',f)&&!alleate(s,'tu',f)){s.guerra[chiave('tu',f)]=true;L(s,nomeF(s,f)+' dichiara guerra a '+c.nome+'.','guerra')}}}
  // diplomazia: ogni tanto una guerra finisce o comincia
  // alleanze (V3): finiscono solo dopo il preavviso e non prima del minimo; se un regno cade finiscono subito
  for(const k of Object.keys(s.alleanza||{})){const al=s.alleanza[k],x=k.split('|');
   if(s.cadute[x[0]]||s.cadute[x[1]])delete s.alleanza[k];
   else if(al.rompe&&g>=al.rompe&&g>=al.da+D.DIPL.MIN){delete s.alleanza[k];L(s,nomeF(s,x[0])+' e '+nomeF(s,x[1])+' non sono più alleati.','guerra')}}
  if(g%4===0){const vivi=fazioni(s).filter(f=>viva(s,f)),reali=vivi.filter(f=>f!=='tu'),dom=VEN.dominante(s),X=D.DIPL.IA;for(let i=0;i<vivi.length;i++)for(let j=i+1;j<vivi.length;j++){const k=chiave(vivi[i],vivi[j]),amico=(vivi[i]==='tu'||vivi[j]==='tu')&&s.rel[vivi[i]==='tu'?vivi[j]:vivi[i]]>=D.REGNO.AMICO;
    if(s.guerra[k]){if(r()<.16){faiPace(s,vivi[i],vivi[j]);L(s,nomeF(s,vivi[i])+' e '+nomeF(s,vivi[j])+' firmano la pace.','guerra')}}
    else if(r()<(dom&&(dom.f===vivi[i]||dom.f===vivi[j])?X.GUERRA_DOM:.14)*VEN.molt(s,"guerra",{a:vivi[i],b:vivi[j]})&&!s.alleanza[k]&&!amico){s.guerra[k]=true;L(s,nomeF(s,vivi[i])+' dichiara guerra a '+nomeF(s,vivi[j])+'.','guerra')}}
   // ogni tanto due regni liberi si alleano contro chi vince troppo (mai a nome del tuo regno); ogni tanto un'alleanza matura si scioglie, con preavviso
   for(let i=0;i<reali.length;i++)for(let j=i+1;j<reali.length;j++){const a=reali[i],b=reali[j];if(alleatoDi(s,a)||alleatoDi(s,b)||inGuerra(s,a,b))continue;
     const contro=dom&&a!==dom.f&&b!==dom.f?dom.f:vivi.find(c=>c!==a&&c!==b&&inGuerra(s,a,c)&&inGuerra(s,b,c));
     if(contro&&r()<(dom&&contro===dom.f?X.ALLEANZA:X.FRONTE)){s.alleanza[chiave(a,b)]={da:g,rompe:0};scioglieScontri(s,a,b);L(s,nomeF(s,a)+' e '+nomeF(s,b)+' si alleano contro '+nomeF(s,contro)+'.','guerra')}}
   for(const k of Object.keys(s.alleanza)){const al=s.alleanza[k];if(!al.rompe&&g>=al.da+D.DIPL.MIN&&r()<X.ROTTURA){const x=k.split('|');al.rompe=g+D.DIPL.PREAVVISO;L(s,nomeF(s,x[0])+' e '+nomeF(s,x[1])+' annunciano la fine dell\'alleanza.','guerra')}}}
  for(const f of VEN.regni(s))if(s.rel[f]<0&&g%3===0&&!(s.servizio&&inGuerra(s,s.servizio.faz,f)))s.rel[f]++;
  // incarichi scaduti
  for(const q of s.incarichi)if(!q.fatto&&!q.fallito&&g>q.scad){q.fallito=true;const l=s.l[q.da];l.inc=null;l.rel-=3;L(s,'Incarico scaduto: '+VEN.titoloInc(s,q)+'.','male')}
  s.incarichi=s.incarichi.filter(q=>!(q.fatto||q.fallito)||g-q.scad<3);
  // contratto da mercenario
  if(s.servizio&&s.servizio.tipo==='mer'&&g>=s.servizio.fino){L(s,'Il contratto con '+VEN.rg(s,s.servizio.faz).breve+' è finito.');s.servizio=null}
  VEN.vittoria(s);s.ev.push({t:'giorno',g});VEN.ganci('giorno',s)}
 Object.assign(VEN._,{vai,rimuovi,sconfitta});
 return{scioglieScontri,faiPace,nascePredoni,nasceCarovana,decidi,pensa:(s,p,M)=>VEN.decidi(s,p,M),oraNuova,perdite,promuoviIA,sconfitta,rimuovi,giornoNuovo}})());
