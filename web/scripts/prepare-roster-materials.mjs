import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const icons=read('content/roster-material-icons.json'),requirements=read('content/roster-material-requirements.json'),games={};
for(const game of new Set([...Object.keys(icons.games),...Object.keys(requirements.games)])){
 const data=Buffer.from(JSON.stringify({icons:icons.games[game]?.items||[],characters:requirements.games[game]||{}}));
 const packed=gzipSync(data,{level:9});if(!gunzipSync(packed).equals(data))throw Error('Material packing mismatch');
 games[game]={bytes:data.length,sha256:createHash('sha256').update(data).digest('hex'),payload:packed.toString('base64')};
}
writeFileSync('content/roster-material-runtime.json',JSON.stringify({version:1,games})+'\n');
console.log(JSON.stringify({materialGames:Object.keys(games).length,packedBytes:readFileSync('content/roster-material-runtime.json').length}));
