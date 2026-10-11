const H=require('../src/js/motori/12-harvest-valley.js');let fails=0;
for(const n of [2,3,4,5])for(let g=0;g<200;g++){let s=H.newGame(n,Array.from({length:n},(_,i)=>'P'+i),{});let k=0;
 while(!s.over&&k++<200){const opts=[];const farm=s.farms[s.cur]>0;
  const sp=H.spots(s);const tries=[];
  s.market.forEach((c,i)=>{if(c.k==='weeds'){H.covers(s).forEach(q=>tries.push({t:'place',src:'m'+i,x:q[0],y:q[1]}))}else if(c.k==='tractor'){H.covers(s).forEach(q=>H.dests(s,...q).forEach(d=>tries.push({t:'place',src:'m'+i,x:q[0],y:q[1],to:d})))}else sp.forEach(q=>tries.push({t:'place',src:'m'+i,x:q[0],y:q[1]}))});
  if(farm)sp.forEach(q=>tries.push({t:'place',src:'farm',x:q[0],y:q[1]}));
  if(!tries.length){console.log('NO MOVES',n,s.market,Object.keys(s.grid).length);fails++;break}
  const a=tries[Math.floor(Math.random()*tries.length)];const r=H.act(s,a);if(r.err){console.log('ERR',r.err,a);fails++;break}s=r.s}
 if(!s.over){fails++;console.log('no end',n,k)}
 else if(g===0)console.log(n,'cells',Object.keys(s.grid).length,'/',s.cap,'scores',s.over.scores,'deck',s.deck.length)}
console.log(fails?'FAILS '+fails:'ALL OK');
process.exit(fails?1:0)
