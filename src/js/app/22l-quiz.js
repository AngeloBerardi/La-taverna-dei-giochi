/* ================= QUIZ DELLA TAVERNA (percorso circolare a domande) ================= */
const QPC=['#e8453c','#2f9bd8','#f2b81c','#3aa05a','#9a5fd0','#e8782a'];
const qcol=c=>DOMANDE.CATS[c].c;
function quizBoardH(s){const C=170,R=146,pos=p=>{const a=p/QUIZ.SQ*2*Math.PI-Math.PI/2;return[C+R*Math.cos(a),C+R*Math.sin(a)]};
 const dst=s.phase==='move'&&myTurn()?QUIZ.dests(s):[];let o=`<svg class="qb" viewBox="0 0 340 340" role="img" aria-label="Percorso">`;
 for(let p=0;p<QUIZ.SQ;p++){const k=QUIZ.sq(p),[x,y]=pos(p),d=dst.find(z=>z.to===p);
  const fill=k.h!=null?qcol(k.h):k.r?'#2b2118':qcol(k.c),r=k.h!=null?13:8.5;
  o+=`<g ${d?`data-a="qmove" data-v="${d.dir}" class="qd" role="button" tabindex="0"`:''}>`+
   (k.r?`<rect x="${x-8}" y="${y-8}" width="16" height="16" transform="rotate(45 ${x} ${y})" fill="${fill}" stroke="#f2b81c" stroke-width="2"/><text x="${x}" y="${y+3.5}" class="qt">↻</text>`:
    `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${d?'#fff':'#0009'}" stroke-width="${d?3:2}"/>`+(k.h!=null?`<circle cx="${x}" cy="${y}" r="${r-4}" fill="none" stroke="#fff9" stroke-width="1.5"/>`:''))+
   (d?`<circle cx="${x}" cy="${y}" r="${r+6}" fill="none" stroke="#fff" stroke-width="2" class="qpulse"/>`:'')+`</g>`}
 const at={};s.pos.forEach((p,i)=>{(at[p]=at[p]||[]).push(i)});
 for(const p in at){const [x,y]=pos(+p),l=at[p];l.forEach((i,j)=>{const a=j/l.length*2*Math.PI,ox=l.length>1?Math.cos(a)*6:0,oy=l.length>1?Math.sin(a)*6:0;
  o+=`<g class="qtok ${i===s.cur&&!s.over?'act':''}"><circle cx="${x+ox}" cy="${y-14+oy}" r="8.5" fill="${QPC[i%6]}" stroke="#fff" stroke-width="2"/><text x="${x+ox}" y="${y-11+oy}" class="qt tk">${esc((s.names[i][0]||'?').toUpperCase())}</text></g>`})}
 o+=`</svg>`;
 const dots=i=>DOMANDE.CATS.map((c,k)=>`<i style="background:${s.wedge[i]&(1<<k)?c.c:'#0000'};border-color:${c.c}"></i>`).join('');
 const q=s.q;
 const mid=`<div class="qmid"><div class="qdie">${s.phase==='move'?`<b>${s.roll}</b>`:s.phase==='roll'?'<b>'+ic('dado',40)+'</b>':s.phase==='ask'?`<i style="color:${qcol(q.cat)}">${DOMANDE.CATS[q.cat].n}</i>`:'<b>★</b>'}</div><div class="qwed">${dots(s.cur)}</div><small>${esc(s.names[s.cur])}</small></div>`;
 return`<div class="qwrap">${o}${mid}</div>`}
function quizH(){if(ui.tv)return quizTVH();const s=G,mine=myTurn()&&!s.over,ph=s.phase,q=s.q;
 const chips=`<span class="chip">${esc(s.names[s.cur])}${s.phase==='pick'?' sceglie la categoria':''}</span>${s.final||(q&&q.final)?'<span class="chip pal">Domanda finale</span>':''}`;
 const strip=stripH(s,i=>({c:QPC[i%6],b:QUIZ.wedges(s,i)+'/6'}));
 const pl=s.names.map((n,i)=>`<div class="pl ${i===s.cur&&!s.over?'act':''}"><div class="av" style="background:${QPC[i%6]}">${esc(n[0]||'?')}</div><span class="n">${esc(n)}${seatTag(i)}</span><span class="hc qwed">${DOMANDE.CATS.map((c,k)=>`<i style="background:${s.wedge[i]&(1<<k)?c.c:'#0000'};border-color:${c.c}"></i>`).join('')}</span></div>`).join('');
 let ctl='',body='';
 if(ph==='ask'&&q){body=`<div class="qq" style="--qc:${qcol(q.cat)}"><small>${DOMANDE.CATS[q.cat].n}${q.final?' · FINALE':''}</small><b>${esc(q.t)}</b></div>`;
  ctl=`<div class="qans">${q.o.map((t,k)=>`<button class="b ${mine?'disc':'disc dimm'}" ${mine?`data-a="qans" data-v="${k}"`:'disabled'}>${esc(t)}</button>`).join('')}</div>`}
 else if(ph==='roll'&&mine)ctl=`<button class="b play" data-a="qroll">${ic('dado',18)} Tira il dado</button>`;
 else if(ph==='pick'&&mine)ctl=`<div class="qpick">${DOMANDE.CATS.map((c,k)=>`<button class="b sm" style="background:${c.c};color:#fff" data-a="qpick" data-v="${k}">${c.n}</button>`).join('')}</div>`;
 const hint=mine?(ph==='roll'?'Tira il dado.':ph==='move'?`Hai fatto ${s.roll}: tocca una delle due caselle che brillano sul percorso (avanti o indietro).`:ph==='ask'?'Scegli la risposta giusta.':ph==='pick'?`Scegli la categoria della domanda finale per ${esc(s.names[s.who])}.`:''):'';
 const end=s.over&&!ui.anim?`<div class="modal late" style="--late:${(.6*SP).toFixed(2)}s"><div class="box endbox win"><div class="crown">${ic('corona',48)}</div><h2>Vince ${esc(s.names[s.over.win])}!</h2><div class="scores">${s.names.map((n,i)=>`<div class="${i===s.over.win?'w':''}"><span>${esc(n)}</span><b>${s.over.scores[i]}</b><small>spicchi</small></div>`).join('')}</div><div class="col"><button class="b play" data-a="rematch">Rivincita</button><button class="b disc" data-a="tolobby">Torna alla stanza</button></div></div></div>`:'';
 const bub=s.over||ui.anim?`<div class="bubble"><span class="nar">${esc(s.log[s.log.length-1]||'')}</span>&nbsp;</div>`:`<div class="bubble ${mine?'me':''}"><span class="nar">${esc(s.log[s.log.length-1]||'')}</span>${mine?`<b>${esc(s.names[s.cur])}</b>, tocca a te!`:`Tocca a <b>${esc(s.names[s.cur])}</b><span class="dots"></span>`}${mine&&hint?`<small>${hint}</small>`:''}${ui.busy?'<small>invio mossa…</small>':''}</div>`;
 return fixH({title:'Quiz della Taverna',chips,strip,mid:quizBoardH(s),bot:body+bub+`<div class="ctl kctl">${ctl}</div>`,players:pl,end})}
function quizClick(a,v){if(!myTurn())return;
 if(a==='qroll')return dispatch({t:'roll'});
 if(a==='qmove')return dispatch({t:'move',dir:+v});
 if(a==='qans')return dispatch({t:'answer',k:+v});
 if(a==='qpick')return dispatch({t:'pick',cat:+v})}
const QZFX={async pre(){return{}},async run(prev,ns){for(const e of ns.ev){
  if(e.t==='roll'){Snd.play('dice');await W(450)}
  else if(e.t==='move'){Snd.play('deal');await W(300)}
  else if(e.t==='answer'){Snd.play(e.ok?'redeem':'err');await W(350)}
  else if(e.t==='wedge'){Snd.play('redeem');await W(300)}
  else if(e.t==='final'){Snd.play('whoosh');await W(300)}}
  endFx(ns)}};
