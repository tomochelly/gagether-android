// Vite can leave old hashed chunks after a multi-environment build. Retain every
// chunk reachable from runtime entrypoints, manifests and non-hashed JS modules.
// Restrict removal to generated hashed JS; artwork and build ID manifests stay.
import {readdirSync,readFileSync,unlinkSync} from 'node:fs';
import {join,basename} from 'node:path';
export function pruneGeneratedChunks(root='dist') {
 const files=[];
 function walk(dir){for(const e of readdirSync(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory())walk(p);else files.push(p);}}
 walk(root);
 const generated=p=>p.includes('/_next/static/')&&/-[A-Za-z0-9_-]{8,}\.js$/.test(p);
 const js=files.filter(p=>/\.m?js$/.test(p)),byName=new Map();
 for(const p of js){const name=basename(p);byName.set(name,[...(byName.get(name)||[]),p]);}
 const refs=p=>[...readFileSync(p,'utf8').matchAll(/[A-Za-z0-9_~.-]+\.m?js/g)].flatMap(m=>byName.get(m[0])||[]);
 const pending=js.filter(p=>!generated(p));
 for(const p of files.filter(p=>p.endsWith('.json')&&!p.includes('/.vite/')))pending.push(...refs(p));
 const live=new Set();
 while(pending.length){const p=pending.pop();if(live.has(p))continue;live.add(p);pending.push(...refs(p));}
 let bytes=0,count=0;
 for(const p of js)if(generated(p)&&!live.has(p)){bytes+=readFileSync(p).length;unlinkSync(p);count++;}
 console.log(JSON.stringify({prunedUnreachableChunks:count,bytes}));
}
if(process.argv[1]?.endsWith('/prune-generated-chunks.mjs'))pruneGeneratedChunks(process.argv[2]||'dist');
