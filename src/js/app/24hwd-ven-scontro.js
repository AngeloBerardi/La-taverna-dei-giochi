/* ---- Compagnia di ventura, vista: incontro, esito, attesa e HUD della battaglia. ----
   Parte di `Ven` (24hw-ventura.js): legge stato e aiutanti da `Ven._`. Nomi e HTML come prima. CSS: css/39j*-ven-*.css. */
const VenScontro=(()=>{
 const {D,V,bt,faz,inS,n0,oggH,pannello,posto,riga,tu}=Ven._;
 function incontroH(fascia){const s=V.s,inc=s.incontro;if(!inc)return'';const t=tu();
  if(inc.tipo==='parla'){const p=VEN.part(s,inc.pid[0]);if(!p)return pannello('Incontro',bt('Prosegui','scegli:lascia'),{fisso:1});
   const sg=p.k==='sig'?s.sig[p.sig]:null,tr=sg&&D.TRATTI[sg.tratto],riv=p.k==='riv';
   return pannello(esc(riv?D.RIVALE.nome.charAt(0).toUpperCase()+D.RIVALE.nome.slice(1):p.nome),`<p class="vn-p">${p.k==='car'?'I mercanti vi salutano guardinghi, la mano sulle borse.':riv?'«Guarda guarda, un collega.» '+esc(D.RIVALE.d)+' «Il mondo è grande abbastanza per due compagnie. Forse.»':tr?'Signore '+esc(tr.nome)+'. '+esc(tr.saluto):'Vi squadrano in silenzio.'} ${faz(p.faz)}</p><p class="vn-p">${VenGente.schieraH([p])}</p>${inc.voce?`<p class="vn-p vn-bene">${esc(inc.voce)}</p>`:''}
${VenLuoghi.passaH(sg)}${sg?VenGente.confH(s,sg):''}${riga('',bt('Buona strada','scegli:lascia',{cls:'gold'})+(inc.detto?'':bt('Che si dice in giro?','scegli:notizie',{no:!!sg&&VEN.confidenza(s,sg)<1}))+bt(riv?'Sfidala':'Aggredisci','scegli:aggredisci'))}`,{fisso:1})}
  if(inc.tipo==='mischia'&&!inc.pronto){const sc=s.scontri.find(x=>x.id===inc.sc);if(!sc)return pannello('Battaglia',bt('Prosegui','scegli:lascia'),{fisso:1});const A=sc.a.map(id=>VEN.part(s,id)).filter(Boolean),B=sc.b.map(id=>VEN.part(s,id)).filter(Boolean);
   return pannello('Una battaglia in corso',`<p class="vn-p">Due schiere si affrontano. Con chi state?</p>${riga(`<b>${A.map(p=>esc(p.nome)).join(', ')}</b><small>${VenGente.schieraH(A)}</small>`,bt('Con loro','scegli:a',{cls:'gold'}))}${riga(`<b>${B.map(p=>esc(p.nome)).join(', ')}</b><small>${VenGente.schieraH(B)}</small>`,bt('Con loro','scegli:b',{cls:'gold'}))}${riga('',bt('Non è affar nostro','scegli:lascia'))}`,{fisso:1})}
  if(inc.tipo==='arena'){const T=D.TORNEO,tn=s.torneo;if(!tn)return pannello('Torneo',bt('Prosegui','chiudi'),{fisso:1});const capi=VEN.capi(s),av=VEN.avversariTorneo(s,tn.lid,tn.giorno,tn.turno,capi.length),mat=VEN.premioTorneo(tn),st=capi.map(c=>VEN.statArena(c));
   return pannello(esc(T.turni[tn.turno])+' · '+esc(s.l[tn.lid].nome),`<p class="vn-p">Lo steccato è pieno di gente. Si combatte a piedi, uno contro uno${capi.length>1?' (ognuno col suo avversario: si vince o si perde insieme)':''}.</p>
${av.map((x,k)=>riga(`<b>${esc(x.nome)}</b><small>${esc(x.corredo)} · vita ${x.st.pf} · danno ${x.st.dan} · difesa ${x.st.dif}</small>`,'')).join('')}
<p class="vn-p"><small>Tu: ${capi.map((c,k)=>esc(c.nome)+' — '+esc((D.OGG[c.eq.arma]||{}).nome||'a mani nude')+', vita '+st[k].pf+', difesa '+st[k].dif).join(' · ')}.${s.ferito===VEN.giorno(s)?' <span class="vn-male">Ancora ammaccato: vita a metà fino a sera.</span>':''}</small></p>
${riga('',bt(ic('spada',16)+' Combatti','scegli:attacca',{cls:'gold'})+bt('Risolvi','scegli:auto'))}${riga('<small>Cambia arma dal capitano prima di entrare.</small>',bt(mat?'Ritirati · '+mat:'Ritirati','fai:ritira'))}`,{fisso:1,cls:'vn-inc'})}
  const{nem,all,luogo}=VEN.schieramenti(s),sito=luogo&&VEN.SITO[luogo.tipo],fn=nem.reduce((a,p)=>a+VEN.forza(p),0)+(luogo?VEN.forzaTr(luogo.g)*(VEN.MURA[luogo.tipo]?VEN.P.MURA:1):0),fa=VEN.forza(t)+all.reduce((a,p)=>a+VEN.forza(p),0),q=fa/Math.max(1,fa+fn)*100;
  const A=VEN.anteprima(s),titolo=sito?esc(luogo.nome):luogo?'Assalto a '+esc(luogo.nome):nem.map(p=>esc(p.nome)).join(', ')||'Nemici';
  const sc=A.scelte,strat=sc.filter(x=>/^strat:/.test(x.k)),norm=sc.filter(x=>!/^strat:/.test(x.k));
  const bot=x=>`<span class="vn-sc">${bt(esc(x.tx),'scegli:'+x.k,{cls:x.k==='attacca'?'gold':'',no:x.ok===false})}${x.ok===false&&x.perche?`<small class="vn-fl2">${esc(x.perche)}</small>`:infoH(esc(x.info||''))}</span>`;
  if(fascia)return pannello(titolo,`${strat.length?`<p class="vn-p"><small>Consiglio</small></p><div class="vn-sg">${strat.map(bot).join('')}</div>`:''}<div class="vn-sg">${norm.map(bot).join('')}</div>`,{fisso:1,cls:'vn-inc'});
  return pannello(titolo,`${A.avvisi.length?`<p class="vn-p vn-male vn-all">${A.avvisi.map(esc).join(' · ')}</p>`:''}<div class="vn-ff">${lato(A.noi,'Voi')}${lato(A.loro,'Loro')}</div>
${campoRiga(A)}<div class="vn-forze"><i style="width:${q.toFixed(0)}%"></i></div><small class="vn-fl"><span>Voi ${VEN.sani(t)}</span><span>${q>62?'In vantaggio':q>42?'Alla pari':q>28?'In svantaggio':'Disperata'}</span><span>Loro</span></small>
${luogo&&!sito?VenLuoghi.fasiH():''}${strat.length?`<p class="vn-p"><small>Consiglio</small></p><div class="vn-sg">${strat.map(bot).join('')}</div>`:''}<div class="vn-sg">${norm.map(bot).join('')}</div>`,{fisso:1,cls:'vn-inc'+(ui.tv?' vn-tvi':'')})}
 function lato(x,et){const n=x.stima?esc(x.stima):null,r=x.rango,rn=r&&typeof r==='object'?r.n:r,rt=r&&typeof r==='object'?r.nome:'',num=(i,v,l)=>`<span title="${l}">${ic(i,16)}<b>${n?'?':v}</b><small>${l}</small></span>`;
  return`<div class="vn-fc"><div class="vn-stend" style="--a:${x.col};--b:${x.col2}"><b>${esc((x.nome||'?').charAt(0).toUpperCase())}</b></div><small>${et}</small><h4>${esc(x.nome)}</h4>
${x.capo?`<p class="vn-cp">${esc(x.capo)}${x.indole?' · '+esc(x.indole):''}</p>`:''}${rn!=null?`<p class="vn-rg">${[0,1,2,3,4].map(i=>`<i class="${i<rn?'on':''}"></i>`).join('')} ${esc(rt||'')}</p>`:''}
${n?`<p class="vn-cp">${n}</p>`:''}<div class="vn-nn">${num('scudo',x.f,'fanti')}${num('freccia',x.t,'tiratori')}${num('passi',x.c,'cavalieri')}</div></div>`}
 function campoRiga(A){const sn=A.scena||{},T={1:'pianura',2:'bosco',3:'colline',4:'monti'},h=Math.floor(A.ora)%24,o=h<6?'notte':h<12?'mattina':h<18?'pomeriggio':'sera',M={sereno:'sereno',pioggia:'pioggia',nebbia:'nebbia',neve:'neve'};
  const v=[[null,T[sn.terreno]||'pianura'],sn.strada?['passi','strada']:null,sn.costa?['freccia','costa']:null,[null,M[sn.meteo]||sn.meteo||'sereno'],[h>=6&&h<19?'sole':'luna',o]].filter(Boolean);
  return`<p class="vn-cmp">${v.map(([i,tx])=>`<span>${i?ic(i,14):''}${esc(tx)}</span>`).join('')}</p>`}
 function esitoH(){const o=V.s.ult;if(!o)return'';const v=o.vince==='a';
  if(o.torneo){const x=o.torneo,T=D.TORNEO,s=V.s;
   return pannello(x.vinto?(x.chiuso?'Campione del torneo':'Duello vinto'):'Sconfitta in lizza',`<div class="vn-es ${v?'v':'s'}">${ic(v?'coppa':'teschio',44)}</div>
<div class="vn-griglia"><span><b>${x.premio}</b>${x.chiuso&&x.vinto?'incassate':x.vinto?'in palio':'premio'}</span><span><b>+${o.fama}</b>fama</span><span><b>+${o.xp}</b>esperienza</span></div>
<p class="vn-p ${x.vinto?'vn-bene':'vn-male'}">${x.vinto?(x.chiuso?'Il pubblico è in piedi. Il premio è tuo.':'Superato: '+esc(T.turni[x.turno+1])+' ti aspetta. Puoi ritirarti col premio maturato o rischiarlo.'):'Sei fuori dal torneo e il premio maturato è perso. Nessun uomo è caduto; fino a sera combatti a metà delle forze.'}</p>
${(o.oggetti||[]).map(id=>D.OGG[id]?oggH(D.OGG[id],'',' · nello zaino'):'').join('')}${o.livello?'<p class="vn-p vn-bene">Il capitano sale di livello: un punto abilità da spendere.</p>':''}
${riga('',bt('Avanti','chiudi',{cls:'gold'}))}`,{fisso:1,cls:'vn-inc'})}
  return pannello(v?'Vittoria':'Sconfitta',`<div class="vn-es ${v?'v':'s'}">${ic(v?'coppa':'teschio',44)}</div>
<div class="vn-griglia"><span><b>${o.morti}</b>caduti</span><span><b>${o.feriti}</b>feriti</span><span><b>${o.oro>0?'+':''}${n0(o.oro)}</b>monete</span><span><b>+${o.fama}</b>fama</span><span><b>+${o.xp}</b>esperienza</span><span><b>${o.prig}</b>prigionieri</span></div>
${o.presa!=null?`<p class="vn-p vn-bene">${esc(V.s.l[o.presa].nome)} è caduta.</p>`:''}${(o.oggetti||[]).map(id=>D.OGG[id]?oggH(D.OGG[id],'',' · nello zaino'):'').join('')}${o.livello?'<p class="vn-p vn-bene">Il capitano sale di livello: un punto abilità da spendere.</p>':''}${o.promo?'<p class="vn-p vn-bene">Alcuni uomini sono pronti a salire di rango.</p>':''}
${riga('',bt('Avanti','chiudi',{cls:'gold'}))}`,{fisso:1,cls:'vn-inc'})}
 function attesaH(){const s=V.s;if(s.prigioniero)return`<div class="vn-vela"><div><h3>In catene</h3><p>Prigioniero di ${esc(s.prigioniero.da)}. Le ore passano, in attesa di un'occasione per fuggire.</p></div></div>`;
  return`<div class="vn-vela chiaro"><div><h3>${s.assedio?'Assedio':'La compagnia riposa'}</h3><p>${s.assedio?'Si montano scale e arieti.':'Il tempo scorre.'}</p>${bt('Basta così','ferma',{cls:'gold'})}</div></div>`}
 // ---------- HUD della battaglia ----------
 // ---------- il tavolo dello schieramento (passo 19, solo con i reparti): carte, foglio ondate, Pronto ----------
 const NT={f:'Fanti',t:'Tiratori',c:'Cavalieri'},IC={f:'scudo',t:'freccia',c:'passi'},FM={serrata:'Serrata',larga:'Larga',cuneo:'Cuneo'},ING={retro:'Retro',fsx:'Fianco sinistro',fdx:'Fianco destro'},ORD={carica:'Carica',tieni:'Tieni',segui:'Seguimi'};
 const FN={schiera:'schiera',dividi:'dividi',unisci:'unisci',prepara:'preparaOndata',ondata:'ondata'};
 const nOnd=b=>(b.ond?b.ond.a:[]).reduce((a,w)=>a+w.tr.reduce((c,x)=>c+x.n,0),0);
 const conto=b=>{const camp=b.u.filter(u=>u.l==='a'&&!u.cap&&u.st==='vivo').length,on=nOnd(b),ris=VCAM.riserva(b,'a');return`In campo ${camp}/${camp+on+ris} · Ondate ${on} · Riserva ${ris}`};
 const libere=(b,t)=>b.ris.a.reduce((a,x)=>a+(x.t===t?x.n:0),0)+b.u.filter(u=>u.l==='a'&&u.t===t&&!u.cap&&u.st==='vivo'&&!u.sp).length;
 // una mossa di schieramento: da soli subito, in compagnia come gli altri ordini (con il posto)
 function manda(t,o){const k=VenCampo.K,r=inS()?VenStanza.manda({t:'b-'+t,o}):VCAM[FN[t]](k.s,Object.assign({l:'a'},o));if(r&&r.err){Ven.avviso(r.err);return false}return true}
 function schieraSu(r,x,y){if(manda('schiera',{r,x,y}))VenCampo.K.selR=null;render()}
 function foglioH(b){const k=VenCampo.K,id=k.od||1,W=b.ond.a,w=W.find(x=>x.id===id),bz=k.bz[id]||{ing:'retro',k:'comando',v:0,ord:'carica'},d=w?{ing:w.ing,k:w.quando.k,v:w.quando.v,ord:w.ord}:bz,m={},ts={};
  for(const x of w?w.tr:[])m[x.t]=(m[x.t]||0)+x.n;
  for(const x of b.ris.a)ts[x.t]=1;for(const u of b.u)if(u.l==='a'&&!u.cap&&u.st==='vivo'&&!u.sp)ts[u.t]=1;for(const t of Object.keys(m))ts[t]=1;
  const ordT=Object.keys(ts).sort((x,y)=>'ftc'.indexOf(VDAT.TR[x].c)-'ftc'.indexOf(VDAT.TR[y].c)||(x<y?-1:1)),ok=new Set(VCAM.settori(b,'a').filter(z=>z.k==='ingresso').map(z=>z.id));
  const ch=(tx,v,on,no)=>`<button class="vt-ch${on?' on':''}" data-a="ven" data-v="${v}"${no?' disabled':''}>${tx}</button>`,P=`vond:${id}:`;
  const sub=d.k==='linea'?[50,30].map(v=>ch(v+'%',P+'q:linea:'+v,d.v===v)).join(''):d.k==='tempo'?[1,2,3].map(v=>ch(v+' min',P+'q:tempo:'+v*600,d.v===v*600)).join(''):'';
  return`<div class="vt-fo"><div class="vt-fh">${[1,2].map(i=>{const x=W.find(y=>y.id===i);return ch('Ondata '+i+(x?' · '+x.tr.reduce((a,y)=>a+y.n,0):''),'vond:'+i,i===id)}).join('')}<button class="vt-ch vt-x" data-a="ven" data-v="vond:apri" aria-label="Chiudi">${ic('x',18)}</button></div>
<div class="vt-fb"><p class="vt-ct">${conto(b)}</p>${ordT.map(t=>`<div class="vt-tr"><span>${esc(VDAT.TR[t].nome)}<small>${libere(b,t)} liberi</small></span><button class="vt-pm" data-a="ven" data-v="${P}t:${t}:-" aria-label="Meno">−</button><b>${m[t]||0}</b><button class="vt-pm" data-a="ven" data-v="${P}t:${t}:+" aria-label="Più">+</button></div>`).join('')}
<p class="vt-et">Da dove entra</p><div class="vt-sg">${['retro','fsx','fdx'].map(i=>ch(ING[i],P+'ing:'+i,d.ing===i,!ok.has(i))).join('')}</div>
<p class="vt-et">Quando</p><div class="vt-sg">${ch('Al mio segnale',P+'q:comando:0',d.k==='comando')}${ch('Quando la linea cede',P+'q:linea:50',d.k==='linea')}${ch('Dopo',P+'q:tempo:600',d.k==='tempo')}</div>${sub?`<div class="vt-sg">${sub}</div>`:''}
<p class="vt-et">Che ordine ha</p><div class="vt-sg">${['carica','tieni','segui'].map(o=>ch(ORD[o],P+'o:'+o,d.ord===o)).join('')}</div></div></div>`}
 function tavoloBasso(b){const k=VenCampo.K,R=VCAM.reparti(b,'a').filter(x=>x.n>0),cnt={},on=nOnd(b);
  const carte=R.map(x=>{const n=(cnt[x.c]=(cnt[x.c]||0)+1),tot=R.filter(y=>y.c===x.c).length;return`<div class="vt-c${k.selR===x.r?' on':''}" data-r="${x.r}" data-c="${x.c}"><button class="vt-cm" data-a="ven" data-v="vrep:${x.r}">${ic(IC[x.c],18)}<b>${x.n}</b><small>${NT[x.c]}${tot>1?' '+n:''}</small></button><button class="vt-cb2" data-a="ven" data-v="vfm:${x.r}" aria-label="Formazione">${FM[x.fm]||x.fm}</button><button class="vt-cb2" data-a="ven" data-v="vdiv:${x.r}">Dividi</button></div>`}).join('');
  return`<div class="vn-basso vt-bs"><p class="vt-h">${k.selR!=null?'Tocca il campo, dentro una zona, per metterlo':'Tocca un reparto, poi il campo'}</p><div class="vt-cs">${carte}</div><div class="vt-bb">${b.ondOk?bt('Ondate'+(on?' · '+on:''),'vond:apri'):''}${bt(ic('spada',18)+' Pronto','vpronto',{cls:'gold'})}</div></div>${k.fogOnd&&b.ondOk?foglioH(b):''}`}
 function ondaMod(id,q){const k=VenCampo.K,b=k.s,w=b.ond.a.find(x=>x.id===id),bz=k.bz[id]||(k.bz[id]={ing:'retro',k:'comando',v:0,ord:'carica'}),d=w?{ing:w.ing,k:w.quando.k,v:w.quando.v,ord:w.ord}:Object.assign({},bz),m={};
  for(const x of w?w.tr:[])m[x.t]=(m[x.t]||0)+x.n;
  if(q[0]==='t'){const t=q[1],cur=m[t]||0,mx=cur+libere(b,t);m[t]=q[2]==='+'?Math.min(mx,cur+5):Math.max(0,cur-5)}
  else if(q[0]==='ing')d.ing=q[1];else if(q[0]==='q'){d.k=q[1];d.v=+q[2]||0}else if(q[0]==='o')d.ord=q[1];
  Object.assign(bz,d);const tr=Object.keys(m).filter(t=>m[t]>0).map(t=>({t,n:m[t]}));
  if(w||tr.length)manda('prepara',{id,tr,ing:d.ing,quando:{k:d.k,v:d.v},ord:d.ord});render()}
 function azione(v){const k=VenCampo.K,b=k.s,p=v.split(':'),c=p[0];if(!b)return;
  if(c==='vrep'){const r=+p[1];k.selR=k.selR===r?null:r;return render()}
  if(c==='vdiv'){if(manda('dividi',{r:+p[1]}))k.selR=null;return render()}
  if(c==='vfm'){const r=inS()?VenStanza.manda({t:'b-ord',o:{r:+p[1],t:'forma'}}):VCAM.ordina(b,{r:+p[1],t:'forma'});if(r&&r.err)Ven.avviso(r.err);return render()}
  if(c==='vond'){if(p[1]==='apri'){k.fogOnd=!k.fogOnd;return render()}const id=+p[1];if(p.length===2){k.od=id;return render()}return ondaMod(id,p.slice(2))}
  if(c==='vondata'){manda('ondata',{id:+p[1]});return render()}
  if(c==='vpronto'){const r=inS()?VenStanza.manda({t:'b-pronto',o:{}}):VCAM.pronto(b,'a');if(r&&r.err)return Ven.avviso(r.err);
   // i gettoni nemici si muovono nel loro schieramento per un secondo, poi si parte
   k.tvT=k.t+1.2;k.fogOnd=false;k.selR=null;setTimeout(()=>{const g=inS()?VenStanza.pausa():(k.pausa=false);if(g&&g.err)Ven.avviso(g.err);render()},1100);render()}}
 // i comandi del tavolo passano da qui (prima del listener comune): un reparto si trascina su un altro dello stesso tipo per unirli
 {let dr=null,salta=false;
  document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-a="ven"]');if(!b)return;const v=b.dataset.v||'';if(!/^(vrep|vdiv|vfm|vond|vondata|vpronto)(:|$)/.test(v))return;e.stopPropagation();e.preventDefault();if(salta){salta=false;return}azione(v)},true);
  document.addEventListener('pointerdown',e=>{const c=e.target.closest&&e.target.closest('.vt-cm');dr=c?{r:+c.parentNode.dataset.r,c:c.parentNode.dataset.c,x:e.clientX,y:e.clientY}:null},true);
  document.addEventListener('pointerup',e=>{const d=dr;dr=null;if(!d||Math.hypot(e.clientX-d.x,e.clientY-d.y)<14)return;const t=document.elementFromPoint(e.clientX,e.clientY),c2=t&&t.closest('.vt-c');
   if(c2&&+c2.dataset.r!==d.r&&c2.dataset.c===d.c){salta=true;setTimeout(()=>{salta=false},400);if(manda('unisci',{r:+c2.dataset.r,r2:d.r}))VenCampo.K.selR=null;render()}},true)}
 // formazione come piccolo segno: file serrate, punti sparsi, cuneo
 const FMS={serrata:'<path d="M2 3h12M2 7h12M2 11h12" stroke-dasharray="1.6 1"/>',larga:'<path d="M3 3h1M9 3h1M14 3h0M5 7h1M11 7h1M2 11h1M8 11h1M14 11h0" stroke-dasharray="1 4"/>',cuneo:'<path d="M8 2v0M6 6h4M4 10h8M2 14h12" stroke-dasharray="1.6 1"/>'};
 const fmSvg=f=>'<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-label="'+(FM[f]||f)+'">'+(FMS[f]||FMS.larga)+'</svg>';
 // dati di ogni carta di reparto: chiave g (f/t/c), morale, fatica, frecce
 function repDati(b){const mo=VCAM.morali?VCAM.morali(b,'a'):[],R=VCAM.reparti(b,'a').filter(x=>x.n>0).slice(0,6),cnt={};
  return R.map(x=>{const g=x.c,m=mo.find(y=>y.r===x.r)||{},n=(cnt[g]=(cnt[g]||0)+1);return{r:x.r,g,n:x.n,fm:x.fm,mor:m.mor!=null?m.mor:100,fa:m.fa||0,fr:m.fr,nome:NT[g]+(R.filter(y=>y.c===g).length>1?' '+n:'')}})}
 const moC=m=>m>60?3:m>30?2:1;
 function campoH(){const k=VenCampo.K,b=k.s;if(!b)return'';k._hud=0;const tv=VenCampo.tavolo(b),pr=b.ond?b.ond.a.filter(w=>!w.fatta&&w.quando.k==='comando'&&w.tr.length):[],O=[['carica','Carica','spada'],['tieni','Tieni','scudo'],['segui','Seguimi','passi'],['avanza','Avanza','freccia'],['arretra','Ripiega','indietro']];
  const fine=V.pan==='fine'?`<div class="vn-vela"><div><h3>${b.fine&&b.fine.vince==='a'?'Il campo è vostro':'La giornata è persa'}</h3><p>${b.fine&&b.fine.vince==='a'?'Il nemico volta le spalle.':'Chi può si mette in salvo.'}</p>${bt('Avanti','fine',{cls:'gold'})}</div></div>`:'';
  const cap=VCAM.capU(b,posto()),nome=esc((cap&&cap.nome)||"Capitano");
  const carte=tv?'':repDati(b).map(x=>`<button class="vn-rc${k.gruppo===x.g?' on':''} m${moC(x.mor)}${x.mor<=20?' rotto':''}" data-a="ven" data-v="cgr:${x.g}" data-g="${x.g}" data-r="${x.r}">${ic(IC[x.g],18)}<b id="vn-g${x.r<3?x.g:'r'+x.r}">${x.n}</b><span class="vn-fs">${fmSvg(x.fm)}</span><small>${x.nome}</small><i class="vn-mo"><u style="width:${Math.max(4,x.mor)}%"></u></i><s class="vn-fa" style="height:${Math.min(80,x.fa)}%"></s>${x.fr!=null?`<em class="vn-fr">${ic('freccia',10)}${x.fr}</em>`:''}</button>`).join('')+pr.map(w=>`<button class="vn-rc vn-on" data-a="ven" data-v="vondata:${w.id}"><b>${w.tr.reduce((a,x)=>a+x.n,0)}</b><small>Ondata ${w.id}</small><small class="vn-ig">${ING[w.ing]||''}</small></button>`).join('');
  return`<div class="vn-alto vn-ca"><div class="vn-barra"><span class="vn-std a"></span><b id="vn-na"></b><div class="vn-forze"><i id="vn-ba"></i></div><b id="vn-nb"></b><span class="vn-std b"></span></div>
<div class="vn-capo"><span>${ic('cuore',14)}</span><span class="vn-cn">${nome}</span><div class="vn-pfb"><i id="vn-pf"></i></div><button class="vn-ib" data-a="ven" data-v="cvel" aria-label="Velocità">×${k.vel}</button>${tv?'':`<button class="vn-ib ${k.pausa?'on':''}" data-a="ven" data-v="cpausa" aria-label="Pausa">${ic(k.pausa?'play':'pausa',18)}</button>`}<button class="vn-ib ${k.alt>60?'on':''}" data-a="ven" data-v="cvista" aria-label="Vista del comandante">${ic('mappa',18)}</button></div>${tv?`<small class="vt-cnt">${conto(b)}</small>`:''}<canvas id="vn-mm" class="vn-mm" width="72" height="120" aria-label="Mini-mappa"></canvas></div>
${k.pausa&&!tv&&!b.fine&&b.t===0&&!(b.rep&&b.pronto&&b.pronto.a)&&!(inS()&&ui.tv)?`<div class="vn-via"><p>${b.tipo==='arena'?'Tocca lo steccato per muovere il capitano, l\'avversario per attaccarlo. Qui conta solo la tua arma.':'Tocca il campo per muovere il capitano, un nemico per attaccarlo. Scegli un gruppo e dagli un ordine.'}</p>${bt(ic('spada',18)+' Via','cpausa',{cls:'gold'})}</div>`:''}
${tv?tavoloBasso(b):`<div class="vn-basso vn-cb${b.tipo==='arena'?' vn-arena':''}"><div class="vn-rcs">${carte}</div>
<div class="vn-or">${O.map(([o,n,i])=>`<button class="vn-bt" data-a="ven" data-v="cord:${o}">${ic(i,20)}<small>${n}</small></button>`).join('')}<button class="vn-bt vn-grido" id="vn-grido" data-a="ven" data-v="cgrido">${ic('megafono',20)}<small>Grido</small></button></div></div>`}${fine}`}
 // mini-mappa 72x120, quattro volte al secondo: un puntino per gruppo (ambra i nostri, rosso scuro i loro), riquadro della telecamera
 function minimappa(cv){const k=VenCampo.K,b=k.s;if(!cv||!b)return;const x=cv.getContext('2d'),W=b.W||VCAM.C.W,H=b.H||VCAM.C.H,w=cv.width,h=cv.height,sx=w/W,sy=h/H;
  x.fillStyle='#2b3a1c';x.fillRect(0,0,w,h);x.strokeStyle='#b88a3c';x.lineWidth=2;x.strokeRect(1,1,w-2,h-2);
  const G={};for(const u of b.u){if(u.st!=='vivo')continue;const q=u.l+(u.r!=null?u.r:u.c),c=G[q]||(G[q]={l:u.l,n:0,x:0,y:0});c.n++;c.x+=u.x;c.y+=u.y}
  for(const q in G){const c=G[q];x.fillStyle=c.l==='a'?'#f0a830':'#7a1a14';const r=Math.max(2,Math.min(6,1+Math.sqrt(c.n)*.7));x.beginPath();x.arc(c.x/c.n*sx,c.y/c.n*sy,r,0,6.2832);x.fill()}
  const A=VenArte,r=A.cv&&A.cv.getBoundingClientRect();if(r&&r.height){const vw=k.alt*r.width/r.height,vh=k.alt/(A.SE||1);x.strokeStyle='#fff2b0';x.lineWidth=1;x.strokeRect((k.fuoco.x-vw/2)*sx,(k.fuoco.z-vh/2)*sy,vw*sx,vh*sy)}}
 // morale, fatica e frecce dei reparti aggiornati senza ridisegnare
 function hudReparti(){const k=VenCampo.K,b=k.s;if(!b)return;for(const x of repDati(b)){const el=document.querySelector('.vn-rc[data-g="'+x.g+'"][data-r="'+x.r+'"]');if(!el)continue;const u=el.querySelector('.vn-mo u'),f=el.querySelector('.vn-fa');if(u)u.style.width=Math.max(4,x.mor)+'%';if(f)f.style.height=Math.min(80,x.fa)+'%';el.classList.remove('m1','m2','m3');el.classList.add('m'+moC(x.mor));el.classList.toggle('rotto',x.mor<=20)}}
 // tocco lungo su una carta = tutti; tocco sulla mini-mappa = la telecamera va lì; vista del comandante = telecamera alta
 {let lg=null,lungo=false;
  document.addEventListener('pointerdown',e=>{const c=e.target.closest&&e.target.closest('.vn-rc:not(.vn-on)');clearTimeout(lg);if(c)lg=setTimeout(()=>{lungo=true;VenCampo.K.gruppo='tutti';render()},550)},true);
  const ferma=()=>clearTimeout(lg);document.addEventListener('pointerup',ferma,true);document.addEventListener('pointercancel',ferma,true);
  document.addEventListener('click',e=>{const t=e.target.closest?e.target:null;if(!t)return;if(lungo&&t.closest('.vn-rc')){lungo=false;e.stopPropagation();e.preventDefault();return}
   const m=t.closest('#vn-mm');if(m){const r=m.getBoundingClientRect(),b=VenCampo.K.s;if(b)VenCampo.centra((e.clientX-r.left)/r.width*(b.W||VCAM.C.W),(e.clientY-r.top)/r.height*(b.H||VCAM.C.H));return}
   if(t.closest('[data-v="cvista"]')){e.stopPropagation();e.preventDefault();const K=VenCampo.K;K.alt=K.alt>60?38:80;K.segue=K.alt<60;render()}},true)}
 return{incontroH,esitoH,attesaH,campoH,conto,schieraSu,minimappa,hudReparti}})();
