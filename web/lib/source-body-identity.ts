import exclusions from '../content/excluded-source-bodies.json' with {type:'json'};
import type {Entry,SourceBody} from './types';
/** Landing pages are links, not localized article originals. Keep stored evidence intact. */
export function articleBodySource(gameId:string,url:string){
 if(gameId!=='nte')return true;
 try{const u=new URL(url);return !['nte.perfectworld.com','nte.perfectworldgames.com','yh.wanmei.com'].includes(u.hostname)||!/^\/(?:[a-z-]+\/)?(?:main|index)\.html\/?$/.test(u.pathname);}catch{return false;}
}
export function bodyBelongsToEntry(entry:Pick<Entry,'id'|'gameId'>,body:SourceBody){
 return articleBodySource(entry.gameId,body.sourceUrl)&&!exclusions.some(r=>r.entryId===entry.id&&r.locale===body.locale&&r.sourceUrl===body.sourceUrl&&r.bodyHash===body.bodyHash);
}
