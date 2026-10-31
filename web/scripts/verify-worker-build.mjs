import {readFileSync,readdirSync,existsSync,statSync} from 'node:fs';
const start=JSON.parse(readFileSync('.sites-runtime/build-start.json','utf8')),entry='dist/server/index.js';
if(start.root!==process.cwd()||!existsSync(entry)||statSync(entry).mtimeMs<start.startedAt-1000)throw Error('Worker entry was not rebuilt. Refusing to package mixed server/client output.');
const worker=readFileSync(entry,'utf8'),routes=[];function walk(dir){for(const item of readdirSync(dir,{withFileTypes:true})){const p=dir+'/'+item.name;if(item.isDirectory())walk(p);else if(/^route\.(?:ts|js|tsx|jsx|mts|mjs)$/.test(item.name))routes.push('/'+dir.replace(/^app\//,'').replace(/\[\.\.\.([^\]]+)\]/g,':$1+').replace(/\[([^\]]+)\]/g,':$1'));}}walk('app/api');
const missing=routes.filter(path=>!worker.includes('pattern:`'+path+'`')&&!worker.includes('pattern:"'+path+'"'));
if(missing.length)throw Error('Compiled Worker is missing current API routes: '+missing.join(', '));
const source=JSON.parse(readFileSync('public/source-manifest.json','utf8')),built=JSON.parse(readFileSync('dist/client/source-manifest.json','utf8'));if(source.fingerprint!==built.fingerprint)throw Error('Client source manifest differs from this build');
console.log(JSON.stringify({freshWorkerEntry:true,apiRoutesVerified:routes.length,sourceFingerprint:source.fingerprint}));
