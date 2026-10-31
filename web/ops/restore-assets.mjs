import './restore-roster-snapshot.mjs';
import {readFileSync,mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {dirname} from 'node:path';
import {createHash} from 'node:crypto';
const rows=JSON.parse(readFileSync(new URL('./assets-manifest.json',import.meta.url),'utf8'));
for(const row of rows){
 if(row.path.split('/').some(p=>p.startsWith('.')))continue;
 const check=bytes=>createHash('sha256').update(bytes).digest('hex')===row.sha256;
 if(existsSync(row.path)&&check(readFileSync(row.path)))continue;
 const response=await fetch(row.url,{signal:AbortSignal.timeout(60000)});if(!response.ok)throw Error(row.path+': HTTP '+response.status);
 const bytes=Buffer.from(await response.arrayBuffer());if(bytes.length!==row.bytes||!check(bytes))throw Error(row.path+': original hash mismatch');mkdirSync(dirname(row.path),{recursive:true});writeFileSync(row.path,bytes);
 console.log('Restored verified original:',row.path);
}
