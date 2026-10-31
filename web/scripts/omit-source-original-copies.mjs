// Verified source-hosted originals keep their exact source URLs.
// Audited original bytes remain in native Git, including exact game outfit renders.
import {readFileSync,existsSync,unlinkSync} from 'node:fs';import {join} from 'node:path';import {createHash} from 'node:crypto';
import {isArknightsSourceArtwork} from './source-arknights-assets.mjs';
export function omitSourceOriginalCopies(root='dist',entries=JSON.parse(readFileSync('content/character-rosters/artwork-manifest.json','utf8'))){
 let count=0,bytes=0;
 for(const a of entries){
  if(a.delivery!=='source-original')continue;
  const url=new URL(a.url),gameRender=a.gameId==='umamusume'&&a.sourceKind==='community'&&a.url===`https://media.gametora.com/umamusume/characters/render/trainee/idle/${a.characterId}.png`&&a.width===768&&a.height===1024;if((a.sourceKind!=='official'&&!gameRender&&!isArknightsSourceArtwork(a))||a.status!=='ok'||url.protocol!=='https:'||['gagether.wiki','gagether.tomochelly.chatgpt.site'].includes(url.hostname)||!/^public\/roster-bootstrap\/[a-f0-9]{64}\.(png|webp|jpg)$/.test(a.path))throw Error('Unverified source-original delivery');
  const original=readFileSync(a.path);if(original.length!==a.bytes||createHash('sha256').update(original).digest('hex')!==a.sha256)throw Error('Source original changed');
  const target=join(root,'client',a.path.slice('public/'.length));if(!existsSync(target))continue;
  if(!readFileSync(target).equals(original))throw Error('Generated original differs');unlinkSync(target);count++;bytes+=a.bytes;
 }
 console.log(JSON.stringify({preservedSourceOriginalURLs:count,duplicatePackagedBytesOmitted:bytes}));return {count,bytes};
}
