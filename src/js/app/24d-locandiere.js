/* ---- Il locandiere: finestra di dialogo (cervello a copioni: motori/24-locandiere.js; con Claude via funzione Netlify se attiva) ---- */
const Oste={
 log:[],ai:null,busy:false,q:'',
 ctx(){const n=Math.max(1,lobbySeats().length),on=FB.st==='ok'&&FB.p,p=on?FB.p:{};
  return{nome:ME.name,n,ora:new Date().getHours(),giorno:Math.floor(Date.now()/864e5),monete:on?p.coins:null,partite:p.played||0,vittorie:p.wins||0,mail:!!(on&&FB.mail()),
   giochi:GAMES.map(g=>({id:g.id,name:g.name,desc:g.desc,range:g.range,ok:g.ok(n),coop:!ELO.competitivo(g.id)}))}},
 cfgH(){return'<button class="b sm" data-a="oste">Locandiere 🍺</button>'},
 html(){const c=Oste.ctx();
  return`<div class="modal"><div class="box col oste"><h2>Il locandiere</h2>
<div class="olog" id="oste-log" aria-live="polite">${Oste.log.map(m=>`<div class="om ${m.da}">${esc(m.t)}</div>`).join('')}${Oste.busy?'<div class="om oste">…</div>':''}</div>
<div class="chips">${LOC.rapide(c).map(q=>`<button class="chip" data-a="osteq" data-v="${esc(q)}">${esc(q)}</button>`).join('')}</div>
<div class="row"><input class="acc-in" id="oste-q" type="text" maxlength="200" placeholder="Chiedi al locandiere" autocomplete="off" value="${esc(Oste.q)}" style="flex:1"><button class="b sm gold" data-a="osteok" ${Oste.busy?'disabled':''}>Invia</button></div>
<button class="b sm" data-a="ostex">Chiudi</button></div></div>`},
 async remota(domanda,c){if(Oste.ai===false)return null;
  try{const ac=new AbortController(),to=setTimeout(()=>ac.abort(),9000);
   const r=await fetch('/.netlify/functions/locandiere',{method:'POST',headers:{'content-type':'application/json'},signal:ac.signal,
    body:JSON.stringify({domanda,contesto:{n:c.n,nome:c.nome,giochi:c.giochi.map(g=>g.name)}})});clearTimeout(to);
   if([404,405,501,503].includes(r.status)){Oste.ai=false;return null}
   if(!r.ok)return null;const j=await r.json();Oste.ai=true;return typeof j.testo==='string'&&j.testo?j.testo:null}
  catch(e){return null}},
 async chiedi(testo){testo=String(testo||'').trim().slice(0,200);if(!testo||Oste.busy)return;
  Oste.log.push({da:'tu',t:testo});Oste.q='';Oste.busy=true;render();Oste.giu();
  const c=Oste.ctx();let r=null;try{r=await Oste.remota(testo,c)}catch(e){}
  Oste.log.push({da:'oste',t:r||LOC.risposta(testo,c)});Oste.log=Oste.log.slice(-30);Oste.busy=false;render();Oste.giu()},
 giu(){setTimeout(()=>{const l=document.getElementById('oste-log');if(l)l.scrollTop=l.scrollHeight},30)},
 act(a,v){
  if(a==='oste'){ui.oste=true;ui.cfg=false;if(!Oste.log.length)Oste.log.push({da:'oste',t:LOC.saluto(Oste.ctx())});render();return Oste.giu()}
  if(a==='ostex'){ui.oste=false;ui.cfg=true;return render()}
  if(a==='osteq')return Oste.chiedi(v);
  if(a==='osteok')return Oste.chiedi(Oste.q)}};
document.addEventListener('input',e=>{if(e.target.id==='oste-q')Oste.q=e.target.value});
document.addEventListener('keydown',e=>{if(e.target.id==='oste-q'&&e.key==='Enter'){e.preventDefault();Oste.chiedi(Oste.q)}});
