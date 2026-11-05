/* ---- Battaglia in tempo reale con pausa (Cantari di Ventura, piano B, step B5): la vista sul telefono della battaglia a istanti. ----
   Le regole sono di ATEM (motori/27s: `passo`, `ordina`), il cervello di eroi e nemici di AIAT (27t: atteggiamenti, «Uso automatico»). Qui:
   · il ciclo: la logica avanza a 10 istanti al secondo (×1/×2), il disegno va a ogni fotogramma e interpola le posizioni fra l'istante prima e quello dopo;
   · i tocchi diventano ordini (eroe = sceglilo, nemico = attaccalo, esagono = vai lì, eroe a terra = rialzalo; abilità: subito, oppure bersaglio / area in due tocchi);
   · la pausa (gratis: non si chiama `passo`) e la pausa automatica (impostazioni nel menu: inizio, eroe sotto un quarto dei PF, eroe senza bersaglio,
     nemico nuovo in campo, un capo che prepara un potere ad area); la griglia si vede solo in pausa o mirando;
   · l'HUD verticale: ritratti in alto (64 pt), campo al centro, pannello legno e ottone in basso con le abilità a anello di ricarica, Pausa, ×1/×2, atteggiamento.
   La mappa, i segnalini e il 3D sono quelli di sempre (BatMappa 24hc, Scena3D 24hn/24ho): qui si spostano a ogni fotogramma (`Scena3D.muovi` nel 3D).
   `Bat` (24he) resta il padrone di `Bat.s`, del salvataggio e della schermata di fine: quando `Bat.s` è di ATEM (`Bat.tempo()`) le sue viste passano qui.
   Comandi: un solo `data-a="btt"` con `data-v="verbo:arg"` (07c). Stile: css/39a-avventura.css (prefisso tr-). Piano: docs/AVVENTURA-B.md, scheda B5. */
const BatT={
 sel:null,mira:null,pausa:false,motivo:'',foglio:null,acc:0,raf:0,ult:0,prev:null,cur:null,sDi:null,els:new Map(),dis:{},zSig:'',rifaiA:0,ozio:{},suoni:{},
 fermoA:0,mem:{},xpShow:0,zP:{},   // B6: fino a quando l'immagine resta ferma (critico), memoria di ASUC fra un istante e l'altro, esperienza mostrata nel contatore
 AP_DEF:{inizio:true,ferito:true,ozio:false,nuovo:true,capo:true},
 AP_NOMI:[['inizio','All\'inizio della battaglia'],['ferito','Un eroe sotto un quarto dei PF'],['ozio','Un eroe senza bersaglio'],['nuovo','Un nemico nuovo in campo'],['capo','Un capo prepara un potere ad area']],
 ap:null,
 carica(){try{const j=JSON.parse(localStorage.getItem('bat-pausa')||'null');BatT.ap=Object.assign({},BatT.AP_DEF,j&&typeof j==='object'?j:{})}catch(e){BatT.ap=Object.assign({},BatT.AP_DEF)}},
 salvaAp(){try{localStorage.setItem('bat-pausa',JSON.stringify(BatT.ap))}catch(e){ERR.n(e)}},
 // una battaglia nuova (o ripresa dopo un ricaricamento: si riparte sempre in pausa)
 prepara(nuova){const s=Bat.s;BatT.sDi=s;BatT.mira=null;BatT.foglio=null;BatT.acc=0;BatT.ozio={};BatT.rifaiA=0;BatT.zSig='';
  BatT.fermoA=0;BatT.mem={};BatT.xpShow=Succo.daStato(s);Succo.pulisci();
  BatT.cur=BatT.foto(s);BatT.prev=BatT.cur;const h=s.cb.find(c=>c.lato==='eroi'&&ATEM.inPiedi(c));BatT.sel=h?h.id:null;
  BatT.pausa=!s.over&&(!nuova||BatT.ap.inizio);BatT.motivo=s.over?'':nuova?'Dai gli ordini, poi tocca Riprendi.':'Battaglia ripresa.'},
 eroe(s){const c=BatT.sel&&ATEM.trova(s,BatT.sel);return c&&c.lato==='eroi'?c:null},
 ferma(){const s=Bat.s;return!s||!!s.over||BatT.pausa||!!BatT.foglio||!!Bat.vedi||document.hidden},
 // ---- posizioni: esagono frazionario (q, r) e quota (h = 1 su un rialzo) di chi è in campo, all'istante di adesso ----
 foto(s){const o={},A=s.arena;
  for(const c of s.cb){if(!ATEM.inCampo(c))continue;const h=AGRI.alt(A,c)?1:0;
   if(c.mv){const f=Math.min(1,c.mv.k/c.mv.n),d=c.mv.da,hd=AGRI.alt(A,d)?1:0;o[c.id]={q:d.q+(c.q-d.q)*f,r:d.r+(c.r-d.r)*f,h:hd+(h-hd)*f,mv:true,la:!!c.lancio}}
   else o[c.id]={q:c.q,r:c.r,h,mv:false,la:!!c.lancio}}
  return o},
 // ---- il ciclo ----
 avvia(){if(!BatT.raf){BatT.ult=0;BatT.raf=requestAnimationFrame(BatT.frame)}},
 viva(){return!!(ui.bat&&Bat.tempo()&&document.querySelector('.tr-bat'))},
 frame(t){BatT.raf=0;if(!BatT.viva())return;const s=Bat.s;if(BatT.sDi!==s)BatT.prepara(false);
  const dt=Math.min(250,t-(BatT.ult||t));BatT.ult=t;
  if(!BatT.ferma()&&t>=BatT.fermoA){BatT.acc+=dt*(Bat.cfg.vel===2?2:1);let n=0;   // B6: un critico ferma l'immagine per 60 ms (il tempo di gioco non passa)
   while(BatT.acc>=100&&n<6){BatT.acc-=100;n++;BatT.istante();if(BatT.ferma())break}if(n>=6)BatT.acc=0}
  if(BatT.rifaiA&&performance.now()>=BatT.rifaiA){BatT.rifaiA=0;render();return}
  BatT.disegna(BatT.ferma()?1:BatT.acc/100,t);BatT.raf=requestAnimationFrame(BatT.frame)},
 // un istante di gioco: l'IA pensa (ogni mezzo secondo) e la battaglia avanza; poi eventi, pausa automatica, HUD
 istante(){const s=Bat.s,hp0={};for(const c of s.cb)if(c.lato==='eroi')hp0[c.id]=c.hp;
  BatT.prev=BatT.cur||BatT.foto(s);let r;
  try{r=AIAT.avanza(s,1,{qui:true})}catch(e){ERR.n(e,'bat-tempo');BatT.pausa=true;BatT.motivo='Qualcosa è andato storto: la battaglia è salvata.';Bat.salva();render();return}
  if(r.err){BatT.pausa=true;BatT.motivo=r.err;render();return}
  BatT.cur=BatT.foto(s);BatT.eventi(r.ev,s);BatT.controlla(s,hp0);
  if(s.t%30===0)Bat.salva();BatT.hud(s)},
 // ---- eventi: registro, numeri e scritte, animazioni, suoni, pausa automatica ----
 RIFAI:new Set(['arriva','cade','muore','fuggito','arreso','fine']),
 riga(e,s){const N=id=>ACRO.nome(s,id),P=id=>{const p=APOT.P[id]||APOT.oggetto(id);return p?p.nome:String(id)};
  switch(e.t){
   case'attacca':case'annullato':case'fallito':case'conc-spesa':return null;
   case'lancia':return e.id==='rialza'?null:{testo:`${N(e.chi)} prepara ${P(e.id)}.`,lato:ATEM.trova(s,e.chi).lato,peso:'normale'};
   case'interrotto':return{testo:`${N(e.chi)}: ${P(e.id)} interrotto.`,lato:ATEM.trova(s,e.chi).lato,peso:'minore'};
   case'potere':return{testo:`${N(e.chi)} usa ${P(e.id)}.`,lato:ATEM.trova(s,e.chi).lato,peso:'normale'};
   case'oggetto':return{testo:`${N(e.chi)} usa ${P(e.id)}.`,lato:ATEM.trova(s,e.chi).lato,peso:'normale'};
   case'tiro':return e.ok?null:{testo:`${N(e.chi)} manca ${N(e.bers)}.`,lato:ATEM.trova(s,e.chi).lato,peso:'minore'}}
  const r=ACRO.riga(e,s);return r.testo?r:null},
 eventi(ev,s){let log=false;const rid=BatAnima.mq(),d3=Scena3D.on();
  for(const e of ev){const r=BatT.riga(e,s);if(r){Bat.log.push(r);if(Bat.log.length>120)Bat.log.shift();log=true}
   if(BatT.RIFAI.has(e.t)||(e.t==='rialza'&&e.ok))BatT.rifaiA=performance.now()+(e.t==='fine'?700:420);
   if(e.t==='arriva'&&ATEM.trova(s,e.chi).lato==='nemici'&&BatT.ap.nuovo)BatT.ferma_('Arriva '+ACRO.nome(s,e.chi)+'.');
   if(e.t==='lancia'&&e.zona){const c=ATEM.trova(s,e.chi),m=c&&BEST.M[c.def];if(m&&m.capo&&BatT.ap.capo)BatT.ferma_(ACRO.nome(s,e.chi)+' prepara '+((APOT.P[e.id]||{}).nome||e.id)+': esci dall\'area rossa.')}
   if(e.t==='attacca'||e.t==='lancia')BatT.cls(e.chi,e.t==='lancia'?'':'tr-colpo',260);
   for(const x of ACRO.effetti(e,s)){
    switch(x.t){
     case'dado':if(d3)Scena3D.passo(x,s,.55,rid);break;   // «Mancato», numeri e critico sono riscontri di ASUC, disegnati da Succo (B6)
     case'etichetta':if(!/^(Colpito|Mancato|Critico!)$/.test(x.testo))BatAnima.etic(x.chi,x.testo,x.tono);break;
     case'numero':if(d3)Scena3D.passo(x,s,1,rid);break;   // il numero e il suo suono sono di Succo
     case'scossa':break;   // lampo e spinta sono il riscontro «colpito»
     case'stato':if(x.ok){BatAnima.etic(x.chi,BatAnima.nomeStato(x.stato),'neutro');BatT.suono(x)}break;
     case'cade':case'esce':BatAnima.cls(x.chi,x.t,0);if(d3)Scena3D.passo(x,s,1,rid);if(x.t==='cade')BatT.suono(x);break;   // chi muore si sbriciola (Succo): il tonfo è solo di chi cade
     case'compare':if(d3)Scena3D.passo(x,s,1,rid);break;
     case'fine':BatT.suono(x);break}}}
  // il succo (B6): i riscontri di questo istante; alla vittoria anche «Livello su!», e la schermata finale aspetta che bottino e livello finiscano
  const ris=ASUC.da(ev,s,BatT.mem);
  if(s.over&&ev.some(e=>e.t==='fine'&&e.esito)){const vit=s.over.esito==='vittoria',lv=vit?ASUC.livelli(s,BatT.camp()):[];ris.push(...lv);
   let ms=700;if(vit){if(!rid&&ris.some(x=>x.t==='bottino'))ms=1400;if(lv.length)ms=Math.max(ms,ASUC.TAB.livello.ms+lv[lv.length-1].rit+250)}
   BatT.rifaiA=performance.now()+ms}
  Succo.gioca(ris,s);
  if(log)BatT.logDom()},
 // la campagna a cui appartiene la battaglia (serve per sapere se un eroe sale di livello)
 camp(){return(typeof Ses!=='undefined'&&Ses.a&&Ses.a.camp)||(typeof Camp!=='undefined'&&Camp.s)||null},
 // pausa automatica: un motivo alla volta (il primo resta)
 ferma_(motivo){if(BatT.pausa)return;BatT.pausa=true;BatT.motivo=motivo;Bat.salva();BatT.rifaiA=BatT.rifaiA||performance.now()+1},
 controlla(s,hp0){if(s.over)return;
  for(const c of s.cb){if(c.lato!=='eroi'||!ATEM.inCampo(c))continue;
   if(BatT.ap.ferito&&c.hp>0&&hp0[c.id]>=c.hpMax/4&&c.hp<c.hpMax/4)BatT.ferma_(ACRO.nome(s,c.id)+' è gravemente ferito.');
   if(!ATEM.inPiedi(c)||s.ordini[c.id]||c.mv||c.lancio){delete BatT.ozio[c.id];continue}
   const z=BatT.ozio[c.id]==null?(BatT.ozio[c.id]=s.t):BatT.ozio[c.id];if(BatT.ap.ozio&&s.t-z>=30){BatT.ozio[c.id]=s.t+600;BatT.ferma_(ACRO.nome(s,c.id)+' non ha un bersaglio.')}}
  const c=BatT.eroe(s);if(!c||!ATEM.inPiedi(c)){const h=s.cb.find(x=>x.lato==='eroi'&&ATEM.inPiedi(x));if(h&&h.id!==BatT.sel){BatT.sel=h.id;BatT.mira=null;BatT.rifaiA=BatT.rifaiA||performance.now()+1}}},
 // suoni dei passi (A10), senza ripetere lo stesso suono più di una volta ogni 90 ms
 suono(x){const k=x.t+(x.tipo||'')+(x.crit?'c':''),ora=performance.now();if(ora-(BatT.suoni[k]||0)<90)return;BatT.suoni[k]=ora;AvvAudio.passo(x,1)},
 cls(id,c,ms){if(!c)return;const el=BatT.els.get(id);if(!el)return;el.classList.remove(c);void el.getBoundingClientRect();el.classList.add(c);if(ms>0)setTimeout(()=>el.classList.remove(c),ms)},
 // ---- disegno a ogni fotogramma: segnalini (SVG) e miniature (3D) nelle posizioni interpolate ----
 disegna(al,t){const s=Bat.s,P=BatT.cur||{},Q=BatT.prev||P,mq=BatAnima.mq(),out={};t=t||performance.now();
  for(const id in P){const b=P[id],a=Q[id]||b,p={q:a.q+(b.q-a.q)*al,r:a.r+(b.r-a.r)*al,h:a.h+(b.h-a.h)*al,mv:b.mv,la:b.la};out[id]=p;
   const [x,y0]=BatMappa.xy(p.q,p.r),y=y0-6*p.h,bob=p.mv&&!mq&&!Scena3D.on()?Math.abs(Math.sin(t/85))*2.2:0;BatT.dis[id]={x,y};
   const el=BatT.els.get(id);if(el){el.setAttribute('transform',`translate(${x.toFixed(1)} ${(y-bob).toFixed(1)})`);el.dataset.x=x.toFixed(1);el.dataset.y=y.toFixed(1)}}
  if(Scena3D.on()&&Scena3D.muovi&&(!BatT.ferma()||t-(BatT.m3||0)>250)){BatT.m3=t;Scena3D.muovi(out,t/1000)}},
 // ---- HUD a ogni istante: PF, ricariche, lanci, aree rosse ----
 hud(s){if(!s)return;
  for(const c of s.cb){const el=BatT.els.get(c.id);if(el){const f=el.querySelector('.bt-hpf'),p=Math.max(0,Math.min(1,c.hp/c.hpMax));
    if(f){f.setAttribute('width',(26*p).toFixed(1));f.setAttribute('fill',p>.5?'#5fbf6a':p>.25?'#e8b43a':'#d9503f')}el.classList.toggle('tr-lancia',!!c.lancio)}
   if(c.lato!=='eroi')continue;const r=document.querySelector(`.tr-rit[data-v="sel:${c.id}"]`);if(!r)continue;const b=r.querySelector('.tr-pf i'),p=Math.max(0,Math.min(1,c.hp/c.hpMax));
   if(b){b.style.width=(100*p).toFixed(0)+'%';b.className=p>.5?'':p>.25?'m':'b'}r.classList.toggle('ko',c.hp<=0)}
  const c=BatT.eroe(s);if(c){for(const b of document.querySelectorAll('.tr-ab[data-k]')){const R=BatT.ric(s,c,b.dataset.k,b.dataset.id),g=b.querySelector('.tr-arco');
    if(g)g.setAttribute('stroke-dashoffset',(BatT.CIRC*(1-R.fr)).toFixed(1));b.classList.toggle('off',!R.ok);b.classList.toggle('vivo',!!R.vivo)}
   const pf=document.querySelector('.tr-chi b');if(pf)pf.textContent=`${Math.max(0,c.hp)}/${c.hpMax} PF`}
  Succo.tinte(s);if(Succo.stati(s)&&!BatT.rifaiA)BatT.rifaiA=performance.now()+40;   // B6: tinta di fiamme, veleno e gelo; le icone di stato si ridisegnano se ne arriva o parte una
  BatT.zone(s)},
 CIRC:2*Math.PI*23,
 // stato di un tasto: fr = parte dell'anello ancora da ricaricare (0 = pronto), ok = si può usare, vivo = in corso
 ric(s,c,k,id){if(k==='conc')return{fr:0,ok:c.conc>0||c.concT>s.t,vivo:c.concT>s.t};
  if(k==='oggetto')return{fr:0,ok:(c.cintura||[]).includes(id),vivo:!!(c.lancio&&c.lancio.id===id)};
  const R=ATEM.ricarica(s,c,id);if(!R)return{fr:0,ok:false};const vivo=!!(c.lancio&&c.lancio.id===id)||!!(s.rapidi[c.id]&&s.rapidi[c.id].id===id);
  return{fr:R.tot>0?Math.min(1,R.resta/R.tot):0,ok:R.usi>0,vivo}},
 // le aree rosse dei poteri che i nemici stanno lanciando (si aggiornano se seguono un bersaglio)
 zone(s){const z=new Map();   // cella → quanto è carico il potere che la minaccia (0..1; se due aree si sovrappongono vale la più carica)
  for(const c of s.cb)if(c.lancio&&c.lato==='nemici'&&ATEM.inPiedi(c)){const cel=ATEM.zonaDi(s,c),p=ASUC.riempimento(s,c);if(cel)for(const x of cel){const k=x.q+','+x.r;z.set(k,Math.max(z.get(k)||0,p))}}
  const sig=[...z.keys()].join('|'),svg=document.querySelector('.tr-bat .bt-svg');if(!svg)return;let g=svg.querySelector('.tr-zone');
  if(sig!==BatT.zSig||(sig&&!g)){BatT.zSig=sig;BatT.zP={};
   if(!g&&sig){g=document.createElementNS(BatAnima.NS,'g');g.setAttribute('class','tr-zone');g.setAttribute('pointer-events','none');const fx=svg.querySelector('.bt-fx');svg.insertBefore(g,fx)}
   if(g)g.innerHTML=[...z.keys()].map(k=>{const [q,r]=k.split(',').map(Number),[x,y]=BatMappa.xy(q,r),h=AGRI.alt(s.arena,{q,r})?6:0;return`<polygon class="zb" points="${BatMappa.punti(x,y-h,BatMappa.Z-2)}"/><polygon class="zr" data-k="${k}" points="${BatMappa.punti(x,y-h,0)}"/>`}).join('')}
  if(!g)return;
  // B6: l'area rossa si riempie mentre il potere si carica, fino a scoppiare (il poligono interno cresce con la carica)
  for(const [k,p] of z){if(Math.abs((BatT.zP[k]||0)-p)<.03&&p<1)continue;BatT.zP[k]=p;const po=g.querySelector('.zr[data-k="'+k+'"]');if(!po)continue;
   const [q,r]=k.split(',').map(Number),[x,y]=BatMappa.xy(q,r),h=AGRI.alt(s.arena,{q,r})?6:0;po.setAttribute('points',BatMappa.punti(x,y-h,(BatMappa.Z-2)*p))}},
 logDom(){const el=document.querySelector('.tr-log');if(el)el.innerHTML=BatT.logH()},
 logH(){return Bat.log.slice(-2).map((r,k,L)=>`<p class="${r.lato?'l-'+r.lato:''} ${r.peso}${k<L.length-1?' vec':''}">${esc(r.testo)}</p>`).join('')},
 avviso(t){BatAnima.toast(t,1600)},
 // un segno sull'esagono di arrivo di un ordine
 segno(q,r,tipo){const g=document.querySelector('.tr-bat .bt-fx');if(!g)return;const [x,y]=BatMappa.xy(q,r),h=AGRI.alt(Bat.s.arena,{q,r})?6:0,e=document.createElementNS(BatAnima.NS,'polygon');
  e.setAttribute('points',BatMappa.punti(x,y-h,BatMappa.Z-3));e.setAttribute('class','tr-segno '+(tipo||''));g.appendChild(e);setTimeout(()=>e.remove(),700)},
 // ---- ordini ----
 ordina(o,dove){const s=Bat.s;if(!s||s.over)return false;const r=ATEM.ordina(s,o,{qui:true});if(r.err){BatT.avviso(r.err);return false}
  if(dove)BatT.segno(dove.q,dove.r,o.t==='attacca'?'att':'');Snd.play('sel');BatT.hud(s);return true},
 // la creatura disegnata più vicina al tocco (chi cammina sta fra due esagoni), altrimenti chi occupa l'esagono
 chiA(s,cella,p){let best=null,bd=22*22;if(p)for(const c of s.cb){if(!ATEM.inCampo(c))continue;const d=BatT.dis[c.id];if(!d)continue;const dx=d.x-p.x,dy=d.y-14-p.y,q=dx*dx+dy*dy;if(q<bd){bd=q;best=c}}
  return best||(cella?s.cb.find(c=>ATEM.inCampo(c)&&c.q===cella.q&&c.r===cella.r)||null:null)},
 tocca(cella,p){const s=Bat.s;if(!s||s.over||BatT.foglio)return;const c=BatT.eroe(s),chi=BatT.chiA(s,cella,p);
  if(BatT.mira)return BatT.miraTocco(s,c,cella,chi);
  if(!cella&&!chi)return;
  if(chi&&chi.lato==='eroi'){if(chi.hp>0){if(chi.id!==BatT.sel){BatT.sel=chi.id;Snd.play('sel');render()}return}
   if(c&&ATEM.inPiedi(c))BatT.ordina({chi:c.id,t:'rialza',bers:chi.id},chi);return}
  if(!c||!ATEM.inPiedi(c))return BatT.avviso('Scegli un eroe in piedi');
  if(chi&&chi.lato==='nemici'&&chi.hp>0)return BatT.ordina({chi:c.id,t:'attacca',bers:chi.id},chi);
  if(cella&&AGRI.passabile(s.arena,cella))BatT.ordina({chi:c.id,t:'vai',a:{q:cella.q,r:cella.r}},cella)},
 // mirare con un'abilità: un bersaglio (un tocco) o un'area (primo tocco = anteprima, secondo nello stesso punto = lancia)
 miraTocco(s,c,cella,chi){const M=BatT.mira;if(!c||!ATEM.inPiedi(c)){BatT.mira=null;return render()}
  const o={chi:c.id,t:M.t,id:M.id};
  if(M.p.area==='singolo'){if(!chi)return BatT.avviso('Tocca un bersaglio');o.bers=chi.id;if(BatT.ordina(o,chi)){BatT.mira=null;render()}return}
  if(!cella)return;const k=cella.q+','+cella.r;
  if(M.k===k||(M.zona&&M.zona.some(x=>x.q===cella.q&&x.r===cella.r)&&M.k)){o.cella={q:M.c.q,r:M.c.r};if(BatT.ordina(o,M.c)){BatT.mira=null;render()}return}
  const z=ATEM.zona(s,c,M.p,{cella:{q:cella.q,r:cella.r}});if(!z||!z.length)return BatT.avviso('Lì non si può');M.k=k;M.c={q:cella.q,r:cella.r};M.zona=z.map(x=>({q:x.q,r:x.r}));render()},
 // un tasto della barra: le abilità senza bersaglio partono subito, le altre chiedono dove
 usa(k,id){const s=Bat.s,c=BatT.eroe(s);if(!s||s.over||!c)return;if(!ATEM.inPiedi(c))return BatT.avviso(c.nome+' è a terra');
  if(BatT.mira&&BatT.mira.id===id){BatT.mira=null;return render()}
  if(k==='conc')return BatT.ordina({chi:c.id,t:'conc'});
  const p=k==='oggetto'?APOT.oggetto(id):APOT.P[id];if(!p)return;
  if(p.area==='se'||p.area==='aura'){BatT.mira=null;BatT.ordina({chi:c.id,t:k,id},c);return render()}
  BatT.mira={t:k,id,p,k:null,c:null,zona:null};BatT.foglio=null;render()},
 // ---- comandi (data-a="btt") ----
 act(v){const s=Bat.s;if(!s)return;const i=String(v).indexOf(':'),k=i<0?String(v):String(v).slice(0,i),x=i<0?'':String(v).slice(i+1);
  switch(k){
   case'pausa':if(s.over)return;BatT.pausa=!BatT.pausa;BatT.motivo='';if(BatT.pausa)Bat.salva();Snd.play('sel');return render();
   case'vel':Bat.cfg.vel=Bat.cfg.vel===2?1:2;Bat.salvaCfg();return render();
   case'sel':{const c=ATEM.trova(s,x);if(!c||c.lato!=='eroi')return;if(c.hp>0&&ATEM.inCampo(c)){BatT.sel=c.id;BatT.mira=null}else if(c.hp<=0&&ATEM.inCampo(c)){const e=BatT.eroe(s);if(e&&ATEM.inPiedi(e))BatT.ordina({chi:e.id,t:'rialza',bers:c.id},c)}return render()}
   case'ab':{const j=x.indexOf(':');return BatT.usa(j<0?x:x.slice(0,j),j<0?'':x.slice(j+1))}
   case'nomira':BatT.mira=null;return render();
   case'ferma':{const c=BatT.eroe(s);if(c)BatT.ordina({chi:c.id,t:'ferma'});return render()}
   case'foglio':BatT.foglio=BatT.foglio===x?null:x;BatT.mira=null;return render();
   case'chiudi':BatT.foglio=null;return render();
   case'att':{const c=BatT.eroe(s);if(c&&AIAT.ATT[x]){const r=AIAT.imposta(s,c.id,x,{qui:true});if(r&&r.err)BatT.avviso(r.err)}BatT.foglio=null;return render()}
   case'auto':{const c=BatT.eroe(s);if(!c)return;const on=!((((s.ia||{}).auto||{})[c.id]||{})[x]);const r=AIAT.automatico(s,c.id,x,on,{qui:true});if(r&&r.err)BatT.avviso(r.err);return render()}
   case'ap':if(x in BatT.ap){BatT.ap[x]=!BatT.ap[x];BatT.salvaAp()}return render();
   case'esci':BatT.foglio=null;Bat.salva();return Bat.act('batesci')}},
 // ---- disegno dell'intera vista (a ogni render dell'app) ----
 html(){const s=Bat.s,c=BatT.eroe(s),pz=BatT.pausa&&!s.over;
  return`<div class="bt tr-bat${pz?' tr-pz':''}${BatT.mira?' tr-mi':''}" role="dialog" aria-modal="true" aria-label="Battaglia">${BatT.altoH(s)}
<div class="bt-mappa">${BatMappa.svg(s,{ev:BatT.evid(s,c),vista:Bat.v,aspetti:Bat.aspetti,griglia:pz||!!BatT.mira})}<div class="tr-log" data-a="btt" data-v="foglio:log" role="log" aria-label="Registro">${BatT.logH()}</div>
${BatT.bandaH(s)}<div class="bt-toast" role="status"></div></div>${s.over?'':BatT.bassoH(s,c)}${BatT.foglioH(s,c)}${Bat.fineH(s)}</div>`},
 // in alto: i ritratti degli eroi (PF e stati), a destra oro e perdizione della compagnia
 altoH(s){const ok=id=>BatT.sel===id;
  const r=s.cb.filter(c=>c.lato==='eroi').map(c=>{const p=Math.max(0,Math.min(1,c.hp/c.hpMax)),via=!ATEM.inCampo(c)&&!c.morto,st=(c.stati||[]).map(z=>z.id).filter(id=>id!=='terra'&&Sagome.STATO[id]).slice(0,2);
   return`<button class="tr-rit${ok(c.id)?' on':''}${c.hp<=0?' ko':''}${via?' via':''}" data-a="btt" data-v="sel:${esc(c.id)}" aria-pressed="${ok(c.id)}" aria-label="${esc(c.nome)}, ${Math.max(0,c.hp)} su ${c.hpMax} PF${via?', in arrivo':c.hp<=0?', a terra':''}">`
    +`<span class="tr-rf">${Eroi.ritratto(Bat.aspetti[c.id],c.razza,c.classe,40)}</span><span class="tr-pf"><i class="${p>.5?'':p>.25?'m':'b'}" style="width:${(100*p).toFixed(0)}%"></i></span>`
    +(st.length?`<span class="tr-st">${st.map(id=>`<i style="background:${Sagome.STATO[id][1]}"></i>`).join('')}</span>`:'')+`</button>`}).join('');
  const C=Camp.s,ris=`<span class="su-cont" aria-label="Esperienza guadagnata">${ic('scintilla',14)}<b>${BatT.xpShow|0}</b></span>`+(C?`<span class="su-oro">${ic('moneta',14)}<b>${C.oro|0}</b></span><span>${ic('teschio',14)}<b>${C.perdizione|0}</b></span>`:'');
  return`<div class="tr-alto"><div class="tr-ritt" role="group" aria-label="Eroi in campo">${r}</div><div class="tr-ris">${ris}</div></div>`},
 // sul campo: pausa (con il motivo) oppure che cosa toccare per mirare
 bandaH(s){if(s.over)return'';const M=BatT.mira;
  if(M){const t=M.p.area==='singolo'?(['alleato','alleati','amico','amici','terra'].includes(M.p.bers)?'Tocca un alleato':'Tocca un nemico'):M.k?'Tocca di nuovo l\'area per lanciare':'Tocca dove lanciare';
   return`<div class="tr-banda mi"><span><b>${esc(M.p.nome)}</b>${esc(t)}</span><button class="b sm" data-a="btt" data-v="nomira">Annulla</button></div>`}
  if(BatT.pausa)return`<div class="tr-banda"><span><b>In pausa</b>${esc(BatT.motivo||'Dai gli ordini con calma.')}</span></div>`;return''},
 // evidenze sulla mappa: l'eroe scelto, i bersagli validi mentre si mira, l'area in anteprima
 evid(s,c){const ev={celle:[],creature:[]};if(c)ev.creature.push({id:c.id,tipo:'sel'});const M=BatT.mira;if(!M||!c)return ev;
  if(M.p.area==='singolo'){const al=['alleato','alleati','amico','amici','terra'].includes(M.p.bers);
   for(const x of s.cb)if(ATEM.inCampo(x)&&(al?x.lato===c.lato&&(M.p.bers==='terra'?x.hp<=0:M.p.bers.startsWith('amic')||x.hp>0):x.lato!==c.lato&&x.hp>0))ev.creature.push({id:x.id,tipo:al?'valido':'attaccabile'})}
  else if(M.zona)for(const x of M.zona)ev.celle.push({q:x.q,r:x.r,tipo:'area'});
  return ev},
 abilita(c){const L=[];if(!c)return L;
  for(const id of c.poteri||[]){const p=APOT.P[id];if(p&&id!=='attacco'&&p.costo!=='reazione')L.push({k:'potere',id,p,nome:p.nome})}
  const vis=new Set();for(const id of c.cintura||[]){if(vis.has(id))continue;vis.add(id);const p=APOT.oggetto(id);if(p)L.push({k:'oggetto',id,p,nome:p.nome,n:c.cintura.filter(x=>x===id).length})}
  if(c.concMax>0)L.push({k:'conc',id:'conc',nome:'Concentrazione',p:null});return L},
 icona(a){if(a.k==='conc')return'mirino';const p=a.p,E=p.eff||[],ha=k=>E.some(e=>e&&e.k===k);if(a.k==='oggetto')return ha('cura')?'pozione':'fuoco';
  if(ha('cura'))return'cuore';if(E.some(e=>e&&e.k==='stato'&&e.ca)||p.bers==='alleato'||p.bers==='alleati'||p.area==='se')return'scudo';
  if(['cerchio','cono','linea'].includes(p.area))return'fuoco';return p.att==='arma'?'spada':'scintilla'},
 // in basso: chi è scelto, la barra delle abilità (al massimo 5 + «Tutte»), Pausa, velocità, atteggiamento, menu
 bassoH(s,c){if(Bat.vedi)return'';const L=BatT.abilita(c).slice(0,5),A=c?AIAT.atteggiamento(s,c):null,v=Bat.cfg.vel===2?2:1,C=BatT.CIRC.toFixed(1);
  const tasto=a=>{const R=BatT.ric(s,c,a.k,a.id),mi=BatT.mira&&BatT.mira.id===a.id;
   return`<button class="tr-ab${R.ok?'':' off'}${mi?' mi':''}" data-a="btt" data-v="ab:${a.k}:${esc(a.id)}" data-k="${a.k}" data-id="${esc(a.id)}" aria-label="${esc(a.nome)}"><span class="tr-tondo">`
    +`<svg class="tr-ric" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="23"/><circle class="tr-arco" cx="26" cy="26" r="23" stroke-dasharray="${C}" stroke-dashoffset="${(BatT.CIRC*(1-R.fr)).toFixed(1)}"/></svg>`
    +`${ic(BatT.icona(a),22)}${a.n>1?`<i class="tr-n">${a.n}</i>`:a.k==='conc'?`<i class="tr-n">${c.conc}</i>`:''}</span><small>${esc(a.nome)}</small></button>`};
  const tutte=`<button class="tr-ab" data-a="btt" data-v="foglio:abil" aria-label="Tutte le abilità e l'uso automatico"><span class="tr-tondo">${ic('plus',22)}</span><small>Tutte</small></button>`;
  return`<div class="tr-basso"><div class="tr-chi">${c?`<span>${esc(c.nome)} · ${esc((EROI.CLASSI[c.classe]||{}).nome||'')} ${c.liv||''}</span><b>${Math.max(0,c.hp)}/${c.hpMax} PF</b>`:'<span>Nessun eroe in piedi</span>'}</div>
<div class="tr-abil" role="group" aria-label="Abilità">${c?L.map(tasto).join('')+tutte:''}</div>
<div class="tr-cmd"><button class="b gold tr-p" data-a="btt" data-v="pausa" aria-pressed="${BatT.pausa}">${ic(BatT.pausa?'play':'pausa',18)} ${BatT.pausa?'Riprendi':'Pausa'}</button>
<button class="b tr-v" data-a="btt" data-v="vel" aria-label="Velocità ${v}×, tocca per ${v===2?'1×':'2×'}">${v}×</button>
${c?`<button class="b tr-a" data-a="btt" data-v="foglio:att" aria-label="Atteggiamento: ${esc(AIAT.ATT[A].nome)}">${esc(AIAT.ATT[A].nome)}</button>`:''}
<button class="ib" data-a="btt" data-v="foglio:menu" aria-label="Menu della battaglia">${ic('menu',20)}</button></div></div>`},
 // fogli dal basso (mentre sono aperti la battaglia è ferma): abilità con «Uso automatico», atteggiamento, registro, menu
 foglioH(s,c){const f=BatT.foglio;if(!f||s.over)return'';let titolo='',corpo='';
  const riga=(v,nome,tag,desc,on)=>`<button class="bt-riga${on?' tr-on':''}" data-a="btt" data-v="${v}"${on!=null?` aria-pressed="${!!on}"`:''}><b>${esc(nome)}</b>${tag?`<em>${esc(tag)}</em>`:''}<small>${esc(desc||'')}</small></button>`;
  if(f==='abil'&&c){titolo='Abilità di '+c.nome;const au=((s.ia||{}).auto||{})[c.id]||{};
   corpo=BatT.abilita(c).map(a=>{const p=a.p,T=p&&a.k==='potere'?APOT.tempi(p):null,sec=n=>(n/ATEM.IST).toLocaleString('it-IT',{maximumFractionDigits:1})+' s';
    const tag=a.k==='conc'?`${c.conc}/${c.concMax}`:a.k==='oggetto'?'×'+a.n:T?(T.lancio?'lancio '+sec(T.lancio)+' · ':'')+'ricarica '+sec(T.ricarica):'';
    const desc=a.k==='conc'?'Vantaggio sui tiri per 6 secondi.':a.k==='oggetto'?Bat.descOgg(p):p.desc;
    const libero=a.k==='potere'&&p.ric==='turno',auto=a.k!=='oggetto'&&!libero;
    return`<div class="tr-riga">${riga('ab:'+a.k+':'+a.id,a.nome,tag,desc)}${auto?`<button class="b sm tr-auto${au[a.id]?' gold':''}" data-a="btt" data-v="auto:${esc(a.id)}" aria-pressed="${!!au[a.id]}">${au[a.id]?'Auto sì':'Auto no'}</button>`:libero?'<span class="tr-lib">sempre</span>':''}</div>`}).join('')
    +`<p class="muted tr-nota">«Auto» = l'eroe usa da solo quel potere quando serve. I poteri «sempre» li usa comunque.</p>`}
  else if(f==='att'&&c){titolo='Atteggiamento di '+c.nome;const A=AIAT.atteggiamento(s,c);corpo=AIAT.ATT_ID.map(k=>riga('att:'+k,AIAT.ATT[k].nome,k===A?'scelto':'',AIAT.ATT[k].desc,k===A)).join('')}
  else if(f==='log'){titolo='Registro';corpo=`<div class="bt-log aperto tr-reg">${Bat.log.slice(-60).map(r=>`<p class="${r.lato?'l-'+r.lato:''} ${r.peso}">${esc(r.testo)}</p>`).join('')}</div>`}
  else if(f==='menu'){titolo='Battaglia';
   corpo=`<div class="tr-ap"><b>Pausa automatica</b>${BatT.AP_NOMI.map(([k,t])=>`<button class="chip${BatT.ap[k]?' on':''}" data-a="btt" data-v="ap:${k}" aria-pressed="${!!BatT.ap[k]}">${esc(t)}</button>`).join('')}</div>
<div class="bt-menu"><button class="b" data-a="btt" data-v="foglio:log">Registro completo</button><button class="b" data-a="btt" data-v="esci">Esci e riprendi dopo</button><button class="b gold" data-a="btt" data-v="chiudi">Torna alla battaglia</button></div>`}
  else return'';
  return`<div class="bt-vela" data-a="btt" data-v="chiudi"></div><div class="bt-foglio" role="dialog" aria-label="${esc(titolo)}"><div class="bt-fh"><b>${esc(titolo)}</b><button class="ib" data-a="btt" data-v="chiudi" aria-label="Chiudi">${ic('x',16)}</button></div><div class="bt-fl">${corpo}</div></div>`},
 // dopo ogni render: i segnalini nuovi, l'HUD e il ciclo
 dopo(){const s=Bat.s;if(BatT.sDi!==s)BatT.prepara(false);BatT.els=new Map([...document.querySelectorAll('.tr-bat .bt-tok')].map(e=>[e.dataset.id,e]));BatT.zSig='';
  BatT.hud(s);BatT.disegna(BatT.ferma()?1:BatT.acc/100);BatT.avvia()}
};
BatT.carica();
