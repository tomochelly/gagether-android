// Remove only generated inventories and abandoned transfer parts from a helper-built archive.
// The original source/assets and the input archive remain recoverable.
import {execFileSync} from 'node:child_process';
import {mkdtempSync,readdirSync,unlinkSync,rmSync,statSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
const [input,output]=process.argv.slice(2);if(!input||!output||resolve(input)===resolve(output))throw Error('Use distinct input and output archives');
const stage=mkdtempSync(join(tmpdir(),'gagether-package-'));
try{
 execFileSync('tar',['-xzf',resolve(input),'-C',stage]);
 function walk(dir){for(const item of readdirSync(dir,{withFileTypes:true})){const p=join(dir,item.name);if(item.isDirectory())walk(p);else if(/^\..+\.[A-Za-z0-9]{6}$/.test(item.name)||/_snapshot\.json$/.test(item.name)&&p.includes('/.openai/drizzle/meta/')||item.name==='manifest.json'&&p.includes('/.vite/')){unlinkSync(p);console.log('Excluded build-only file:',p.slice(stage.length+1));}}}
 walk(stage);execFileSync('tar',['-C',stage,'-czf',resolve(output),'dist']);
 const size=Number(execFileSync('gzip',['-l',resolve(output)],{encoding:'utf8'}).trim().split('\n').at(-1).trim().split(/\s+/)[1]);if(size>256*1024*1024)throw Error('Expanded archive still exceeds256MiB');console.log(JSON.stringify({archive:resolve(output),expandedBytes:size}));
}finally{rmSync(stage,{recursive:true,force:true});}
