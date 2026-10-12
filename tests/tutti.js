// Esegue tutti i test dei motori (tests/test_*.js) e si ferma al primo che fallisce.
const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const files=fs.readdirSync(__dirname).filter(f=>/^test_.*\.js$/.test(f)).sort();let ko=0;
for(const f of files){const t=Date.now();try{const out=execFileSync(process.execPath,[path.join(__dirname,f)],{encoding:'utf8'});console.log('✔',f,((Date.now()-t)/1000).toFixed(1)+'s');}
 catch(e){ko++;console.log('✘',f);console.log(String(e.stdout||'')+String(e.stderr||''))}}
console.log(ko?ko+' test falliti':'Tutti i test passati ('+files.length+')');process.exit(ko?1:0)
