const S=require('../src/js/motori/13-scoundrel.js');let w=0,l=0,f=0;
for(let g=0;g<3000;g++){let s=S.newGame(1,['a']),k=0;while(!s.over&&k++<500){let a;
 if(!s.ranLast&&s.took===0&&s.room.length===4&&Math.random()<.2)a={t:'run'};else{const i=Math.floor(Math.random()*s.room.length),c=s.room[i];a={t:'take',i,weapon:S.isMon(c)&&S.canWeapon(s,c)&&Math.random()<.8}}
 const r=S.act(s,a);if(r.err){console.log('ERR',r.err,a);f++;break}s=r.s}
 if(!s.over){f++;console.log('no end')}else s.over.win?w++:l++}
console.log({w,l,f});process.exit(f?1:0)
