/* ================= REGISTRI ================= */
const VIEW={regicide:()=>regicideH(),briscola:briscolaH,scopa:scopaH,burraco:burracoH,gang:gangH,saboteur:sabotH,azul:azulH,island:islandH,machiavelli:machH};
const FX={regicide:{pre:regPre,run:(p,n,o)=>runFx(n.ev,o)},briscola:BRFX,scopa:SCFX,burraco:BUFX,gang:GAFX,saboteur:SBFX,azul:AZFX,island:ISFX,machiavelli:MAFX};
function gameClick(a,v){({regicide:regClick,briscola:brisClick,scopa:scopaClick,burraco:burClick,gang:gangClick,saboteur:sabClick,azul:azClick,island:islClick,machiavelli:machClick})[G.g](a,v)}

(()=>{const em=$('.embers');if(RM)return;for(let i=0;i<14;i++){const d=document.createElement('i');d.style.left=Math.random()*100+'%';d.style.animationDuration=9+Math.random()*10+'s';d.style.animationDelay=-Math.random()*15+'s';em.appendChild(d)}})();
window.__rg={get G(){return G},ui,R,ME,dispatch,render,local,myTurn,viewer,needCover,isMine,get Q(){return Q},set SP(v){SP=v}};
if(ME.name)enterHub();else{ui.screen='name';render()}

