import {execFileSync} from 'node:child_process';
import {readFileSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
const files=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8'}).split('\0').filter(Boolean).filter(p=>!p.startsWith('reference/')&&!p.startsWith('public/assets/')&&!p.startsWith('android/')&&!p.startsWith('outputs/')&&!p.endsWith('.tar.gz')&&!p.endsWith('.zip')&&!p.endsWith('.png')&&!p.endsWith('.ico')&&!p.endsWith('.jpg')&&!p.endsWith('.webp')&&!p.endsWith('.avif')&&!p.endsWith('.woff2')&&!p.endsWith('.ttf')&&!p.startsWith('.git/')).sort();
const elements=files.filter(p=>!p.endsWith('.tsbuildinfo')&&!p.startsWith('.env')).map(p=>({path:'web/'+p,mode:(statSync(p).mode&0o111)?'100755':'100644',type:'blob',content:readFileSync(p,'utf8')}));
const chunks=[];let chunk=[],size=0;
for(const e of elements){const n=JSON.stringify(e).length;if(size+n>90000&&chunk.length){chunks.push(chunk);chunk=[];size=0;}chunk.push(e);size+=n;}if(chunk.length)chunks.push(chunk);
const index=Number(process.argv[2]||0);
process.stdout.write(JSON.stringify({total:chunks.length,files:files.length,elements:chunks[index]||[],hash:createHash('sha256').update(JSON.stringify(elements)).digest('hex')}));
