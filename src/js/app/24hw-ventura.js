/* ---- Compagnia di ventura (Cantari di Ventura, piano C): la partita. Stato, ciclo, tocchi, HUD e pannelli. ----
   Mondo libero sul modello dei giochi di comando di truppe: giri la mappa, recluti, commerci, combatti, servi un regno o ne fondi uno.
   Regole: `VEN` (motori/28k), battaglia `VCAM` (28l), dati `VDAT` (28j). Disegno: `VenMappa` (24hu), `VenCampo` (24hv), `VenArte` (24ht).
   Un solo comando: `data-a="ven" data-v="verbo:arg:arg"` (07c-comandi). Il tempo del mondo scorre solo mentre la compagnia
   cammina o aspetta, e mai con un pannello aperto. Salvataggio sul telefono (`ven-salv`), a ogni alba, luogo e battaglia.
   Pannelli nei file 24hwa–24hwe (VenBarre, VenLuoghi, VenGente, VenScontro, VenTv), che leggono gli aiutanti da `Ven._`. CSS: css/39j*-ven-*.css (prefisso `vn-`). Piano: docs/VENTURA.md. */
const Ven=(()=>{
 const V={s:null,modo:'mondo',pan:null,sub:'home',vel:1,acc:0,raf:0,ult:0,avvisi:[],qta:1,carta:null,msg:'',regno:'val',hud:0,fine:null,gesti:false,pt:{},pin:0};
 const D=VDAT,ST_K='ven-salv';
 const leggi=()=>{try{return VEN.apri(localStorage.getItem(ST_K))}catch(e){return null}};
 const salva=()=>{if(!V.s||VenStanza.on())return;try{localStorage.setItem(ST_K,VEN.salva(V.s))}catch(e){}};
 const tu=()=>VEN.TU(V.s);
 // in compagnia (stanza live) le azioni passano dalla stanza; da soli si chiamano i motori qui
 const mio2=()=>mio();
 const inS=()=>VenStanza.on(),posto=()=>inS()?Math.max(0,VenStanza.seat()):0,mio=()=>VEN.capDi(V.s,posto())||V.s.cap;
 const ordina=o=>{const r=inS()?VenStanza.manda({t:'ordina',o}):VEN.ordina(V.s,o);if(r&&!r.err)VenAudio.ordine(o);return r};
 const n0=x=>Math.round(x).toLocaleString('it-IT');
 const faz=f=>{const r=VEN.rg(V.s,f);return`<span class="vn-fz" style="--fz:${r.col}">${esc(r.breve)}</span>`};
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
 function sezioneH(){interruttori();const s=leggi(),R=VEN.regni(null);
  const coop=VenStanza.leggiSalv('coop'),
  daSolo=coop?`<button class="b sm ecta" data-a="ven" data-v="dasolo">${V.confSolo?'Conferma: sostituisce la tua partita da solo':'Continua da solo la partita in compagnia'}</button><small class="muted">Compagnia in compagnia, giorno ${VEN.giorno(coop.w)}${V.confSolo?' · la partita da solo che hai ora andrà persa':''}.</small>`:'';
  const cont=s?`<button class="av-card av-cont" data-a="ven" data-v="continua"><span class="vn-stemma">${ic('spada',26)}</span><span class="av-tx"><b>${esc(s.nome)}</b><small>Giorno ${VEN.giorno(s)} · ${VEN.uomini(VEN.TU(s))} uomini · fama ${s.fama}</small></span><span class="av-go">Continua</span></button>`:'';
  return`<div class="sh2">Compagnia di ventura ${infoH('Un mondo libero: tre regni in guerra, villaggi dove reclutare, città dove commerciare, castelli da prendere. Nessuna trama: la strada la scegli tu.')}</div>
${cont}${daSolo}<div class="vn-nuova"><small class="muted">${s?'Ricomincia da un altro regno (il salvataggio di ora si perde):':'Da quale regno parti?'}</small>
<div class="vn-regni vn-r5">${R.map(f=>`<button class="vn-regno${V.regno===f?' on':''}" style="--fz:${VEN.rg(null,f).col}" data-a="ven" data-v="regno:${f}"><b>${esc(VEN.rg(null,f).breve)}</b><small>${esc(VEN.rg(null,f).motto)}</small></button>`).join('')}</div>
<button class="b ${s?'sm':'gold'} ecta" data-a="ven" data-v="nuova">${ic('spada',18)} ${s?'Nuova compagnia':'Leva la compagnia'}</button>
<small class="muted">${ic('amici',14)} In compagnia, fino a quattro capitani: apri una stanza dalla Taverna e scegli «Compagnia di ventura» tra i giochi.</small></div>`}
 // `?ven=grandi,mondo2`: accende in memoria, per la sessione, i soli interruttori nominati (mai salvati)
 function interruttori(){try{const q=new URLSearchParams(location.search).get('ven');if(q)for(const k of q.split(','))if(Object.prototype.hasOwnProperty.call(D.ACCESO,k))D.ACCESO[k]=true}catch(e){}}
 function entra(s){interruttori();V.s=s;V.modo='mondo';V.pan=s.incontro?'incontro':s.dentro>=0||s.davanti>=0?'luogo':null;V.sub='home';V.carta=null;V.msg='';V.avvisi=[];V.vitVista=!!s.vinta;V.nomeRegno='';V.stend=0;Plancia.chiudi();ui.ven=true;render()}
 function esci(){salva();ui.ven=false;ui.avv=true;V.pan=null;ferma();VenArte.smonta();document.documentElement.classList.remove('vn-on');render()}
 // ---------- ciclo ----------
 function ferma(){if(V.raf){cancelAnimationFrame(V.raf);V.raf=0}}
 function dopo(){const on=!!(ui.ven&&V.s),de=document.documentElement;de.classList.toggle('vn-on',on);de.classList.toggle('vn-tv',on&&!!ui.tv);de.classList.toggle('vn-ctl',on&&tvOn());if(!on){if(V.raf){ferma();VenArte.smonta()}return}
  if(!VenArte.A.pronta){if(!VenArte.A.fallita)VenArte.avvia().then(()=>{if(ui.ven)render()});return}
  const host=document.querySelector('.vn-scena');if(!host)return;VenArte.monta(host);if(!V.gesti)gesti();
  if(V.modo==='mondo')VenMappa.apri(V.s);{const cc=document.querySelector('.vn-carta-cv');if(cc&&V.s)VenMappa.carta(cc,V.s)}
  if(!V.orecchio){V.orecchio=true;document.addEventListener('click',e=>{V.ultimoClick=e},true);document.addEventListener('input',e=>{if(e.target&&e.target.id==='vn-regno-nome')V.nomeRegno=e.target.value},true)}hudVivo();if(!V.raf){V.ult=0;V.raf=requestAnimationFrame(giro)}}
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
   if(ui.tv){if(V.modo==='campo'){const k=VenCampo.K;k.segue=false;k.fuoco.x=30;k.fuoco.z=50;k.alt=80}else{VenMappa.K.alt=26;VenMappa.centra()}}
   if(ora-V.hud>250){V.hud=ora;hudVivo();const cl=ui.tv&&document.getElementById('vn-tvl');if(cl){const h=VenTv.cronTv(V.s);if(cl.innerHTML!==h)cl.innerHTML=h}}
   if(V.avvisi.length&&ora-V.avvisi[0].t>4200){V.avvisi.shift();const el=document.querySelector('.vn-avv');if(el)el.innerHTML=avvisiH()}}
  catch(e){ERR.n(e,'ventura');ferma()}}
 // il tempo del mondo: otto minuti di gioco al secondo a ×1 (un giorno ≈ tre minuti)
 function mondo(dt){const s=V.s,t=tu();if(V.pan&&V.pan!=='attesa')return;if(s.incontro)return;const cammina=t.ord||s.prigioniero||(s.voci&&s.voci.length&&s.dentro<0&&s.davanti<0);if(!cammina)return;
  V.acc+=dt*8*(s.prigioniero||(t.ord&&t.ord.t==='aspetta')?Math.max(6,V.vel*3):V.vel);const n=Math.floor(V.acc);if(n<1)return;V.acc-=n;const g0=VEN.giorno(s),ev=VEN.passo(s,n);let ridisegna=false;
  VenAudio.mondo(ev);
  for(const e of ev){if(e.t==='incontro'){V.pan='incontro';ridisegna=true}else if(e.t==='dentro'||e.t==='davanti'){V.pan='luogo';V.sub='home';V.msg='';ridisegna=true;salva()}
   else if(e.t==='log'&&e.tipo)avviso(e.tx,e.tipo);else if(e.t==='giorno')salva();else if(e.t==='libero'||e.t==='fine-attesa'){ridisegna=true}else if(e.t==='voce')ridisegna=true;else if(e.t==='conquista')ridisegna=true}
  if(V.pan==='attesa'&&!(t.ord&&t.ord.t==='aspetta')&&!s.prigioniero){V.pan=s.incontro?'incontro':s.dentro>=0||s.davanti>=0?'luogo':null;ridisegna=true}
  if(s.prigioniero&&V.pan!=='attesa'){V.pan='attesa';ridisegna=true}
  if(ridisegna||VEN.giorno(s)!==g0)render()}
 // numeri che cambiano senza ridisegnare tutta la pagina
 function hudVivo(){const s=V.s,q=(id,tx)=>{const el=document.getElementById(id);if(el&&el.textContent!==tx)el.textContent=tx};
  if(V.modo==='campo'){const b=VenCampo.K.s;if(!b)return;const na=VCAM.vivi(b,'a').length+VCAM.riserva(b,'a'),nb=VCAM.vivi(b,'b').length+VCAM.riserva(b,'b'),g=VCAM.gruppi(b,'a'),c=VCAM.capU(b,posto());
   q('vn-na',String(na));{const sec=Math.floor(b.t/10);q('vn-tvt',Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0'))}q('vn-nb',String(nb));const ba=document.getElementById('vn-ba');if(ba)ba.style.width=(na/Math.max(1,na+nb)*100).toFixed(1)+'%';const fm=VCAM.forme(b,'a');for(const k of['f','t','c']){q('vn-g'+k,String(g[k]));q('vn-fm'+k,fm[k])}
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
  if(r&&r.err)avviso(r.err);if(document.querySelector('.vn-carta'))render()}
 // V7, la TV: fascia alta con i numeri della compagnia, cronaca a destra, capitani in basso; in battaglia solo le forze e il tempo
 const tvOn=()=>!!(inS()&&G&&G.tv&&!ui.tv&&VenStanza.seat()>=0);
 // ---------- pannelli ----------
 const pannello=(titolo,corpo,o)=>`<div class="vn-pan ${o&&o.cls||''}"><div class="vn-pt"><h3>${titolo}</h3>${o&&o.fisso?'':`<button class="vn-ib" data-a="ven" data-v="${o&&o.chiudi||'chiudi'}" aria-label="Chiudi">${ic('x',18)}</button>`}</div><div class="vn-pc">${corpo}</div>${V.msg?`<p class="vn-msg" role="status">${esc(V.msg)}</p>`:''}</div>`;
 const riga=(sx,dx,cls)=>`<div class="vn-r ${cls||''}"><div class="vn-rs">${sx}</div><div class="vn-rd">${dx||''}</div></div>`;
 const bt=(tx,v,o)=>`<button class="b sm ${o&&o.cls||''}" data-a="ven" data-v="${v}" ${o&&o.no?'disabled':''}>${tx}</button>`;
 // regno (V4): fondare, trattare da sovrano, governare, vincere
 function nomeRegno(){const el=document.getElementById('vn-regno-nome');if(el)V.nomeRegno=el.value}
 function html(){if(VenStanza.on()||VenStanza.X.era)VenStanza.sync();if(!V.s)return'';if(V.s.vinta&&!V.vitVista&&V.modo==='mondo'&&!V.s.incontro){V.vitVista=true;V.pan='vittoria'}const A=VenArte.A;
  const corpo=A.fallita?`<div class="vn-vela"><div><h3>Serve la grafica 3D</h3><p>Questo telefono non riesce ad accendere la scena. Chiudi le altre schede e riprova.</p>${A.errore?`<p><small>${esc(A.errore)}</small></p>`:''}${bt('Riprova','riprova',{cls:'gold'})}${bt('Esci','esci')}</div></div>`:!A.pronta?'<div class="vn-vela"><div><h3>Si spiegano le mappe…</h3></div></div>':
   ui.tv?(V.modo==='campo'?VenTv.campoTvH():VenTv.tvH()+(V.s.incontro?VenTv.incontroTvH():'')+(V.pan==='esito'?VenScontro.esitoH():'')):
   V.modo==='campo'?VenScontro.campoH():VenBarre.altoH()+(V.pan?'':tvOn()?VenBarre.ctlH():VenBarre.bassoH())+(V.carta!=null&&!V.pan?VenBarre.cartaH():'')+
   (V.pan==='luogo'?VenLuoghi.luogoH():V.pan==='compagnia'?VenGente.compagniaH():V.pan==='capitano'?VenGente.capitanoH():V.pan==='diario'?VenGente.diarioH():V.pan==='incontro'?VenScontro.incontroH(tvOn()):V.pan==='esito'?VenScontro.esitoH():V.pan==='attesa'?VenScontro.attesaH():V.pan==='menu'?VenBarre.menuH():V.pan==='carta'?VenBarre.cartaMondoH():V.pan==='corona'?VenLuoghi.coronaH():V.pan==='vittoria'?VenLuoghi.vittoriaH():'')+VenGente.voceH();
  return`<div class="vn" data-modo="${V.modo}"><div class="vn-scena"></div><div class="vn-etc"></div>${corpo}<div class="vn-avv">${avvisiH()}</div></div>`}
 // ---------- battaglia ----------
 function inBattaglia(scheda){V.modo='campo';V.pan=null;V.fine=null;VenCampo.apri(scheda);render()}
 function fineBattaglia(){const r=VCAM.riepilogo(VenCampo.K.s),x=VEN.esito(V.s,r);V.modo='mondo';V.fine=null;V.pan=x.err?null:'esito';VenMappa.centra();salva();VenAudio.mondo([{t:'esito',out:r}]);render()}
 // ---------- comandi ----------
 function act(v){const s=V.s,p=String(v||'').split(':'),c=p[0];V.msg='';
  if(c==='regno'){V.regno=p[1];return render()}
  if(c==='rip')return VenStanza.scegli(p[1]);
  if(c==='dasolo'){if(!V.confSolo&&leggi()){V.confSolo=true;return render()}V.confSolo=false;if(VenStanza.perSolo()){const x=leggi();if(x)entra(x)}return}
  if(c==='continua'){const x=leggi();if(x)entra(x);return}
  if(c==='nuova'){interruttori();const x=VEN.nuovo((Date.now()^Math.floor(Math.random()*1e9))>>>0,{nome:ME.name||'Capitano',compagnia:'Compagnia di '+(ME.name||'ventura'),regno:V.regno});entra(x);salva();return}
  if(!s)return;
  if(c==='esci')return inS()?VenStanza.esci():esci();
  if(c==='riprova'){riprova();return}
  if(c==='regole'){ui.rules='ventura';return render()}
  if(c==='tv'){if(!inS())return;const r=VenStanza.manda({t:'tv',v:!G.tv});if(r.err)avviso(r.err);return render()}
  if(c==='pan'){V.pan=p[1];V.sub='home';V.carta=null;return render()}
  if(c==='sub'){V.sub=p.slice(1).join(':');return render()}
  if(c==='stend'){nomeRegno();V.stend=+p[1]|0;return render()}
  if(c==='chiudi'){V.pan=s.incontro?'incontro':s.dentro>=0&&V.pan==='esito'&&s.ult&&s.ult.torneo?'luogo':null;V.sub='home';return render()}
  if(c==='carta'){V.carta=null;return render()}
  if(c==='qta'){V.qta=+p[1]||1;return render()}
  if(c==='qual'){try{localStorage.setItem('ven-q',p[1])}catch(e){}VenArte.A.lento=0;VenArte.misura();return render()}
  if(c==='vel'){const v=V.vel===1?2:V.vel===2?4:1;if(inS()){const r=VenStanza.manda({t:'vel',v});if(r.err)avviso(r.err)}else V.vel=v;return render()}
  if(c==='cartatocco'){const cv=document.querySelector('.vn-carta-cv'),e=V.ultimoClick;if(cv&&e){const r=cv.getBoundingClientRect(),G=VEN.mappaDi(s).G;VenMappa.guarda((e.clientX-r.left)/r.width*G,(e.clientY-r.top)/r.height*G);VenMappa.K.alt=Math.max(VenMappa.K.alt,22);V.pan=null}return render()}
  if(c==='centra'){(V.modo==='campo'?VenCampo:VenMappa).centra();return}
  if(c==='ferma'){ordina({t:'ferma'});V.pan=s.dentro>=0||s.davanti>=0?'luogo':null;return render()}
  if(c==='campo'){const r=ordina({t:'aspetta',ore:8});if(r.err)avviso(r.err);else V.pan='attesa';return render()}
  if(c==='segui'){const r=ordina({t:'segui',pid:+p[1]});V.carta=null;if(r.err)avviso(r.err);return render()}
  if(c==='parla'){const a=p[1]==='c'?{t:'continua'}:{t:'scegli',i:+p[1]},r=inS()?VenStanza.manda({t:'parla',a}):VEN.parla(s,a);if(r.err){V.msg=r.err;Snd.play('err');return render()}
   V.msg='';if(!inS()){salva();if(s.incontro){V.pan='incontro';VenAudio.mondo([{t:'incontro'}])}}return render()}
  if(c==='scegli'){const sv=p.slice(1).join(':'),r=inS()?VenStanza.manda({t:'scegli',v:sv}):VEN.scegli(s,sv);if(r.err){V.msg=r.err;return render()}if(inS())return render();if(p[1]==='passa')avviso(s.log[s.log.length-1].tx,'bene');
   if(p[1]==='attacca')return inBattaglia(r.campo);if(p[1]==='auto'){VEN.auto(s);V.pan='esito';salva();return render()}
   V.pan=s.incontro?'incontro':s.dentro>=0||s.davanti>=0?'luogo':null;return render()}
  if(c==='fai'){const a=p[1];let z={a};
   if(a==='recluta')z.n=+p[2]||1;else if(a==='compra'||a==='vendi'){z.m=p[2];z.n=a==='vendi'?Math.min(V.qta,tu().merci[p[2]]||0):Math.min(V.qta,s.l[s.dentro].scorte[p[2]]||0)}
   else if(a==='assolda'){z.t=p[2];z.n=1}else if(a==='compagno'||a==='compraogg')z.id=p[2];else if(a==='abilita')z.k=p[2];else if(a==='vendiogg'||a==='equipa')z.i=+p[2];else if(a==='togli'){z.slot=p[2];z.k=+p[3]||0}else if(a==='imbarca')z.lid=+p[2];else if(a==='liberasig')z.sig=+p[2];else if(a==='promuovi'){z.t=p[2];z.su=p[3];z.n=1}else if(a==='congeda'){z.t=p[2];z.n=1}
   else if(a==='pace')z.f=p[2];else if(a==='proponi'){z.tipo=p[2];z.f=p[3]}else if(a==='guarnigione'){z.t=p[2];z.verso=+p[3];z.n=1}
   else if(a==='fonda'){nomeRegno();z.nome=V.nomeRegno||'';z.stend=V.stend|0}else if(a==='feudo'){z.lid=+p[2];z.sid=+p[3]}else if(a==='investi'){z.t=p[2];z.lid=+p[3]}else if(a==='dichiara'||a==='rompi')z.f=p[2];
   const r=inS()?VenStanza.manda({t:'fai',z}):VEN.fai(s,z);if(r.err){V.msg=r.err;Snd.play('err');return render()}
   if(a==='proponi'){V.msg='';avviso(s.log[s.log.length-1].tx,'bene')}
   if(a==='fonda'){V.pan='corona';V.sub='home';V.nomeRegno='';avviso(s.log[s.log.length-1].tx,'bene')}else if(a==='feudo'||a==='investi'||a==='aduna'||a==='dichiara'||a==='rompi'){V.sub='home';avviso(s.log[s.log.length-1].tx,a==='dichiara'?'guerra':'bene')}
   if(a==='esci'){V.pan=null;V.sub='home'}else if(a==='riposa'||a==='assedia'||a==='imbarca'){V.pan='attesa';V.sub='home'}else if(a==='razzia'){V.pan=null}else if(a==='assalta'||a==='lizza'){V.pan='incontro'}else if(a==='ritira'){V.pan='luogo'}else if(a==='voci'){avviso(r.lid!=null?'Segnato sulla carta: '+s.l[r.lid].nome:s.log[s.log.length-1].tx,'bene')}
   VenAudio.fai(a);
   salva();return render()}
  // battaglia
  const k=VenCampo.K;
  if(c==='cpausa'){if(inS()){const r=VenStanza.pausa();if(r&&r.err)avviso(r.err)}else k.pausa=!k.pausa;return render()}
  if(c==='cvel'){if(inS())avviso('In compagnia si combatte a passo normale');else k.vel=k.vel===1?2:1;return render()}
  if(c==='cgr'){const g=p[1];
   if(g!=='tutti'&&k.gruppo===g){// un tocco sul gruppo già scelto gira la formazione: serrata, cuneo, larga (i tiratori saltano il cuneo)
    const r=inS()?VenStanza.manda({t:'b-ord',o:{g,t:'forma'}}):VCAM.ordina(k.s,{g,t:'forma'});
    if(r.err)avviso(r.err);else avviso(CLS[g]+': '+({serrata:'serrate le file',larga:'allargatevi',cuneo:'a cuneo'})[VCAM.forme(inS()&&r.s&&r.s.b?r.s.b.c:k.s,'a')[g]]);
    return render()}
   k.gruppo=g;return render()}
  if(c==='cord'){const r=inS()?VenStanza.manda({t:'b-ord',o:{g:k.gruppo,t:p[1]}}):VCAM.ordina(k.s,{g:k.gruppo,t:p[1]});if(r.err)avviso(r.err);else avviso((k.gruppo==='tutti'?'Tutti':CLS[k.gruppo])+': '+({carica:'alla carica!',tieni:'tenete la posizione',segui:'con me!',avanza:'avanti dieci passi',arretra:'indietro dieci passi'})[p[1]]);return}
  if(c==='cgrido'){const r=inS()?VenStanza.manda({t:'b-cap',o:{grido:true}}):VCAM.capitano(k.s,{grido:true});if(r.err)avviso(r.err);return}
  if(c==='fine'){if(inS()){const r=VenStanza.manda({t:'b-fine'});if(r.err)avviso(r.err);return render()}return fineBattaglia()}}
 const traccia=()=>VenAudio.traccia();
 return{_:{CLS,D,PREGIO,TIPO,V,bt,faz,inS,mio,mio2,n0,oggH,pannello,pips,posto,riga,tu},V,sezioneH,html,dopo,act,avviso,traccia,entra,salva,ferma}})();
