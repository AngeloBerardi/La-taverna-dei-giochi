/* UNO (regole del classico gioco di scarto a colori; grafica e testi nostri). 2-10 giocatori (oltre 6 due mazzi).
   Carte: stringhe "colore+valore": R/Y/G/B + 0-9, S (Salta), V (Inverti), D (+2); jolly W+W (Cambia colore) e W+F (+4).
   Opzione edi: 'classic' (il +4 si può sfidare, niente accumulo) · 'stack' (+2 su +2 e +4 su +4 si accumulano, il +4 non si sfida).
   Dimenticare di dire UNO (ultima carta senza averlo annunciato) costa 2 carte. Si gioca una mano: vince chi finisce le carte.
   Fasi: play (cur agisce) · pass (ha pescato: può giocare quella carta o passare) · challenge (cur può sfidare o accettare il +4).
   Azioni: play{c,color?,uno?} draw pass challenge accept. */
const UNO=(()=>{
let RND=Math.random;const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(RND()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const clone=s=>JSON.parse(JSON.stringify(s));
const COLORS=['R','Y','G','B'],CN={R:'Rosso',Y:'Giallo',G:'Verde',B:'Blu'};
const col=c=>c[0],val=c=>c[1];
const pts=c=>col(c)==='W'?50:'SVD'.includes(val(c))?20:+val(c);
const L=(s,t)=>{s.log.push(t);if(s.log.length>40)s.log.shift()};
const nm=(s,i)=>s.names[i];
function mkDeck(n){const d=[];for(let k=0;k<(n>6?2:1);k++){for(const c of COLORS){d.push(c+'0');for(let v=1;v<=9;v++)d.push(c+v,c+v);for(const x of 'SVD')d.push(c+x,c+x)}for(let i=0;i<4;i++)d.push('WW','WF')}return shuffle(d)}
function newGame(n,names,o={}){const deck=mkDeck(n),hands=Array.from({length:n},()=>[]);
 for(let k=0;k<7;k++)for(let i=0;i<n;i++)hands[i].push(deck.shift());
 let top;do{top=deck.shift();if(col(top)==='W'||'SVD'.includes(val(top))){deck.push(top);shuffle(deck);top=null}}while(!top);
 const s={n,edi:o.edi==='stack'?'stack':'classic',names:names.slice(0,n),hands,deck,discard:[top],color:col(top),dir:1,cur:Math.floor(RND()*n),phase:'play',pend:0,pendK:null,drawn:null,w4:null,log:[],ev:[],evn:0,over:null};
 L(s,'Sette carte a testa. In tavola: '+CN[s.color]+' '+val(top));return s}
const nextP=(s,i,k=1)=>(((i+s.dir*k)%s.n)+s.n)%s.n;
function refill(s){if(s.deck.length)return;const top=s.discard.pop();s.deck=shuffle(s.discard.map(c=>c));s.discard=[top];s.ev.push({t:'reshuffle'});L(s,'Mazzo finito: si rimescolano gli scarti')}
function draw(s,p,n){const got=[];for(let i=0;i<n;i++){refill(s);if(!s.deck.length)break;const c=s.deck.shift();s.hands[p].push(c);got.push(c)}s.ev.push({t:'draw',p,n:got.length});return got}
const playable=(s,c)=>{const top=s.discard[s.discard.length-1];if(s.pend){return s.edi==='stack'&&((s.pendK==='D'&&c===col(top)+'D')||(s.pendK==='D'&&val(c)==='D')||(s.pendK==='F'&&c==='WF'))}
 return col(c)==='W'||col(c)===s.color||val(c)===val(top)&&col(top)!=='W'}
const canPlay=(s,p)=>s.hands[p].filter(c=>playable(s,c));
function advance(s,skip){s.cur=nextP(s,s.cur,1+(skip||0));s.phase='play';s.drawn=null;s.ev.push({t:'turn',p:s.cur})}
function finish(s,p){const sc=s.hands.map((h,i)=>i===p?0:h.reduce((a,c)=>a+pts(c),0)),total=sc.reduce((a,b)=>a+b,0);sc[p]=total;
 s.over={win:p,scores:sc,reason:'Prima a restare senza carte'};s.ev.push({t:'end',win:p});L(s,nm(s,p)+' resta senza carte e vince!')}
/* gioca la carta c dalla mano di p, con effetti */
function doPlay(s,p,c,color,uno){const h=s.hands[p],i=h.indexOf(c);h.splice(i,1);const prevColor=s.color,hadColor=h.some(x=>col(x)===prevColor&&col(x)!=='W');
 s.discard.push(c);s.drawn=null;s.ev.push({t:'play',p,c});
 s.color=col(c)==='W'?color:col(c);L(s,nm(s,p)+' gioca '+(col(c)==='W'?(val(c)==='F'?'+4':'Cambia colore')+' → '+CN[color]:CN[col(c)]+' '+val(c)));
 if(h.length===0){finish(s,p);return}
 if(h.length===1&&!uno){draw(s,p,2);L(s,nm(s,p)+' ha dimenticato di dire UNO: pesca 2 carte')}else if(h.length===1){s.ev.push({t:'uno',p});L(s,nm(s,p)+' dice UNO!')}
 const v=val(c);
 if(v==='V'){if(s.n===2){advance(s,1);return}s.dir=-s.dir;s.ev.push({t:'reverse'});advance(s);return}
 if(v==='S'){s.ev.push({t:'skip',p:nextP(s,p)});advance(s,1);return}
 if(v==='D'){if(s.edi==='stack'){s.pend+=2;s.pendK='D';advance(s);return}const q=nextP(s,p);draw(s,q,2);L(s,nm(s,q)+' pesca 2 carte e salta il turno');s.ev.push({t:'skip',p:q});advance(s,1);return}
 if(v==='F'){if(s.edi==='stack'){s.pend+=4;s.pendK='F';advance(s);return}s.w4={by:p,hadColor};s.cur=nextP(s,p);s.phase='challenge';s.ev.push({t:'turn',p:s.cur});return}
 advance(s)}
const fail=e=>({err:e});
function act(st,a){const s=clone(st);if(s.over)return fail('Partita finita');s.ev=[];const p=s.cur;
 if(s.phase==='challenge'){const w=s.w4;
  if(a.t==='accept'){draw(s,p,4);L(s,nm(s,p)+' pesca 4 carte e salta il turno');s.w4=null;s.ev.push({t:'skip',p});advance(s);s.evn++;return{s}}
  if(a.t==='challenge'){s.ev.push({t:'challenge',p,q:w.by});if(w.hadColor){draw(s,w.by,4);L(s,'Sfida vinta! '+nm(s,w.by)+' aveva il colore e pesca 4 carte');s.w4=null;s.phase='play';s.ev.push({t:'turn',p})}
   else{draw(s,p,6);L(s,'Sfida persa: '+nm(s,p)+' pesca 6 carte e salta il turno');s.w4=null;s.ev.push({t:'skip',p});advance(s)}s.evn++;return{s}}
  return fail('Sfida il +4 o accettalo')}
 if(a.t==='draw'){if(s.phase!=='play')return fail('Hai già pescato');
  if(s.pend){draw(s,p,s.pend);L(s,nm(s,p)+' pesca '+s.pend+' carte');s.ev.push({t:'skip',p});s.pend=0;s.pendK=null;advance(s);s.evn++;return{s}}
  const g=draw(s,p,1);if(!g.length){advance(s);s.evn++;return{s}}
  L(s,nm(s,p)+' pesca una carta');if(playable(s,g[0])){s.phase='pass';s.drawn=g[0]}else advance(s);s.evn++;return{s}}
 if(a.t==='pass'){if(s.phase!=='pass')return fail('Prima pesca');L(s,nm(s,p)+' passa');advance(s);s.evn++;return{s}}
 if(a.t==='play'){const c=a.c;if(!s.hands[p].includes(c))return fail('Non hai quella carta');
  if(s.phase==='pass'&&c!==s.drawn)return fail('Puoi giocare solo la carta pescata');
  if(!playable(s,c))return fail(s.pend?'Devi rispondere con un '+(s.pendK==='D'?'+2':'+4')+' o pescare':'Carta non giocabile: serve '+CN[s.color]+' o lo stesso valore');
  if(col(c)==='W'){if(!COLORS.includes(a.color))return fail('Scegli un colore')}
  doPlay(s,p,c,a.color,!!a.uno);s.evn++;return{s}}
 return fail('Azione non valida adesso')}
return{newGame,act,setRnd:f=>{RND=f},COLORS,CN,col,val,pts,playable,canPlay}})();
if(typeof module!=='undefined')module.exports=UNO;
