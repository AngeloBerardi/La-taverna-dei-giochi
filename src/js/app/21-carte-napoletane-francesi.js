/* ================= CARTE NAPOLETANE E FRANCESI (BURRACO) ================= */
const ISU={C:'<path d="M4 3h16c0 5.5-3.2 8.6-6.5 9.3V17H17v2.5H7V17h3.5v-4.7C7.2 11.6 4 8.5 4 3z"/><path d="M6.5 5h11" stroke="rgba(255,255,255,.55)" stroke-width="1.2"/>',
 D:'<circle cx="12" cy="12" r="9.5"/><circle cx="12" cy="12" r="5.6" fill="none" stroke="rgba(255,255,255,.75)" stroke-width="1.6"/><circle cx="12" cy="12" r="2" fill="rgba(255,255,255,.85)"/>',
 S:'<path d="M12 1l2.6 3.2V15h-5.2V4.2z"/><rect x="6.5" y="15" width="11" height="2.4" rx="1.1"/><rect x="10.9" y="17.3" width="2.2" height="4"/><circle cx="12" cy="22.3" r="1.4"/>',
 B:'<path d="M10 22.5 10.8 7c0-1.8.4-3.3 1.3-4.6.7-1 2.1-1 2.7.1.8 1.4.6 3.1-.2 4.5l-.7 1.1 1 .9-1 1.4.9 1-.9 1.4.8.9-.9 1.3-1.2 10.5z"/><circle cx="12.3" cy="9.5" r=".9" fill="rgba(255,255,255,.6)"/>'};
const IFIG={F:'<svg viewBox="0 0 40 44"><circle cx="20" cy="11" r="7"/><path d="M7 43c0-12 6-19 13-19s13 7 13 19z"/><path d="M12 6 30 2l-3 6z"/><path d="M27 2l6-1-2 4z"/></svg>',
 C:'<svg viewBox="0 0 40 44"><path d="M9 42l4-13-6-5 3-9 9-9 3-4 2 6c7 3 10 10 9 18l-3 16z"/><path d="M22 4l3 8" stroke="var(--faceA)" stroke-width="1.5"/><circle cx="17" cy="16" r="1.8" fill="var(--faceA)"/></svg>',R:ART.K};
function icardH(id,o={}){if(!id||o.back)return cardH('',{back:1,cls:o.cls});const{r,s}=IT.P(id),a=o.attrs||'',st=o.style?`style="${o.style}"`:'',lab=r==='1'?'A':r,sv=pstyle?psv(s):`<svg viewBox="0 0 24 24">${ISU[s]}</svg>`;let inner;
 if('FCR'.includes(r))inner=pstyle?`<div class="pcart"><div class="pa">${pfig(r,s)}</div><div class="pa rv">${pfig(r,s)}</div></div>`:`<div class="art">${IFIG[r]}<em>${sv}</em></div>`;else if(r==='1')inner=`<div class="big1">${pstyle?'<i class="ring"></i>':''}${sv}</div>`;
 else inner=`<div class="pips">${PIPS[r].map(([x,y])=>`<b class="${y>.5?'f':''}" style="left:${x*50}%;top:${y*100}%">${sv}</b>`).join('')}</div>`;
 const dv=o.dv?`<div class="dv">${o.dv}</div>`:'';
 return`<div class="card it ${pstyle?'pc':''} i${s} ${o.cls||''}" ${a} ${st}><div class="ix"><span>${lab}</span><i>${sv}</i></div><div class="ix r"><span>${lab}</span><i>${sv}</i></div>${inner}${dv}</div>`}
function bcardH(id,o={}){if(!id||o.back)return cardH('',{back:1,cls:o.cls});const p=BURR.P(id);return cardH(p.j?'X1':p.rk+p.s,{...o,nofoil:true})}
const deckH=(n,extra='')=>`<div class="pile ${n?'':'empty'}" id="deck"><div class="stk">${[0,1,2].slice(0,Math.min(3,n)).map(()=>cardH('',{back:1})).join('')}</div>Mazzo${n?`<b>${n}</b>`:''}${extra}</div>`;
