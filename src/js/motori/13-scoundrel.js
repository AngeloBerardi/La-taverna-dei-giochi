/* SCOUNDREL – solitario di carte (Zach Gage e Kurt Bieg, 2011). Mazzo da 44 carte: fiori e picche 2-A (mostri), quadri 2-10 (armi), cuori 2-10 (pozioni). Vita 20. */
const SCOUN=(()=>{
let RND=Math.random;const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(RND()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const val=c=>+c.slice(1),suit=c=>c[0],isMon=c=>c[0]==='C'||c[0]==='S';
const NAMES={11:'J',12:'Q',13:'K',14:'A'};const rk=v=>NAMES[v]||String(v);
function deck(){const d=[];for(const s of'CS')for(let v=2;v<=14;v++)d.push(s+v);for(const s of'DH')for(let v=2;v<=10;v++)d.push(s+v);return d}
const L=(s,t)=>{s.log.push(t);if(s.log.length>40)s.log.shift()};
function deal(s){while(s.room.length<4&&s.dungeon.length)s.room.push(s.dungeon.shift());s.took=0;s.need=s.room.length>=4?3:s.room.length;s.potion=false}
function newGame(n,names,o={}){const s={n:1,names:names.slice(0,1),cur:0,hands:[[]],log:[],ev:[],evn:0,over:null,life:20,max:20,dungeon:shuffle(deck()),room:[],weapon:null,took:0,need:3,potion:false,ranLast:false,discard:[],lastPot:0};deal(s);L(s,'Il dungeon vi attende: 20 punti vita');return s}
function finish(s,win){let sc;if(win){sc=s.life;if(s.life===20&&s.lastPot)sc+=s.lastPot}else{sc=s.life-[...s.dungeon,...s.room].filter(isMon).reduce((a,c)=>a+val(c),0)}
 s.over={win,scores:[sc],lvl:0,reason:win?'Avete ripulito il dungeon':'Siete caduto nel dungeon'};s.phase='summary';s.ev.push({t:'end',win,sc})}
function canWeapon(s,c){return !!s.weapon&&(s.weapon.last==null||val(c)<=s.weapon.last)}
function act(st,a){const s=JSON.parse(JSON.stringify(st));if(s.over)return{err:'Partita finita'};s.ev=[];
 if(a.t==='run'){if(s.took>0)return{err:'Non puoi scappare da una stanza già iniziata'};if(s.ranLast)return{err:'Non puoi scappare due stanze di fila'};if(s.room.length<4||!s.dungeon.length)return{err:'Non puoi scappare adesso'};
  s.dungeon.push(...s.room);s.room=[];s.ranLast=true;s.ev.push({t:'run'});L(s,'Scappate dalla stanza: le carte finiscono in fondo al mazzo');deal(s);s.evn++;return{s}}
 if(a.t==='take'){const i=a.i,c=s.room[i];if(c==null)return{err:'Carta non valida'};const v=val(c);let dmg=0;s.lastPot=0;
  if(suit(c)==='D'){if(s.weapon)s.discard.push(s.weapon.c,...s.weapon.stack);s.weapon={c,stack:[],last:null};s.ev.push({t:'weapon',c});L(s,'Equipaggiate un’arma da '+v)}
  else if(suit(c)==='H'){s.lastPot=v;if(s.potion){s.ev.push({t:'potion',c,heal:0});L(s,'Seconda pozione nella stanza: sprecata')}else{const h=Math.min(s.max,s.life+v)-s.life;s.life+=h;s.potion=true;s.ev.push({t:'potion',c,heal:h});L(s,'Pozione: +'+h+' vita')}s.discard.push(c)}
  else{if(a.weapon){if(!canWeapon(s,c))return{err:s.weapon?'L’arma può colpire solo mostri di valore ≤ '+s.weapon.last:'Non hai un’arma'};dmg=Math.max(0,v-s.weapon.c.slice(1));s.weapon.stack.push(c);s.weapon.last=v}else{dmg=v;s.discard.push(c)}
   s.life-=dmg;s.ev.push({t:'fight',c,dmg,weapon:!!a.weapon});L(s,'Mostro '+rk(v)+(a.weapon?' (con arma)':' (a mani nude)')+': −'+dmg+' vita')}
  s.room.splice(i,1);s.took++;s.evn++;
  if(s.life<=0){s.life=0;finish(s,false);return{s}}
  if(s.took>=s.need){s.ranLast=false;s.potion=false;if(!s.dungeon.length&&!s.room.length){finish(s,true);return{s}}deal(s);if(!s.room.length){finish(s,true)}}
  return{s}}
 return{err:'Azione sconosciuta'}}
return{newGame,act,setRnd:f=>{RND=f},val,suit,isMon,rk,canWeapon,deck}})();
if(typeof module!=='undefined')module.exports=SCOUN;
