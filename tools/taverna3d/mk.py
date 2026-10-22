# Genera src/js/app/12c-lobby-3d.js e src/css/90-lobby-3d.css dai sorgenti di questa cartella.
# three.js r128 sta in src/js/vendor/09c-three.min.js (non toccare).
import re,json,shutil,os
import os
D=os.path.dirname(os.path.abspath(__file__))+'/'
REPO=os.path.abspath(D+'../..')+'/'
rd=lambda f:open(D+f).read()
core=rd('core.js');core=core[core.index('/* ---------- texture procedurali'):]
inner='\n'.join([rd('pre.js'),core,rd('fig.js'),rd('fire.js'),rd('main1.js'),rd('main2.js'),rd('catalog.js'),rd('main2e.js'),rd('main2f.js'),rd('music.js'),rd('page.js'),rd('eng0.js'),rd('eng.js')])
inner=inner.replace("$('toast')","$('l3dtoast')")
mark=rd('markup.html').strip().replace('id="toast"','id="l3dtoast"').replace('`','\\`')
js="""/* ---- La Taverna 3D: ingresso, locanda e boschetto (estetica di base della lobby) ----
   Solo aspetto e interazioni della lobby: legge stanza, membri, ospiti, chat ed emote dallo stato dell'app
   e usa le sue azioni (setname, addguest, join, copy, chatsend, emo, rules…) e startGame per avviare le partite.
   Motori, viste dei giochi e rete non sono toccati. Senza WebGL o se il 3D è troppo lento si torna al falò (modalità semplice).
   Generato da tools/taverna3d/mk.py (python3 tools/taverna3d/mk.py): le parti 3D vengono da lì. */
window.__L3D=(()=>{
 const A={
  R:()=>R,ME:()=>ME,ui:()=>ui,members:()=>members(),seats:()=>lobbySeats(),games:()=>GAMES,
  info:g=>tvInfo(g),box:id=>(typeof TVB!=='undefined'&&TVB[id])||null,cat:k=>TVC[k],avc:()=>AVC,avs:()=>AVS,
  ST:(k,v)=>ST(k,v),Snd:()=>Snd,inv:()=>INV,defOpts:id=>defOpts(id),
  busy:()=>!!(R.on&&R.doc&&R.doc.phase==='play'),
  canResume:()=>{if(R.on)return false;try{return!!(JSON.parse(ST('rg-off')||'null')||{}).game}catch(e){return false}},
  save:()=>saveMine(),savePos:()=>savePos(),start:(id,o)=>startGame(id,null,o),
  act:(a,v)=>{const b=document.createElement('button');b.type='button';b.hidden=true;b.dataset.a=a;if(v!=null)b.dataset.v=v;(A.root||document.body).appendChild(b);b.click();b.remove()},
  duck:v=>{if(Snd.duck)Snd.duck(v)},audioKick:()=>{if(Snd.mus)Snd.start()},
  fallback:msg=>{state='fail';ui.lobby='iso';ST('rg-lb','iso');ui.err=msg;hide();render()}
 };
 let E=null,state='idle',wrap=null;
 const hasGL=()=>{try{const c=document.createElement('canvas');return!!(window.WebGLRenderingContext&&(c.getContext('webgl')||c.getContext('experimental-webgl')))}catch(e){return false}};
 function boot(){
  if(state!=='idle')return state==='ready';
  if(!window.THREE||!hasGL()){state='fail';return false}
  try{
   wrap=document.createElement('div');wrap.id='l3d';wrap.innerHTML=`"""+mark+"""`;document.body.appendChild(wrap);A.root=wrap.querySelector('#l3dapp');
   E=(function(A){
"""+inner+"""
   })(A);
   state='ready';return true;
  }catch(e){console.error('Taverna 3D',e);state='fail';if(wrap)wrap.remove();wrap=null;return false}
 }
 function hide(){if(E)E.hide();if(wrap)wrap.style.display='none'}
 return{
  ok:()=>state==='ready'||(state==='idle'&&!!window.THREE&&hasGL()),
  show:screen=>{if(!boot()){if(ui.lobby==='3d'){ui.lobby='iso';render()}return}wrap.style.display='';E.show(screen)},
  hide,dbg:()=>E,sync:()=>{if(E&&wrap&&wrap.style.display!=='none')E.sync()},
 };
})();
"""
open(REPO+'src/js/app/12c-lobby-3d.js','w').write(js)
# CSS con ambito #l3d
css=rd('head.html');css=css[css.index('<style>')+7:css.index('</style>')]+'\n'+rd('extra.css')
def scope(block):
    out=[];i=0
    while i<len(block):
        j=block.find('{',i)
        if j<0:break
        sel=block[i:j].strip()
        if sel.startswith('@media'):
            d=1;k=j+1
            while d:
                if block[k]=='{':d+=1
                elif block[k]=='}':d-=1
                k+=1
            out.append(sel+'{'+scope(block[j+1:k-1])+'}');i=k;continue
        k=block.find('}',j);body=block[j+1:k];i=k+1
        if sel.startswith('@keyframes'):
            d=1;k2=j+1
            while d:
                if block[k2]=='{':d+=1
                elif block[k2]=='}':d-=1
                k2+=1
            out.append(block[block.rfind('\n',0,j)+1 if False else i-len(block[i-len(body)-2:i])-len(sel) :k2]);i=k2;continue
        parts=[]
        for p in sel.split(','):
            p=p.strip()
            if p in('html','body'):continue
            if p==':root':parts.append('#l3d');continue
            if p=='*':parts.append('#l3d *');continue
            p=p.replace('#app','#l3dapp')
            parts.append(p if p.startswith('#l3dapp') else '#l3d '+p)
        if parts:out.append(','.join(parts)+'{'+body+'}')
    return '\n'.join(out)
css=css.replace('#toast','#l3dtoast')
sc=scope(css)
sc="/* ---- La Taverna 3D (12c-lobby-3d.js): stile con ambito #l3d ---- */\n#l3d *,#l3d *::before,#l3d *::after{all:revert}\n#l3d [hidden]{display:none!important}\n#l3d{position:fixed;inset:0;z-index:80;background:#07060d}\n#l3d #l3dapp{max-width:560px!important}\n"+sc+"\n#l3d .hint{}\n"
open(REPO+'src/css/90-lobby-3d.css','w').write(sc)

print(len(js),len(sc))
