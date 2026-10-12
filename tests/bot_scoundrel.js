// Bot di Scoundrel: prova tutte le sequenze nella stanza (ordine, arma o mani nude) e valuta lo stato finale
// con vita + pozioni rimaste − stima del danno dei mostri rimasti (conta solo carte note a un giocatore che tiene il conto).
const S=require('../src/js/motori/13-scoundrel.js');
const P={a:.5,p:.4,run:9};
function evalS(s){if(s.over)return s.over.win?1000+s.over.scores[0]:-1000+s.life;
 const rest=[...s.room,...s.dungeon],ws=rest.filter(c=>c[0]==='D').map(S.val);
 const w=s.weapon?+s.weapon.c.slice(1):0,cap=s.weapon?(s.weapon.last==null?99:s.weapon.last):0;
 const wav=ws.length?ws.reduce((a,b)=>a+b)/ws.length:0;let dmg=0,pot=0;
 for(const c of rest){const v=S.val(c);if(S.isMon(c))dmg+=v<=cap?Math.max(0,v-w):Math.max(0,v-Math.max(wav*.8,v<=cap?w:0));else if(c[0]==='H')pot+=v}
 return s.life+P.p*pot-P.a*dmg}
function plan(s){let best={v:-1e9,a:null};
 (function dfs(st,first){for(let i=0;i<st.room.length;i++){const c=st.room[i];const opts=S.isMon(c)&&S.canWeapon(st,c)?[true,false]:[false];
  for(const w of opts){const r=S.act(st,{t:'take',i,weapon:w});if(r.err)continue;const a=first||{t:'take',i,weapon:w};
   if(r.s.over||r.s.took===0){const v=evalS(r.s);if(v>best.v)best={v,a}}else dfs(r.s,a)}}})(s,null);
 return best}
function move(s){const b=plan(s);
 if(!s.ranLast&&s.took===0&&s.room.length===4&&s.dungeon.length&&b.v<evalS(s)-P.run)return{t:'run'};
 return b.a}
module.exports={move,plan,P};
