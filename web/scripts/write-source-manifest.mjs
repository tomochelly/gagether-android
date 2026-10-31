import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,readdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const all=[];function walk(dir){if(!existsSync(dir))return;for(const e of readdirSync(dir,{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())walk(p);else if(/\.(ts|tsx|json|css|js|mjs)$/.test(p))all.push(p);}}
for(const dir of ['app','components','lib','content','build'])walk(dir);
const migrations=existsSync('drizzle')?readdirSync('drizzle').filter(p=>p.endsWith('.sql')).map(p=>'drizzle/'+p):[];
const files=[...all,...migrations,...['db/schema.ts','drizzle/meta/_journal.json','package.json','pnpm-lock.yaml','vite.config.ts','.openai/hosting.json'].filter(existsSync)].sort();
const entries=files.map(path=>({path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')}));
const fingerprint=createHash('sha256').update(JSON.stringify(entries)).digest('hex');mkdirSync('public',{recursive:true});writeFileSync('public/source-manifest.json',JSON.stringify({version:1,fingerprint,entries})+'\n');console.log('Runtime source fingerprint:',fingerprint);
