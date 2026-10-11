const ISLE=(()=>{
let RND=Math.random;const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(RND()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const clone=o=>JSON.parse(JSON.stringify(o));
const NAMES=['Pianta','Formica','Ragno','Topo','Lucertola','Ratto','Pipistrello','Serpente','Procione','Volpe','Lince','Lupo','Tigre','Alligatore','Leone','Orso polare'];
const POW=['Nessun potere.','Sposta un animale di 1–3 caselle.','Sposta due animali di 1 casella ciascuno.','Sposta un animale di 1–2 caselle.','Elimina un animale non impilato a tua scelta.','Sposta un animale di 2 caselle.','Dopo aver mangiato, spostalo in una qualsiasi altra casella vuota.','Scambia la posizione di due carte.','Al prossimo turno, se mangi un animale di valore esattamente 1 in meno, elimina un animale non impilato a tua scelta.','Al prossimo turno l’animale deve muoversi in diagonale di 1 casella per mangiare.','Al prossimo turno l’animale deve saltare 1 carta in direzione ortogonale per mangiare.','Dopo che il lupo ha mangiato, si sposta di 1 casella.','Al prossimo turno l’animale deve muoversi di due caselle per mangiare.','L’animale mangiato finisce sotto il coccodrillo, nella casella del predatore.','Al prossimo turno l’animale deve mangiare un animale di valore esattamente 1 in meno.','Al prossimo turno non puoi usare l’Orso polare per mangiare.'];
const LO=-1,HI=4;const inA=(x,y)=>x>=LO&&x<=HI&&y>=LO&&y<=HI;const K=(x,y)=>x+','+y,XY=k=>k.split(',').map(Number);
const top=st=>st[st.length-1];const L=(s,t)=>{s.log.push(t);if(s.log.length>60)s.log.shift()};const E=(s,o)=>s.ev.push(o);
const dist=(a,b)=>Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1]);
function eatOpts(s,shark){const out=[],mods=s.mods||[],has=k=>mods.some(m=>m.k===k);
 for(const k in s.cells){const[x,y]=XY(k),v=top(s.cells[k]);if(!shark&&has('polar')&&v===15)continue;
  let tg;if(shark)tg=[[1,0],[-1,0],[0,1],[0,-1]];else if(has('fox'))tg=[[1,1],[1,-1],[-1,1],[-1,-1]];else if(has('lynx'))tg=[[2,0],[-2,0],[0,2],[0,-2]];else if(has('tiger'))tg=[[2,0],[-2,0],[0,2],[0,-2],[1,1],[1,-1],[-1,1],[-1,-1]];else tg=[[1,0],[-1,0],[0,1],[0,-1]];
  for(const[dx,dy]of tg){const tk=K(x+dx,y+dy),t=s.cells[tk];if(!t)continue;if(!shark&&has('lynx')&&!s.cells[K(x+dx/2,y+dy/2)])continue;const u=top(t),d=v-u;
   if(shark?d>0:(has('lion')?d===1:d>=1&&d<=3))out.push({t:'eat',from:[x,y],to:[x+dx,y+dy],shark:!!shark})}}return out}
function empties(){const a=[];for(let x=LO;x<=HI;x++)for(let y=LO;y<=HI;y++)a.push([x,y]);return a}
function mvOpts(s,it,onlyFrom){const out=[];const froms=Object.keys(s.cells).map(XY).filter(p=>{const v=top(s.cells[K(...p)]);return(it.self==null||v===it.self)&&!(it.done||[]).includes(v)&&(!onlyFrom||(p[0]===onlyFrom[0]&&p[1]===onlyFrom[1]))});
 for(const f of froms)for(const e of empties()){if(s.cells[K(...e)])continue;const d=dist(f,e);if(d<1)continue;if(it.ds&&!it.ds.includes(d))continue;out.push({t:'mv',from:f,to:e})}return out}
function pendOpts(s,it){if(it.k==='mv')return mvOpts(s,it);if(it.k==='rm')return Object.keys(s.cells).filter(k=>s.cells[k].length===1).map(k=>({t:'rm',at:XY(k)}));
 if(it.k==='sw'){const ks=Object.keys(s.cells).map(XY);const o=[];for(let i=0;i<ks.length;i++)for(let j=i+1;j<ks.length;j++)o.push({t:'sw',a:ks[i],b:ks[j]});return o}return[]}
function settle(s){while(s.pend.length&&!pendOpts(s,s.pend[0]).length)s.pend.shift();if(!s.pend.length)check(s)}
function whaleOpts(s){const o=[];for(const k in s.cells)for(const e of empties())if(!s.cells[K(...e)])o.push({t:'whale',from:XY(k),to:e});return o}
function canContinue(s){if(eatOpts(s,false).length)return true;if(s.water.includes('shark')&&eatOpts(s,true).length)return true;
 if(s.water.includes('whale')){for(const w of whaleOpts(s)){const c=clone(s);const st=c.cells[K(...w.from)];delete c.cells[K(...w.from)];c.cells[K(...w.to)]=st;if(eatOpts(c,false).length||(c.water.includes('shark')&&eatOpts(c,true).length))return true}}return false}
function check(s){if(s.over)return;if(Object.keys(s.cells).length>1&&canContinue(s))return;finish(s)}
function finish(s){const left=Object.keys(s.cells).length;const txt=left===1?'Grande vittoria!':left===2?'Bella vittoria!':left===3?'Vittoria di misura':'Hai perso';
 s.over={win:left<=3,left,txt,scores:[left],winners:left<=3?[0]:[]};s.phase='summary';E(s,{t:left<=3?'win':'lose'});L(s,txt+' ('+left+' animali rimasti)')}
const ISLE={id:'island',name:'L’isola dei predatori',ok:n=>n===1,NAMES,POW,LO,HI,eatOpts,pendOpts,whaleOpts,
 newGame(n,names,opts={}){const s={g:'island',n:1,names:[names[0]||'Tu'],cells:{},water:['shark','whale'],mods:[],pend:[],log:[],ev:[],evn:0,over:null,teams:1,hands:[[]],cur:0,turn:1,phase:'play'};
  const v=shuffle([...Array(16).keys()]);v.forEach((c,i)=>{s.cells[K(i%4,Math.floor(i/4))]=[c]});
  const w=String(opts.water==null?'2':opts.water);if(w==='0')s.water=[];else if(w==='1')s.water=[shuffle(['shark','whale'])[0]];
  L(s,'Mangia in ordine di catena alimentare: ne deve restare uno solo');check(s);return s},
 options(s){if(s.over)return[];if(s.pend.length)return pendOpts(s,s.pend[0]);const o=eatOpts(s,false);if(s.water.includes('shark'))o.push(...eatOpts(s,true));if(s.water.includes('whale'))o.push(...whaleOpts(s));return o},
 act(st,a){if(st.over)return{err:'Partita finita'};const s=clone(st);s.ev=[];const ok=()=>{s.evn=(s.evn||0)+1;return{s}};
  if(a.t==='end'){finish(s);return ok()}
  if(s.pend.length){const it=s.pend[0];const legal=pendOpts(s,it);
   const same=(p,q)=>p&&q&&p[0]===q[0]&&p[1]===q[1];
   if(it.k==='mv'){if(a.t!=='mv')return{err:'Devi spostare un animale (potere della carta)'};const m=legal.find(o=>same(o.from,a.from)&&same(o.to,a.to));if(!m)return{err:'Spostamento non valido: serve una casella vuota alla distanza giusta'};
    const fk=K(...a.from),stk=s.cells[fk];delete s.cells[fk];s.cells[K(...a.to)]=stk;(it.done=it.done||[]).push(top(stk));E(s,{t:'move',from:a.from,to:a.to});L(s,NAMES[top(stk)]+' si sposta');it.left--;if(it.left<=0)s.pend.shift();settle(s);return ok()}
   if(it.k==='rm'){if(a.t!=='rm')return{err:'Devi eliminare un animale non impilato'};if(!legal.find(o=>same(o.at,a.at)))return{err:'Scegli un animale non impilato'};const k=K(...a.at),id=top(s.cells[k]);delete s.cells[k];E(s,{t:'rm',at:a.at,id});L(s,NAMES[id]+' viene eliminato');s.pend.shift();settle(s);return ok()}
   if(it.k==='sw'){if(a.t!=='sw'||same(a.a,a.b))return{err:'Scegli due carte diverse da scambiare'};const ka=K(...a.a),kb=K(...a.b);if(!s.cells[ka]||!s.cells[kb])return{err:'Scegli due carte'};const t=s.cells[ka];s.cells[ka]=s.cells[kb];s.cells[kb]=t;E(s,{t:'swap',a:a.a,b:a.b});L(s,'Due carte si scambiano di posto');s.pend.shift();settle(s);return ok()}}
  if(a.t==='whale'){if(!s.water.includes('whale'))return{err:'Non hai la balena'};const fk=K(...a.from);if(!s.cells[fk]||s.cells[K(...a.to)]||!inA(...a.to))return{err:'La balena sposta un animale in una casella vuota'};s.cells[K(...a.to)]=s.cells[fk];delete s.cells[fk];s.water=s.water.filter(w=>w!=='whale');E(s,{t:'whale',from:a.from,to:a.to});L(s,'La balena sposta '+NAMES[top(s.cells[K(...a.to)])]);check(s);return ok()}
  if(a.t!=='eat')return{err:'Mossa non valida'};
  const shark=!!a.shark;if(shark&&!s.water.includes('shark'))return{err:'Non hai lo squalo'};
  const m=eatOpts(s,shark).find(o=>o.from[0]===a.from[0]&&o.from[1]===a.from[1]&&o.to[0]===a.to[0]&&o.to[1]===a.to[1]);
  if(!m){const mods=(s.mods||[]).map(x=>x.k);return{err:shark?'Lo squalo sposta di 1 casella su un animale di valore minore':mods.length?'Con il potere attivo questa mossa non vale: '+({fox:'diagonale di 1 casella',lynx:'salto sopra 1 carta in linea retta',tiger:'due caselle',lion:'solo valore esattamente 1 in meno',polar:'l’Orso polare non può mangiare'}[mods[0]]):'Puoi mangiare un animale 1–3 valori sotto, in una casella adiacente (su, giù, sinistra, destra)'}}
  const fk=K(...a.from),tk=K(...a.to),mover=s.cells[fk],prey=s.cells[tk],v=top(mover),u=top(prey);
  if(shark)s.water=s.water.filter(w=>w!=='shark');
  const old=s.mods||[];s.mods=[];const pend=[];
  if(old.some(x=>x.k==='raccoon')&&v-u===1)pend.push({k:'rm'});
  let at;if(v===13){s.cells[fk]=[...prey,...mover];delete s.cells[tk];at=a.from}else{s.cells[tk]=[...prey,...mover];delete s.cells[fk];at=a.to}
  E(s,{t:'eat',from:a.from,to:a.to,v,u,shark,at});L(s,NAMES[v]+' mangia '+(u===13||u===4||u===1||u===3?'':'')+NAMES[u]+(shark?' (squalo)':''));
  switch(v){case 1:pend.push({k:'mv',ds:[1,2,3],left:1});break;case 2:pend.push({k:'mv',ds:[1],left:2,done:[]});break;case 3:pend.push({k:'mv',ds:[1,2],left:1});break;case 4:pend.push({k:'rm'});break;case 5:pend.push({k:'mv',ds:[2],left:1});break;
   case 6:pend.push({k:'mv',ds:null,self:6,left:1});break;case 7:pend.push({k:'sw'});break;case 8:s.mods.push({k:'raccoon'});break;case 9:s.mods.push({k:'fox'});break;case 10:s.mods.push({k:'lynx'});break;
   case 11:pend.push({k:'mv',ds:[1],self:11,left:1});break;case 12:s.mods.push({k:'tiger'});break;case 14:s.mods.push({k:'lion'});break;case 15:s.mods.push({k:'polar'});break}
  s.pend=pend;s.turn++;settle(s);return ok()},
 setRnd:f=>{RND=f}};
return ISLE})();


/* MACHIAVELLI (2-5). 2 mazzi francesi + 4 jolly (108 carte), 13 carte a testa.
   Id carta: 'AH.0' (rango, seme, mazzo) o 'X.0'..'X.3' per i jolly. Il tavolo è una lista di combinazioni (liste di id). */
