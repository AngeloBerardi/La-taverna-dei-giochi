#!/usr/bin/env node
// Costruisce e controlla la sintassi dello script. Esce con errore se qualcosa non va.
const fs = require('fs'), path = require('path'), cp = require('child_process');
cp.execFileSync('node', [path.join(__dirname, 'build.js')], { stdio: 'inherit' });
const html = fs.readFileSync(path.join(__dirname, '../dist/index.html'), 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
let bad = 0;
scripts.forEach((m, i) => { try { new Function(m[1]); } catch (e) { bad++; console.error(`script ${i}: ${e.message}`); } });
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/manifest.json'), 'utf8'));
const missing = manifest.filter(f => !fs.existsSync(path.join(__dirname, '..', f)));
if (missing.length) { bad++; console.error('nel manifest ma assenti:', missing.join(', ')); }
console.log(bad ? 'CHECK FALLITO' : `OK: ${scripts.length} script, sintassi valida`);
process.exit(bad ? 1 : 0);
