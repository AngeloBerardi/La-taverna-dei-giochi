/* UNO (regole del classico gioco di scarto a colori; grafica e testi nostri). 2-10 giocatori (oltre 6 due mazzi).
   Carte: stringhe "colore+valore": R/Y/G/B + 0-9, S (Salta), V (Inverti), D (+2); jolly W+W (Cambia colore) e W+F (+4).
   Modalità (opzione edi): 'classic' (il +4 si può sfidare, niente accumulo) · 'stack' (+2 su +2 e +4 su +4 si accumulano, il +4 non si sfida)
   · 'sette' (classiche + Sette-Zero) · 'caos' (accumulo + Sette-Zero). s.edi resta 'classic'|'stack', s.sw=true se c'è Sette-Zero, s.modo = modalità scelta.
   Sette-Zero: giocare un 7 fa scambiare la propria mano con un giocatore a scelta (fase swap, azione swap{to}; in due è automatico),
   giocare uno 0 fa passare tutte le mani al giocatore successivo nel verso di gioco. 7 e 0 si giocano una carta alla volta.
   UNO: giocando la penultima carta si annuncia (uno:true). Chi se lo dimentica resta "scoperto" (s.miss): il giocatore dopo di lui
   può denunciarlo (azione catch) prima di muovere e il colpevole pesca 2; appena cur fa un'altra mossa il momento è passato.
   Il colpevole può rimediare subito dopo aver giocato con l'azione uno (anche fuori turno), finché il prossimo non ha mosso.
   Doppie: si giocano insieme n copie identiche (stesso colore e valore, mai jolly) con a.n; gli effetti si ripetono n volte
   (Salta salta n giocatori, Inverti n volte, +2 fa pescare 2n). Dopo aver pescato si gioca solo la carta pescata, da sola.
   Si può chiudere con qualsiasi carta, anche speciale: se l'ultima è +2/+4 il prossimo pesca prima del conteggio dei punti (con l'accumulo
   anche il mucchio in corso), il +4 giocato per chiudere è sempre regolare e non si sfida, un jolly per chiudere non chiede il colore. Si gioca una mano: vince chi finisce le carte.
   Fasi: play (cur agisce) · pass (ha pescato: può giocare quella carta o passare) · challenge (cur può sfidare o accettare il +4) · swap (cur ha giocato un 7: sceglie con chi scambiare).
   Azioni: play{c,n?,color?,uno?} draw pass challenge accept catch uno swap{to}. */
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
 const modo=['classic','stack','sette','caos'].includes(o.edi)?o.edi:'classic';
 const s={n,modo,edi:modo==='stack'||modo==='caos'?'stack':'classic',sw:modo==='sette'||modo==='caos',names:names.slice(0,n),hands,deck,discard:[top],color:col(top),dir:1,cur:Math.floor(RND()*n),phase:'play',pend:0,pendK:null,drawn:null,w4:null,miss:null,log:[],ev:[],evn:0,over:null};
 L(s,'Sette carte a testa. In tavola: '+CN[s.color]+' '+val(top));return s}
const nextP=(s,i,k=1)=>(((i+s.dir*k)%s.n)+s.n)%s.n;
function refill(s){if(s.deck.length)return;const top=s.discard.pop();s.deck=shuffle(s.discard.map(c=>c));s.discard=[top];s.ev.push({t:'reshuffle'});L(s,'Mazzo finito: si rimescolano gli scarti')}
function draw(s,p,n){const got=[];for(let i=0;i<n;i++){refill(s);if(!s.deck.length)break;const c=s.deck.shift();s.hands[p].push(c);got.push(c)}s.ev.push({t:'draw',p,n:got.length});return got}
const playable=(s,c)=>{const top=s.discard[s.discard.length-1];if(s.pend){return s.edi==='stack'&&((s.pendK==='D'&&c===col(top)+'D')||(s.pendK==='D'&&val(c)==='D')||(s.pendK==='F'&&c==='WF'))}
 return col(c)==='W'||col(c)===s.color||val(c)===val(top)&&col(top)!=='W'}
const canPlay=(s,p)=>s.hands[p].filter(c=>playable(s,c));
function advance(s,skip){s.cur=nextP(s,s.cur,1+(skip||0));s.phase='play';s.drawn=null;if(s.miss===s.cur)s.miss=null;s.ev.push({t:'turn',p:s.cur})}
function finish(s,p){const sc=s.hands.map((h,i)=>i===p?0:h.reduce((a,c)=>a+pts(c),0)),total=sc.reduce((a,b)=>a+b,0);sc[p]=total;
 s.over={win:p,scores:sc,reason:'Prima a restare senza carte'};s.ev.push({t:'end',win:p});L(s,nm(s,p)+' resta senza carte e vince!')}
const fixMiss=s=>{if(s.miss!=null&&s.hands[s.miss].length!==1)s.miss=null};
function swapHands(s,a,b){const h=s.hands[a];s.hands[a]=s.hands[b];s.hands[b]=h;s.ev.push({t:'swap',p:a,q:b});L(s,nm(s,a)+' scambia la mano con '+nm(s,b));fixMiss(s)}
function rotateHands(s){const old=s.hands.map(h=>h.slice());for(let i=0;i<s.n;i++)s.hands[nextP(s,i)]=old[i];s.ev.push({t:'rotate'});L(s,'Tutti passano la mano al giocatore successivo');fixMiss(s)}
/* quante copie identiche di c puoi giocare insieme adesso (1 = solo da sola) */
const maxN=(s,p,c)=>{if(!playable(s,c)||col(c)==='W'||s.phase!=='play'||(s.sw&&'70'.includes(val(c))))return 1;return s.hands[p].filter(x=>x===c).length};
/* gioca n copie della carta c dalla mano di p, con effetti */
function doPlay(s,p,c,color,uno,n){n=n||1;const h=s.hands[p];for(let k=0;k<n;k++)h.splice(h.indexOf(c),1);const prevColor=s.color,hadColor=h.some(x=>col(x)===prevColor&&col(x)!=='W');
 for(let k=0;k<n;k++)s.discard.push(c);s.drawn=null;s.ev.push({t:'play',p,c,n});
 s.color=col(c)==='W'?color:col(c);const v=val(c),nx=nextP(s,p);
 L(s,nm(s,p)+' gioca '+(n>1?n+' × ':'')+(col(c)==='W'?(v==='F'?'+4':'Cambia colore')+' → '+CN[color]:CN[col(c)]+' '+v));
 if(h.length===0){/* l'ultima carta pesca per il prossimo prima del conteggio dei punti */
  const k=v==='D'?2*n:v==='F'?4:0;if(k){const tot=k+(s.edi==='stack'?s.pend:0);draw(s,nx,tot);s.pend=0;s.pendK=null;L(s,nm(s,nx)+' pesca '+tot+' carte')}
  finish(s,p);return}
 if(h.length===1){if(uno){s.ev.push({t:'uno',p});L(s,nm(s,p)+' dice UNO!')}else{s.miss=p;L(s,nm(s,p)+' ha una carta sola e non ha detto UNO!')}}
 if(s.sw&&v==='7'){if(s.n===2){swapHands(s,p,nx);advance(s);return}s.phase='swap';s.ev.push({t:'turn',p});return}
 if(s.sw&&v==='0'){rotateHands(s);advance(s);return}
 if(v==='V'){if(s.n===2){advance(s,n);return}if(n%2){s.dir=-s.dir;s.ev.push({t:'reverse'})}advance(s);return}
 if(v==='S'){s.ev.push({t:'skip',p:nx});advance(s,n);return}
 if(v==='D'){if(s.edi==='stack'){s.pend+=2*n;s.pendK='D';advance(s);return}draw(s,nx,2*n);L(s,nm(s,nx)+' pesca '+2*n+' carte e salta il turno');s.ev.push({t:'skip',p:nx});advance(s,1);return}
 if(v==='F'){if(s.edi==='stack'){s.pend+=4;s.pendK='F';advance(s);return}s.w4={by:p,hadColor};s.cur=nx;s.phase='challenge';s.ev.push({t:'turn',p:s.cur});return}
 advance(s)}
const fail=e=>({err:e});
function act(st,a){const s=clone(st);if(s.over)return fail('Partita finita');s.ev=[];const p=s.cur;
 if(a.t==='uno'){if(s.miss==null)return fail('Adesso non serve dire UNO');const q=s.miss;s.miss=null;s.ev.push({t:'uno',p:q});L(s,nm(s,q)+' dice UNO in tempo!');s.evn++;return{s}}
 if(a.t==='catch'){if(s.miss==null||s.miss===p)return fail('Nessuno da denunciare');const q=s.miss;s.miss=null;draw(s,q,2);s.ev.push({t:'catch',p,q});L(s,nm(s,p)+' denuncia '+nm(s,q)+': non ha detto UNO e pesca 2 carte');s.evn++;return{s}}
 if(a.t!=='swap')s.miss=null;
 if(s.phase==='swap'){if(a.t!=='swap')return fail('Hai giocato un 7: scegli con chi scambiare la mano');const q=a.to;if(!Number.isInteger(q)||q<0||q>=s.n||q===p)return fail('Scegli un altro giocatore');swapHands(s,p,q);advance(s);s.evn++;return{s}}
 if(a.t==='swap')return fail('Nessuno scambio in corso');
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
  if(col(c)==='W'){if(!COLORS.includes(a.color)){if(s.hands[p].length===1)a={...a,color:s.color};else return fail('Scegli un colore')}}
  const n=a.n==null?1:a.n;if(!Number.isInteger(n)||n<1)return fail('Numero di carte non valido');
  if(n>1){if(col(c)==='W')return fail('I jolly si giocano uno alla volta');if(s.sw&&'70'.includes(val(c)))return fail('Il 7 e lo 0 si giocano una carta alla volta');if(s.phase==='pass')return fail('Dopo aver pescato giochi solo la carta pescata, da sola');
   if(s.hands[p].filter(x=>x===c).length<n)return fail('Non hai '+n+' carte uguali a quella')}
  doPlay(s,p,c,a.color,!!a.uno,n);s.evn++;return{s}}
 return fail('Azione non valida adesso')}
return{newGame,act,setRnd:f=>{RND=f},COLORS,CN,col,val,pts,playable,canPlay,maxN}})();
if(typeof module!=='undefined')module.exports=UNO;
