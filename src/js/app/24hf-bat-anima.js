/* ---- Animazioni della battaglia (Cantari di Ventura, A5.6): i passi di ACRO.effetti diventano movimento, dado, numeri e scritte sul DOM già disegnato. ----
   Si anima la mappa dello stato PRIMA dell'azione, passo dopo passo; alla fine Bat disegna lo stato nuovo. Niente qui cambia lo stato di gioco.
   Con «riduci animazioni» ogni passo è breve e i segnalini saltano a destinazione; con «Salta» restano solo le righe del registro. */
const BatAnima={
 NS:'http://www.w3.org/2000/svg',_et:{},
 mq(){try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){return false}},
 attesa(ms){return new Promise(ok=>setTimeout(ok,ms))},
 tok(id){return[...document.querySelectorAll('.bt-tok')].find(e=>e.dataset.id===id)||null},
 // un testo dentro lo strato degli effetti della mappa; sparisce da solo dopo `vive` ms
 testo(cls,x,y,t,vive){const g=document.querySelector('.bt-fx');if(!g)return null;const e=document.createElementNS(BatAnima.NS,'text');
  e.setAttribute('class',cls);e.setAttribute('x',x.toFixed(1));e.setAttribute('y',y.toFixed(1));e.setAttribute('text-anchor','middle');e.textContent=t;g.appendChild(e);setTimeout(()=>e.remove(),vive);return e},
 // posizione corrente del segnalino (cambia durante i movimenti)
 pos(el){return[+el.dataset.x,+el.dataset.y]},
 metti(el,x,y,dur){if(!el.style.transform){el.style.transition='none';el.style.transform=`translate(${el.dataset.x}px,${el.dataset.y}px)`;el.getBoundingClientRect()}
  el.style.transition=dur?`transform ${dur}ms linear`:'none';el.style.transform=`translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;el.dataset.x=x.toFixed(1);el.dataset.y=y.toFixed(1)},
 cls(id,c,ms){const el=BatAnima.tok(id);if(!el)return;el.classList.add(c);if(ms>0)setTimeout(()=>el.classList.remove(c),ms)},
 nomeStato(id){return(typeof ASTA!=='undefined'&&ASTA.STATI[id]&&ASTA.STATI[id].nome)||String(id)},
 // ---- i singoli passi ----
 sposta(x,s,f,rid){const el=BatAnima.tok(x.chi);if(!el)return;const A=s.arena,pts=x.passi.map(p=>{const [px,py]=BatMappa.xy(p.q,p.r);return[px,py-(AGRI.alt(A,p)?6:0)]}),u=pts[pts.length-1];
  const segui=()=>{if((Bat.v.k||1)>1.05)Bat.segui(u[0],u[1])};
  if(rid||f<=0){BatAnima.metti(el,u[0],u[1],0);segui();return}
  const dur=ACRO.MS.passo*f;pts.forEach((p,i)=>setTimeout(()=>BatAnima.metti(el,p[0],p[1],dur),i*dur));setTimeout(segui,pts.length*dur)},
 // il dado: tira per un attimo numeri a caso, poi mostra il risultato vero (i numeri a caso sono solo grafica)
 dado(x,s,f,rid){const el=document.querySelector('.bt-dado');if(!el)return;const N=id=>ACRO.nome(s,id),sal=!!x.salvezza,tiri=x.tiri&&x.tiri.length>1?x.tiri:null;
  const esito=sal?(x.ok?'Salvezza superata':'Salvezza fallita'):x.crit?'Critico!':x.ok?'Colpito':'Mancato',
   cosa=sal?`${N(x.bers)}: salvezza su ${(ACRO.AB[x.ab]||x.ab||'').toLowerCase()}`:`${N(x.chi)} attacca ${N(x.bers)}`;
  const quadro=(n,fin)=>{el.className='bt-dado on'+(fin?(x.ok?' ok':' no')+(x.crit?' crit':''):' roll');
   el.innerHTML=`<div class="bt-dd"><span class="bt-dq">${esc(cosa)}</span><i class="bt-d20">${n}</i>`
    +(fin?`<span class="bt-dv">${tiri?`${tiri.join(' · ')} → `:''}${x.tot} contro ${sal?'DC':'CA'} ${x.cont}${x.vant?' · vantaggio':x.svant?' · svantaggio':''}</span><b class="bt-de">${esc(esito)}</b>`:'')+`</div>`};
  const tot=Math.max(300,x.ms*f),vive=Math.max(rid?900:0,tot+420*f);
  if(rid||f<=0.3){quadro(x.tiro,true)}
  else{const t0=performance.now(),giro=()=>{if(performance.now()-t0>tot*.6){quadro(x.tiro,true);return}quadro(1+Math.floor(Math.random()*20),false);setTimeout(giro,70)};giro()}
  clearTimeout(BatAnima._dt);BatAnima._dt=setTimeout(()=>{el.className='bt-dado'},vive)},
 // numero che sale dal segnalino: rosso per i danni, verde per le cure
 num(x){const el=BatAnima.tok(x.chi);if(!el)return;const [px,py]=BatAnima.pos(el),pos=x.v>0,t=(pos?'+':'−')+Math.abs(x.v);
  BatAnima.testo(`bt-num ${pos?'pos':'neg'} t-${x.tipo||'x'}${x.crit?' crit':''}`,px,py-26,t,ACRO.VIVE.numero)},
 etic(id,testo,tono){const el=BatAnima.tok(id);if(!el)return;const [px,py]=BatAnima.pos(el),ora=performance.now(),e=BatAnima._et[id]||{t:0,n:0};
  if(ora-e.t>1100)e.n=0;const k=e.n++;e.t=ora;BatAnima._et[id]=e;BatAnima.testo(`bt-et ${tono||'neutro'}`,px,py-36-k*14,testo,ACRO.VIVE.etichetta)},
 hp(id,d){const el=BatAnima.tok(id);if(!el)return;const mx=+el.dataset.max,hp=Math.max(0,Math.min(mx,+el.dataset.hp+d));el.dataset.hp=hp;
  const b=el.querySelector('.bt-hpf');if(b){const p=hp/mx;b.setAttribute('width',(26*p).toFixed(1));b.setAttribute('fill',p>.5?'#5fbf6a':p>.25?'#e8b43a':'#d9503f')}},
 toast(t,ms){const el=document.querySelector('.bt-toast');if(!el)return;el.textContent=t;el.classList.add('on');clearTimeout(BatAnima._tt);BatAnima._tt=setTimeout(()=>el.classList.remove('on'),ms)},
 passo(x,s,f,rid){
  switch(x.t){
   case'sposta':return BatAnima.sposta(x,s,f,rid);
   case'dado':return BatAnima.dado(x,s,f,rid);
   case'numero':return BatAnima.num(x);
   case'etichetta':return BatAnima.etic(x.chi,x.testo,x.tono);
   case'hp':return BatAnima.hp(x.chi,x.d);
   case'scossa':return rid?0:BatAnima.cls(x.chi,'scossa',320);
   case'stato':return x.ok?BatAnima.etic(x.chi,BatAnima.nomeStato(x.stato),'neutro'):0;
   case'cade':return BatAnima.cls(x.chi,'cade',0);
   case'esce':return BatAnima.cls(x.chi,'esce',0);
   case'turno':return Bat.suTurno(x.chi,s);
   case'giro':return BatAnima.toast('Giro '+x.n,900)}},
 // anima tutti gli eventi di un'azione. `s` = stato dopo l'azione (per i nomi). Il registro si scrive comunque, anche saltando.
 async gira(ev,s,B){const g=B.gen,rid=BatAnima.mq();
  for(const e of ev){
   const r=ACRO.riga(e,s);if(r.testo){B.log.push(r);if(B.log.length>120)B.log.shift();B.logDom()}
   for(const x of ACRO.effetti(e,s)){
    if(B.salta||g!==B.gen)break;
    const f=(rid?.3:1)/(B.cfg.vel||1);BatAnima.passo(x,s,f,rid);if(x.ms>0)await BatAnima.attesa(x.ms*f)}
   if(g!==B.gen)return}}
};
