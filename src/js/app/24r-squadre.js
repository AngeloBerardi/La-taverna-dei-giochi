/* ---- Preparazione della partita: squadre, spie, fantasma. Si apre prima di proporre/avviare i giochi con `prep` ---- */
const Prep=(()=>{
const TN=['Rossi','Blu'],SQ=['Zucche','Streghe','Gufi','Gatti','Draghi','Volpi'];
const rnd=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
function open(id){const S=lobbySeats(),n=S.length;
 const p={g:id,S,n};
 if(id==='spie'){p.teams=SPIE.defTeams(n);p.spies=[0,1]}
 else if(id==='zucca'){p.k=n;p.sq=Array.from({length:n},(_,i)=>i)}
 else if(id==='fantasma'){p.ghost=0}
 ui.prep=p;render()}
function mescola(){const p=ui.prep;
 if(p.g==='spie'){const idx=rnd([...p.S.keys()]);p.teams=Array(p.n).fill(0);idx.slice(Math.ceil(p.n/2)).forEach(i=>{p.teams[i]=1});fixSpies(p,true)}
 else if(p.g==='zucca'){const idx=rnd([...p.S.keys()]);idx.forEach((s,j)=>{p.sq[s]=j%p.k})}
 else if(p.g==='fantasma')p.ghost=Math.floor(Math.random()*p.n);
 render()}
function fixSpies(p,force){[0,1].forEach(t=>{if(force||p.teams[p.spies[t]]!==t)p.spies[t]=p.teams.indexOf(t)})}
function valid(p){if(p.g==='spie')return[0,1].every(t=>p.teams.filter(x=>x===t).length>=2)?'':'Servono almeno 2 giocatori per squadra';
 if(p.g==='zucca'){const k=Math.max(...p.sq)+1;return k>=2&&Array.from({length:k},(_,j)=>p.sq.includes(j)).every(Boolean)?'':'Servono almeno 2 squadre, nessuna vuota'}return''}
function set(a,v){const p=ui.prep;if(!p)return;const[x,y]=String(v).split('|'),i=+x;
 if(a==='pteam'){p.teams[i]=1-p.teams[i];fixSpies(p)}
 else if(a==='pspy'){if(p.teams[i]!==undefined)p.spies[p.teams[i]]=i}
 else if(a==='psq'){p.sq[i]=(p.sq[i]+1)%p.k;}
 else if(a==='pk'){p.k=Math.max(2,Math.min(6,p.k+(+y)));p.sq=p.sq.map(q=>q%p.k)}
 else if(a==='pghost')p.ghost=i;
 render()}
function preset(v){const p=ui.prep;if(v==='solo')p.sq=Array.from({length:p.n},(_,i)=>i),p.k=Math.min(6,p.n);else if(v==='coppie'){p.k=Math.min(6,Math.ceil(p.n/2));p.sq=Array.from({length:p.n},(_,i)=>Math.floor(i/2)%p.k)}else{p.k=2;p.sq=Array.from({length:p.n},(_,i)=>i%2)}render()}
function risultato(){const p=ui.prep;let seats=p.S,o={};
 if(p.g==='spie')o={teams:p.teams.slice(),spies:p.spies.slice()};
 else if(p.g==='zucca')o={squads:p.sq.slice()};
 else if(p.g==='fantasma')seats=[p.S[p.ghost],...p.S.filter((_,i)=>i!==p.ghost)];
 return{seats,o}}
function conferma(){const p=ui.prep;if(valid(p))return;const{seats,o}=risultato(),g=p.g;ui.prep=null;launch(g,{...defOpts(g),...o},seats)}
function launch(id,o,seats){const g=GAMES.find(x=>x.id===id);
 if(R.on&&members().length>=2&&Voto.proponi('play',id,o,g&&g.mode?g.mode(lobbySeats().length):'',seats))return render();
 return startGame(id,seats,o)}
function annulla(){ui.prep=null;render()}
function html(){const p=ui.prep;if(!p)return'';const err=valid(p),nm=i=>esc(p.S[i].name);let corpo='',titolo='',sotto='';
 if(p.g==='spie'){titolo='Squadre e spie';sotto='Tocca la squadra per cambiarla. La stella è la spia: vede la chiave e dà gli indizi.';
  corpo=[0,1].map(t=>`<div class="pcol"><h3 style="color:${t?'#6fa3f0':'#ef7a70'}">${TN[t]}</h3>${p.S.map((s,i)=>p.teams[i]!==t?'':`<div class="prow"><button class="b sm" data-a="pteam" data-v="${i}">${nm(i)}</button><button class="b sm ${p.spies[t]===i?'gold':''}" data-a="pspy" data-v="${i}" aria-label="Spia" aria-pressed="${p.spies[t]===i}">${ic('star',16)}</button></div>`).join('')}</div>`).join('')}
 else if(p.g==='zucca'){titolo='Squadre';sotto='Tocca un giocatore per passarlo alla squadra successiva. Chi è nella stessa squadra gioca insieme, a turno.';
  corpo=`<div class="row"><button class="b sm" data-a="ppre" data-v="solo">Tutti contro tutti</button><button class="b sm" data-a="ppre" data-v="coppie">A coppie</button><button class="b sm" data-a="ppre" data-v="due">Due squadre</button></div><div class="row"><button class="b sm" data-a="pk" data-v="0|-1" aria-label="Meno squadre">−</button><span>${p.k} squadre</span><button class="b sm" data-a="pk" data-v="0|1" aria-label="Più squadre">+</button></div>`+
   Array.from({length:p.k},(_,q)=>`<div class="pcol"><h3>${SQ[q]}</h3>${p.S.map((s,i)=>p.sq[i]!==q?'':`<div class="prow"><button class="b sm" data-a="psq" data-v="${i}">${nm(i)}</button></div>`).join('')||'<small class="muted">vuota</small>'}</div>`).join('')}
 else{titolo='Chi è il Fantasma?';sotto='Gli altri sono i detective. Il Fantasma si muove in segreto e usa i biglietti neri.';
  corpo=`<div class="pcol">${p.S.map((s,i)=>`<div class="prow"><button class="b sm ${p.ghost===i?'gold':''}" data-a="pghost" data-v="${i}" aria-pressed="${p.ghost===i}">${nm(i)}${p.ghost===i?' · Fantasma':''}</button></div>`).join('')}</div>`}
 return`<div class="modal edfull"><div class="box prep"><header class="edh"><h2>${titolo}</h2><small class="muted">${sotto}</small></header><div class="edbody col">${corpo}${err?`<p class="err">${err}</p>`:''}</div>
<footer class="edf row"><button class="b sm" data-a="pcanc">Annulla</button><button class="b sm" data-a="pmix">${ic('dado',16)} A caso</button><button class="b gold" data-a="pok" ${err?'disabled':''}>${R.on&&members().length>=2?'Proponi':'Gioca'}</button></footer></div></div>`}
return{open,set,preset,mescola,conferma,annulla,html,launch}})();
