
/* ================= pagina del gioco: tipo di partita, opzioni reali dell'app, regole ================= */
var PSEL={},PENDSEL='',PAGE=-1,COVERS=[];
function cover(i){if(!COVERS[i])COVERS[i]=boxTex(i).image.toDataURL();return COVERS[i]}
function okG(i,N){return GAMES[i].g.ok(N==null?curN():N)}
function optOf(i){var g=GAMES[i].g;if(!g.opts)return null;var u=A.ui();return (u.opts&&u.opts[g.id])||g.opts.vals[0][0]}
function selSummary(i){var G=GAMES[i],N=curN(),out=[G.g.ok(N)?G.g.mode(N):(G.r+' giocatori')];var o=G.g.opts,v=optOf(i);if(o)o.vals.forEach(function(x){if(x[0]===v)out.push(x[1])});return out.join(' · ')}
function isExp(o){return /edizion|espansion|avventur/i.test(o.label)}
function openPage(i){
  var G=GAMES[i],N=curN(),ok=okG(i,N);PAGE=i;
  $('gp-k').textContent=G.k;$('gp-img').src=cover(i);$('gp-img').alt='Scatola di '+G.t;$('gp-img').style.filter=ok?'':'grayscale(1) brightness(.6)';$('gp-t').textContent=G.t;
  $('gp-m').innerHTML='<span>'+esc(G.r)+(G.r==='1'?' giocatore':' giocatori')+'</span><span>'+esc(G.k)+'</span>'+(ok?'':'<span style="border-color:#c8434a;color:#ff9a8a">Non disponibile in '+N+'</span>');
  $('gp-d').textContent=G.s;
  var o=G.g.opts,h='<div class="gopt"><div class="gol"><span>Tipo di partita</span><b>'+esc(ok?G.g.mode(N):'Servono '+G.r+' giocatori')+'</b></div>';
  if(o){var cur=optOf(i);h+='<div class="gol"><span>'+(isExp(o)?'Espansione · ':'')+esc(o.label)+'</span><div class="gch">'+o.vals.map(function(v){return '<button type="button" data-k="'+o.k+'" data-v="'+esc(v[0])+'" class="'+(v[0]===cur?'on':'')+'">'+esc(v[1])+'</button>'}).join('')+'</div></div>'}
  if(!o||!isExp(o))h+='<div class="gol"><span>Espansione</span><b class="mut">Nessuna espansione disponibile</b></div>';
  $('gp-o').innerHTML=h+'</div>';
  [].forEach.call($('gp-o').querySelectorAll('.gch button'),function(b){b.onclick=function(){var u=A.ui();u.opts=u.opts||{};u.opts[G.id]=b.dataset.v;[].forEach.call(b.parentNode.children,function(x){x.classList.toggle('on',x===b)})}});
  $('gp-v').style.display='';$('gp-v').textContent='Regole';
  var busy=A.busy();
  $('gp-go').disabled=!ok||!!busy;$('gp-go').style.opacity=ok&&!busy?1:.4;$('gp-go').textContent=busy?'Partita in corso':ok?'Proponi al tavolo':'Servono '+G.r;
  $('gpage').classList.add('on');$('gpage').setAttribute('aria-hidden','false');$('gpage').scrollTop=0;
}
function closePage(){$('gpage').classList.remove('on');$('gpage').setAttribute('aria-hidden','true');if(cur&&cur.unpop)cur.unpop();PAGE=-1}
function closeList(){$('glist').classList.remove('on');$('glist').setAttribute('aria-hidden','true')}
$('gl-x').onclick=closeList;$('gp-x').onclick=closePage;
$('gp-v').onclick=function(){if(PAGE>=0)A.act('rules',GAMES[PAGE].id)};
$('gp-go').onclick=function(){if(PAGE<0)return;var i=PAGE;if(!okG(i)||A.busy())return;PENDSEL=selSummary(i);closePage();closeList();E.propose(i);PENDSEL=''};
$('glq').addEventListener('input',function(){var q=this.value.trim().toLowerCase();[].forEach.call($('gl-grid').children,function(el){if(el.dataset.i!=null)el.style.display=!q||GAMES[+el.dataset.i].t.toLowerCase().indexOf(q)>=0?'':'none';else el.style.display=q?'none':''})});
