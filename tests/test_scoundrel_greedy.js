const S=require('../src/js/motori/13-scoundrel.js');let w=0,l=0,sc=[];
for(let g=0;g<3000;g++){let s=S.newGame(1,['a']),k=0;while(!s.over&&k++<500){
 let a;if(!s.ranLast&&s.took===0&&s.room.length===4&&s.room.filter(c=>S.isMon(c)).reduce((x,c)=>x+S.val(c),0)>38)a={t:'run'};
 else{const rm=s.room.map((c,i)=>({c,i}));const score=({c})=>S.suit(c)==='D'?0:S.suit(c)==='H'?(s.life<14&&!s.potion?1:9):(S.canWeapon(s,c)?2+(14-S.val(c))*0.01:5+S.val(c));rm.sort((x,y)=>score(x)-score(y));const {c,i}=rm[0];a={t:'take',i,weapon:S.isMon(c)&&S.canWeapon(s,c)}}
 const r=S.act(s,a);if(r.err){console.log('ERR',r.err,a);break}s=r.s}
 s.over&&s.over.win?w++:l++;sc.push(s.over.scores[0])}
console.log({w,l,avg:sc.reduce((a,b)=>a+b)/sc.length});
