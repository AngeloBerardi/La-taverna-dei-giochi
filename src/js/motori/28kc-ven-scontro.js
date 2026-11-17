/* ---- Compagnia di ventura, Scontri del capitano: schieramenti, `campo`/`esito`/`auto`, assedio, assalto, tornei e arena. Motore puro, senza DOM né rete. ----
   Estensione di VEN (28k): aggiunge le sue funzioni allo stesso oggetto; gli aiutanti del nucleo arrivano da `VEN._`,
   le funzioni degli altri file si chiamano `VEN.nome(...)`. Piano: docs/passi/01-spacca-mondo.md. */
Object.assign(VEN,(()=>{
 const{D,L,MURA,P,SITO,TU,abil,aggiungi,capi,cella,colFaz,dist,forza,forzaTr,giorno,lato,limitePrig,notte,ogg,ostile,part,relaz,rnd,somma,statCap,togliUomini,uomini,vicinoOk,xpLiv}=VEN._;
 // assalto alle mura da parte di signori
 function assalto(s,l,r){const A=l.ass.pid.map(id=>part(s,id)).filter(Boolean),dentro=s.p.filter(p=>p.dentro===l.id&&p.k==='sig');let fa=A.reduce((x,p)=>x+forza(p),0),fd=(forzaTr(l.g)+dentro.reduce((x,p)=>x+forza(p),0))*P.MURA;const fa0=fa,fd0=fd;
  for(let k=0;k<8&&fa>fa0*.4&&fd>fd0*.3;k++){const qa=.16*fd/(fa+fd)*(.6+r()*.8),qd=.16*fa/(fa+fd)*(.6+r()*.8);for(const p of A)VEN.perdite(p.tr,qa,r);VEN.perdite(l.g,qd,r);for(const p of dentro)VEN.perdite(p.tr,qd,r);
   fa=A.reduce((x,p)=>x+forza(p),0);fd=(forzaTr(l.g)+dentro.reduce((x,p)=>x+forza(p),0))*P.MURA}
  const presa=fd<=fd0*.3&&fa>0,faz=l.ass.faz;l.ass=null;
  if(presa){const capo=A.sort((a,b)=>forza(b)-forza(a))[0];for(const p of dentro)VEN.sconfitta(s,p,faz);VEN.conquista(s,l,faz,capo&&capo.k==='sig'?capo.sig:-1);
   if(capo){const meta=capo.tr.filter(e=>e.n>=2);l.g=[];for(const e of meta){const k=Math.floor(e.n*.35);togliUomini(capo.tr,e.t,k);aggiungi(l.g,e.t,k)}}}
  else{L(s,l.nome+' respinge l\'assalto.','guerra');for(const p of A){p.ia.st='casa';p.via=[]}}}
 function schieramenti(s){const inc=s.incontro,tu=TU(s);let nem=[],all=[],luogo=null;
  if(inc.tipo==='assalto'){luogo=s.l[inc.lid];nem=s.p.filter(p=>p.dentro===luogo.id&&p.k==='sig');all=s.p.filter(p=>p.k==='sig'&&p.faz==='tu'&&p.dentro<0&&!p.sc&&dist(p,luogo)<2)}
  else if(inc.tipo==='mischia'){const sc=s.scontri.find(x=>x.id===inc.sc);if(sc){const A=sc.a.map(id=>part(s,id)).filter(Boolean),B=sc.b.map(id=>part(s,id)).filter(Boolean);if(inc.lato==='a'){all=A;nem=B}else{all=B;nem=A}}}
  else{nem=inc.pid.map(id=>part(s,id)).filter(Boolean);all=(inc.all||[]).map(id=>part(s,id)).filter(Boolean)}
  return{nem,all,luogo}}
 // ---------- tornei nelle città (V2) ----------
 // Un torneo c'è in una città quando (giorno + id) % 7 === 0: nessuno stato in più, dura tutto il giorno. Il duello è a piedi, corpo a corpo,
 // con l'equipaggiamento di chi gioca (senza cavallo, e l'arco diventa una spada). `s.torneo = {lid, turno, posta, giorno}`: turno = prossimo duello (0..2).
 const torneoOggi=(s,l)=>!!l&&l.tipo==='citta'&&(giorno(s)+l.id)%7===0;
 // i tornei dei prossimi giorni, dal più vicino: [{lid, giorni}]
 function tornei(s){const g=giorno(s),tu=TU(s);return s.l.filter(l=>l.tipo==='citta').map(l=>({lid:l.id,giorni:(7-(g+l.id)%7)%7})).sort((a,b)=>a.giorni-b.giorni||dist(s.l[a.lid],tu)-dist(s.l[b.lid],tu))}
 const quando=n=>n===0?'oggi':n===1?'domani':'tra '+n+' giorni';
 const premioTorneo=t=>t&&t.turno>0?t.posta*D.TORNEO.mol[t.turno-1]:0;
 // chi esce da un torneo in cui è iscritto: incassa il premio maturato
 function chiudiTorneo(s,motivo){const t=s.torneo,premio=premioTorneo(t);TU(s).oro+=premio;s.torneo=null;L(s,motivo+(premio?': incassi '+premio+' monete.':'.'),premio?'bene':'');return premio}
 // i campioni crescono con chi si iscrive: oltre il livello medio `T.LIV` dei capitani ogni livello aggiunge `T.cresce` (così il premio, che sale
 // col livello, resta una scommessa e non una rendita). Arrotondato per difetto: stesso mondo → stessi numeri.
 function baseTorneo(s,turno){const T=D.TORNEO,b=T.base[turno],cs=capi(s),lv=Math.max(0,Math.floor(cs.reduce((a,c)=>a+c.liv,0)/Math.max(1,cs.length))-T.LIV),out={};
  for(const k in b)out[k]=Math.round(b[k]+(T.cresce[k]||0)*lv);return out}
 // gli avversari di un turno: stesso mondo, stessa città, stesso giorno, stesso turno → stessi uomini
 function avversariTorneo(s,lid,giornoT,turno,n){const T=D.TORNEO,b=baseTorneo(s,turno),r=ADADI.gen({rng:ADADI.semina((s.seme^Math.imul(lid+1,2654435761)^Math.imul(giornoT+1,40503)^Math.imul(turno+1,69069))>>>0)}),nomi=T.nomi[turno].slice(),out=[];
  for(let k=0;k<n;k++){const kit=T.kit[Math.floor(r()*T.kit.length)],arma=ogg(kit.arma),sc=kit.scudo?ogg(kit.scudo):null,nome=nomi.splice(Math.floor(r()*nomi.length),1)[0]||T.nomi[turno][0];
   out.push({nome,kit:kit.id,corredo:kit.nome,turno,st:{nome,pf:b.pf,att:b.att+(arma.att||0),dif:b.dif+(sc?sc.dif:0),dan:b.dan+(arma.dan||0),rit:arma.rit||12,perf:arma.perf||0,git:0,vel:10,
    asp:{elmo:kit.elmo,arma:arma.asp,scudo:sc?sc.asp:null,cor:T.cor[turno],mant:1,col:T.colori[turno]}}})}
  return out}
 // il capitano in lizza: a piedi, senza arco, con tutto il resto che porta addosso
 function statArena(c){const eq=Object.assign({},c.eq,{cavallo:null});if((ogg(eq.arma)||{}).git)eq.arma='spada';const st=statCap(Object.assign({},c,{eq})),cv=c.ab.cavaliere||0;st.att+=2*cv;st.pf+=4*cv;return st}
 // dopo una sconfitta in lizza si combatte a metà vita fino a sera
 const feritoOggi=(s,c)=>s.ferito===giorno(s)?Object.assign({},c,{pf:Math.max(1,Math.round(c.pf*.5))}):c;
 function campoArena(s){const t=s.torneo,l=s.l[t.lid],cs=capi(s).map(c=>feritoOggi(s,statArena(c))),av=avversariTorneo(s,t.lid,t.giorno,t.turno,cs.length);
  return{seme:(s.rng^s.t)|0,tipo:'arena',terreno:1,bioma:0,notte:notte(s),ora:(s.t%P.GIORNO)/60,scena:{meteo:'sereno',strada:false,pend:0,costa:null,vicino:{tipo:'citta',faz:l.faz}},a:[],
   b:av.map((x,k)=>({p:-100-k,t:'pre_f2',n:1,st:x.st})),faza:'tu',fazb:l.faz,noma:s.nome,nomb:D.TORNEO.turni[t.turno]+(av.length>1?'i':'')+' di '+l.nome,cap:cs[0],capi:cs,morale:55}}
 // chiude un duello del torneo: vittoria → turno dopo (o finale: premio, fama e un oggetto di pregio 3); sconfitta → fuori, senza prigionia né perdite
 function esitoArena(s,riep){const t=s.torneo,tu=TU(s),T=D.TORNEO,v=riep.vince==='a',out={vince:riep.vince,id:s.uid++,morti:0,feriti:0,oro:0,xp:0,prig:0,fama:0,bottino:[],oggetti:[],promo:false,presa:null,livello:false,torneo:null};
  if(!t){s.incontro=null;return{err:'Nessun torneo in corso'}}s.incontro=null;
  const l=s.l[t.lid],turno=t.turno;
  if(v){s.stat.duelli=(s.stat.duelli||0)+1;out.xp=T.xp[turno];out.fama=T.fama[turno];s.fama+=out.fama;t.turno++;
   if(t.turno>=3){const prem=t.posta*T.mol[2],r=rnd(s),has=id=>tu.zaino.includes(id)||[s.cap].concat(s.soci||[]).some(c=>Object.values(c.eq).flat().includes(id)),pool=Object.keys(D.OGG).filter(id=>D.OGG[id].q===3&&!has(id)),id=pool.length?pool[Math.floor(r()*pool.length)]:null;
    tu.oro+=prem;out.oro=prem;if(id){tu.zaino.push(id);out.oggetti.push(id)}s.torneo=null;s.stat.tornei=(s.stat.tornei||0)+1;out.torneo={vinto:true,turno,premio:prem,oggetto:id,chiuso:true};
    L(s,'Campione del torneo di '+l.nome+'! '+prem+' monete'+(id?' e '+D.OGG[id].nome+'.':'.'),'bene')}
   else{out.torneo={vinto:true,turno,premio:premioTorneo(t),oggetto:null,chiuso:false};L(s,'Vinci il duello contro '+T.turni[turno].toLowerCase()+(out.fama?' (+'+out.fama+' fama)':'')+': in palio ora '+premioTorneo(t)+' monete.','bene')}}
  else{s.torneo=null;s.ferito=giorno(s);out.torneo={vinto:false,turno,premio:0,oggetto:null,chiuso:true};L(s,'Cadi in lizza a '+l.nome+' e perdi il torneo: fino a sera combatterai a metà delle forze.','male')}
  cresci(s,out);s.ult=out;s.ev.push({t:'esito',out});return{s,out}}
 // il capitano cresce
 function cresci(s,out){for(const c of capi(s)){c.xp+=out.xp;while(c.xp>=xpLiv(c.liv)){c.xp-=xpLiv(c.liv);c.liv++;c.punti++;out.livello=true;L(s,c.nome+' sale al livello '+c.liv+'.','bene')}}}
 // la scheda della battaglia per VCAM: lato `a` = chi gioca e i suoi alleati
 function campoBase(s){const inc=s.incontro;if(!inc)return null;if(inc.tipo==='arena')return campoArena(s);const{nem,all,luogo}=schieramenti(s),tu=TU(s),M=VEN.mappaDi(s),i=cella(M,tu.x,tu.y);
  const riga=(p,tr)=>tr.filter(e=>e.n-(e.f||0)>0).map(e=>({p,t:e.t,n:e.n-(e.f||0)}));
  let a=riga(0,tu.tr),b=[];for(const p of all)a=a.concat(riga(p.id,p.tr));for(const p of nem)b=b.concat(riga(p.id,p.tr));if(luogo)b=b.concat(riga(-1-luogo.id,luogo.g));
  const cs=capi(s).map(c=>feritoOggi(s,statCap(c)));
  const scena={meteo:s.meteo||'sereno',strada:!!M.S[i],pend:M.T[i]===3?1:0,costa:null,vicino:null};
  for(let d=1;d<=3&&!scena.costa;d++){if(M.T[cella(M,tu.x+d,tu.y)]===0)scena.costa='e';else if(M.T[cella(M,tu.x-d,tu.y)]===0)scena.costa='o'}
  {let m=luogo,md=3.4;if(!m)for(const l of s.l){const d=dist(l,tu);if(d<md&&l.noto!==false){md=d;m=l}}if(m)scena.vicino={tipo:m.tipo,faz:m.faz}}
  return{seme:(s.rng^s.t)|0,tipo:luogo&&MURA[luogo.tipo]?'assedio':'campo',terreno:M.T[i],bioma:M.B[i],notte:notte(s),ora:(s.t%P.GIORNO)/60,scena,a,b,
   faza:lato(s),fazb:luogo?luogo.faz:nem[0]?nem[0].faz:'pre',cola:colFaz(s,lato(s)),colb:colFaz(s,luogo?luogo.faz:nem[0]?nem[0].faz:'pre'),noma:s.nome,nomb:luogo?luogo.nome:nem.map(p=>p.nome).join(', '),
   cap:cs[0],capi:cs,morale:tu.mor,assedio:luogo&&MURA[luogo.tipo]&&s.assedio&&s.assedio.lid===luogo.id?fasi(s):undefined}}
 // assedio di chi gioca (V5b): le scale sono pronte subito, la breccia dopo BRECCIA_ORE dall'inizio, la porta con l'ariete
 // un salvataggio di prima delle fasi non ha `da`: l'assedio era iniziato ASSEDIO_ORE prima di `pronto`
 const inizio=a=>a.da!=null?a.da:a.pronto-P.ASSEDIO_ORE*60;
 const fasi=s=>({breccia:s.t-inizio(s.assedio)>=P.BRECCIA_ORE*60,ariete:!!s.assedio.ariete});
 function assedioStato(s){const a=s.assedio;if(!a)return null;const f=fasi(s),resta=inizio(a)+P.BRECCIA_ORE*60-s.t;return{scale:true,breccia:f.breccia,ariete:f.ariete,oreBreccia:Math.max(0,Math.ceil(resta/60))}}
 function scegliNucleo(s,v){if(s.rac&&s.rac.scena)return{err:'Prima rispondi'};const inc=s.incontro,tu=TU(s),r=rnd(s);if(!inc)return{err:'Nessun incontro'};
  if(inc.tipo==='mischia'){if(v==='a'||v==='b'){inc.lato=v;const{nem}=schieramenti(s);for(const p of nem)if(!ostile(s,p,tu)&&VEN.regni(s).includes(p.faz))VEN.inimica(s,p.faz);inc.pronto=true;return{s}}
   if(v==='lascia'){s.incontro=null;return{s}}if(!inc.pronto)return{err:'Scegli con chi stare'}}
  if(inc.tipo==='parla'){const p=part(s,inc.pid[0]);if(v==='lascia'||!p){s.incontro=null;return{s}}
   const sgp=p.k==='sig'?s.sig[p.sig]:null;if(sgp)VEN.confSig(s,sgp);
   if(sgp&&(v==='lettera'||v==='prestito'||v==='rendi')){const R=VEN.favoreSig(s,sgp,v);if(R)return R}
   if(v==='notizie'){if(inc.detto)return{err:'Non ha altro da dirti'};if(sgp){const R=VEN.favoreSig(s,sgp,'notizie');if(R)return R;VEN.memSig(sgp).g=giorno(s)}inc.detto=1;const x=s.l.filter(l=>l.noto===false&&l.g.length).sort((a,b)=>dist(a,tu)-dist(b,tu))[0];
    if(x){x.noto=true;inc.voce='«Si parla di '+x.nome+': '+(x.tipo==='covo'?'un nido di predoni':'pietre antiche, e chi ci va non sempre torna')+'. Te lo segno sulla mappa.»'}else inc.voce='«Niente che tu non sappia già, capitano.»';return{s}}
   if(v.slice(0,6)==='passa:')return VEN.passaA(s,p,+v.slice(6));
   if(v==='aggredisci'){if(sgp)VEN.memSig(sgp).trad++;if(VEN.regni(s).includes(p.faz)){VEN.inimica(s,p.faz);L(s,'Hai aggredito gente di '+VEN.rg(s,p.faz).breve+': ora ti sono nemici.','male')}inc.tipo='nemico';inc.da='tu';return{s}}return null}
  if(inc.tipo==='assalto'&&v==='togli'){s.assedio=null;s.incontro=null;if(s.dentro!==inc.lid)s.davanti=inc.lid;return{s}}
  if(inc.tipo==='assalto'&&(v==='attendi'||v==='ariete')){const a=s.assedio;if(!a||a.lid!==inc.lid||!MURA[s.l[inc.lid].tipo])return{err:'Qui non c\'è un assedio'};
   // si rimanda l'assalto: paghe, viveri e soccorsi dei signori continuano a correre
   if(v==='attendi'){if(fasi(s).breccia)return{err:'La breccia è già aperta'};a.pronto=inizio(a)+P.BRECCIA_ORE*60}
   else{if(a.ariete)return{err:'L\'ariete è già pronto'};if(tu.oro<P.ARIETE_ORO)return{err:'Servono '+P.ARIETE_ORO+' monete'};tu.oro-=P.ARIETE_ORO;a.ariete=true;a.pronto=s.t+P.ARIETE_ORE*60}
   a.da=inizio(a);s.incontro=null;tu.ord={t:'aspetta',fino:a.pronto+60};L(s,v==='attendi'?'Aspettate che le mura cedano.':'Si abbatte un tronco per l\'ariete: pronto tra '+P.ARIETE_ORE+' ore.','guerra');return{s}}
  if(v==='attacca'||v==='auto')return{s,campo:campo(s)};
  if(inc.tipo==='nemico'){const{nem}=schieramenti(s),capo=nem[0];
   if(v==='paga'){if(!capo||capo.k!=='pre')return{err:'Non trattano'};const q=Math.max(30,Math.floor(tu.oro*.25));if(tu.oro<q)return{err:'Non hai abbastanza monete'};tu.oro-=q;capo.oro+=q;for(const p of nem){p.fermo=s.t+240;p.ia.st='giro';p.via=[]}s.tregua=s.t+480;s.incontro=null;L(s,'Paghi '+q+' monete e i predoni vi lasciano passare.');VEN.reagisci(s,'tributo');return{s}}
   if(v==='fuggi'){const e=tu.tr.filter(e=>!D.TR[e.t].compagno&&e.n>0);const persi=inc.da==='tu'?0:Math.max(1,Math.floor(uomini(tu)*.12));let k=persi,via=0;while(k>0&&e.length){const x=e[Math.floor(r()*e.length)];if(togliUomini(tu.tr,x.t,1)){k--;via++}else e.splice(e.indexOf(x),1);if(!e.some(q=>q.n>0))break}
    for(const p of nem){p.fermo=s.t+150;p.ia.st='giro';p.via=[]}s.tregua=s.t+300;tu.mor=Math.max(0,tu.mor-6);s.incontro=null;L(s,via?'Vi sganciate lasciando indietro '+via+' uomini di retroguardia.':'Vi sganciate senza perdite.',via?'male':'');VEN.reagisci(s,'fuga');return{s}}}
  return null}
 // la scelta che il nucleo non conosce passa ai ganci `scelta`; se nessuno risponde resta l'errore di sempre
 function scegli(s,v){const r=scegliNucleo(s,v);if(r)return r;return VEN.ganci('scelta',s,v)||{err:'Scelta non valida'}}
 // chiude una battaglia giocata o risolta: riep = { vince:'a'|'b', cad:[{p,t,n}], capKo, uccisi }
 function esitoBase(s,riep){const inc=s.incontro;if(!inc)return{err:'Nessun incontro'};if(inc.tipo==='arena')return esitoArena(s,riep);const{nem,all,luogo}=schieramenti(s),tu=TU(s),r=rnd(s),med=abil(s,'medicina');
  const out={vince:riep.vince,morti:0,feriti:0,oro:0,xp:0,prig:0,fama:0,bottino:[],oggetti:[],promo:false,presa:null,livello:false};const dona=id=>{if(D.OGG[id]){tu.zaino.push(id);out.oggetti.push(id)}};
  const fn=nem.reduce((x,p)=>x+forza(p),0)+(luogo?forzaTr(luogo.g)*(MURA[luogo.tipo]?P.MURA:1):0),fa=forza(tu)+all.reduce((x,p)=>x+forza(p),0);
  let valUcc=0;const prima=uomini(tu);
  for(const c of riep.cad||[]){if(c.n<=0)continue;if(c.p===0){const e=tu.tr.find(e=>e.t===c.t);if(!e)continue;const comp=!!D.TR[c.t].compagno;let fer=0;for(let k=0;k<c.n;k++)if(comp||r()<.3+med*.06)fer++;
     const morti=Math.min(c.n-fer,e.n);togliUomini(tu.tr,c.t,morti);const e2=tu.tr.find(e=>e.t===c.t);if(e2)e2.f=Math.min(e2.n,(e2.f||0)+fer);out.morti+=morti;out.feriti+=fer}
   else if(c.p<0){const l=s.l[-1-c.p];togliUomini(l.g,c.t,c.n);valUcc+=c.n*D.valore(c.t)}
   else{const p=part(s,c.p);if(p){togliUomini(p.tr,c.t,c.n);if(nem.includes(p)){valUcc+=c.n*D.valore(c.t);if(riep.vince==='a'&&r()<.3&&s.prig.reduce((a,e)=>a+e.n,0)<limitePrig(s)){aggiungi(s.prig,c.t,1);out.prig++}}}}}
  s.stat.uccisi+=Math.round(valUcc);if(prima>0&&out.morti>=prima*.25)VEN.reagisci(s,'perdite');
  if(riep.vince==='a'){s.stat.vinte++;if(fn>=fa){VEN.reagisci(s,'vittoria');for(const c of VEN.inCompagnia(s)){const gr=VEN.gradDi(s,c.id);gr.g=VEN.limita(gr.g+D.GRAD.VINTA)}}const rapporto=fn/Math.max(1,fa);out.fama=Math.max(1,Math.round(Math.min(25,fn/14*Math.max(.4,rapporto))));s.fama+=out.fama;s.slancio=Math.min(30,s.slancio+8);
   out.xp=Math.round(valUcc*1.4+10);
   for(const p of nem){VEN.avanzaInc(s,'vinci',p);out.oro+=Math.floor(p.oro*.6)+Math.round(forza(p)*.2);const era=p.k,sgi=p.sig;
    for(const q of s.incarichi)if(q.tipo==='predoni'&&q.pid===p.id&&!q.fatto){q.fatto=true;const l=s.l[q.da];tu.oro+=q.premio;l.rel+=8;l.inc=null;relaz(s,l.faz,2);s.fama+=3;L(s,'Predoni dispersi: '+l.nome+' vi paga '+q.premio+' monete.','bene')}
    if(p.k==='sig'&&r()<.3){const B=D.BOTTEGA[p.faz];if(B)dona(B[Math.floor(r()*B.length)])}
    if(p.k==='riv'&&!s.rivVinta){s.rivVinta=giorno(s);const vv=s.volpe||(s.volpe={tappa:0});if(!vv.dono){vv.dono=1;dona(D.RIVALE.premio)}s.fama+=15;L(s,'La Volpe Rossa vi lascia il campo'+(vv.dono===1?', e la sua cavalla.':'.'),'bene')}
    if(p.k==='sig'){VEN.memSig(s.sig[sgi]).sconf++;const preso=r()<VEN.probCattura(s,riep);VEN.sconfitta(s,p,'tu',preso?'tu':null);if(preso){s.sig[sgi].am=(s.sig[sgi].am||0)-10;s.prig.push({sig:sgi,n:1,t:'sig'});L(s,s.sig[sgi].nome+' è tuo prigioniero.','bene')}relaz(s,p.faz,-4)}
    else{if(p.porta){out.bottino.push([p.porta.m,p.porta.q]);tu.merci[p.porta.m]=(tu.merci[p.porta.m]||0)+p.porta.q}VEN.sconfitta(s,p,'tu')}
    if(era==='pre'){for(const l of s.l)if(l.tipo==='villaggio'&&dist(l,tu)<6)l.rel+=1}}
   out.oro+=Math.round(valUcc*.4);out.oro=Math.round(out.oro*(1+somma(s,'bottino')));VEN.ganci('premio',s,riep,out);tu.oro+=out.oro;
   // esperienza alle truppe rimaste, in proporzione
   const tot=uomini(tu)||1;for(const e of tu.tr)if(D.TR[e.t].su.length){e.xp=(e.xp||0)+valUcc*.9*e.n/tot;if(e.xp>=D.XP_SU[D.TR[e.t].t])out.promo=true}
   for(const p of all){p.sc=0;if(VEN.regni(s).includes(p.faz))relaz(s,p.faz,3);if(p.k==='sig'&&s.sig[p.sig]){s.sig[p.sig].am=(s.sig[p.sig].am||0)+4;VEN.memSig(s.sig[p.sig]).fav++}}
   if(luogo&&SITO[luogo.tipo]){const covo=luogo.tipo==='covo';VEN.reagisci(s,'sito');VEN.avanzaInc(s,'sito',luogo);luogo.g=[];luogo.vinto=giorno(s);if(luogo.tesoro){dona(luogo.tesoro);luogo.tesoro=null}s.stat[covo?'covi':'rovine']++;const pr=covo?260:120;tu.oro+=pr;out.oro+=pr;s.fama+=covo?12:6;out.fama+=covo?12:6;
    L(s,covo?luogo.nome+' è in cenere: le strade respirano.':'Le rovine tacciono. Quel che custodivano è vostro.','bene');if(covo)s.davanti=-1;
    for(const q of s.incarichi)if((q.tipo==='reliquia'||q.tipo==='taglia')&&q.a===luogo.id&&!q.fatto&&!q.fallito){q.fatto=true;tu.oro+=q.premio;out.oro+=q.premio;const da=s.l[q.da];da.inc=null;da.rel+=8;s.fama+=5;L(s,'Incarico compiuto: '+q.premio+' monete da '+da.nome+'.','bene')}}
   else if(luogo){for(const p of s.p.filter(p=>p.dentro===luogo.id&&p.k!=='sig'))p.dentro=-1;const srv=s.servizio;
    if(srv){VEN.conquista(s,luogo,srv.faz,srv.tipo==='vas'?-2:-1);if(srv.tipo==='vas')L(s,'Il sovrano ti affida '+luogo.nome+'.','bene');else{tu.oro+=700;out.oro+=700}relaz(s,srv.faz,10)}else VEN.conquista(s,luogo,'tu',-2);
    luogo.g=[];s.assedio=null;s.fama+=20;out.fama+=20;out.presa=luogo.id;s.dentro=luogo.id}
   if(inc.tipo==='mischia'){const sc=s.scontri.find(x=>x.id===inc.sc);if(sc){const i=s.scontri.indexOf(sc);s.scontri.splice(i,1)}}}
  else{s.stat.perse++;tu.mor=Math.max(0,tu.mor-15);s.slancio=0;out.xp=Math.round(valUcc*.7);
   for(const p of nem){p.sc=0;p.fermo=s.t+120;VEN.promuoviIA(p)}for(const p of all){p.sc=0;if(p.k!=='tu')VEN.sconfitta(s,p,nem[0]?nem[0].faz:null)}
   if(inc.tipo==='mischia'){const sc=s.scontri.find(x=>x.id===inc.sc);if(sc)s.scontri.splice(s.scontri.indexOf(sc),1)}
   // i superstiti si disperdono: ne resta una parte, ferita; oro e merci al vincitore; il capitano è preso se è caduto
   const persi=Math.floor(tu.oro*.4);tu.oro-=persi;out.oro=-persi;tu.merci={};
   for(const e of tu.tr.slice()){if(D.TR[e.t].compagno){e.f=e.n;continue}const resta=Math.floor(e.n*(riep.capKo?.3:.6));togliUomini(tu.tr,e.t,e.n-resta);const e2=tu.tr.find(x=>x.t===e.t);if(e2)e2.f=Math.min(e2.n,Math.ceil(e2.n*.6))}
   s.assedio=null;
   if(riep.capKo){s.prigioniero={fino:s.t+(18+Math.floor(r()*30))*60,da:nem[0]?nem[0].nome:(luogo?luogo.nome:'i nemici')};tu.ord=null;tu.via=[];L(s,'Sei caduto e ti hanno preso: ti porteranno in catene finché non riesci a fuggire.','male')}
   else{const M=VEN.mappaDi(s),m=nem[0]||luogo;if(m){const v=vicinoOk(M,tu.x+(tu.x-m.x)*2+1.5,tu.y+(tu.y-m.y)*2+1.5);tu.x=v[0];tu.y=v[1]}L(s,'La compagnia è rotta e si ritira in disordine.','male')}
   s.rotta=s.t+180;tu.ord=null;tu.via=[]}
  cresci(s,out);VEN.ganci('battaglia',s,riep,out);
  s.incontro=null;s.ult=out;s.ev.push({t:'esito',out});return{s,out}}
 // ganci: `scheda(s,sc)` in fondo a `campo` (aggiunge campi; se restituisce un oggetto, quello è la scheda) ed `esito(s,riep)` all'inizio di `esito` (se restituisce un risultato, l'esito normale non si fa)
 function campo(s){const sc=campoBase(s);if(!sc)return sc;const x=VEN.ganci('scheda',s,sc);return x&&typeof x==='object'?x:sc}
 function esito(s,riep){const x=VEN.ganci('esito',s,riep);if(x)return x;return esitoBase(s,riep)}
 // risoluzione automatica: gioca la battaglia col motore del campo, senza grafica (VCAM è nel file dopo: esiste a runtime)
 function auto(s){const c=campo(s);if(!c)return{err:'Nessun incontro'};return esito(s,VCAM.risolvi(c))}
 return{assalto,schieramenti,torneoOggi,tornei,quando,premioTorneo,chiudiTorneo,avversariTorneo,statArena,campo,assedioStato,scegli,esito,auto}})());
