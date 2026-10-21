/* ---- Regicide sullo schermo comune (?tv=CODICE): vista pensata per una TV, non il telefono ingrandito ----
   Si usa quando ui.tv è vero (vedi regicideH in 13-regicide.js). Mostra solo informazioni pubbliche: niente mani,
   solo il numero di carte di ciascuno; del Castello solo il grado dei nemici futuri, mai il seme (il mazzo è coperto). */
const RTV={
 // percorso dei 12 nemici: 4 Fanti, 4 Regine, 4 Re. Sconfitti = spuntati, attuale = acceso (con seme), futuri = solo grado
 percorsoH(s){const fatti=s.en?12-s.castle.length-1:12,cur=s.en?P(s.en.c):null;
  return'<div class="rtv-path" aria-label="Percorso nel castello">'+Array.from({length:12},(_,i)=>{const r='JQK'[Math.floor(i/4)],stato=i<fatti?'done':i===fatti&&s.en?'now':'next';
   return`<span class="${stato} r${r}">${stato==='now'?r+SYM[cur.s]:r}</span>`}).join('')+'</div>'},
 stato(s){const n=esc(s.names[s.cur]);
  if(s.over)return s.over.win?'Il castello è liberato':'Il regno è perduto';
  if(s.phase==='discard')return`<b>${n}</b> deve scartare carte per <b>${s.owed}</b> punti`;
  if(s.phase==='pick')return`<b>${n}</b> ha giocato il Jolly: sceglie chi gioca dopo`;
  return`Tocca a <b>${n}</b>`},
 finaleH(s){if(!s.over)return'';const w=s.over.win,fatti=s.en?12-s.castle.length-1:12;
  return`<div class="rtv-end ${w?'win':'lose'}"><div class="rtv-endbox"><div class="rtv-crown">${ic(w?'corona':'teschio',72)}</div><h2>${w?'Regicidio compiuto!':'Il regno è perduto'}</h2>
   <p>${w?'Tutti e 12 i sovrani corrotti sono caduti.':esc(s.over.reason||'')}</p><p class="rtv-sub">Nemici sconfitti: ${fatti} su 12</p></div></div>`},
 legendaH(){return'<ul class="rtv-leg"><li><i class="H">♥</i><b>Cuori</b> curano: gli scarti tornano nella Taverna</li><li><i class="D">♦</i><b>Quadri</b> pescano carte</li><li><i class="C">♣</i><b>Fiori</b> fanno danno doppio</li><li><i class="S">♠</i><b>Picche</b> riducono l’attacco</li></ul>'}
};
function regicideTVH(){
 const s=G,en=ui.viewEn||s.en,url=TV.linkGioco(),d3=RTV3.sync(s,en);document.documentElement.dataset.rtv3=d3?'1':'';
 let boss='',head='REGICIDE';
 if(en){const rk=P(en.c).r,su=P(en.c).s,hp=RG.hpOf[rk],atk=RG.atOf[rk],eff=Math.max(0,atk-en.sh),left=Math.max(0,hp-en.dmg);
  head=`${ACTS[rk][0]} · ${ACTS[rk][1]} · nemico ${Math.min(12,12-s.castle.length)} di 12`;
  boss=`<div class="rtv-boss ${su}" id="boss"><div class="rtv-face">${cardH(en.c,{cls:'xl',boss:1,style:'--cw:min(29vh,17vw)'})}</div>
   <div class="rtv-info"><div class="rtv-name">${RN[rk]} di ${SN[su]}</div><div class="rtv-title">${esc(TITLES[en.c])}</div>
    <div class="rtv-imm ${en.can?'off':''}">${en.can?'Immunità annullata dal Jolly':'Immune ai '+SN[su].toLowerCase()+' '+SYM[su]+' · '+IMMTXT[su]}</div>
    <div class="rtv-hp"><i style="width:${left/hp*100}%"></i><b>${left}<small> / ${hp} vita</small></b></div>
    <div class="rtv-stats"><span><b>${eff}</b> attacco${en.sh?` <small>(−${en.sh} scudo)</small>`:''}</span><span><b>${en.dmg}</b> danno subito</span></div></div></div>`}
 const played=s.played.map(c=>{const nw=!seen.p.has(c);return cardH(c,{cls:nw?'pop':'',style:`--cw:min(11vh,6.4vw);--r:${(hash(c)%9)-4}deg`})}).join('')||'<span class="rtv-empty">Nessuna carta sul campo</span>';seen.p=new Set(s.played);
 const pls=s.names.map((n,i)=>`<li class="${i===s.cur&&!s.over?'act':''}"><span class="av">${esc(n[0]||'?')}</span><span class="n">${esc(n)}</span><span class="hc"><b>${s.hands[i].length}</b> carte</span></li>`).join('')+(s.n===1?`<li class="jk"><span class="av">J</span><span class="n">Jolly</span><span class="hc"><b>${s.jl}</b></span></li>`:'');
 const feed=s.log.slice(-5).reverse().map((t,i)=>`<li class="${i?'':'new'}">${esc(t)}</li>`).join('');
 return`<div class="rtv${d3?' d3':''}">
  <header class="rtv-top"><div><div class="rtv-logo">Regicide</div><div class="rtv-act">${head}</div></div>${d3?`<div class="rtv-state">${RTV.stato(s)}</div>`:''}
   <div class="rtv-join"><div class="rtv-qr">${QR.svg(url,{scuro:'#1a1208',chiaro:'#f6ecd2'})}</div><div><div class="rtv-code">${esc(R.code||TV.code)}</div><div class="rtv-hint">Inquadra per sederti al tavolo</div></div></div></header>
  ${d3?'':`<aside class="rtv-left">${RTV.percorsoH(s)}<div class="rtv-piles"><div><b>${s.castle.length}</b><small>Castello</small></div><div><b>${s.tav.length}</b><small>Taverna</small></div><div><b>${s.disc.length}</b><small>Scarti</small></div></div></aside>
  <main class="rtv-main">${boss}<div class="rtv-state">${RTV.stato(s)}</div><div class="rtv-field">${played}</div></main>`}
  <aside class="rtv-right"><ul class="rtv-pl">${pls}</ul><div class="rtv-lt">Cronaca</div><ul class="rtv-feed">${feed}</ul></aside>
  <footer class="rtv-foot">${RTV.legendaH()}</footer>${RTV.finaleH(s)}</div>`}
