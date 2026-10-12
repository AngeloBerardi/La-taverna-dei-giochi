/* DISCESA TASCABILE (solitario) – dungeon crawler a dadi su una griglia 5x6, ispirato a One Card Dungeon (Barny Skinner, Little Rocket Games).
   Regole del gioco base e delle espansioni Porto (Harbour Clash) e Vetta (Eternal Peak) dal regolamento; mappe, mostri, nomi e le parti non pubbliche
   delle espansioni (classi e forzieri dello Scettro, Soglia Infernale) sono ricostruzioni originali. Coordinate x 0..4, y 0..5 (y=5 in basso). */
const DISC=(()=>{
let RND=Math.random;const d6=()=>1+Math.floor(RND()*6);const clone=o=>JSON.parse(JSON.stringify(o));
const W=5,H=6,K=(x,y)=>x+','+y;
const L=(s,t)=>{s.log.push(t);if(s.log.length>60)s.log.shift()};const E=(s,o)=>s.ev.push(o);
/* --- mappe: 4 per avventura, ruotate di 180° per i livelli 5-8 (come girare la carta), poi di nuovo dritte con mostri più forti --- */
const MAPS={
 base:[['1...2','.#.#.','..3..','.#.#.','.....','..S..'],['#1..#','...#2','.#...','..3#.','.....','S...#'],['..1..','#.#.#','2...3','.#.#.','.....','#.S.#'],['1.#.2','..#..','.....','3#.#.','.....','.S...']],
 porto:[['1.~.2','.~~~.','..3..','#...#','.~.~.','..S..'],['~1..~','~.#.2','~....','~.3#.','~....','~S...'],['1...2','~~.~~','..3..','~~.~~','.....','..S..'],['..1..','.#~#.','2~~~3','.#~#.','.....','S....']],
 vetta:[['1*.*2','.*#*.','..3..','*...*','..#..','..S..'],['**1**','*...*','2.#.3','..*..','.*.*.','..S..'],['1..#2','**.#.','..3.*','.#**.','.....','S.*..'],['#.1.#','*.*.*','2...3','*.*.*','.....','#.S.#']],
 soglia:[['1.x.2','.x.x.','..3..','x...x','.x.x.','..S..'],['1...2','xx.xx','..3..','#...#','.x.x.','S....'],['x1.2x','..x..','.3...','x...x','.#.#.','..S..'],['..1..','x#x#x','2...3','..x..','x...x','..S..']]};
const BOSSMAP=['1.2.3','.#.#.','.....','x.#.x','.....','..S..'];
/* --- mostri per livello: [nome, salute, gittata, difesa, attacco, velocità, quanti]; bonus in acqua [vel, att, dif, git] --- */
const MON=[['Ragni',2,2,2,3,4,2],['Ratti giganti',2,2,2,3,5,3],['Goblin',3,2,2,4,4,2],['Scheletri',3,3,3,4,4,3],['Arcieri non morti',2,5,3,4,3,3],['Orchi',4,2,3,7,4,2],
 ['Lupi mannari',3,2,3,5,7,3],['Spettri',3,4,4,6,5,2],['Golem',5,2,4,7,3,2],['Stregoni',3,6,3,6,4,3],['Cavalieri neri',4,3,4,6,5,3],['Draghi',5,4,4,8,5,3]];
const ADV={base:{n:'Le Cripte',names:null,bonus:null},
 porto:{n:'Porto delle Ombre',names:['Granchi','Ratti di stiva','Pirati','Annegati','Balestrieri','Squali di terra','Sirene','Fantasmi del molo','Kraken giovani','Streghe del mare','Capitani maledetti','Leviatani'],bonus:[[2,0,0,0],[2,0,0,0],[1,1,0,0],[0,1,0,0],[0,0,0,1],[1,1,0,0],[2,0,0,0],[0,1,0,0],[1,0,1,0],[0,0,0,2],[1,1,0,0],[0,1,0,0]]},
 vetta:{n:'Vetta Eterna',names:['Pipistrelli','Lupi bianchi','Kobold','Yeti giovani','Arcieri dei ghiacci','Troll','Aquile giganti','Spiriti del gelo','Giganti di brina','Sciamani','Yeti','Draghi bianchi'],bonus:null},
 soglia:{n:'Soglia Infernale',names:['Imp','Cerberi cuccioli','Diavoletti','Dannati','Arcieri infernali','Demoni minori','Segugi di fuoco','Succubi','Golem di lava','Negromanti','Cavalieri del baratro','Arcidemoni'],bonus:null}};
const BOSS={n:'Scettrarca',hp:6,rng:4,def:4,atk:7,spd:4,lives:2},GUARD=['Comandanti',3,3,3,5,5];
const DEMON={n:'Guardiano della Soglia',hp:6,rng:4,def:5,atk:8,spd:6,lives:2};
/* --- classi: base dal regolamento; Corsaro e Sherpa dalle espansioni; le altre ricostruite --- */
const CLS={nessuna:{n:'Nessuna',d:'Nessun potere.'},paladino:{n:'Paladino',d:'Una volta per livello, tieni il dado energia di una caratteristica dal turno prima e ritira gli altri due.'},
 barbaro:{n:'Barbaro',d:'Una volta per turno, se hai 1 di salute, ritira tutti i dadi energia.'},ranger:{n:'Ranger',d:'Una volta per livello, metti un dado sulla Gittata invece che sulla Velocità.'},
 mago:{n:'Mago',d:'Una volta per livello, ritira tutti i dadi energia.'},
 monaco:{n:'Monaco',d:'Una volta per livello, riduci di 2 i danni di un attacco dei mostri.',x:'scettro'},chierico:{n:'Chierico',d:'Una volta per livello, recupera 2 di salute.',x:'scettro'},assassino:{n:'Assassino',d:'Una volta per livello, un tuo attacco ignora la linea di vista.',x:'scettro'},
 corsaro:{n:'Corsaro',d:'Una volta per livello, spostati su una casella libera qualsiasi, senza spendere Velocità.',x:'porto'},
 sherpa:{n:'Sherpa',d:'Una volta per livello, muoviti ignorando i muri (ma non fermarti su un muro).',x:'vetta'},
 esorcista:{n:'Esorcista',d:'Una volta per livello, togli 1 salute a un mostro in linea di vista, ignorando la difesa.',x:'soglia'}};
/* --- oggetti: Clessidra ed Erbe curative dal regolamento, gli altri ricostruiti; quelli con u sono unici della propria avventura --- */
const ITEMS={clessidra:{n:'Clessidra',d:'Un’altra fase dell’avventuriero: ritrovi Velocità e Attacco del turno, e i mostri restano fermi.',p:'porto'},rum:{n:'Rum',d:'+3 Velocità in questo turno.',p:'porto'},arpione:{n:'Arpione',d:'+3 Gittata in questo turno.',p:'porto'},
 bussola:{n:'Bussola',d:'Ritira un dado energia (prima di assegnarli).',p:'porto'},onda:{n:'Onda anomala',d:'Ogni mostro in acqua perde 1 salute.',p:'porto',u:1},
 erbe:{n:'Erbe curative',d:'Dimezza i danni del prossimo attacco dei mostri (per eccesso).',p:'vetta'},corda:{n:'Corda',d:'+2 Difesa in questo turno.',p:'vetta'},piccozza:{n:'Piccozza',d:'+2 Attacco in questo turno.',p:'vetta'},
 pelliccia:{n:'Pelliccia',d:'Ignori la bufera fino alla fine del livello.',p:'vetta'},valanga:{n:'Valanga',d:'Ogni mostro nella bufera perde 1 salute.',p:'vetta',u:1},
 acquasanta:{n:'Acqua santa',d:'Un mostro in linea di vista perde 1 salute, ignorando difesa e gittata.',p:'soglia'},amuleto:{n:'Amuleto',d:'+2 Difesa in questo turno.',p:'soglia'},pozione:{n:'Pozione',d:'Recuperi 3 di salute.',p:'soglia'},
 specchio:{n:'Specchio',d:'Ritira tutti i dadi energia (prima di assegnarli).',p:'soglia'},braciere:{n:'Braciere',d:'Ogni mostro sulla lava perde 1 salute.',p:'soglia',u:1}};
const TER={'~':'acqua','*':'bufera','x':'lava'};
/* --- geometria --- */
const inB=(x,y)=>x>=0&&x<W&&y>=0&&y<H;
const dist=(a,b)=>{const dx=Math.abs(a.x-b.x),dy=Math.abs(a.y-b.y);return 3*Math.min(dx,dy)+2*(Math.abs(dx-dy))};
const wall=(s,x,y)=>!inB(x,y)||s.map[y][x]==='#';
const ter=(s,x,y)=>inB(x,y)?s.map[y][x]:'#';
const alive=s=>s.mon.filter(m=>m.hp>0);
const monAt=(s,x,y)=>s.mon.find(m=>m.hp>0&&m.x===x&&m.y===y);
function segBlocked(ax,ay,bx,by,rx,ry){const e=1e-6,x0=rx+e,x1=rx+1-e,y0=ry+e,y1=ry+1-e;let t0=0,t1=1;const dx=bx-ax,dy=by-ay;
 for(const[p,q]of[[-dx,ax-x0],[dx,x1-ax],[-dy,ay-y0],[dy,y1-ay]]){if(p===0){if(q<0)return false}else{const r=q/p;if(p<0){if(r>t1)return false;if(r>t0)t0=r}else{if(r<t0)return false;if(r<t1)t1=r}}}return t1-t0>e}
function los(s,a,b,skip){const bl=[];for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(s.map[y][x]==='#')bl.push([x,y])}
 for(const m of alive(s)){if(skip&&skip.includes(m))continue;if((m.x===a.x&&m.y===a.y)||(m.x===b.x&&m.y===b.y))continue;bl.push([m.x,m.y])}
 const cs=p=>[[p.x,p.y],[p.x+1,p.y],[p.x,p.y+1],[p.x+1,p.y+1]];
 const isB=(x,y)=>bl.some(([rx,ry])=>rx===x&&ry===y);
 // una linea che scorre lungo il bordo comune di due caselle bloccate passa in una fessura chiusa
 const seam=(ax,ay,bx,by)=>{if(ax===bx){for(let y=Math.min(ay,by);y<Math.max(ay,by);y++)if(isB(ax-1,y)&&isB(ax,y))return true}
  if(ay===by){for(let x=Math.min(ax,bx);x<Math.max(ax,bx);x++)if(isB(x,ay-1)&&isB(x,ay))return true}return false};
 for(const[ax,ay]of cs(a))for(const[bx,by]of cs(b)){if(!seam(ax,ay,bx,by)&&!bl.some(([rx,ry])=>segBlocked(ax,ay,bx,by,rx,ry)))return true}return false}
const DIR=[[1,0,2],[-1,0,2],[0,1,2],[0,-1,2],[1,1,3],[1,-1,3],[-1,1,3],[-1,-1,3]];
/* Dijkstra: costo per raggiungere ogni casella. pass(x,y): si può attraversare; ignoreWalls per lo Sherpa */
function paths(s,from,max,pass,ignoreWalls){const best={},q=[[0,from.x,from.y]];best[K(from.x,from.y)]=0;
 while(q.length){q.sort((a,b)=>a[0]-b[0]);const[c,x,y]=q.shift();if(c>best[K(x,y)])continue;
  for(const[dx,dy,w]of DIR){const nx=x+dx,ny=y+dy;if(!inB(nx,ny))continue;if(!ignoreWalls&&wall(s,nx,ny))continue;
   if(dx&&dy&&!ignoreWalls&&wall(s,x+dx,y)&&wall(s,x,y+dy))continue;if(!pass(nx,ny))continue;const nc=c+w;if(nc>max)continue;if(best[K(nx,ny)]==null||nc<best[K(nx,ny)]){best[K(nx,ny)]=nc;q.push([nc,nx,ny])}}}return best}
/* --- statistiche effettive --- */
function mStat(s,m,k,at){const p=at||m;let v=m[k];if(ter(s,p.x,p.y)==='~'&&m.bon){const i={spd:0,atk:1,def:2,rng:3}[k];if(i!=null)v+=m.bon[i]}return v}
const blizz=s=>ter(s,s.hero.x,s.hero.y)==='*'&&!s.tmp.fur;
function hStat(s,k){const h=s.hero,d=s.die||{};
 if(k==='S')return h.S+(d.S||0)+(s.tmp.S||0);if(k==='A')return Math.max(0,h.A-(blizz(s)?1:0))+(d.A||0)+(s.tmp.A||0);
 if(k==='D')return Math.max(1,Math.max(0,h.D-(blizz(s)?1:0))+(d.D||0)+(s.tmp.D||0));if(k==='R')return h.R+(d.R||0)+(s.tmp.R||0)}
const leftS=s=>hStat(s,'S')-s.spent.S,leftA=s=>hStat(s,'A')-s.spent.A;
/* --- livelli --- */
const LEVELS=12;
function setupLevel(s){const lv=s.level,adv=s.adv,bossLv=lv===12&&(s.mods.boss||adv==='soglia');let rows;
 if(bossLv)rows=BOSSMAP.slice();else{const base=MAPS[adv][(lv-1)%4];rows=lv>=5&&lv<=8?base.slice().reverse().map(r=>r.split('').reverse().join('')):base.slice()}
 s.map=rows.map(r=>r.replace(/[123S]/g,'.'));s.mon=[];s.chest=null;
 const st={};rows.forEach((r,y)=>r.split('').forEach((c,x)=>{st[c]={x,y}}));s.hero.x=st.S.x;s.hero.y=st.S.y;
 if(bossLv){const B=adv==='soglia'&&!s.mods.boss?DEMON:BOSS;s.mon.push({n:B.n,hp:B.hp,max:B.hp,rng:B.rng,def:B.def,atk:B.atk,spd:B.spd,x:st['2'].x,y:st['2'].y,lives:B.lives,boss:1,bon:null});
  for(const c of['1','3'])s.mon.push({n:GUARD[0],hp:GUARD[1],max:GUARD[1],rng:GUARD[2],def:GUARD[3],atk:GUARD[4],spd:GUARD[5],x:st[c].x,y:st[c].y,bon:null})}
 else{const M=MON[lv-1],A=ADV[adv],nm=A.names?A.names[lv-1]:M[0];for(let i=0;i<M[6];i++){const p=st[String(i+1)];s.mon.push({n:nm,hp:M[1],max:M[1],rng:M[2],def:M[3],atk:M[4],spd:M[5],x:p.x,y:p.y,bon:A.bonus?A.bonus[lv-1]:null})}}
 if(s.mods.chest){let far=null;for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(s.map[y][x]!=='.'||monAt(s,x,y)||(x===s.hero.x&&y===s.hero.y))continue;const d=dist({x,y},s.hero)+((x*7+y*3+lv)%5);if(!far||d>far.d)far={x,y,d}}if(far)s.chest={x:far.x,y:far.y}}
 s.once={};s.tmp={};L(s,'Livello '+lv+': '+alive(s).map(m=>m.n).filter((v,i,a)=>a.indexOf(v)===i).join(' e '));E(s,{t:'level',lv});
 if(s.mods.stone&&lv>1){s.hero.hp=Math.max(1,s.hero.hp-1);L(s,'La Pietra della Perdizione ti toglie 1 salute')}
 startTurn(s)}
function roll(s){s.dice=[d6(),d6(),d6()];if(s.mods.stone)s.dice=s.dice.map(v=>Math.min(6,v+1));s.die=null;s.phase='energy';E(s,{t:'roll',dice:s.dice.slice()})}
function startTurn(s){s.spent={S:0,A:0};s.tmp={fur:s.tmp&&s.tmp.fur};s.halve=false;s.prevDie=s.die||s.prevDie||null;s.once.barb=false;s.turn++;roll(s)}
function win(s){s.over={win:true,scores:[s.score()],lv:12,reason:'Lo scettro è tuo!'};s.phase='summary';E(s,{t:'win'});L(s,'Hai conquistato il fondo del dungeon!')}
function lose(s,why){s.hero.hp=0;s.over={win:false,scores:[(s.level-1)*10],lv:s.level,reason:why};s.phase='summary';E(s,{t:'lose'});L(s,why)}
function cleared(s){E(s,{t:'clear',lv:s.level});L(s,'Livello '+s.level+' completato!');if(s.level>=LEVELS)return win(s);s.phase='levelup'}
function hit(s,m,n,why){m.hp=Math.max(0,m.hp-n);E(s,{t:'hit',x:m.x,y:m.y,n,why:why||''});if(m.hp<=0){if(m.lives>1){m.lives--;m.hp=m.max;m.atk+=1;E(s,{t:'rise',x:m.x,y:m.y});L(s,m.n+' si rialza più furioso!')}else{E(s,{t:'kill',x:m.x,y:m.y});L(s,m.n+' sconfitto')}}
 if(!alive(s).length)cleared(s)}
/* --- fase mostri --- */
function monsterPhase(s){const h=s.hero;const order=alive(s).sort((a,b)=>dist(a,h)-dist(b,h));
 for(const m of order){const others=alive(s).filter(o=>o!==m);const occ=(x,y)=>(x===h.x&&y===h.y)||others.some(o=>o.x===x&&o.y===y);
  const reach=paths(s,m,mStat(s,m,'spd'),(x,y)=>!(x===h.x&&y===h.y));let best=null;
  const toHero=paths(s,h,99,()=>true);
  for(const k in reach){const[x,y]=k.split(',').map(Number);if(occ(x,y)&&!(x===m.x&&y===m.y))continue;const p={x,y},d=dist(p,h),ok=d<=mStat(s,m,'rng',p)&&los(s,p,h,[m]);
   const key=ok?[0,-d,reach[k]]:[1,toHero[k]==null?999:toHero[k],reach[k]];if(!best||key[0]<best.key[0]||(key[0]===best.key[0]&&(key[1]<best.key[1]||(key[1]===best.key[1]&&key[2]<best.key[2]))))best={key,x,y}}
  if(best&&(best.x!==m.x||best.y!==m.y)){E(s,{t:'mmove',from:[m.x,m.y],to:[best.x,best.y]});m.x=best.x;m.y=best.y}}
 let tot=0;const who=[];for(const m of alive(s)){if(dist(m,h)<=mStat(s,m,'rng')&&los(s,m,h,[m])){tot+=mStat(s,m,'atk');who.push([m.x,m.y])}}
 const def=hStat(s,'D');let dmg=Math.floor(tot/def);
 if(s.halve&&dmg){dmg=Math.ceil(dmg/2);s.halve=false}
 if(s.monk&&dmg){dmg=Math.max(0,dmg-2);s.monk=false}
 E(s,{t:'matk',tot,def,dmg,who});if(tot)L(s,'I mostri attaccano: '+tot+' contro difesa '+def+' → '+dmg+' danni');
 h.hp-=dmg;if(h.hp<=0)return lose(s,'Sei caduto al livello '+s.level);
 if(ter(s,h.x,h.y)==='x'){h.hp-=1;E(s,{t:'lava'});L(s,'La lava ti brucia: −1');if(h.hp<=0)return lose(s,'Bruciato dalla lava al livello '+s.level)}
 startTurn(s)}
function openChest(s){const r=d6(),h=s.hero;s.chest=null;let t;
 if(r===1){h.hp=Math.max(1,h.hp-1);t='Trappola! −1 salute'}else if(r<=3){h.hp=Math.min(6,h.hp+2);t='Pozione: +2 salute'}
 else if(r<=5&&s.mods.items&&s.pool.length){const it=s.pool.shift();s.items.push(it);t='Trovi: '+ITEMS[it].n}else if(r<=5){s.tmp.A=(s.tmp.A||0)+2;s.tmp.S=(s.tmp.S||0)+2;t='Pergamena: +2 Velocità e +2 Attacco in questo turno'}
 else{const k=['S','A','D','R'].filter(k=>h[k]<6);const kk=k.length?k[Math.floor(RND()*k.length)]:null;if(kk){h[kk]++;t='Reliquia: +1 '+({S:'Velocità',A:'Attacco',D:'Difesa',R:'Gittata'})[kk]+' per sempre'}else{h.hp=6;t='Reliquia: salute piena'}}
 E(s,{t:'chest',r,txt:t});L(s,'Forziere ('+r+'): '+t)}
/* --- API --- */
function newGame(n,names,o={}){const adv=ADV[o.adv]?o.adv:'base';
 const s={g:'discesa',n:1,names:[names[0]||'Tu'],hands:[[]],cur:0,log:[],ev:[],evn:0,over:null,teams:1,adv,level:1,turn:0,phase:'setup',
  hero:{x:2,y:5,hp:6,S:1,A:1,D:1,R:2},cls:'nessuna',mods:{chest:false,items:false,boss:false,stone:false},items:[],pool:[],dice:null,die:null,mon:[],map:MAPS[adv][0].map(r=>r.replace(/[123S]/g,'.')),once:{},tmp:{},spent:{S:0,A:0}};
 L(s,ADV[adv].n+': scegli la classe e le espansioni, poi scendi');return s}
function classesFor(s){return Object.keys(CLS).filter(k=>!CLS[k].x||CLS[k].x==='scettro'||CLS[k].x===s.adv||true)}
function act(st,a){if(st.over)return{err:'Partita finita'};const s=clone(st);s.ev=[];s.score=()=>s.level*10+s.hero.hp;const h=s.hero;const ok=()=>{delete s.score;s.evn=(s.evn||0)+1;return{s}};const err=t=>({err:t});
 if(a.t==='setup'){if(s.phase!=='setup')return err('Già iniziata');if(a.cls&&!CLS[a.cls])return err('Classe sconosciuta');s.cls=a.cls||'nessuna';
  s.mods={chest:!!a.chest,items:!!a.items,boss:!!a.boss,stone:!!a.stone};
  if(s.mods.items){const pool=Object.keys(ITEMS).filter(k=>!ITEMS[k].u||ITEMS[k].p===s.adv);for(let i=pool.length-1;i>0;i--){const j=Math.floor(RND()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}s.items=pool.slice(0,3);s.pool=pool.slice(3)}
  L(s,'Classe: '+CLS[s.cls].n+(s.items.length?' · oggetti: '+s.items.map(i=>ITEMS[i].n).join(', '):''));setupLevel(s);return ok()}
 if(s.phase==='levelup'){if(a.t!=='up')return err('Scegli un potenziamento o la cura');if(a.stat==='heal'){h.hp=6;L(s,'Ti riposi: salute piena')}else{if(!['S','A','D','R'].includes(a.stat))return err('Scelta non valida');if(h[a.stat]>=6)return err('Già al massimo');h[a.stat]++;L(s,'+1 '+({S:'Velocità',A:'Attacco',D:'Difesa',R:'Gittata'})[a.stat])}
  s.level++;s.tmp={};setupLevel(s);return ok()}
 if(a.t==='item'){const i=s.items.indexOf(a.id);if(i<0)return err('Non hai questo oggetto');const id=a.id;
  const inE=['bussola','specchio'].includes(id);if(inE&&s.phase!=='energy')return err('Si usa prima di assegnare i dadi');if(!inE&&s.phase!=='hero')return err('Si usa durante il tuo turno');
  if(id==='clessidra'){s.spent={S:0,A:0};L(s,'Clessidra: un’altra fase per te')}
  else if(id==='rum')s.tmp.S=(s.tmp.S||0)+3;else if(id==='arpione')s.tmp.R=(s.tmp.R||0)+3;else if(id==='piccozza')s.tmp.A=(s.tmp.A||0)+2;
  else if(id==='corda'||id==='amuleto')s.tmp.D=(s.tmp.D||0)+2;else if(id==='erbe')s.halve=true;else if(id==='pelliccia')s.tmp.fur=true;else if(id==='pozione')h.hp=Math.min(6,h.hp+3);
  else if(id==='bussola'){if(!(a.i>=0&&a.i<3))return err('Scegli il dado');s.dice[a.i]=d6()}else if(id==='specchio')s.dice=[d6(),d6(),d6()];
  else if(id==='acquasanta'){const m=alive(s)[a.m];if(!m||!los(s,h,m))return err('Scegli un mostro in linea di vista')}
  s.items.splice(i,1);E(s,{t:'item',id});L(s,'Usi: '+ITEMS[id].n);
  if(id==='acquasanta')hit(s,alive(s)[a.m],1,'santa');
  if(['onda','valanga','braciere'].includes(id)){const tt={onda:'~',valanga:'*',braciere:'x'}[id];for(const m of alive(s))if(ter(s,m.x,m.y)===tt&&!s.over&&s.phase!=='levelup')hit(s,m,1,id)}
  return ok()}
 if(s.phase==='energy'){
  if(a.t==='reroll'){if(s.cls==='mago'){if(s.once.mago)return err('Già usato in questo livello');s.once.mago=1}else if(s.cls==='barbaro'){if(h.hp!==1)return err('Solo con 1 di salute');if(s.once.barb)return err('Già usato in questo turno');s.once.barb=1}else return err('La tua classe non può');
   s.dice=[d6(),d6(),d6()];E(s,{t:'roll',dice:s.dice.slice()});L(s,'Ritiri i dadi energia');return ok()}
  if(a.t==='paladin'){if(s.cls!=='paladino')return err('Solo il Paladino');if(s.once.pal)return err('Già usato in questo livello');if(!s.prevDie||!['S','A','D'].includes(a.stat))return err('Nessun dado da tenere');
   s.once.pal=1;s.dice=[s.prevDie[a.stat],d6(),d6()];s.lock=a.stat;L(s,'Il Paladino tiene il dado '+s.dice[0]+' sulla stessa caratteristica');return ok()}
  if(a.t!=='assign')return err('Assegna i dadi energia');const o=a.order;if(!Array.isArray(o)||o.length!==3||new Set(o).size!==3||o.some(i=>!(i>=0&&i<3)))return err('Assegna un dado a ogni caratteristica');
  if(s.lock&&o[['S','A','D'].indexOf(s.lock)]!==0)return err('Il dado tenuto dal Paladino resta sulla sua caratteristica');
  s.die={S:s.dice[o[0]],A:s.dice[o[1]],D:s.dice[o[2]],R:0};s.lock=null;
  if(a.ranger){if(s.cls!=='ranger'||s.once.rng)return err('Non puoi');s.once.rng=1;s.die.R=s.die.S;s.die.S=0;L(s,'Ranger: il dado della Velocità va sulla Gittata')}
  s.phase='hero';E(s,{t:'assign'});return ok()}
 if(s.phase!=='hero')return err('Non ora');
 if(a.t==='move'||a.t==='warp'){const x=a.x,y=a.y;if(!inB(x,y)||wall(s,x,y))return err('Lì non puoi andare');if(monAt(s,x,y))return err('C’è un mostro');
  if(a.t==='warp'){if(s.cls!=='corsaro'||s.once.cor)return err('Non puoi');s.once.cor=1}
  else{const sh=!!a.sherpa;if(sh&&(s.cls!=='sherpa'||s.once.she))return err('Non puoi');const P=paths(s,h,leftS(s),(px,py)=>!monAt(s,px,py),sh);const c=P[K(x,y)];if(c==null||c===0)return err('Velocità insufficiente');s.spent.S+=c;if(sh)s.once.she=1}
  E(s,{t:'move',from:[h.x,h.y],to:[x,y]});h.x=x;h.y=y;if(s.chest&&s.chest.x===x&&s.chest.y===y)openChest(s);return ok()}
 if(a.t==='attack'){const m=alive(s)[a.m];if(!m)return err('Scegli un mostro');if(dist(h,m)>hStat(s,'R'))return err('Fuori gittata');
  const ign=!!a.ignoreLos;if(ign&&(s.cls!=='assassino'||s.once.ass))return err('Non puoi');if(!ign&&!los(s,h,m))return err('Non hai la linea di vista');
  const def=mStat(s,m,'def');if(leftA(s)<def)return err('Ti servono '+def+' punti attacco');s.spent.A+=def;if(ign)s.once.ass=1;L(s,'Colpisci '+m.n);hit(s,m,1,'atk');return ok()}
 if(a.t==='power'){if(s.cls==='chierico'){if(s.once.chi)return err('Già usato');s.once.chi=1;h.hp=Math.min(6,h.hp+2);L(s,'Il Chierico prega: +2 salute');return ok()}
  if(s.cls==='monaco'){if(s.once.mon)return err('Già usato');s.once.mon=1;s.monk=true;L(s,'Il Monaco si concentra: −2 ai prossimi danni');return ok()}
  if(s.cls==='esorcista'){const m=alive(s)[a.m];if(!m||!los(s,h,m))return err('Scegli un mostro in linea di vista');if(s.once.eso)return err('Già usato');s.once.eso=1;hit(s,m,1,'eso');return ok()}
  return err('Nessun potere da attivare')}
 if(a.t==='end'){monsterPhase(s);return ok()}
 return err('Azione sconosciuta')}
return{newGame,act,setRnd:f=>{RND=f},MAPS,MON,ADV,CLS,ITEMS,TER,W,H,dist,los,paths,alive,monAt,hStat,mStat,leftS,leftA,wall,ter,K,LEVELS}})();
if(typeof module!=='undefined')module.exports=DISC;
