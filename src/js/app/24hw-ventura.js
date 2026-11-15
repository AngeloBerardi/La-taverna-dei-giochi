/* ---- Compagnia di ventura (Cantari di Ventura, piano C): la partita. Stato, ciclo, tocchi, HUD e pannelli. ----
   Mondo libero sul modello dei giochi di comando di truppe: giri la mappa, recluti, commerci, combatti, servi un regno o ne fondi uno.
   Regole: `VEN` (motori/28k), battaglia `VCAM` (28l), dati `VDAT` (28j). Disegno: `VenMappa` (24hu), `VenCampo` (24hv), `VenArte` (24ht).
   Un solo comando: `data-a="ven" data-v="verbo:arg:arg"` (07c-comandi). Il tempo del mondo scorre solo mentre la compagnia
   cammina o aspetta, e mai con un pannello aperto. Salvataggio sul telefono (`ven-salv`), a ogni alba, luogo e battaglia.
   CSS: css/39j-ventura.css (prefisso `vn-`). Piano: docs/VENTURA.md. */
const Ven=(()=>{
 const V={s:null,modo:'mondo',pan:null,sub:'home',vel:1,acc:0,raf:0,ult:0,avvisi:[],qta:1,carta:null,msg:'',regno:'val',hud:0,fine:null,gesti:false,pt:{},pin:0};
 const D=VDAT,ST_K='ven-salv';
 const leggi=()=>{try{return VEN.apri(localStorage.getItem(ST_K))}catch(e){return null}};
 const salva=()=>{if(!V.s||VenStanza.on())return;try{localStorage.setItem(ST_K,VEN.salva(V.s))}catch(e){}};
 const tu=()=>VEN.TU(V.s);
 // in compagnia (stanza live) le azioni passano dalla stanza; da soli si chiamano i motori qui
 const mio2=()=>mio();
 const inS=()=>VenStanza.on(),posto=()=>inS()?Math.max(0,VenStanza.seat()):0,mio=()=>VEN.capDi(V.s,posto())||V.s.cap;
 const ordina=o=>inS()?VenStanza.manda({t:'ordina',o}):VEN.ordina(V.s,o);
 const n0=x=>Math.round(x).toLocaleString('it-IT');
 const faz=f=>`<span class="vn-fz" style="--fz:${D.FAZ[f].col}">${esc(D.FAZ[f].breve)}</span>`;
 const pips=t=>'<i class="vn-pip">'+'<b></b>'.repeat(t)+'</i>';
 const CLS={f:'Fanti',t:'Tiratori',c:'Cavalieri'};
 function doti(o){const x=[],piu=(v,tx)=>{if(v)x.push((v>0?'+':'')+v+' '+tx)};piu(o.dan,'danno');piu(o.att,'mira');piu(o.dif,'difesa');piu(o.pf,'vita');if(o.slot==='cavallo')x.push('passo '+o.vel);else piu(o.vel,'passo');
  if(o.rit)x.push(o.rit<12?'svelta':o.rit>14?'lenta':'');if(o.perf)x.push('sfonda '+Math.round(o.perf*100)+'% d\'armatura');if(o.git)x.push('tira a '+o.git+' passi');if(o.due)x.push('a due mani');if(o.car)x.push('carica +'+Math.round(o.car*100)+'%');
  if(o.morale)x.push('+'+o.morale+' morale');if(o.grido)x.push('grido più frequente');if(o.bottino)x.push('+'+Math.round(o.bottino*100)+'% bottino');if(o.ab)for(const k of Object.keys(o.ab))x.push('+'+o.ab[k]+' '+D.ABIL[k].nome);return x.filter(Boolean).join(' · ')}
 const oggH=(o,azioni,extra)=>riga(`<b class="${PREGIO[o.q]}">${esc(o.nome)}</b> <i class="vn-tag ${PREGIO[o.q]}">${D.PREGIO[o.q]}</i><small>${D.SLOT[o.slot]} · ${esc(doti(o))}${extra||''}</small><small class="vn-fl2">${esc(o.d)}</small>`,azioni||'');
 const TIPO=D.TIPI,PREGIO=['','vn-q1','vn-q2','vn-q3','vn-q4'];
 function avviso(tx,tipo){V.avvisi.push({tx,tipo:tipo||'',t:performance.now()});if(V.avvisi.length>3)V.avvisi.shift();const el=document.querySelector('.vn-avv');if(el)el.innerHTML=avvisiH()}
 const avvisiH=()=>V.avvisi.map(a=>`<div class="vn-av ${a.tipo}">${esc(a.tx)}</div>`).join('');
 // ---------- ingresso dalla pagina Avventura ----------
 function sezioneH(){const s=leggi(),R=D.REGNI;
  const coop=VenStanza.leggiSalv('coop'),
  daSolo=coop?`<button class="b sm ecta" data-a="ven" data-v="dasolo">${V.confSolo?'Conferma: sostituisce la tua partita da solo':'Continua da solo la partita in compagnia'}</button><small class="muted">Compagnia in compagnia, giorno ${VEN.giorno(coop.w)}${V.confSolo?' · la partita da solo che hai ora andrà persa':''}.</small>`:'';
  const cont=s?`<button class="av-card av-cont" data-a="ven" data-v="continua"><span class="vn-stemma">${ic('spada',26)}</span><span class="av-tx"><b>${esc(s.nome)}</b><small>Giorno ${VEN.giorno(s)} · ${VEN.uomini(VEN.TU(s))} uomini · fama ${s.fama}</small></span><span class="av-go">Continua</span></button>`:'';
  return`<div class="sh2">Compagnia di ventura ${infoH('Un mondo libero: tre regni in guerra, villaggi dove reclutare, città dove commerciare, castelli da prendere. Nessuna trama: la strada la scegli tu.')}</div>
${cont}${daSolo}<div class="vn-nuova"><small class="muted">${s?'Ricomincia da un altro regno (il salvataggio di ora si perde):':'Da quale regno parti?'}</small>
<div class="vn-regni vn-r5">${R.map(f=>`<button class="vn-regno${V.regno===f?' on':''}" style="--fz:${D.FAZ[f].col}" data-a="ven" data-v="regno:${f}"><b>${esc(D.FAZ[f].breve)}</b><small>${esc(D.FAZ[f].motto)}</small></button>`).join('')}</div>
<button class="b ${s?'sm':'gold'} ecta" data-a="ven" data-v="nuova">${ic('spada',18)} ${s?'Nuova compagnia':'Leva la compagnia'}</button>
<small class="muted">${ic('amici',14)} In compagnia, fino a quattro capitani: apri una stanza dalla Taverna e scegli «Compagnia di ventura» tra i giochi.</small></div>`}
 function entra(s){V.s=s;V.modo='mondo';V.pan=s.incontro?'incontro':s.dentro>=0||s.davanti>=0?'luogo':null;V.sub='home';V.carta=null;V.msg='';V.avvisi=[];Plancia.chiudi();ui.ven=true;render()}
 function esci(){salva();ui.ven=false;ui.avv=true;V.pan=null;ferma();VenArte.smonta();document.documentElement.classList.remove('vn-on');render()}
 // ---------- ciclo ----------
 function ferma(){if(V.raf){cancelAnimationFrame(V.raf);V.raf=0}}
 function dopo(){const on=!!(ui.ven&&V.s);document.documentElement.classList.toggle('vn-on',on);if(!on){if(V.raf){ferma();VenArte.smonta()}return}
  if(!VenArte.A.pronta){if(!VenArte.A.fallita)VenArte.avvia().then(()=>{if(ui.ven)render()});return}
  const host=document.querySelector('.vn-scena');if(!host)return;VenArte.monta(host);if(!V.gesti)gesti();
  if(V.modo==='mondo')VenMappa.apri(V.s);{const cc=document.querySelector('.vn-carta-cv');if(cc&&V.s)VenMappa.carta(cc,V.s)}
  if(!V.orecchio){V.orecchio=true;document.addEventListener('click',e=>{V.ultimoClick=e},true)}hudVivo();if(!V.raf){V.ult=0;V.raf=requestAnimationFrame(giro)}}
 // «Riprova» dopo la resa: il canvas è nuovo, quindi gesti, scene e contatori si rifanno come dopo una perdita normale
 function riprova(){ferma();V.rip=0;V.riparato=0;V.ripUlt=0;V.gesti=false;V.pt={};V.pin=0;VenMappa.K.scene=null;VenMappa.K.seme=-1;
  VenArte.riprova().then(()=>{if(ui.ven&&V.modo==='campo'&&VenArte.A.pronta)VenCampo.scena();if(ui.ven)render()});render()}
 // contesto grafico perso (schermo bianco): si rifà tutto da capo, al massimo una volta ogni due secondi; alla terza di fila ci si arrende
 function ripara(ora){if(ora-(V.riparato||0)<2000)return false;V.riparato=ora;V.rip=(ora-(V.ripUlt||0)<20000?(V.rip||0):0)+1;V.ripUlt=ora;
  if(V.rip>3){VenArte.A.fallita=true;VenArte.A.pronta=false;VenArte.A.errore='il telefono ha tolto il contesto grafico troppe volte';ferma();render();return false}
  if(!VenArte.rifai()){ferma();render();return false}V.gesti=false;gesti();VenMappa.K.scene=null;VenMappa.K.seme=-1;if(V.modo==='campo')VenCampo.scena();else VenMappa.apri(V.s);return true}
 function giro(ora){V.raf=requestAnimationFrame(giro);if(!ui.ven||!V.s){ferma();return}if(VenArte.persa()&&!ripara(ora))return;const dt=Math.min(.1,V.ult?(ora-V.ult)/1000:.016);V.ult=ora;
  try{if(inS())VenStanza.giro(dt);if(!V.s)return;if(V.modo==='campo'){VenCampo.passo(dt);const k=VenCampo.K;if(k.finita&&!V.fine){V.fine=ora}if(V.fine&&ora-V.fine>1400&&V.pan!=='fine'){V.pan='fine';render()}}
   else{if(!inS())mondo(dt);VenMappa.passo(dt,V.s)}
   if(ora-V.hud>250){V.hud=ora;hudVivo()}
   if(V.avvisi.length&&ora-V.avvisi[0].t>4200){V.avvisi.shift();const el=document.querySelector('.vn-avv');if(el)el.innerHTML=avvisiH()}}
  catch(e){ERR.n(e,'ventura');ferma()}}
 // il tempo del mondo: otto minuti di gioco al secondo a ×1 (un giorno ≈ tre minuti)
 function mondo(dt){const s=V.s,t=tu();if(V.pan&&V.pan!=='attesa')return;if(s.incontro)return;const cammina=t.ord||s.prigioniero;if(!cammina)return;
  V.acc+=dt*8*(s.prigioniero||(t.ord&&t.ord.t==='aspetta')?Math.max(6,V.vel*3):V.vel);const n=Math.floor(V.acc);if(n<1)return;V.acc-=n;const g0=VEN.giorno(s),ev=VEN.passo(s,n);let ridisegna=false;
  for(const e of ev){if(e.t==='incontro'){V.pan='incontro';ridisegna=true;Snd.play('avv-missione')}else if(e.t==='dentro'||e.t==='davanti'){V.pan='luogo';V.sub='home';V.msg='';ridisegna=true;salva();Snd.play('avv-porta')}
   else if(e.t==='log'&&e.tipo)avviso(e.tx,e.tipo);else if(e.t==='giorno'){salva();Snd.play('avv-alba')}else if(e.t==='libero'||e.t==='fine-attesa'){ridisegna=true}else if(e.t==='conquista')ridisegna=true}
  if(V.pan==='attesa'&&!(t.ord&&t.ord.t==='aspetta')&&!s.prigioniero){V.pan=s.incontro?'incontro':s.dentro>=0||s.davanti>=0?'luogo':null;ridisegna=true}
  if(s.prigioniero&&V.pan!=='attesa'){V.pan='attesa';ridisegna=true}
  if(ridisegna||VEN.giorno(s)!==g0)render()}
 // numeri che cambiano senza ridisegnare tutta la pagina
 function hudVivo(){const s=V.s,q=(id,tx)=>{const el=document.getElementById(id);if(el&&el.textContent!==tx)el.textContent=tx};
  if(V.modo==='campo'){const b=VenCampo.K.s;if(!b)return;const na=VCAM.vivi(b,'a').length+VCAM.riserva(b,'a'),nb=VCAM.vivi(b,'b').length+VCAM.riserva(b,'b'),g=VCAM.gruppi(b,'a'),c=VCAM.capU(b,posto());
   q('vn-na',String(na));q('vn-nb',String(nb));const ba=document.getElementById('vn-ba');if(ba)ba.style.width=(na/Math.max(1,na+nb)*100).toFixed(1)+'%';for(const k of['f','t','c'])q('vn-g'+k,String(g[k]));
   const pf=document.getElementById('vn-pf');if(pf&&c)pf.style.width=Math.max(0,c.pf/c.pfm*100).toFixed(0)+'%';const gr=document.getElementById('vn-grido');if(gr){const r=Math.max(0,((b.gridi[posto()]||0)-b.t)/VCAM.C.GRIDO);gr.style.setProperty('--r',r.toFixed(2));gr.classList.toggle('no',r>0)}return}
  const t=tu(),h=VEN.ora(s),m=s.t%60;q('vn-ora','Giorno '+VEN.giorno(s)+' · '+String(h).padStart(2,'0')+':'+String(m-m%10).padStart(2,'0'));q('vn-oro',n0(t.oro));
  q('vn-uom',VEN.uomini(t)+'/'+VEN.limite(s));q('vn-cibo',String(Math.floor(VEN.razioni(t)/Math.max(1,Math.ceil(VEN.uomini(t)/6)))));q('vn-mor',String(t.mor));q('vn-fama',String(s.fama));q('vn-meteo',s.meteo==='pioggia'?'pioggia':s.meteo==='nebbia'?'nebbia':'');
  const lu=document.getElementById('vn-luna');if(lu){const nt=VEN.notte(s);if(lu.dataset.n!==String(nt)){lu.dataset.n=String(nt);lu.innerHTML=ic(nt?'luna':'sole',16)}}}
 // ---------- gesti sul canvas ----------
 function gesti(){V.gesti=true;const cv=VenArte.cv,sc=()=>V.modo==='campo'?VenCampo:VenMappa;cv.style.touchAction='none';
  cv.addEventListener('pointerdown',e=>{try{cv.setPointerCapture(e.pointerId)}catch(x){}V.pt[e.pointerId]={x:e.clientX,y:e.clientY,x0:e.clientX,y0:e.clientY,t:performance.now(),mosso:false};V.pin=0});
  cv.addEventListener('pointermove',e=>{const p=V.pt[e.pointerId];if(!p)return;const ids=Object.keys(V.pt);
   if(ids.length>=2){const o=V.pt[ids.find(i=>+i!==e.pointerId)];p.x=e.clientX;p.y=e.clientY;const d=Math.hypot(p.x-o.x,p.y-o.y);if(V.pin>0&&d>0)sc().pizzico(d/V.pin);V.pin=d;p.mosso=o.mosso=true;return}
   const dx=e.clientX-p.x,dy=e.clientY-p.y;if(!p.mosso&&Math.hypot(e.clientX-p.x0,e.clientY-p.y0)<9)return;p.mosso=true;p.x=e.clientX;p.y=e.clientY;sc().trascina(dx,dy)});
  const su=e=>{const p=V.pt[e.pointerId];delete V.pt[e.pointerId];V.pin=0;if(!p||p.mosso||performance.now()-p.t>600||e.type==='pointercancel')return;tocco(e.clientX,e.clientY)};
  cv.addEventListener('pointerup',su);cv.addEventListener('pointercancel',su);cv.addEventListener('wheel',e=>{e.preventDefault();sc().pizzico(e.deltaY<0?1.12:.89)},{passive:false})}
 function tocco(px,py){const s=V.s;if(V.modo==='campo'){const o=VenCampo.tocco(px,py);if(!o)return;const r=inS()?VenStanza.bCap(o):VCAM.capitano(VenCampo.K.s,o);if(r&&r.err)avviso(r.err);return}
  if(V.pan||s.incontro||s.prigioniero)return;const o=VenMappa.tocco(px,py);if(!o)return;V.carta=null;let r=null;
  if(o.tipo==='terra')r=ordina({t:'vai',x:o.x,y:o.y});
  else if(o.tipo==='luogo'){const l=s.l[o.id];if(VEN.dist(tu(),l)<.8&&(s.dentro===l.id||s.davanti===l.id)){V.pan='luogo';return render()}r=ordina({t:'entra',lid:o.id});if(!r.err)avviso('In marcia verso '+l.nome)}
  else{V.carta=o.id;return render()}
  if(r&&r.err)avviso(r.err);else Snd.play('avv-passo');if(document.querySelector('.vn-carta'))render()}
 // ---------- HUD del mondo ----------
 function altoH(){return`<div class="vn-alto"><button class="vn-ib" data-a="ven" data-v="pan:menu" aria-label="Menu">${ic('menu',20)}</button>
<div class="vn-tempo"><span id="vn-luna"></span><b id="vn-ora"></b><small id="vn-meteo"></small></div><button class="vn-ib" data-a="ven" data-v="centra" aria-label="Torna sulla compagnia">${ic('mirino',20)}</button>
<div class="vn-ris"><span title="Monete">${ic('moneta',15)}<b id="vn-oro"></b></span><span title="Uomini">${ic('amici',15)}<b id="vn-uom"></b></span><span title="Giorni di viveri">${ic('boccale',15)}<b id="vn-cibo"></b></span><span title="Morale">${ic('cuore',15)}<b id="vn-mor"></b></span><span title="Fama">${ic('star',15)}<b id="vn-fama"></b></span></div></div>`}
 function bassoH(){const s=V.s,t=tu(),att=t.ord&&t.ord.t==='aspetta',pt=mio().punti>0,prom=t.tr.some(e=>D.TR[e.t].su.length&&(e.xp||0)>=D.XP_SU[D.TR[e.t].t]);
  return`<div class="vn-basso"><button class="vn-bt" data-a="ven" data-v="pan:compagnia">${ic('amici',20)}<small>Compagnia</small>${prom?'<i class="vn-punto"></i>':''}</button>
<button class="vn-bt" data-a="ven" data-v="pan:capitano">${ic('utente',20)}<small>Capitano</small>${pt?'<i class="vn-punto"></i>':''}</button>
<button class="vn-bt" data-a="ven" data-v="pan:diario">${ic('diario',20)}<small>Diario</small></button>
<button class="vn-bt" data-a="ven" data-v="${att?'ferma':'campo'}">${ic(att?'play':'letto',20)}<small>${att?'Riparti':'Accampati'}</small></button>
<button class="vn-bt" data-a="ven" data-v="vel">${ic('passi',20)}<small>×${V.vel}</small></button>
<button class="vn-bt" data-a="ven" data-v="pan:carta">${ic('mappa',20)}<small>Carta</small></button></div>`}
 function cartaH(){const s=V.s,p=VEN.part(s,V.carta);if(!p||p.dentro>=0)return'';const ost=VEN.ostile(s,p,tu()),f=VEN.forza(p),mia=VEN.forza(tu()),giud=f<mia*.6?'Più debole di voi':f<mia*1.1?'Alla vostra portata':f<mia*1.7?'Più forte di voi':'Molto più forte di voi';
  const comp={f:0,t:0,c:0};for(const e of p.tr)comp[D.TR[e.t].c]+=e.n;
  return`<div class="vn-carta"><div class="vn-ct"><b>${esc(p.nome)}</b>${faz(p.faz)}<button class="vn-ib" data-a="ven" data-v="carta" aria-label="Chiudi">${ic('x',16)}</button></div>
<small>${p.k==='car'?'Carovana di mercanti':p.k==='pre'?'Predoni':'Signore in armi'} · ${VEN.uomini(p)} uomini (${comp.f} fanti, ${comp.t} tiratori, ${comp.c} cavalieri)</small><small class="${ost?'vn-male':''}">${ost?'Nemici. ':''}${giud}.</small>
<button class="b sm ${ost?'gold':''}" data-a="ven" data-v="segui:${p.id}">${ic(ost?'spada':'passi',16)} ${ost?'Dagli addosso':'Raggiungi'}</button></div>`}
 // ---------- pannelli ----------
 const pannello=(titolo,corpo,o)=>`<div class="vn-pan ${o&&o.cls||''}"><div class="vn-pt"><h3>${titolo}</h3>${o&&o.fisso?'':`<button class="vn-ib" data-a="ven" data-v="${o&&o.chiudi||'chiudi'}" aria-label="Chiudi">${ic('x',18)}</button>`}</div><div class="vn-pc">${corpo}</div>${V.msg?`<p class="vn-msg" role="status">${esc(V.msg)}</p>`:''}</div>`;
 const riga=(sx,dx,cls)=>`<div class="vn-r ${cls||''}"><div class="vn-rs">${sx}</div><div class="vn-rd">${dx||''}</div></div>`;
 const bt=(tx,v,o)=>`<button class="b sm ${o&&o.cls||''}" data-a="ven" data-v="${v}" ${o&&o.no?'disabled':''}>${tx}</button>`;
 function truppaH(e,azioni){const T=D.TR[e.t];return riga(`<b>${esc(T.nome)}</b> ${pips(T.t)}<small>${CLS[T.c]||''} · ${e.n} uomini${e.f?' · '+e.f+' feriti':''}${T.compagno?' · compagno':''}</small>`,azioni||'')}
 function luogoH(){const s=V.s,lid=s.dentro>=0?s.dentro:s.davanti,l=s.l[lid];if(!l)return'';const t=tu(),fuori=s.davanti>=0,mio=l.faz==='tu'||l.sig===-2,g=VEN.giorno(s),sito=VEN.SITO[l.tipo],mura=VEN.MURA[l.tipo];
  const testa=`<div class="vn-lt" style="--fz:${D.FAZ[l.faz].col}"><small>${TIPO[l.tipo]} ${mio?'· tuo':''}</small>${sito||l.faz==='neu'?'':faz(l.faz)}<small>${sito?'':l.oste?'Vi accoglie '+esc(l.oste):'Prosperità '+l.prosp}${l.sacc>g?' · saccheggiato':''}${l.ass?' · sotto assedio':''}</small></div>`;
  const uom=l.g.reduce((a,e)=>a+e.n,0),giud=VEN.forzaTr(l.g)*(mura?VEN.P.MURA:1)>VEN.forza(t)*1.15?'più forti di voi':VEN.forzaTr(l.g)>VEN.forza(t)*.7?'alla vostra portata':'più deboli di voi';
  if(sito){const cb=l.boss&&D.CAPIBANDA.find(c=>c.id===l.boss),pieno=l.g.length>0;
   return pannello(esc(l.nome),testa+(l.tipo==='covo'?`<p class="vn-p">${pieno?'Una palizzata, fumo di bivacchi, sentinelle tra gli alberi. '+(cb?'Qui comanda <b>'+esc(cb.nome)+'</b>: '+esc(cb.d):''):'Cenere e pali anneriti. Qui non ruba più nessuno.'}</p>`:`<p class="vn-p">${pieno?'Pietre antiche, muschio, e orme fresche: qualcuno si è accampato tra le colonne, a guardia di ciò che resta.':'Le rovine tacciono. Non c\'è più nulla da prendere.'}</p>`)+
    (pieno?riga(`<b>${l.tipo==='covo'?'Assalto al covo':'Esplora le rovine'}</b><small>${uom} uomini, ${giud}. Chi vince si prende quel che c'è.</small>`,bt(ic('spada',16)+' Avanti','fai:assalta',{cls:'gold'})):'')+riga('',bt('Via di qui','fai:esci')),{chiudi:'fai:esci'})}
  if(fuori){const ass=s.assedio&&s.assedio.lid===l.id;return pannello(esc(l.nome),testa+`<p class="vn-p">Le porte sono sbarrate: ${esc(D.FAZ[l.faz].breve)} vi è nemica.</p>`+
    (l.tipo==='villaggio'?riga('<b>Razzia</b><small>Monete e grano, ma il regno non dimentica.</small>',bt('Saccheggia','fai:razzia',{cls:'gold'})):mura?
     riga(`<b>Assedio</b><small>Dietro le mura ${uom} uomini, ${giud}.</small>`,bt(ass?'In corso':'Assedia','fai:assedia',{cls:'gold',no:ass})):'')+riga('',bt('Via di qui','fai:esci')),{chiudi:'fai:esci'})}
  if(V.sub==='mercato'){const righe=Object.keys(D.MERCI).map(m=>{const sc=l.scorte[m]||0,pc=VEN.prezzo(s,l,m,1),pv=VEN.prezzo(s,l,m,-1),ho=t.merci[m]||0,rif=D.MERCI[m].base;
    return riga(`<b>${esc(D.MERCI[m].nome)}</b>${D.MERCI[m].cibo?' <i class="vn-tag">viveri</i>':''}<small>Hai ${ho} · scorta ${sc} · compri a <span class="${pc<rif*.8?'vn-bene':pc>rif*1.3?'vn-male':''}">${pc}</span> · vendi a ${pv}</small>`,bt('Vendi','fai:vendi:'+m,{no:!ho})+bt('Compra','fai:compra:'+m,{cls:'gold',no:!sc}))}).join('');
   return pannello('Mercato di '+esc(l.nome),`<div class="vn-qta"><small>Carico ${VEN.carico(t)}/${VEN.caricoMax(s)} · quantità</small>${[1,5,20].map(q=>`<button class="vn-ch${V.qta===q?' on':''}" data-a="ven" data-v="qta:${q}">×${q}</button>`).join('')}</div>`+righe,{chiudi:'sub:home'})}
  if(V.sub==='taverna'){const merc=l.merc.map(e=>truppaH(e,bt(D.INGAGGIO[D.TR[e.t].t]+' m.','fai:assolda:'+e.t,{cls:'gold'}))).join('')||'<p class="vn-p">Nessun mercenario cerca lavoro, oggi.</p>';
   const comp=D.COMPAGNI.filter(c=>s.compagni[c.id]===l.id).map(c=>riga(`<b>${esc(c.nome)}</b><small>${esc(c.d)}</small><small class="vn-bene">+2 a ${esc(D.ABIL[c.abil].nome)}, e combatte al vostro fianco.</small>`,bt(c.costo+' m.','fai:compagno:'+c.id,{cls:'gold'}))).join('');
   return pannello(l.tipo==='monastero'?'Foresteria':'Taverna',`${comp?'<div class="sh2">Gente fuori dal comune</div>'+comp:''}${l.tipo==='monastero'?'':'<div class="sh2">Gente di ventura</div>'+merc}`,{chiudi:'sub:home'})}
  if(V.sub==='armi'){const un=l.unica&&D.OGG[l.unica],c=mio2(),ora=o=>{const x=o.slot==='cimelio'?null:D.OGG[c.eq[o.slot]];return x?` · ora porti: ${esc(x.nome)}`:''};
   const vend=l.bott.map(id=>{const o=D.OGG[id];return oggH(o,bt(VEN.prezzoOgg(s,o,1)+' m.','fai:compraogg:'+id,{cls:'gold'}),ora(o))}).join('')||'<p class="vn-p">Scaffali vuoti: torna tra qualche giorno.</p>';
   const mia=t.zaino.map((id,i)=>{const o=D.OGG[id];return o?oggH(o,bt('Vendi '+VEN.prezzoOgg(s,o,-1),'fai:vendiogg:'+i)):''}).join('');
   return pannello(l.tipo==='monastero'?'Reliquie e rimedi':l.tipo==='locanda'?'Il baule dell\'oste':l.tipo==='porto'?'Merci d\'oltremare':'Armaiolo',`${un?'<div class="sh2">Offerta unica della capitale</div>'+oggH(un,bt(VEN.prezzoOgg(s,un,1)+' m.','fai:compraogg:'+un.id,{cls:'gold'}),ora(un)):''}<div class="sh2">In vendita</div>${vend}${mia?'<div class="sh2">Dal tuo zaino</div>'+mia:''}`,{chiudi:'sub:home'})}
  if(V.sub==='navi'){const porti=s.l.filter(x=>x.tipo==='porto'&&x.id!==l.id),oro=40+VEN.uomini(t)*3;
   return pannello('Imbarco',`<p class="vn-p">Un passaggio per tutta la compagnia: ${oro} monete. Per mare si arriva prima, e i predoni restano a terra.</p>`+porti.map(x=>riga(`<b>${esc(x.nome)}</b> ${faz(x.faz)}<small>${Math.round(VEN.dist(l,x))} leghe${VEN.nemiche(s,'tu',x.faz)?' · porto nemico':''}</small>`,bt('Salpa','fai:imbarca:'+x.id,{cls:'gold',no:VEN.nemiche(s,'tu',x.faz)}))).join(''),{chiudi:'sub:home'})}
  if(V.sub==='sala'){const f=l.faz,R=D.REGNI.includes(f),srv=s.servizio,prig=s.prig.reduce((a,e)=>a+e.n,0),sg=s.sig[l.sig],tr=sg&&D.TRATTI[sg.tratto];let h='';
   if(R){h+=`<p class="vn-p">${esc(D.FAZ[f].nome)}, retto da ${esc(D.FAZ[f].re)}. Amicizia: ${s.rel[f]}.</p>${sg?`<p class="vn-p">Qui siede <b>${esc(sg.nome)}</b>, signore ${esc(tr.nome)}. ${esc(tr.saluto)}</p>`:''}`;
    if(!srv)h+=riga(`<b>Contratto di ventura</b><small>Quattro settimane di soldo; i loro nemici diventano i vostri. Fama ${VEN.P.FAMA_CONTRATTO}.</small>`,bt('Firma','fai:contratto',{cls:'gold'}));
    if(!srv||srv.tipo==='mer')h+=riga(`<b>Giuramento</b><small>Vassallo del regno, con un villaggio in feudo. Fama ${VEN.P.FAMA_VASSALLO}, amicizia 10.</small>`,bt('Giura','fai:giura'));
    if(srv&&srv.faz===f)h+=riga(`<b>Sciogli il legame</b><small>Servi ${esc(D.FAZ[f].breve)} come ${srv.tipo==='vas'?'vassallo':'mercenario'}.</small>`,bt('Lascia','fai:lascia'))}
   if(R&&l.tipo==='citta'&&srv&&srv.faz===f)h+=diploH(f,srv);
   for(const k of D.REGNI)if(s.rel[k]<=-25)h+=riga(`<b>Pace con ${esc(D.FAZ[k].breve)}</b><small>Un tributo mette fine all'inimicizia (${s.rel[k]}).</small>`,bt('Tratta','fai:pace:'+k));
   h+=riga(`<b>Riscatti</b><small>${prig?prig+' prigionieri da cedere':'Nessun prigioniero'}</small>`,bt('Incassa','fai:riscatta',{cls:'gold',no:!prig}));return pannello('Sala del signore',h,{chiudi:'sub:home'})}
  if(V.sub==='guarn'){return pannello('Guarnigione',`<div class="sh2">Dentro le mura</div>${l.g.map(e=>truppaH(e,bt('Riprendi','fai:guarnigione:'+e.t+':-1'))).join('')||'<p class="vn-p">Nessuno.</p>'}<div class="sh2">Con te</div>${t.tr.filter(e=>!D.TR[e.t].compagno).map(e=>truppaH(e,bt('Lascia','fai:guarnigione:'+e.t+':1'))).join('')}`,{chiudi:'sub:home'})}
  // casa del luogo
  let h=testa;const q=l.inc,cons=s.incarichi.find(x=>!x.fatto&&!x.fallito&&(x.tipo==='consegna'&&x.a===l.id||x.tipo==='reclute'&&x.da===l.id)),fer=t.tr.reduce((a,e)=>a+(e.f||0),0),ospiti=D.COMPAGNI.some(c=>s.compagni[c.id]===l.id);
  if(l.tipo==='villaggio'){h+=riga(`<b>Volontari</b><small>${l.rec} pronti a seguirvi · ${D.INGAGGIO[1]} monete a testa</small>`,bt('Uno','fai:recluta:1',{no:!l.rec})+bt('Tutti','fai:recluta:'+l.rec,{cls:'gold',no:!l.rec}))}
  if(VEN.MERCATO[l.tipo])h+=riga('<b>Mercato</b><small>Viveri e merci: compra dove abbonda, vendi dove manca.</small>',bt('Apri','sub:mercato',{cls:'gold'}));
  if(l.tipo==='porto')h+=riga('<b>Imbarco</b><small>Un passaggio per mare verso un altro porto.</small>',bt('Rotte','sub:navi'));
  if(l.tipo==='monastero'){h+=riga(`<b>Infermeria</b><small>${fer?fer+' feriti: i monaci li rimettono in piedi per '+fer*4+' monete di offerta.':'Nessun ferito da curare.'}</small>`,bt('Cura','fai:cura',{cls:'gold',no:!fer}));
   h+=riga(`<b>Benedizione</b><small>${l.bened>g?'Già ricevuta: tornate tra qualche giorno.':'Ottanta monete di offerta: gli uomini marciano col cuore leggero.'}</small>`,bt('Chiedi','fai:benedizione',{no:l.bened>g}))}
  if(l.tipo==='locanda')h+=riga('<b>Voci di strada</b><small>Un giro di vino (25 monete) e l\'oste racconta dove non andare. Cioè dove andare.</small>',bt('Ascolta','fai:voci',{cls:'gold'}));
  if(VEN.OSTERIA[l.tipo]||(l.tipo==='monastero'&&ospiti))h+=riga(`<b>${l.tipo==='monastero'?'Foresteria':'Taverna'}</b><small>${ospiti?'C\'è qualcuno che vale la pena conoscere.':'Mercenari in cerca di soldo.'}</small>`,bt('Entra','sub:taverna',ospiti?{cls:'gold'}:null));
  if(l.bott&&(l.bott.length||l.unica||l.tipo==='citta'))h+=riga(`<b>${l.tipo==='citta'?'Armaiolo':l.tipo==='porto'?'Merci d\'oltremare':l.tipo==='monastero'?'Reliquie e rimedi':'Il baule dell\'oste'}</b><small>${l.unica?'In vetrina un pezzo unico: '+esc(D.OGG[l.unica].nome)+'.':'Armi, armature, cavalli, cimeli. Qui si vende anche il bottino.'}</small>`,bt('Entra','sub:armi',l.unica?{cls:'gold'}:null));
  if(l.tipo==='citta')h+=torneoH(l);
  if(mura)h+=riga('<b>Sala del signore</b><small>Contratti, giuramenti, riscatti.</small>',bt('Entra','sub:sala'));
  if(mio&&mura)h+=riga(`<b>Guarnigione</b><small>${uom} uomini a guardia.</small>`,bt('Gestisci','sub:guarn'));
  if(cons)h+=riga(`<b>Consegna</b><small>${esc(VEN.titoloInc(s,cons))} · ${cons.premio} monete</small>`,bt('Consegna','fai:consegna',{cls:'gold'}));
  if(q&&!q.preso)h+=riga(`<b>Incarico</b><small>${q.tipo==='predoni'?'Una banda infesta i dintorni: disperdetela.':q.tipo==='consegna'?'Portate '+q.n+' di '+D.MERCI[q.bene].nome+' a '+s.l[q.a].nome+'.':q.tipo==='reliquia'?'«Tra quelle pietre riposa qualcosa di sacro. Liberatele da chi le profana.» ('+esc(s.l[q.a].nome)+')':q.tipo==='taglia'?'C\'è una taglia su '+esc(s.l[q.a].nome)+': stanateli.':'Servono '+q.n+' soldati addestrati per la guarnigione.'} ${q.premio} monete, ${q.giorni} giorni.</small>`,bt('Accetta','fai:incarico'));
  if(!(l.tipo==='villaggio'&&!mio))h+=riga(`<b>Riposo</b><small>Otto ore: metà dei feriti torna in piedi.${mio?'':' '+Math.ceil(VEN.uomini(t)*(l.tipo==='locanda'||l.tipo==='monastero'?1:1.5))+' monete.'}</small>`,bt('Riposa','fai:riposa'));
  h+=riga('',bt('Riparti','fai:esci',{cls:'gold'}));return pannello(esc(l.nome),h,{chiudi:'fai:esci'})}
 // la parola presso il re (V3): per ogni regno la proposta possibile, con i fattori a favore e contro e il totale che decide (serve ≥ 0)
 function diploH(f,srv){const s=V.s,g=VEN.giorno(s),vas=srv.tipo==='vas';
  const att=s.parola&&s.parola[f]>g;   // ha appena deciso su tua parola: si vedono le alleanze, ma niente proposte fino al giorno indicato
  const num=v=>(v>0?'+':'−')+Math.abs(v).toFixed(1).replace('.',','),h=[];
  const conto=p=>{const pro=p.f.filter(x=>x.v>0),con=p.f.filter(x=>x.v<0),el=l=>l.map(x=>esc(x.n)+' '+num(x.v)).join(', ')||'nessuno';
   return`<small class="vn-bene">A favore: ${el(pro)}</small><small class="vn-male">Contro: ${el(con)}</small><small>Totale ${num(p.tot)}: il re accetta da 0 in su${p.ok?'. Accetterebbe.':'. Rifiuterebbe.'}</small>`};
  const riga1=(titolo,nota,tipo,k,lab,cls)=>{const p=VEN.proposta(s,tipo,f,k);return p.err?'':riga(`<b>${titolo}</b><small>${nota}</small>${tipo==='rompi'?'':conto(p)}`,bt(lab,'fai:proponi:'+tipo+':'+k,cls?{cls}:null))};
  for(const k of D.REGNI){if(k===f||s.cadute[k])continue;const nome=esc(D.FAZ[k].breve);
   if(VEN.inGuerra(s,f,k))h.push(riga1('Proponi pace con '+nome,'In guerra con '+nome+'. '+(vas?'Parli da vassallo.':'Da mercenario puoi chiedere solo la pace.'),'pace',k,'Proponi','gold'));
   else if(VEN.alleate(s,f,k)){const al=s.alleanza[[f,k].sort().join('|')];h.push(vas?riga(`<b>Alleati di ${nome}</b><small>${al.rompe?'Rottura annunciata: finisce il giorno '+al.rompe+'.':'Dal giorno '+al.da+'; dura almeno '+D.DIPL.MIN+' giorni e si rompe con '+D.DIPL.PREAVVISO+' di preavviso.'}</small>`,al.rompe||att?'':bt('Rompi','fai:proponi:rompi:'+k)):riga(`<b>Alleati di ${nome}</b><small>Dal giorno ${al.da}.</small>`))}
   else if(vas){h.push(riga1('Proponi alleanza con '+nome,'Si combatte insieme e ci si soccorre negli assedi. Un solo alleato per regno.','alleanza',k,'Proponi','gold'));h.push(riga1('Chiedi guerra a '+nome,'Il re muoverà le sue bandiere; '+nome+' non lo dimenticherà.','guerra',k,'Chiedi'))}}
  return`<div class="sh2">Diplomazia</div>`+(att?`<p class="vn-p">${esc(D.FAZ[f].re)} ha appena deciso su tua parola: ti riceverà di nuovo il giorno ${s.parola[f]}.</p>`:'')+(h.join('')||(att?'':'<p class="vn-p">Nessuna trattativa possibile, per ora.</p>'))}
 // il torneo della città: iscrizione, turno, avversari col loro corredo, premio maturato
 function torneoH(l){const s=V.s,t=s.torneo,T=D.TORNEO,g=VEN.giorno(s),capi=VEN.capi(s),posta=capi.reduce((a,c)=>a+T.posta*c.liv,0);
  if(t&&t.lid===l.id){const av=VEN.avversariTorneo(s,t.lid,t.giorno,t.turno,capi.length),mat=VEN.premioTorneo(t),fin=T.mol[2]*t.posta;
   return riga(`<b>Torneo · ${esc(T.turni[t.turno])}</b><small>Duello ${t.turno+1} di 3, a piedi e senza arco: conta l'arma che porti. ${av.map(x=>esc(x.nome)+' ('+esc(x.corredo)+')').join(' · ')}</small>
<small class="vn-bene">${mat?'Premio maturato '+mat+' monete.':'Nessun premio ancora.'} Vincere tutti e tre: ${fin} monete, ${T.fama[2]} fama e un oggetto di pregio.</small>`,
    bt(ic('spada',16)+' In lizza','fai:lizza',{cls:'gold',no:t.giorno!==g})+(mat?bt('Ritirati · '+mat,'fai:ritira'):bt('Ritirati','fai:ritira')))}
  if(VEN.torneoOggi(s,l)){const usato=!!s.torneoUsato&&s.torneoUsato[l.id]===g;
   return riga(`<b>Torneo di oggi</b><small>Tre duelli: sfidante, campione, gran campione. ${capi.length>1?'Scendete in lizza tutti insieme. ':''}Iscrizione ${posta} monete; i premi sono ${T.mol.map(m=>m+'×').join(', ')} l'iscrizione.</small>${usato?'<small class="vn-male">Hai già partecipato oggi.</small>':''}`,
    bt('Iscriviti · '+posta,'fai:torneo',{cls:'gold',no:usato||VEN.TU(s).oro<posta}))}
  const n=(7-(g+l.id)%7)%7;return riga(`<b>Torneo</b><small>Il prossimo si tiene qui ${esc(VEN.quando(n))}.</small>`,'')}
 function compagniaH(){const s=V.s,t=tu(),h=t.tr.map(e=>{const T=D.TR[e.t],need=D.XP_SU[T.t],pr=T.su.length?Math.min(e.n,Math.floor((e.xp||0)/need)):0;
   const su=pr?T.su.map(x=>bt(esc(D.TR[x].nome)+' · '+D.PROMO[T.t],'fai:promuovi:'+e.t+':'+x,{cls:'gold'})).join(''):'';
   return riga(`<b>${esc(T.nome)}</b> ${pips(T.t)}<small>${CLS[T.c]} · ${e.n} uomini${e.f?' · '+e.f+' feriti':''}${T.su.length?' · esperienza '+Math.floor(e.xp||0)+'/'+need:''}${pr?' · <span class="vn-bene">'+pr+' pronti a salire</span>':''}</small>`,su+(T.compagno?'':bt('Congeda','fai:congeda:'+e.t)))}).join('');
  const prig=s.prig.map(e=>e.sig!=null?riga(`<b>${esc(s.sig[e.sig].nome)}</b><small>Prigioniero di riguardo: vale un riscatto.</small>`):riga(`<b>${esc(D.TR[e.t].nome)}</b><small>${e.n} prigionieri</small>`)).join('');
  return pannello(esc(s.nome),`<p class="vn-p">${VEN.uomini(t)} uomini su ${VEN.limite(s)} · paga ${VEN.paga(s)} monete ogni sette giorni · rendite ${VEN.rendite(s)} · viveri per ${Math.floor(VEN.razioni(t)/Math.max(1,Math.ceil(VEN.uomini(t)/6)))} giorni</p>${h}${prig?'<div class="sh2">Prigionieri</div>'+prig:''}`)}
 function capitanoH(){const s=V.s,c=mio(),t=tu(),st=VEN.statCap(c),ab=Object.keys(D.ABIL).map(k=>riga(`<b>${esc(D.ABIL[k].nome)} ${c.ab[k]}</b>${VEN.abil(s,k)>c.ab[k]?' <i class="vn-tag">+'+(VEN.abil(s,k)-c.ab[k])+'</i>':''}<small>${esc(D.ABIL[k].d)}</small>`,c.punti>0&&c.ab[k]<10?bt(ic('plus',14),'fai:abilita:'+k,{cls:'gold'}):'')).join('');
  const rel=D.REGNI.map(f=>`${faz(f)} <b class="${s.rel[f]<=-25?'vn-male':s.rel[f]>=10?'vn-bene':''}">${s.rel[f]}</b>${s.cadute[f]?' (caduto)':''}`).join(' · ');
  const tr=VEN.traguardi(s).map(x=>`<li class="${x[1]?'ok':''}">${ic(x[1]?'spunta':'bersaglio',14)} ${esc(x[0])}</li>`).join('');
  if(V.sub==='zaino'){const posti=[['arma',c.eq.arma],['scudo',c.eq.scudo],['armatura',c.eq.armatura],['elmo',c.eq.elmo],['cavallo',c.eq.cavallo],['cimelio',c.eq.cimeli[0],0],['cimelio',c.eq.cimeli[1],1]];
   const add=posti.map(([sl,id,k])=>{const o=D.OGG[id];return o?oggH(o,sl==='arma'||sl==='armatura'?'':bt('Togli','fai:togli:'+sl+':'+(k||0))):riga(`<b class="vn-vuoto">${D.SLOT[sl]}: niente</b><small>${sl==='scudo'&&(D.OGG[c.eq.arma]||{}).due?'L\'arma a due mani occupa tutte e due le braccia.':'Scegli qualcosa dallo zaino.'}</small>`)}).join('');
   const z=t.zaino.map((id,i)=>{const o=D.OGG[id];if(!o)return'';const ora=o.slot==='cimelio'?null:D.OGG[c.eq[o.slot]];return oggH(o,bt('Indossa','fai:equipa:'+i,{cls:'gold'}),ora?` · al posto di: ${esc(ora.nome)}`:'')}).join('')||'<p class="vn-p">Lo zaino è vuoto. Armaioli, bottino, rovine e incarichi lo riempiono.</p>';
   return pannello('Equipaggiamento di '+esc(c.nome),`<p class="vn-p">In battaglia: vita ${Math.round(st.pf)} · mira ${Math.round(st.att)} · difesa ${Math.round(st.dif)} · danno ${Math.round(st.dan)} · passo ${st.vel}${st.git?' · tira a '+st.git+' passi':''}</p><div class="sh2">Addosso</div>${add}<div class="sh2">Nello zaino della compagnia</div>${z}`,{chiudi:'sub:home'})}
  const eqv=[c.eq.arma,c.eq.scudo,c.eq.armatura,c.eq.elmo,c.eq.cavallo].concat(c.eq.cimeli).map(id=>D.OGG[id]).filter(Boolean).map(o=>`<span class="${PREGIO[o.q]}">${esc(o.nome)}</span>`).join(' · ');
  return pannello(esc(c.nome),`<p class="vn-p">Livello ${c.liv} · esperienza ${Math.floor(c.xp)}/${VEN.xpLiv(c.liv)} · fama ${s.fama}${c.punti?' · <span class="vn-bene">'+c.punti+' punti da spendere</span>':''}</p>
<p class="vn-p">${s.servizio?(s.servizio.tipo==='vas'?'Vassallo di ':'Al soldo di ')+esc(D.FAZ[s.servizio.faz].nome)+'.':'Capitano libero: nessun regno vi comanda.'}</p><p class="vn-p vn-rel">${rel}</p>
${riga(`<b>Equipaggiamento</b>${t.zaino.length?' <i class="vn-tag">'+t.zaino.length+' nello zaino</i>':''}<small>${eqv}</small>`,bt('Apri','sub:zaino',{cls:'gold'}))}
${inS()?'<div class="sh2">Capitani della compagnia</div>'+VEN.capi(s).map((x,i)=>riga(`<b style="color:${VenCampo.CAPC[i]}">${esc(x.nome)}</b><small>Livello ${x.liv}${i===posto()?' · sei tu':''} · ${esc((D.OGG[x.eq.arma]||{}).nome||'')}, ${esc((D.OGG[x.eq.armatura]||{}).nome||'')}</small>`)).join(''):''}<div class="sh2">Abilità</div>${ab}<div class="sh2">Traguardi</div><ul class="vn-tr">${tr}</ul>`)}
 function cartaMondoH(){return pannello('Carta del mondo','<p class="vn-p">Tocca un punto per portarci lo sguardo. I luoghi nascosti compaiono quando li scopri o quando qualcuno te ne parla.</p><p class="vn-p"><b>Tornei</b>: '+VEN.tornei(V.s).slice(0,3).map(t=>esc(V.s.l[t.lid].nome)+' '+VEN.quando(t.giorni)).join(' · ')+'.</p><canvas class="vn-carta-cv" width="512" height="512" data-a="ven" data-v="cartatocco"></canvas><div class="vn-leg"><span><i style="background:#f4e9c8"></i>locande e monasteri</span><span><i style="background:#9fe0c8"></i>rovine</span><span><i style="background:#c0392b"></i>covi</span><span><i style="background:#d98a1f"></i>voi</span></div>',{cls:'vn-pcarta'})}
 function diarioH(){const s=V.s,g=VEN.giorno(s),inc=s.incarichi.filter(q=>!q.fatto&&!q.fallito).map(q=>riga(`<b>${esc(VEN.titoloInc(s,q))}</b><small>${q.premio} monete · ancora ${Math.max(0,q.scad-g)} giorni</small>`)).join('')||'<p class="vn-p">Nessun incarico. Chiedi nei villaggi, nelle città e ai castelli.</p>';
  const gu=Object.keys(s.guerra).map(k=>k.split('|').map(f=>D.FAZ[f].breve).join(' contro ')).join(' · ')||'I regni sono in pace, per ora.';
  const al=Object.keys(s.alleanza||{}).map(k=>{const x=s.alleanza[k];return k.split('|').map(f=>D.FAZ[f].breve).join(' e ')+(x.rompe?' (finisce il giorno '+x.rompe+')':' (dal giorno '+x.da+')')}).join(' · ')||'Nessuna alleanza tra i regni.';
  return pannello('Diario',`<div class="sh2">Incarichi</div>${inc}<div class="sh2">Guerre</div><p class="vn-p">${esc(gu)}</p><div class="sh2">Alleanze</div><p class="vn-p">${esc(al)}</p><div class="sh2">Cronaca</div><div class="vn-log">${s.log.slice(-18).reverse().map(x=>`<p class="${x.tipo}"><i>G${Math.floor(x.t/1440)+1}</i> ${esc(x.tx)}</p>`).join('')}</div>`)}
 function schieraH(parti,luogo){const c={f:0,t:0,c:0};let n=0;for(const p of parti)for(const e of p.tr){c[D.TR[e.t].c]+=e.n;n+=e.n}if(luogo)for(const e of luogo.g){c[D.TR[e.t].c]+=e.n;n+=e.n}return`${n} uomini · ${c.f} fanti, ${c.t} tiratori, ${c.c} cavalieri`}
 function incontroH(){const s=V.s,inc=s.incontro;if(!inc)return'';const t=tu();
  if(inc.tipo==='parla'){const p=VEN.part(s,inc.pid[0]);if(!p)return pannello('Incontro',bt('Prosegui','scegli:lascia'),{fisso:1});
   const sg=p.k==='sig'?s.sig[p.sig]:null,tr=sg&&D.TRATTI[sg.tratto],riv=p.k==='riv';
   return pannello(esc(riv?D.RIVALE.nome.charAt(0).toUpperCase()+D.RIVALE.nome.slice(1):p.nome),`<p class="vn-p">${p.k==='car'?'I mercanti vi salutano guardinghi, la mano sulle borse.':riv?'«Guarda guarda, un collega.» '+esc(D.RIVALE.d)+' «Il mondo è grande abbastanza per due compagnie. Forse.»':tr?'Signore '+esc(tr.nome)+'. '+esc(tr.saluto):'Vi squadrano in silenzio.'} ${faz(p.faz)}</p><p class="vn-p">${schieraH([p])}</p>${inc.voce?`<p class="vn-p vn-bene">${esc(inc.voce)}</p>`:''}
${riga('',bt('Buona strada','scegli:lascia',{cls:'gold'})+(inc.detto?'':bt('Che si dice in giro?','scegli:notizie'))+bt(riv?'Sfidala':'Aggredisci','scegli:aggredisci'))}`,{fisso:1})}
  if(inc.tipo==='mischia'&&!inc.pronto){const sc=s.scontri.find(x=>x.id===inc.sc);if(!sc)return pannello('Battaglia',bt('Prosegui','scegli:lascia'),{fisso:1});const A=sc.a.map(id=>VEN.part(s,id)).filter(Boolean),B=sc.b.map(id=>VEN.part(s,id)).filter(Boolean);
   return pannello('Una battaglia in corso',`<p class="vn-p">Due schiere si affrontano. Con chi state?</p>${riga(`<b>${A.map(p=>esc(p.nome)).join(', ')}</b><small>${schieraH(A)}</small>`,bt('Con loro','scegli:a',{cls:'gold'}))}${riga(`<b>${B.map(p=>esc(p.nome)).join(', ')}</b><small>${schieraH(B)}</small>`,bt('Con loro','scegli:b',{cls:'gold'}))}${riga('',bt('Non è affar nostro','scegli:lascia'))}`,{fisso:1})}
  if(inc.tipo==='arena'){const T=D.TORNEO,tn=s.torneo;if(!tn)return pannello('Torneo',bt('Prosegui','chiudi'),{fisso:1});const capi=VEN.capi(s),av=VEN.avversariTorneo(s,tn.lid,tn.giorno,tn.turno,capi.length),mat=VEN.premioTorneo(tn),st=capi.map(c=>VEN.statArena(c));
   return pannello(esc(T.turni[tn.turno])+' · '+esc(s.l[tn.lid].nome),`<p class="vn-p">Lo steccato è pieno di gente. Si combatte a piedi, uno contro uno${capi.length>1?' (ognuno col suo avversario: si vince o si perde insieme)':''}.</p>
${av.map((x,k)=>riga(`<b>${esc(x.nome)}</b><small>${esc(x.corredo)} · vita ${x.st.pf} · danno ${x.st.dan} · difesa ${x.st.dif}</small>`,'')).join('')}
<p class="vn-p"><small>Tu: ${capi.map((c,k)=>esc(c.nome)+' — '+esc((D.OGG[c.eq.arma]||{}).nome||'a mani nude')+', vita '+st[k].pf+', difesa '+st[k].dif).join(' · ')}.${s.ferito===VEN.giorno(s)?' <span class="vn-male">Ancora ammaccato: vita a metà fino a sera.</span>':''}</small></p>
${riga('',bt(ic('spada',16)+' Combatti','scegli:attacca',{cls:'gold'})+bt('Risolvi','scegli:auto'))}${riga('<small>Cambia arma dal capitano prima di entrare.</small>',bt(mat?'Ritirati · '+mat:'Ritirati','fai:ritira'))}`,{fisso:1,cls:'vn-inc'})}
  const{nem,all,luogo}=VEN.schieramenti(s),sito=luogo&&VEN.SITO[luogo.tipo],fn=nem.reduce((a,p)=>a+VEN.forza(p),0)+(luogo?VEN.forzaTr(luogo.g)*(VEN.MURA[luogo.tipo]?VEN.P.MURA:1):0),fa=VEN.forza(t)+all.reduce((a,p)=>a+VEN.forza(p),0),q=fa/Math.max(1,fa+fn)*100;
  const titolo=sito?esc(luogo.nome):luogo?'Assalto a '+esc(luogo.nome):nem.map(p=>esc(p.nome)).join(', ')||'Nemici';
  return pannello(titolo,`<p class="vn-p">${sito?(luogo.tipo==='covo'?'Le sentinelle danno l\'allarme. Vi aspettano: ':'Tra le colonne si alzano in piedi: '):luogo?'Scale e arieti sono pronti. Dietro le mura: ':inc.da==='tu'?'Li avete raggiunti: ':'Vi sono addosso: '}${schieraH(nem,luogo)}.</p>${all.length?`<p class="vn-p vn-bene">Al vostro fianco: ${all.map(p=>esc(p.nome)).join(', ')}.</p>`:''}
<div class="vn-forze"><i style="width:${q.toFixed(0)}%"></i></div><small class="vn-fl"><span>Voi ${VEN.sani(t)}</span><span>${q>62?'In vantaggio':q>42?'Alla pari':q>28?'In svantaggio':'Disperata'}</span><span>Loro</span></small>
${riga('',bt(ic('spada',16)+' Combatti','scegli:attacca',{cls:'gold'})+bt('Risolvi','scegli:auto'))}${riga('',(luogo?bt(sito?'Meglio di no':'Togli l\'assedio','scegli:togli'):bt('Ritirata','scegli:fuggi')+(nem[0]&&nem[0].k==='pre'?bt('Paga il pedaggio','scegli:paga'):'')))}`,{fisso:1,cls:'vn-inc'})}
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
 function menuH(){return pannello('Compagnia di ventura',`${riga('<b>Grafica</b><small>Pixel d\'arte più grossi alleggeriscono i telefoni lenti.</small>',['alta','media','bassa'].map(q=>`<button class="vn-ch${VenArte.qual()===q?' on':''}" data-a="ven" data-v="qual:${q}">${q}</button>`).join(''))}
${riga('<b>Regole</b><small>Come si gioca, in breve.</small>',bt('Leggi','regole'))}${inS()?riga('<b>Torna al tavolo</b><small>Chiude la partita per tutta la compagnia.</small>',bt('Chiudi','esci')):riga('<b>Salva ed esci</b><small>La partita resta su questo telefono.</small>',bt('Esci','esci',{cls:'gold'}))}`)}
 // ---------- HUD della battaglia ----------
 function campoH(){const k=VenCampo.K,b=k.s;if(!b)return'';const O=[['carica','Carica','spada'],['tieni','Tieni','scudo'],['segui','Seguimi','passi'],['avanza','Avanti','freccia'],['arretra','Indietro','indietro']];
  const fine=V.pan==='fine'?`<div class="vn-vela"><div><h3>${b.fine&&b.fine.vince==='a'?'Il campo è vostro':'La giornata è persa'}</h3><p>${b.fine&&b.fine.vince==='a'?'Il nemico volta le spalle.':'Chi può si mette in salvo.'}</p>${bt('Avanti','fine',{cls:'gold'})}</div></div>`:'';
  return`<div class="vn-alto vn-ca"><div class="vn-barra"><b id="vn-na"></b><div class="vn-forze"><i id="vn-ba"></i></div><b id="vn-nb"></b></div>
<div class="vn-capo"><span>${ic('cuore',14)}</span><div class="vn-pfb"><i id="vn-pf"></i></div><button class="vn-ib" data-a="ven" data-v="cvel">×${k.vel}</button><button class="vn-ib ${k.pausa?'on':''}" data-a="ven" data-v="cpausa" aria-label="Pausa">${ic(k.pausa?'play':'pausa',18)}</button></div></div>
${k.pausa&&!b.fine&&b.t===0&&!(inS()&&ui.tv)?`<div class="vn-via"><p>${b.tipo==='arena'?'Tocca lo steccato per muovere il capitano, l\'avversario per attaccarlo. Qui conta solo la tua arma.':'Tocca il campo per muovere il capitano, un nemico per attaccarlo. Scegli un gruppo e dagli un ordine.'}</p>${bt(ic('spada',18)+' Via','cpausa',{cls:'gold'})}</div>`:''}
<div class="vn-basso vn-cb${b.tipo==='arena'?' vn-arena':''}"><div class="vn-gr">${[['tutti','Tutti'],['f','Fanti'],['t','Tiratori'],['c','Cavalieri']].map(([g,n])=>`<button class="vn-ch${k.gruppo===g?' on':''}" data-a="ven" data-v="cgr:${g}">${n}${g!=='tutti'?` <b id="vn-g${g}"></b>`:''}</button>`).join('')}</div>
<div class="vn-or">${O.map(([o,n,i])=>`<button class="vn-bt" data-a="ven" data-v="cord:${o}">${ic(i,20)}<small>${n}</small></button>`).join('')}<button class="vn-bt vn-grido" id="vn-grido" data-a="ven" data-v="cgrido">${ic('megafono',20)}<small>Grido</small></button></div></div>${fine}`}
 function html(){if(VenStanza.on()||VenStanza.X.era)VenStanza.sync();if(!V.s)return'';const A=VenArte.A;
  const corpo=A.fallita?`<div class="vn-vela"><div><h3>Serve la grafica 3D</h3><p>Questo telefono non riesce ad accendere la scena. Chiudi le altre schede e riprova.</p>${A.errore?`<p><small>${esc(A.errore)}</small></p>`:''}${bt('Riprova','riprova',{cls:'gold'})}${bt('Esci','esci')}</div></div>`:!A.pronta?'<div class="vn-vela"><div><h3>Si spiegano le mappe…</h3></div></div>':
   V.modo==='campo'?campoH():altoH()+(V.pan?'':bassoH())+(V.carta!=null&&!V.pan?cartaH():'')+
   (V.pan==='luogo'?luogoH():V.pan==='compagnia'?compagniaH():V.pan==='capitano'?capitanoH():V.pan==='diario'?diarioH():V.pan==='incontro'?incontroH():V.pan==='esito'?esitoH():V.pan==='attesa'?attesaH():V.pan==='menu'?menuH():V.pan==='carta'?cartaMondoH():'');
  return`<div class="vn" data-modo="${V.modo}"><div class="vn-scena"></div><div class="vn-etc"></div>${corpo}<div class="vn-avv">${avvisiH()}</div></div>`}
 // ---------- battaglia ----------
 function inBattaglia(scheda){V.modo='campo';V.pan=null;V.fine=null;VenCampo.apri(scheda);render()}
 function fineBattaglia(){const r=VCAM.riepilogo(VenCampo.K.s),x=VEN.esito(V.s,r);V.modo='mondo';V.fine=null;V.pan=x.err?null:'esito';VenMappa.centra();salva();Snd.play(r.vince==='a'?'avv-bottino':'avv-lamento');render()}
 // ---------- comandi ----------
 function act(v){const s=V.s,p=String(v||'').split(':'),c=p[0];V.msg='';
  if(c==='regno'){V.regno=p[1];return render()}
  if(c==='rip')return VenStanza.scegli(p[1]);
  if(c==='dasolo'){if(!V.confSolo&&leggi()){V.confSolo=true;return render()}V.confSolo=false;if(VenStanza.perSolo()){const x=leggi();if(x)entra(x)}return}
  if(c==='continua'){const x=leggi();if(x)entra(x);return}
  if(c==='nuova'){const x=VEN.nuovo((Date.now()^Math.floor(Math.random()*1e9))>>>0,{nome:ME.name||'Capitano',compagnia:'Compagnia di '+(ME.name||'ventura'),regno:V.regno});entra(x);salva();return}
  if(!s)return;
  if(c==='esci')return inS()?VenStanza.esci():esci();
  if(c==='riprova'){riprova();return}
  if(c==='regole'){ui.rules='ventura';return render()}
  if(c==='pan'){V.pan=p[1];V.sub='home';V.carta=null;return render()}
  if(c==='sub'){V.sub=p[1];return render()}
  if(c==='chiudi'){V.pan=s.incontro?'incontro':s.dentro>=0&&V.pan==='esito'&&s.ult&&s.ult.torneo?'luogo':null;V.sub='home';return render()}
  if(c==='carta'){V.carta=null;return render()}
  if(c==='qta'){V.qta=+p[1]||1;return render()}
  if(c==='qual'){try{localStorage.setItem('ven-q',p[1])}catch(e){}VenArte.A.lento=0;VenArte.misura();return render()}
  if(c==='vel'){const v=V.vel===1?2:V.vel===2?4:1;if(inS()){const r=VenStanza.manda({t:'vel',v});if(r.err)avviso(r.err)}else V.vel=v;return render()}
  if(c==='cartatocco'){const cv=document.querySelector('.vn-carta-cv'),e=V.ultimoClick;if(cv&&e){const r=cv.getBoundingClientRect(),G=VEN.mappa(s.seme).G;VenMappa.guarda((e.clientX-r.left)/r.width*G,(e.clientY-r.top)/r.height*G);VenMappa.K.alt=Math.max(VenMappa.K.alt,22);V.pan=null}return render()}
  if(c==='centra'){(V.modo==='campo'?VenCampo:VenMappa).centra();return}
  if(c==='ferma'){ordina({t:'ferma'});V.pan=s.dentro>=0||s.davanti>=0?'luogo':null;return render()}
  if(c==='campo'){const r=ordina({t:'aspetta',ore:8});if(r.err)avviso(r.err);else V.pan='attesa';return render()}
  if(c==='segui'){const r=ordina({t:'segui',pid:+p[1]});V.carta=null;if(r.err)avviso(r.err);return render()}
  if(c==='scegli'){const r=inS()?VenStanza.manda({t:'scegli',v:p[1]}):VEN.scegli(s,p[1]);if(r.err){V.msg=r.err;return render()}if(inS())return render();
   if(p[1]==='attacca')return inBattaglia(r.campo);if(p[1]==='auto'){VEN.auto(s);V.pan='esito';salva();return render()}
   V.pan=s.incontro?'incontro':s.dentro>=0||s.davanti>=0?'luogo':null;return render()}
  if(c==='fai'){const a=p[1];let z={a};
   if(a==='recluta')z.n=+p[2]||1;else if(a==='compra'||a==='vendi'){z.m=p[2];z.n=a==='vendi'?Math.min(V.qta,tu().merci[p[2]]||0):Math.min(V.qta,s.l[s.dentro].scorte[p[2]]||0)}
   else if(a==='assolda'){z.t=p[2];z.n=1}else if(a==='compagno'||a==='compraogg')z.id=p[2];else if(a==='abilita')z.k=p[2];else if(a==='vendiogg'||a==='equipa')z.i=+p[2];else if(a==='togli'){z.slot=p[2];z.k=+p[3]||0}else if(a==='imbarca')z.lid=+p[2];else if(a==='promuovi'){z.t=p[2];z.su=p[3];z.n=1}else if(a==='congeda'){z.t=p[2];z.n=1}
   else if(a==='pace')z.f=p[2];else if(a==='proponi'){z.tipo=p[2];z.f=p[3]}else if(a==='guarnigione'){z.t=p[2];z.verso=+p[3];z.n=1}
   const r=inS()?VenStanza.manda({t:'fai',z}):VEN.fai(s,z);if(r.err){V.msg=r.err;Snd.play('err');return render()}
   if(a==='proponi'){V.msg='';avviso(s.log[s.log.length-1].tx,'bene')}
   if(a==='esci'){V.pan=null;V.sub='home'}else if(a==='riposa'||a==='assedia'||a==='imbarca'){V.pan='attesa';V.sub='home'}else if(a==='razzia'){V.pan=null}else if(a==='assalta'||a==='lizza'){V.pan='incontro'}else if(a==='ritira'){V.pan='luogo'}else if(a==='voci'){avviso(r.lid!=null?'Segnato sulla carta: '+s.l[r.lid].nome:s.log[s.log.length-1].tx,'bene')}
   if(a==='recluta'||a==='assolda'||a==='compagno')Snd.play('avv-compagno');else if(a==='compra'||a==='vendi'||a==='riscatta'||a==='consegna'||a==='compraogg'||a==='vendiogg'||a==='equipa')Snd.play('avv-bottino');else if(a==='promuovi'||a==='abilita')Snd.play('avv-livello');
   salva();return render()}
  // battaglia
  const k=VenCampo.K;
  if(c==='cpausa'){if(inS()){const r=VenStanza.pausa();if(r&&r.err)avviso(r.err)}else k.pausa=!k.pausa;return render()}
  if(c==='cvel'){if(inS())avviso('In compagnia si combatte a passo normale');else k.vel=k.vel===1?2:1;return render()}
  if(c==='cgr'){k.gruppo=p[1];return render()}
  if(c==='cord'){const r=inS()?VenStanza.manda({t:'b-ord',o:{g:k.gruppo,t:p[1]}}):VCAM.ordina(k.s,{g:k.gruppo,t:p[1]});if(r.err)avviso(r.err);else avviso((k.gruppo==='tutti'?'Tutti':CLS[k.gruppo])+': '+({carica:'alla carica!',tieni:'tenete la posizione',segui:'con me!',avanza:'avanti dieci passi',arretra:'indietro dieci passi'})[p[1]]);return}
  if(c==='cgrido'){const r=inS()?VenStanza.manda({t:'b-cap',o:{grido:true}}):VCAM.capitano(k.s,{grido:true});if(r.err)avviso(r.err);return}
  if(c==='fine'){if(inS()){const r=VenStanza.manda({t:'b-fine'});if(r.err)avviso(r.err);return render()}return fineBattaglia()}}
 const traccia=()=>V.modo==='campo'?'avv-battaglia':V.pan==='luogo'?'avv-citta':V.s&&VEN.notte(V.s)?'avv-notte':'avv-giorno';
 return{V,sezioneH,html,dopo,act,avviso,traccia,entra,salva,ferma}})();
