import registry from '../content/leaks/source-media.json' with {type:'json'};
import {leakSchema,type LeakItem} from './leaks';
const subs:Record<string,string>={hsr:'HonkaiStarRail_leaks',zzz:'Zenlesszonezeroleaks_',genshin:'Genshin_Impact_Leaks'};
/** Exact-source media supplements older saved records; never overwrite edited text or discard owner media. */
export function retainLeakSourceMedia(item:LeakItem):LeakItem{const reviewed=registry.find(r=>r.id===item.id&&r.sourceUrl===item.sourceUrl),images=[...new Map([...reviewed?.images||[],...item.images].map(i=>[i.sha256,i])).values()].slice(0,32),embeds=[...reviewed?.embeds||[],...item.embeds||[]];
 try{const u=new URL(item.sourceUrl),post=/^\/r\/([^/]+)\/comments\/([a-z0-9]+)\/[^?]*\/$/.exec(u.pathname);if(u.protocol==='https:'&&u.hostname==='www.reddit.com'&&!u.search&&!u.hash&&post&&post[1].toLowerCase()===subs[item.gameId]?.toLowerCase()&&!embeds.some(e=>e.sourceUrl===item.sourceUrl))embeds.push({provider:'reddit',sourceUrl:item.sourceUrl,postId:post[2],media:/animation|gameplay|video/i.test(item.sourceTitle)?'video':'gallery'});}catch{}
 return leakSchema.parse({...item,images,...embeds.length?{embeds:[...new Map(embeds.map(e=>[e.sourceUrl,e])).values()].slice(0,4)}:{}});
}
