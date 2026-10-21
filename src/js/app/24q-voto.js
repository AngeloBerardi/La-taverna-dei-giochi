/* ---- Voto di stanza: stessa finestra per proporre un gioco e per interrompere la partita ----
   La proposta vive nel documento del membro (mine.prop = {id,k,g,o,by,t}); ogni dispositivo risponde in mine.pv = {id,a}.
   Le regole (unanimità / maggioranza, scadenza) sono in VOTO (motori/34-voto.js). Decide e agisce il dispositivo che ha proposto. */
const Voto=(()=>{
const seen={},done={};let sig='',el=null,res=null;
const devs=()=>members().map(m=>m.id);
const nomi=()=>{const o={};members().forEach(m=>{o[m.id]=m.name||'?'});return o};
function attiva(){if(!R.on)return null;const now=Date.now();let best=null;members().forEach(m=>{const P=m.prop;if(!P||!P.id||done[P.id])return;
  if(!seen[P.id]){if(now-P.t>90000)return;seen[P.id]=now}
  if(now-seen[P.id]>(VOTO.DUR+4)*1000)return;if(!best||P.t>best.t)best={...P,dev:m.id}});return best}
const ans=P=>{const a={};members().forEach(m=>{if(m.pv&&m.pv.id===P.id)a[m.id]=m.pv.a});return a};
const resto=P=>Math.max(0,VOTO.DUR-(Date.now()-seen[P.id])/1000);
const label=P=>P.k==='stop'?'interrompere la partita di '+GN(P.g):'giocare a '+GN(P.g)+(P.sel?' ('+P.sel+')':'');
function proponi(k,g,o,sel,seats){
 if(!R.on||members().length<2)return false;
 if(attiva()){ui.err='C’è già una proposta in corso';render();return true}
 const id=rid();R.mine.prop={id,k,g,o:o||null,sel:sel||'',t:Date.now(),by:R.mine.name||ME.name};if(seats)R.mine.prop.seats=seats;R.mine.pv={id,a:true};saveMine();return true}
function rispondi(a){const P=attiva();if(!P)return;R.mine.pv={id:P.id,a};saveMine()}
function box(){if(el)return el;el=document.createElement('div');el.id='votoov';el.className='votoov';el.setAttribute('role','alertdialog');el.setAttribute('aria-live','polite');document.body.appendChild(el);return el}
function html(P,e,mio,left){const A=ans(P),N=nomi();
 const righe=devs().map(d=>{const a=A[d];return`<li class="${a===true?'si':a===false?'no':''}"><span>${esc(N[d])}${d===ME.dev?' (tu)':''}</span><b>${a===true?'Sì':a===false?'No':'…'}</b></li>`}).join('');
 const need=P.k==='stop'?'Basta la maggioranza ('+e.need+' su '+devs().length+')':'Servono tutti ('+e.need+')';
 return`<div class="box col"><h2>${P.k==='stop'?'Interrompere?':'Si gioca?'}</h2><p class="vq"><b>${esc(P.by)}</b> propone di ${esc(label(P))}.</p>
 <ul class="vlist">${righe}</ul><div class="vbar"><i style="width:${left/VOTO.DUR*100}%"></i></div><p class="muted vt">${need} · <span id="votot">${Math.ceil(left)}</span>s</p>
 <div class="row"><button class="b play ${mio===true?'on':''}" data-a="vsi">Sì</button><button class="b yld ${mio===false?'on':''}" data-a="vno">No</button></div></div>`}
function chiudi(){if(el)el.classList.remove('on');sig=''}
function tick(){
 const P=attiva();
 if(!P){if(res&&Date.now()-res.t<2600)return;res=null;if(el&&el.classList.contains('on'))chiudi();return}
 if(P.k==='play'&&ui.screen!=='game'&&typeof lob3==='function'&&lob3()&&G3Vote())return;
 const A=ans(P),left=resto(P),e=VOTO.esito(P.k,devs(),A,left),mio=A[ME.dev],s=P.id+JSON.stringify(A)+mio;
 if(e.fine){done[P.id]=1;res={t:Date.now(),ok:e.ok};
  const N=nomi(),chi=VOTO.chi(devs(),A,N);
  box().innerHTML=`<div class="box col"><h2>${e.ok?(P.k==='stop'?'Si interrompe':'Si gioca!'):'Proposta bocciata'}</h2><p class="muted">${e.ok?'':esc(chi.join(', '))+(e.tempo?' non ha risposto in tempo.':' non ci sta.')}</p></div>`;box().classList.add('on');sig='';
  if(P.dev===ME.dev){R.mine.prop=null;R.mine.pv=null;const ag=()=>{if(!e.ok)return;if(P.k==='stop')toLobby();else startGame(P.g,P.seats||undefined,P.o||defOpts(P.g))};
   saveMine().then(()=>setTimeout(ag,500))}
  return}
 if(s!==sig){sig=s;box().innerHTML=html(P,e,mio,left);box().classList.add('on')}
 else{const t=document.getElementById('votot'),b=el.querySelector('.vbar i');if(t){t.textContent=Math.ceil(left);b.style.width=(left/VOTO.DUR*100)+'%'}}}
/* nella Taverna 3D la proposta di gioco ha già la sua finestra: qui si lascia fare a lei */
const G3Vote=()=>!!document.getElementById('vote');
setInterval(()=>{try{tick()}catch(x){}},400);
return{proponi,rispondi,attiva,tick}})();
