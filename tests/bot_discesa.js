// Bot per Discesa Tascabile: prova le 6 assegnazioni dei dadi e, per ognuna, posizioni e ordini di attacco; simula la fase dei mostri e sceglie il risultato migliore.
const D=require('../src/js/motori/15-discesa-tascabile.js');
const PERM=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
function val(s){if(s.over)return s.over.win?1e6:-1e6+s.level*1000;if(s.phase==='levelup')return (s.level+1)*1e4+s.hero.hp*60;
 const ms=D.alive(s);let v=s.level*1e4+s.hero.hp*60-ms.reduce((a,m)=>a+m.hp*25+(m.lives>1?m.max*25:0),0);
 for(const m of ms)v-=Math.max(0,8-D.dist(m,s.hero))*.5;return v}
function attackAll(s){let g=0;for(;;){if(s.phase!=='hero'||g++>12)return s;const ms=D.alive(s);let best=null;
 ms.forEach((m,i)=>{const r=D.act(s,{t:'attack',m:i});if(!r.err){const v=-m.hp*10+(m.boss?5:0)-D.mStat(s,m,'def');if(!best||v>best.v)best={v,r}}});if(!best)return s;s=best.r.s}}
function heroPlans(s){const out=[];const P=D.paths(s,s.hero,D.leftS(s),(x,y)=>!D.monAt(s,x,y));
 const a0=attackAll(s);for(const base of[s,a0]){if(base.phase!=='hero'){out.push(base);continue}
  for(const k in P){const[x,y]=k.split(',').map(Number);let t=base;if(x!==base.hero.x||y!==base.hero.y){const r=D.act(base,{t:'move',x,y});if(r.err)continue;t=r.s}out.push(attackAll(t))}}return out}
function finish(t){if(t.phase!=='hero')return t;const r=D.act(t,{t:'end'});return r.s}
function bestTurn(s){let best=null;for(const o of PERM){const r=D.act(s,{t:'assign',order:o});if(r.err)continue;for(const t of heroPlans(r.s)){const f=finish(t);const v=val(f);if(!best||v>best.v)best={v,o,t}}}return best}
// gioca un intero turno partendo da fase energy; ritorna lo stato dopo la fase mostri (o levelup/fine)
function turn(s){if(s.phase==='levelup'){const h=s.hero;const st=h.hp<=3?'heal':h.A<=h.D&&h.A<6?'A':h.D<6?'D':h.S<6?'S':'heal';return D.act(s,{t:'up',stat:st}).s}
 const b=bestTurn(s);if(!b)throw new Error('nessuna mossa');return finish(b.t)}
module.exports={turn,val};
