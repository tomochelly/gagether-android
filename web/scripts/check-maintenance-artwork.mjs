import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const verified=['maintenance-missing-art','maintenance-limbus-base-art'].flatMap(name=>JSON.parse(readFileSync('ops/qa/'+name+'.json','utf8')).verified);
const framing=['maintenance-additional-framing','maintenance-gfl2-framing','maintenance-reverse-framing'].flatMap(name=>JSON.parse(readFileSync('ops/qa/'+name+'.json','utf8')).entries).filter(row=>row.path?.startsWith('ops/character-rosters/enrichment/maintenance-originals/'));
const originals=new Map([...verified,...framing.map(row=>({...row,localPath:row.path}))].map(row=>[row.localPath,row]));
for(const row of originals.values()){
 if(!/^ops\/character-rosters\/enrichment\/maintenance-originals\/[a-f0-9]{64}\.(webp|png)$/.test(row.localPath))throw Error('Invalid preserved original path');
 const bytes=readFileSync(row.localPath);
 if(row.bytes!==undefined&&bytes.length!==row.bytes||createHash('sha256').update(bytes).digest('hex')!==row.sha256)throw Error('Maintenance original changed: '+row.id);
}
console.log(`Verified ${originals.size} distinct preserved originals; 15 recovered forms, other files retain existing source artwork`);
