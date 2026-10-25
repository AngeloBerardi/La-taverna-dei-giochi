/* Regicide Legacy (id `rlegacy`): campagna cooperativa in 12 missioni + spedizione libera.
   Meccaniche ricostruite dalle fonti di docs/rules/regicide-legacy.md; personaggi, luoghi, storia e testi sono nostri.
   Stato puro e JSON-clonabile. La campagna entra con opts.camp (o nuova) ed esce aggiornata in s.camp quando s.over.
   Carte: id → RLEG.def(s,id) (catalogo CAT + s.xd per nemici sconfitti e classi cambiate) = {k:tipo, v:forza, c:classi, nm:nome, f?:figura}. Tipi: h eroe, a animale, x giullare, p pellegrino,
   b belva, m mercenario, e nemico sconfitto. Cima della riserva = fine dell'array (pop). */
const RLEG=(()=>{
let RND=Math.random;
const clone=o=>JSON.parse(JSON.stringify(o));
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(RND()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const pick=a=>a[Math.floor(RND()*a.length)];
const HL=[0,8,7,6,5],JN=[0,0,0,1,2],BASE='GPCB';
const CL={G:{n:'Guerriero',ic:'ascia',d:'danno doppio'},P:{n:'Paladino',ic:'scudo',d:'riduce la forza del nemico'},
 C:{n:'Chierico',ic:'pozione',d:'gli scarti tornano in fondo alla riserva'},B:{n:'Bardo',ic:'liuto',d:'si pescano carte a giro'},
 M:{n:'Mago',ic:'stella',d:'scopri carte e aggiungine una all’attacco'},R:{n:'Razziatore',ic:'fungo',d:'danno doppio e divora la riserva'},
 S:{n:'Guardiano',ic:'pietra',d:'il nemico non colpisce'},D:{n:'Druido',ic:'piuma',d:'tutti gli scarti tornano, i pellegrini se ne vanno'},
 T:{n:'Cantore',ic:'tamburo',d:'tutti pescano metà della forza'},W:{n:'Albero',ic:'albero',d:'ascia, scudo, pozione e liuto, senza immunità'}};
const NOMI={G:['Zanna','Brando','Ulrica','Tor','Gesmunda','Orso','Vasco','Ilda','Ruggero','Berta la Rossa'],
 P:['Riccio','Aldo','Fiamma','Corrado','Isotta','Guelfo','Matilde','Ottone','Clelia','Ser Ermanno'],
 C:['Salvia','Lino','Ortensia','Fra Cirillo','Agnese','Dorotea','Benno','Mirta','Ansaldo','Madre Ilaria'],
 B:['Merlo','Pippo','Viola','Ciro','Allegra','Tancredi','Nives','Fosco','Lodovica','Orfeo il Vecchio'],
 M:['Civetta','Ugo','Selvaggia','Tobia','Iride','Gaspare','Morgana','Teodoro','Ombretta','Arcimago Zeno']};
const AVZ={R:{3:'Muffa',5:'Gramigna',7:'Grifo',10:'Bruma'},S:{3:'Sasso',5:'Ciottolo',7:'Basalto',9:'Monte'},D:{3:'Felce',5:'Salice',7:'Rovo',9:'Quercia'},T:{3:'Timpano',5:'Ritmo',7:'Eco',9:'Tuono'}};
const PELL=['Anselmo','Bice','Cosimo','Dina','Elia','Flora','Gino','Iole','Lapo','Mena','Nello','Olga','Pia','Remo','Sara','Tullio','Uberto','Vanna','Zeno','Ada','Bruno','Carla','Dario','Ebe'];
/* ---------- catalogo delle carte possibili ---------- */
const CAT=(()=>{const d={};
 for(const c of 'GPCBM')for(let v=1;v<=10;v++)d[c+v]={k:v===1?'a':'h',v,c,nm:NOMI[c][v-1]};
 for(const c in AVZ)for(const v in AVZ[c])d[c+v]={k:'h',v:+v,c,nm:AVZ[c][v]};
 d.tronco={k:'h',v:8,c:'',nm:'Tronco',f:'tronco'};d.lira={k:'h',v:7,c:'B',nm:'Lira',f:'lira'};d.edera={k:'h',v:6,c:'C',nm:'Edera',f:'edera'};
 [['bG','Orso'],['bP','Testuggine'],['bC','Cervo'],['bB','Allodola']].forEach(([id,nm])=>d[id]={k:'b',v:0,c:id[1],nm});
 let i=0;for(let v=2;v<=7;v++)for(const l of 'abcd')d['p'+v+l]={k:'p',v,c:'',nm:PELL[i++]};
 d.cucciolo={k:'a',v:1,c:'',nm:'Cucciolo'};
 for(let j=1;j<=2;j++)d['X'+j]={k:'x',v:0,c:'',nm:'Giullare'};
 for(let j=1;j<=4;j++)d['mg'+j]={k:'m',v:5,v2:2,c:'',nm:'Gemelli Fulvi',cost:1};
 for(const c of BASE)d['mv'+c]={k:'m',v:12,c,nm:'Veterano '+CL[c].n.toLowerCase(),cost:2};
 for(let j=1;j<=2;j++)d['mc'+j]={k:'m',v:19,c:'',nm:'Custode di ferro',cost:4};
 for(let j=1;j<=2;j++)d['ml'+j]={k:'a',v:1,c:'GPCB',nm:'Lupo selvatico',cost:3,m:1};
 for(let j=1;j<=2;j++)d['mX'+j]={k:'x',v:0,c:'',nm:'Giullare a contratto',cost:3,m:1};
 for(const c of BASE)d['XS'+c]={k:'x',v:8,c,nm:'Giullare ('+CL[c].n+')',solo:1};
 return d})();
const MERC=['mg1','mg2','mg3','mg4','mvG','mvP','mvC','mvB','mc1','mc2','ml1','ml2','mX1','mX2'];
const BASE40=(()=>{const a=[];for(const c of BASE)for(let v=1;v<=10;v++)a.push(c+v);return a})();
const REL={flauto:{n:'Flauto della Stirpe',d:'Le combo di parentela possono arrivare a 15.'},fischietto:{n:'Fischietto Scarlatto',d:'Un animale può abbinarsi a due carte invece di una.'},
 emblema:{n:'Emblema Azzurro',d:'Il Mago scopre 2 carte in più.'},madre:{n:'Madre Sempreverde',d:'La corruzione brucia la carta più debole della tua mano invece della cima della riserva.'}};
/* ---------- missioni ---------- */
const T3=(nm,f,a,b,c)=>[[nm[0],f,10,a],[nm[1],f,15,b],[nm[2],f,20,c]];
const MIS=[null,
 {n:'Chiamata alle armi',luogo:'Cripta dei Giudici',foes:T3(['Giudice','Inquisitore','Gran Giudice'],'giudice',4,4,4),fx:{},
  intro:'Una corruzione viola è salita dalle cripte e ha preso le corone del regno. La Compagnia della Lama d’Oro accetta l’incarico: liberare la cripta dei giudici.',
  win:'I giudici cadono uno dopo l’altro. Tra le loro vesti trovate un flauto d’osso che fa sentire i compagni più vicini.',lose:'La cripta respinge la Compagnia. Ci si ritira, si contano le ferite e si torna.',premio:'Reliquia: Flauto della Stirpe'},
 {n:'Ombra e nebbia',luogo:'Caverna Umbra',foes:[['Testa dell’Idra','idra',10,6]],fx:{ricresce:1},
  intro:'Un ponte crollato porta a una caverna piena di nebbia. Qualcosa con molte teste respira là sotto.',
  win:'L’idra si accascia nell’acqua scura. Oltre la caverna si vedono le torri dell’Accademia.',lose:'Le teste ricrescono più in fretta delle vostre lame.',premio:'Si apre la strada per l’Accademia'},
 {n:'Lezioni di fiamma',luogo:'Accademia della Fiamma',foes:[['Fusione','fusione',10,4,2],['Grande Fusione','fusione',15,2,2],['Fusione Antica','fusione',20,1,2]],fx:{},
  intro:'All’Accademia gli allievi hanno fuso incantesimi e carne. I maghi sopravvissuti si uniscono alla Compagnia.',
  win:'L’ultima fusione si spegne. Nei sotterranei, un laboratorio ancora acceso.',lose:'Le fusioni assorbono la vostra magia.',premio:'I Maghi restano nella Compagnia'},
 {n:'Fusione oscura',luogo:'Laboratorio di Biologia',foes:T3(['Esperimento','Esperimento instabile','Abominio'],'esperimento',4,4,4),fx:{esp:1},
  intro:'Gabbie aperte, vasche rotte: gli esperimenti si nutrono di ciò che la Compagnia perde per strada.',
  win:'Nelle gabbie trovate belve ancora sane e un gigante di legno di nome Tronco, che decide di seguirvi.',lose:'Gli esperimenti crescono a ogni carta perduta.',premio:'Reliquia: Fischietto Scarlatto · Belve · Tronco'},
 {n:'Alti e potenti',luogo:'Bosco Cremisi',foes:[['Sporigeno','spora',10,4],['Sporigeno Reale','spora',15,4]],fx:{spore:1,corr:1},
  intro:'Nel bosco le spore corrompono chi esita. Si uniscono a voi i Razziatori e la bardo Lira.',
  win:'Le spore si posano. Tronco raccoglie un’ascia caduta e non la lascia più.',lose:'Il bosco si chiude alle vostre spalle.',premio:'Tronco ottiene l’ascia'},
 {n:'Frammenti di memoria',luogo:'Giardino della Memoria',foes:[['Statua','statua',15,4],['Statua Custode','statua',20,4]],fx:{mem:1,corr:1},
  intro:'Le statue del giardino ricordano ogni colpo ricevuto. I Guardiani di pietra vi offrono il loro aiuto.',
  win:'Nella fontana brilla un emblema azzurro che amplifica la magia.',lose:'Le statue si ricompongono, colpo dopo colpo.',premio:'Reliquia: Emblema Azzurro'},
 {n:'Racconti di rinascita',luogo:'Pozzo delle Lacrime',foes:T3(['Stagnino','Stagnino Grosso','Re dello Stagno'],'stagno',4,4,4),fx:{zona:1,corr:1},
  intro:'Al pozzo, chi cade può tornare. I Druidi vi insegnano a chiudere il cerchio: asso, due, tre… fino a dieci.',
  win:'Il pozzo si calma. Il vento sale dal precipizio.',lose:'Il pozzo trattiene i caduti.',premio:'Si apre la via per l’Orlo del Cielo'},
 {n:'Venti del caos',luogo:'Orlo del Cielo',foes:[['Troll','troll',10,6],['Viverna','viverna',25,6]],fx:{vento:1,corr:1},
  intro:'Sull’orlo del mondo il vento strappa le carte di mano. Vi raggiungono i Cantori e una lunga fila di pellegrini, con un cucciolo.',
  win:'Le viverne precipitano nelle nuvole. In lontananza, un tempio con due semi sul portale.',lose:'Il vento disperde la Compagnia.',premio:'Si apre il Tempio dei Due Semi'},
 {n:'Speranza dalle ceneri',luogo:'Tempio dei Due Semi',foes:[['Custode del Sapere','custode',15,4],['Gran Custode','custode',20,5]],fx:{pile:1,corr:1},
  intro:'Nel tempio trovate la Madre Sempreverde, un piccolo albero che assorbe la corruzione. Metà della Compagnia è dispersa nelle sale: dovete richiamarla.',
  win:'Il tempio torna silenzioso. Ma qualcuno, nella Compagnia, ha già scelto l’altra parte.',lose:'Le ceneri coprono i vostri passi.',premio:'Reliquia: Madre Sempreverde'},
 {n:'Orgoglio e caduta',luogo:'Rovine del Tempio',foes:'trad',fx:{trad:1,corr:1},
  intro:'Otto compagni, i più forti o i più corrotti, si voltano contro di voi. Ognuno combatte con la sua arte.',
  win:'I traditori tornano in sé e riprendono posto nella Compagnia, a testa bassa.',lose:'Il tradimento vince, per ora.',premio:'I traditori tornano nella Compagnia'},
 {n:'Discesa nel buio',luogo:'Caverne del Marciume',foes:'tronco',fx:{corr:1},
  intro:'Tronco è sparito nel buio e il marciume lo ha raggiunto. Edera, sua vecchia amica, scende con voi.',
  win:'Edera dà la sua vita per liberare Tronco, che rinasce come albero. La sua carta va strappata.',lose:'Il marciume vi respinge verso la superficie.',premio:'Tronco ottiene il potere dell’Albero · Edera se ne va'},
 {n:'Dalla decadenza alla crescita',luogo:'Trono della Corruzione',foes:'lira',fx:{boss:1,corr:1},
  intro:'Sul trono siede Lira, la vostra bardo, la prima a essere toccata dalla corruzione. Per salvarla dovete sconfiggerla.',
  win:'Lira si risveglia. Il regno respira. La campagna è finita, ma la Compagnia può ripartire quando vuole.',lose:'Il canto di Lira vi spezza.',premio:'Campagna completata · Spedizione libera'}];
const LIB={n:'Spedizione libera',luogo:'Il regno',intro:'Una spedizione con nemici, ostacoli e aiuti estratti a sorte. Il party è quello della vostra campagna.',win:'Spedizione riuscita.',lose:'Spedizione fallita.'};
const BANE={esp:'Gli esperimenti: +1 forza per carta bandita',spore:'Spore: chi cede brucia una carta',mem:'Memoria: le carte giocate vengono bandite',vento:'Vento: a ogni nemico si passa una carta',zona:'Zona missione attiva'};
/* ---------- campagna ---------- */
function newCamp(){return{v:1,m:1,done:[],fails:{},merc:false,rel:[],party:BASE40.slice(),mod:{},corr:[],torn:[],beasts:false,fin:false,lib:{w:0,l:0}}}
const addP=(c,ids)=>ids.forEach(id=>{if(!c.party.includes(id)&&!c.torn.includes(id))c.party.push(id)});
function setupCamp(c,m){
 if(m>=3){const a=[];for(let v=1;v<=10;v++)a.push('M'+v);addP(c,a)}
 if(m>=5){addP(c,['R3','R5','R7','R10','lira'])}
 if(m>=6)addP(c,['S3','S5','S7','S9']);
 if(m>=7)addP(c,['D3','D5','D7','D9']);
 if(m>=8){const p=['cucciolo','T3','T5','T7','T9'];for(let v=2;v<=7;v++)for(const l of 'abcd')p.push('p'+v+l);addP(c,p)}
 if(m>=9&&!c.rel.includes('madre'))c.rel.push('madre');
 if(m===11)addP(c,['edera'])}
function reward(c,m){
 if(m===1&&!c.rel.includes('flauto'))c.rel.push('flauto');
 if(m===4){if(!c.rel.includes('fischietto'))c.rel.push('fischietto');c.beasts=true;addP(c,['tronco'])}
 if(m===5)c.mod.tronco='G';
 if(m===6&&!c.rel.includes('emblema'))c.rel.push('emblema');
 if(m===11){c.torn.push('edera');c.party=c.party.filter(x=>x!=='edera');c.mod.tronco='W'}
 if(m===12)c.fin=true}
/* ---------- utilità di stato ---------- */
const L=(s,t)=>{s.log.push(t);if(s.log.length>60)s.log.shift()};
const E=(s,o)=>s.ev.push(o);
const D=(s,id)=>s.xd[id]||CAT[id];
const val=(s,id)=>D(s,id).v;
const nm=(s,id)=>{const d=D(s,id);return d.nm+(d.k==='x'||d.k==='p'?'':' '+(d.k==='a'?'A':d.v))};
const has=(s,r)=>(s.rel||[]).includes(r);
const sum=(s,a)=>a.reduce((t,c)=>t+val(s,c),0);
const tri=f=>f*(f+1)/2;
function foes(s){const m=s.mis,mk=(nm,f,v,c,x)=>Object.assign({nm,f,v,hp:2*v,c,dmg:0,red:0},x||{});let out=[];
 const spec=s.modo==='libera'?null:MIS[m].foes;
 if(spec==='trad'){const pool=s.deck.filter(id=>{const d=D(s,id);return d.k==='h'&&d.c&&d.c!=='W'});
  pool.sort((a,b)=>(s.corr.includes(b)-s.corr.includes(a))||val(s,b)-val(s,a));const tr=pool.slice(0,8);
  s.deck=s.deck.filter(x=>!tr.includes(x));
  out=tr.map(id=>{const d=D(s,id);return mk('Traditore: '+d.nm,'traditore',d.v+8,d.c[0],{card:id,trad:d.c[0]})}).sort((a,b)=>a.v-b.v);return out}
 if(spec==='tronco'){for(let i=0;i<4;i++)out.push(mk('Giustiziere','giustiziere',10,BASE[i]));shuffle(out);
  s.deck=s.deck.filter(x=>x!=='tronco');const tc=D(s,'tronco').c;
  out.push(mk('Tronco corrotto','tronco',20,tc==='G'||tc==='W'?'G':'P',{card:'tronco',min:10}));return out}
 if(spec==='lira'){const a=[],b=[];for(let i=0;i<4;i++){a.push(mk('Mutato','mutato',15,BASE[i]));b.push(mk('Mutato Maggiore','mutato',20,BASE[i]))}
  shuffle(a);shuffle(b);s.deck=s.deck.filter(x=>x!=='lira');return a.concat(b,[mk('Lira la Corrotta','lira',25,'BP',{card:'lira',boss:1,hp:80})])}
 const groups=spec||(()=>{const all=[];for(let k=1;k<=9;k++)MIS[k].foes.forEach(g=>{for(let i=0;i<g[3];i++)all.push([g[0],g[1],g[2],1,g[4]])});
  shuffle(all);return all.slice(0,12).sort((a,b)=>a[2]-b[2])})();
 for(const g of groups){const grp=[];let ic=shuffle(BASE.split(''));
  for(let i=0;i<g[3];i++){let c=ic[i%4];if(g[4]===2){c=ic[i%4]+ic[(i+1)%4]}if(m===2||g[1]==='idra'||g[1]==='troll'||g[1]==='viverna')c=pick(BASE.split(''));grp.push(mk(g[0],g[1],g[2],c))}
  out.push(...shuffle(grp))}
 return out}
/* ---------- nuova partita (fase di preparazione) ---------- */
function newGame(n,names,opts){opts=opts||{};
 const modo=opts.modo==='libera'?'libera':'camp',camp=opts.camp&&opts.camp.party?clone(opts.camp):newCamp();
 let m=modo==='libera'?0:Math.min(12,Math.max(1,camp.m|0||1));
 if(modo==='camp')setupCamp(camp,m);
const xd={};for(const id in camp.mod)if(CAT[id])xd[id]=Object.assign({},CAT[id],{c:camp.mod[id]});
 const s={n,names:Array.from({length:n},(_,i)=>names[i]||'Giocatore '+(i+1)),hands:Array.from({length:n},()=>[]),cur:0,phase:'prep',modo,mis:m,camp,xd,
  rel:camp.rel.slice(),corr:camp.corr.slice(),hl:HL[n],res:[],disc:[],ban:[],played:[],mats:Array.from({length:n},()=>[]),magic:[],rev:[],mz:[],stacks:null,
  castle:[],en:null,pend:null,owed:0,yr:0,jx:false,jl:n===1?2:0,uj:0,kills:0,ne:0,sac:false,fx:{},bane:null,boon:null,
  coins:0,prep:{merc:[],beast:null},log:[],over:null,ev:[],evn:0};
 if(modo==='libera'){s.bane=pick(Object.keys(BANE));s.fx[s.bane]=1;if(camp.m>5)s.fx.corr=1;s.boon=pick(['flauto','fischietto','emblema','madre','oro']);
  if(s.boon==='oro')s.coins=3;else if(!s.rel.includes(s.boon))s.rel.push(s.boon)}
 else{s.fx=Object.assign({},MIS[m].fx);if(camp.merc)s.coins=tri(camp.fails[m]||0)}
 if(camp.beasts)s.prep.beast='bG';
 const mi=modo==='libera'?LIB:MIS[m];L(s,(modo==='libera'?LIB.n:'Missione '+m+': '+mi.n)+' · '+mi.luogo);
 return s}
function prepAct(s,a){
 if(a.t==='merc'){if(!s.coins&&s.boon!=='oro')return 'Nessun oro per i mercenari';const id=a.id;if(!MERC.includes(id))return 'Mercenario sconosciuto';
  const i=s.prep.merc.indexOf(id);if(i>=0){s.prep.merc.splice(i,1);return null}
  const spent=s.prep.merc.reduce((t,x)=>t+CAT[x].cost,0);if(spent+CAT[id].cost>s.coins)return 'Oro insufficiente ('+(s.coins-spent)+' rimasto)';s.prep.merc.push(id);return null}
 if(a.t==='beast'){if(!s.camp.beasts)return 'Le belve non sono ancora nella Compagnia';if(!['bG','bP','bC','bB'].includes(a.id))return 'Belva sconosciuta';s.prep.beast=a.id;return null}
 if(a.t==='start'){const f=a.first|0;if(f<0||f>=s.n)return 'Giocatore non valido';begin(s,f);return null}
 return 'Prima avviate la missione'}
function begin(s,first){
 const deck=s.camp.party.filter(id=>!s.camp.torn.includes(id));s.deck=deck;
 s.castle=foes(s);
 const extra=[];if(s.prep.beast)extra.push(s.prep.beast);
 for(const id of s.prep.merc){if(CAT[id].k==='x'&&s.n===1)s.jl++;else extra.push(id)}
 for(let j=1;j<=JN[s.n];j++)extra.push('X'+j);
 s.res=shuffle(s.deck.concat(extra));delete s.deck;
 if(s.fx.pile){const pool=s.res.filter(id=>D(s,id).k!=='p'&&D(s,id).k!=='x');const take=pool.slice(0,30);s.res=s.res.filter(x=>!take.includes(x));
  s.stacks=[take.slice(0,10),take.slice(10,20),take.slice(20,30)]}
 for(let k=0;k<s.hl;k++)for(let p=0;p<s.n;p++)if(s.res.length)s.hands[p].push(s.res.pop());
 s.cur=first;s.phase='play';s.en=reveal(s,true);E(s,{t:'start',p:first});L(s,s.names[first]+' apre le danze. Primo nemico: '+s.en.nm)}
function reveal(s,first){const en=s.castle.shift();E(s,{t:'next',f:en.f});
 if(s.fx.vento&&!first&&s.n>1){const g=s.hands.map(h=>h.length?h.splice(Math.floor(RND()*h.length),1)[0]:null);
  g.forEach((c,i)=>{if(c)s.hands[(i+1)%s.n].push(c)});E(s,{t:'vento'});L(s,'Il vento strappa una carta a ognuno e la passa a sinistra')}
 return en}
/* ---------- forza effettiva del nemico ---------- */
function effStr(s){const en=s.en;if(!en)return 0;let v=en.v;
 if(s.fx.esp)v+=Math.min(5,s.ban.length);
 if(s.fx.zona)v+=s.mz.filter(c=>D(s,c).k!=='p').length;
 if(en.trad==='G'||en.trad==='R')v+=5;
 v-=en.red;if(en.min)v=Math.max(en.min,v);return Math.max(0,v)}
/* ---------- formare un attacco ---------- */
function kin(s,cards){// valore comune di una combo di parentela (o 0)
 let com=null;for(const c of cards){const d=D(s,c),o=d.v2?[d.v,d.v2]:[d.v];com=com?com.filter(x=>o.includes(x)):o}
 const lim=has(s,'flauto')?15:10;const ok=(com||[]).filter(v=>v*cards.length<=lim);return{any:!!(com&&com.length),v:ok.length?Math.max(...ok):0}}
function checkPlay(s,cards){
 if(s.phase!=='play')return 'Non è il momento di attaccare';
 if(!Array.isArray(cards)||!cards.length)return 'Seleziona almeno una carta';
 const h=s.hands[s.cur];if(new Set(cards).size!==cards.length||cards.some(c=>!h.includes(c)))return 'Carte non valide';
 const ds=cards.map(c=>D(s,c));
 if(cards.length===1)return null;
 if(ds.some(d=>d.k==='x'))return 'Il giullare si gioca da solo';
 const be=ds.filter(d=>d.k==='b').length,an=ds.filter(d=>d.k==='a').length;
 if(be)return be===1&&cards.length===2?null:'La belva si abbina a una sola altra carta';
 if(an){const mx=has(s,'fischietto')?3:2;return cards.length<=mx?null:mx===3?'Un animale si abbina al massimo a due carte (Fischietto)':'Un animale si abbina a una sola altra carta'}
 const k=kin(s,cards);if(!k.any)return 'Le combo di parentela vogliono carte della stessa forza';
 if(!k.v)return 'Il totale di una combo non può superare '+(has(s,'flauto')?15:10);return null}
function atkOf(s,cards){const ds=cards.map(c=>D(s,c));
 if(cards.length===2&&ds.some(d=>d.k==='b')){const o=ds.find(d=>d.k!=='b');return o.v*2}
 if(cards.length>=2&&!ds.some(d=>d.k==='a'||d.k==='b'))return kin(s,cards).v*cards.length;
 return ds.reduce((t,d)=>t+d.v,0)}
function powers(s,cards,ign){const im=s.en?s.en.c:'',act={},blk={};
 for(const c of cards){const d=D(s,c);let cl=d.c||'';const free=ign||cl==='W'||s.corr.includes(c);if(cl==='W')cl='GPCB';
  for(const k of cl){if(im.includes(k)&&!free){blk[k]=1;continue}act[k]=1}}
 for(const k in act)delete blk[k];return{act,blk:Object.keys(blk)}}
/* ---------- effetti ---------- */
function heal(s,k){shuffle(s.disc);const m=s.disc.splice(0,Math.min(k,s.disc.length));s.res.unshift(...m);return m.length}
function draw(s,k){let i=s.cur,stuck=0,got=0;while(k>0&&s.res.length&&stuck<s.n){if(s.hands[i].length<s.hl){s.hands[i].push(s.res.pop());k--;got++;stuck=0}else stuck++;i=(i+1)%s.n}return got}
function druid(s){const pil=s.disc.filter(c=>D(s,c).k==='p'),rest=s.disc.filter(c=>D(s,c).k!=='p');s.disc=[];s.ban.push(...pil);s.res.unshift(...shuffle(rest));return{back:rest.length,gone:pil.length}}
const keep=(s,c)=>{const d=D(s,c);return d.k==='x'?99:d.v};
function chant(s,atk){const k=Math.ceil(atk/2);let got=0;
 for(let j=0;j<s.n;j++){const p=(s.cur+j)%s.n;for(let i=0;i<k&&s.res.length;i++){s.hands[p].push(s.res.pop());got++}}
 let lost=0;s.hands.forEach(h=>{if(h.length>s.hl){h.sort((a,b)=>keep(s,a)-keep(s,b));const x=h.splice(0,h.length-s.hl);lost+=x.length;s.disc.push(...x)}});return{got,lost}}
function corrPen(s,c){if(has(s,'madre')){const h=s.hands[s.cur];if(h.length){h.sort((a,b)=>keep(s,a)-keep(s,b));const x=h.shift();s.ban.push(x);L(s,'La Madre Sempreverde assorbe la corruzione: brucia '+nm(s,x));return}}
 if(s.res.length){const x=s.res.pop();s.ban.push(x);L(s,'La corruzione di '+nm(s,c)+' brucia '+nm(s,x)+' dalla riserva')}}
/* ---------- turno ---------- */
function lose(s,why){s.over={win:false,reason:why};s.phase='over';E(s,{t:'lose'});L(s,'SCONFITTA: '+why);closeCamp(s,false)}
function win(s){s.over={win:true};s.phase='over';s.en=null;E(s,{t:'win'});L(s,'VITTORIA! '+(s.modo==='libera'?LIB.win:MIS[s.mis].win));closeCamp(s,true)}
function closeCamp(s,w){const c=s.camp;c.v=(c.v|0)+1;
 if(s.modo==='libera'){c.lib=c.lib||{w:0,l:0};c.lib[w?'w':'l']++;return}
 if(w){c.corr=s.corr.slice();reward(c,s.mis);if(!c.done.includes(s.mis))c.done.push(s.mis);c.m=Math.min(13,s.mis+1)}
 else{c.fails[s.mis]=(c.fails[s.mis]||0)+1;c.merc=true}}
function stuckCheck(s){const h=s.hands[s.cur];
 if(s.n===1&&!h.length&&(s.jl<1||s.yr>=1))return lose(s,'Mano vuota e nessun giullare: la missione è perduta');
 if(s.n>1&&s.yr>=s.n-1&&!h.length)lose(s,s.names[s.cur]+' non può né attaccare né cedere')}
function endTurn(s){s.cur=(s.cur+1)%s.n;s.phase='play';s.owed=0;s.sac=false;E(s,{t:'turn',p:s.cur});stuckCheck(s)}
const canFeign=s=>s.phase==='discard'&&s.hands[s.cur].length===s.hl&&s.hl>0;
function beginDamage(s){const en=s.en;
 if(en.boss&&s.res.length){s.ban.push(s.res.pop());E(s,{t:'burn'});L(s,'Il canto di Lira brucia una carta della riserva')}
 if((en.trad==='B'||en.trad==='M'||en.trad==='T')&&s.res.length){s.disc.push(s.res.pop());L(s,en.nm+' strappa una carta dalla riserva')}
 s.owed=effStr(s);if(!s.owed){L(s,'Il nemico non riesce a colpire');E(s,{t:'block'});return afterStrike(s)}
 E(s,{t:'atk',v:s.owed,p:s.cur});s.phase='discard';L(s,s.names[s.cur]+' deve parare '+s.owed);
 if(sum(s,s.hands[s.cur])<s.owed&&!canFeign(s))lose(s,s.names[s.cur]+' deve parare '+s.owed+' ma in mano ha solo '+sum(s,s.hands[s.cur]))}
function afterStrike(s){const en=s.en;if(en&&(en.trad==='C'||en.trad==='D')&&en.dmg>0){en.dmg=Math.max(0,en.dmg-5);L(s,en.nm+' si rigenera di 5')}endTurn(s)}
function toDisc(s,cards){// con la zona missione la carta col prossimo valore della scala va nella zona
 if(!s.fx.zona){s.disc.push(...cards);return}
 const rest=cards.slice().sort((a,b)=>val(s,a)-val(s,b));
 for(const c of rest){const d=D(s,c),need=s.mz.length+1;if(d.k!=='x'&&d.v===need&&need<=10){s.mz.push(c);E(s,{t:'zona',v:need})}else s.disc.push(c)}
 if(s.mz.length>=10){const r=druid(s);s.disc.push(...s.mz);s.mz=[];E(s,{t:'rinascita'});L(s,'La scala è completa: rinascita! '+r.back+' carte tornano nella riserva, '+r.gone+' pellegrini se ne vanno')}}
function defeat(s,exact){const en=s.en;E(s,{t:'kill',exact:!!exact,f:en.f});s.kills++;
 const mg=new Set(s.magic);s.magic=[];const pl=s.played.filter(c=>!/^XS/.test(c));s.played=[];s.mats=s.mats.map(()=>[]);
 for(const c of pl){const d=D(s,c);if(mg.has(c)||(s.fx.mem&&d.k!=='a'&&d.k!=='x'))s.ban.push(c);else s.disc.push(c)}
 if(en.card){if(exact)s.res.push(en.card);else s.disc.push(en.card);L(s,en.nm+' è sconfitto e torna nella Compagnia')}
 else if(s.fx.ricresce&&!exact&&!en.re){s.castle.push(Object.assign({},en,{dmg:0,red:0,hp:10,re:1,nm:en.nm+' ricresciuta'}));L(s,'La testa ricresce! Tornerà con 10 di vita')}
 else{const id='E'+(++s.ne);s.xd[id]={k:'e',v:en.v,c:en.c,nm:en.nm,f:en.f};
  if(exact&&s.fx.ricresce){s.ban.push(id);L(s,'Danno esatto: la testa è distrutta per sempre')}
  else if(exact){s.res.push(id);L(s,'Danno esatto! '+en.nm+' finisce in cima alla riserva')}else{s.disc.push(id);L(s,en.nm+' è sconfitto')}}
 if(exact&&s.stacks){const st=s.stacks.slice().sort((a,b)=>b.length-a.length)[0];if(st.length){s.res.push(st.pop());L(s,'Un compagno disperso torna in cima alla riserva')}}
 s.yr=0;s.jx=false;s.sac=false;
 if(s.fx.corr&&(s.kills===2||s.kills===6))corrupt(s);
 if(!s.castle.length)return win(s);
 s.en=reveal(s,false);s.phase='play';L(s,'Nuovo nemico: '+s.en.nm)}
function corrupt(s){const v=1+Math.floor(RND()*10),c=pick(BASE.split('')),id=c+v;
 const there=s.camp.party.includes(id)&&!s.corr.includes(id);E(s,{t:'corr',c:there?id:null,v,k:c});
 if(there){s.corr.push(id);L(s,'Corruzione: '+nm(s,id)+' è corrotto (ignora le immunità, ma a ogni uso brucia una carta)')}else L(s,'Corruzione: esce '+CL[c].n+' '+v+', già corrotto o assente')}
/* ---------- risoluzione di un attacco ---------- */
function startMagic(s,k){k=Math.min(10,k)+(has(s,'emblema')?2:0);s.rev=[];for(let i=0;i<k&&s.res.length;i++)s.rev.push(s.res.pop());s.phase='magic';E(s,{t:'magic',n:s.rev.length});L(s,'Il Mago scopre '+s.rev.length+' carte')}
function doPlay(s,cards,dev){const e=checkPlay(s,cards);if(e)return e;const p=s.cur,h=s.hands[p],who=s.names[p];
 for(const c of cards)h.splice(h.indexOf(c),1);s.played.push(...cards);s.mats[p].push(...cards);s.yr=0;
 if(cards.length===1&&D(s,cards[0]).k==='x'){s.phase='pick';E(s,{t:'play',p,c:cards});E(s,{t:'jester'});L(s,who+' gioca il giullare: chi lo reclama attacca senza immunità');return null}
 s.pend={cards:cards.slice(),add:[],dev:Math.max(0,Math.min(3,dev|0)),ign:!!s.jx,p};s.jx=false;
 E(s,{t:'play',p,c:cards});L(s,who+' attacca con '+cards.map(c=>nm(s,c)).join(', '));
 for(const c of cards)if(s.corr.includes(c))corrPen(s,c);
 const{act}=powers(s,cards,s.pend.ign);
 if(act.M&&s.res.length){for(const c of cards)if((D(s,c).c||'').includes('M'))s.magic.push(c);startMagic(s,atkOf(s,cards));return null}
 resolve(s);return null}
function doMago(s,c){if(s.phase!=='magic')return 'Nessuna magia in corso';if(c!=null&&!s.rev.includes(c))return 'Carta non scoperta';
 const rest=s.rev.filter(x=>x!==c);s.disc.push(...rest);s.rev=[];const P=s.pend;
 if(c==null){L(s,'Il Mago non aggiunge nulla');s.phase='play';resolve(s);return null}
 P.add.push(c);s.played.push(c);s.mats[P.p].push(c);s.magic.push(c);E(s,{t:'magpick',c});L(s,'Il Mago evoca '+nm(s,c));
 const d=D(s,c);if((d.c||'').includes('M')&&s.res.length&&powers(s,[c],P.ign).act.M){startMagic(s,d.v);return null}
 s.phase='play';resolve(s);return null}
function resolve(s){const P=s.pend,all=P.cards.concat(P.add),{act,blk}=powers(s,all,P.ign);let atk=atkOf(s,P.cards)+P.add.reduce((t,c)=>t+val(s,c),0);
 if(blk.length)E(s,{t:'imm',k:blk});
 if(act.R&&P.dev){const eat=[];for(let i=0;i<P.dev&&s.res.length;i++)eat.push(s.res.pop());s.ban.push(...eat);const mx=eat.length?Math.max(...eat.map(c=>val(s,c))):0;atk+=mx;E(s,{t:'devour',n:eat.length,v:mx});L(s,'Il Razziatore divora '+eat.length+' carte (+'+mx+')')}
 if(act.C){const v=heal(s,atk);E(s,{t:'heal',v});L(s,'Cura: '+v+' carte tornano in fondo alla riserva')}
 if(act.D){const r=druid(s);E(s,{t:'heal',v:r.back});L(s,'Druido: '+r.back+' scarti tornano nella riserva'+(r.gone?', '+r.gone+' pellegrini se ne vanno':''))}
 if(act.B){const v=draw(s,atk);E(s,{t:'draw',v});L(s,'Si pescano '+v+' carte')}
 if(act.T){const r=chant(s,atk);E(s,{t:'draw',v:r.got});L(s,'Il Cantore fa pescare tutti ('+r.got+' carte'+(r.lost?', '+r.lost+' scartate per il limite':'')+')')}
 let mult=(act.G?2:1)*(act.R?2:1),dmg=atk*mult;
 if(s.en.boss)dmg=Math.max(0,dmg-3);if(s.en.trad==='P'||s.en.trad==='S')dmg=Math.max(0,dmg-3);
 if(act.P){s.en.red+=atk;E(s,{t:'shield',v:atk})}
 s.en.dmg+=dmg;E(s,{t:'hit',v:dmg,x:mult});L(s,'Danno '+dmg+(mult>1?' (×'+mult+')':''));s.pend=null;
 if(s.en.dmg>=s.en.hp)return defeat(s,s.en.dmg===s.en.hp);
 if(act.S){E(s,{t:'guard'});L(s,'Il Guardiano blocca il colpo');return afterStrike(s)}
 beginDamage(s)}
function doYield(s){if(s.phase!=='play')return 'Non puoi cedere ora';if(s.n>1&&s.yr>=s.n-1)return 'Non puoi cedere: tutti gli altri hanno ceduto';
 if(s.n===1&&s.yr>=1)return 'Da solo non puoi cedere due volte di fila';
 s.yr++;s.jx=false;L(s,s.names[s.cur]+' cede');E(s,{t:'yield',p:s.cur});
 if(s.fx.spore&&s.res.length){s.ban.push(s.res.pop());L(s,'Le spore bruciano la cima della riserva')}
 beginDamage(s);return null}
function doDisc(s,cards){if(s.phase!=='discard')return 'Nessun colpo da parare';const h=s.hands[s.cur];
 if(!Array.isArray(cards)||new Set(cards).size!==cards.length||cards.some(c=>!h.includes(c)))return 'Carte non valide';
 if(sum(s,cards)<s.owed)return 'Devi scartare almeno '+s.owed+' (selezionati '+sum(s,cards)+')';
 for(const c of cards)h.splice(h.indexOf(c),1);toDisc(s,cards);E(s,{t:'disc',p:s.cur,c:cards});L(s,s.names[s.cur]+' para con '+cards.map(c=>nm(s,c)).join(', '));afterStrike(s);return null}
function doFeign(s){if(!canFeign(s))return 'Puoi fingerti morto solo con la mano piena';const h=s.hands[s.cur].splice(0);toDisc(s,h);E(s,{t:'feign',p:s.cur,c:h});L(s,s.names[s.cur]+' si finge morto e scarta tutta la mano');afterStrike(s);return null}
function doPick(s,to){if(s.phase!=='pick')return 'Scelta non richiesta';if(!(to>=0&&to<s.n))return 'Giocatore non valido';
 s.cur=to;s.jx=true;s.phase='play';E(s,{t:'turn',p:to});L(s,s.names[to]+' reclama il giullare: il prossimo attacco ignora le immunità');stuckCheck(s);return null}
function doSolo(s,k){if(s.n!==1||s.jl<1)return 'Nessun giullare disponibile';if(s.phase!=='play')return 'Non ora';if(!BASE.includes(k)||!k)return 'Scegli una classe';
 s.jl--;s.uj++;const id='XS'+k;s.played.push(id);s.mats[0].push(id);s.yr=0;s.pend={cards:[id],add:[],dev:0,ign:true,p:0};
 E(s,{t:'play',p:0,c:[id]});L(s,'Giullare come '+CL[k].n+': forza 8, senza immunità');resolve(s);return null}
function doSacr(s,c,k){if(!s.stacks)return 'In questa missione non ci sono compagni dispersi';if(s.phase!=='play')return 'Non ora';if(s.sac)return 'Un solo sacrificio per turno';
 const h=s.hands[s.cur];if(!h.includes(c))return 'Carta non valida';const st=s.stacks[k];if(!st||!st.length)return 'Pila vuota';
 h.splice(h.indexOf(c),1);s.ban.push(c);const r=st.pop();s.disc.push(r);s.sac=true;E(s,{t:'sacr',c,r});L(s,s.names[s.cur]+' sacrifica '+nm(s,c)+': '+nm(s,r)+' torna negli scarti');return null}
function act(st,a){if(st.over)return{err:'Missione finita'};const s=clone(st);s.ev=[];let e;
 if(s.phase==='prep')e=prepAct(s,a);
 else switch(a.t){case'play':e=doPlay(s,a.cards,a.dev);break;case'yield':e=doYield(s);break;case'discard':e=doDisc(s,a.cards);break;case'feign':e=doFeign(s);break;
  case'pick':e=doPick(s,a.to);break;case'mago':e=doMago(s,a.c==null?null:a.c);break;case'solo':e=doSolo(s,a.k);break;case'sacr':e=doSacr(s,a.c,a.k|0);break;default:e='Azione sconosciuta'}
 if(e)return{err:e};s.evn=(s.evn||0)+1;return{s}}
/* ---------- aiuti per vista e bot ---------- */
function preview(s,cards,dev){if(checkPlay(s,cards))return null;const ds=cards.map(c=>D(s,c));if(cards.length===1&&ds[0].k==='x')return{jester:true};
 const{act,blk}=powers(s,cards,s.jx);const atk=atkOf(s,cards);let mult=(act.G?2:1)*(act.R?2:1);
 return{atk,dmg:atk*mult,mult,heal:act.C?atk:0,druid:!!act.D,draw:act.B?atk:0,chant:act.T?Math.ceil(atk/2):0,shield:act.P?atk:0,guard:!!act.S,mage:!!act.M,devour:!!act.R,blk,ign:!!s.jx,
  corr:cards.filter(c=>s.corr.includes(c)).length}}
function bestDiscard(s){const h=s.hands[s.cur],n=h.length;let best=null;
 for(let m=1;m<1<<n;m++){let t=0,k=0,j=0;for(let i=0;i<n;i++)if(m>>i&1){t+=val(s,h[i]);k++;if(D(s,h[i]).k==='x')j++}if(t<s.owed)continue;
  const key=(t-s.owed)*100+k*10+j*500;if(!best||key<best.key)best={key,m}}
 return best?h.filter((_,i)=>best.m>>i&1):[]}
const count=s=>{let t=s.res.length+s.disc.length+s.ban.length+s.played.filter(c=>!/^XS/.test(c)).length+s.rev.length+s.mz.length+s.hands.reduce((a,h)=>a+h.length,0);
 if(s.stacks)t+=s.stacks.reduce((a,x)=>a+x.length,0);t+=s.castle.filter(e=>e.card).length+(s.en&&s.en.card?1:0);return t};
return{def:D,newGame,act,checkPlay,preview,bestDiscard,effStr,atkOf,powers,canFeign,count,newCamp,setupCamp,nm,val,
 CL,CAT,MIS,LIB,REL,BANE,MERC,HL,JN,BASE40,tri,clone,setRnd:f=>{RND=f}}})();
if(typeof module!=='undefined'&&module.exports)module.exports=RLEG;
