import type {FastNotice,FastSource} from './fast-notices';
import {hi3WebsiteSources,parseHi3Website} from './hi3-notices';

const HI3_UID='147839994';
const HI3_URL=`https://bbs-api-os.hoyolab.com/community/post/wapi/userPost?uid=${HI3_UID}&size=20&offset=0`;
export function parseHi3Official(value:any):FastNotice[]{
 if(value?.retcode!==0||!Array.isArray(value?.data?.list))throw Error('Official API format changed');
 return value.data.list.filter((n:any)=>String(n?.user?.uid)===HI3_UID&&n.user.certification?.type===1&&String(n?.post?.uid)===HI3_UID&&n.post.game_id===1&&n.post.official_type===3&&!n.post.is_deleted&&n.post.lang==='ko-kr'&&/^\d+$/.test(String(n.post.post_id))).map((n:any)=>({gameId:'hi3',region:'kr',locale:'ko',id:String(n.post.post_id),title:String(n.post.subject),url:'https://www.hoyolab.com/article/'+n.post.post_id,publishedAt:Number(n.post.created_at)>0?new Date(Number(n.post.created_at)*1000).toISOString():null}));
}
const sources:FastSource[]=[{
 gameId:'hi3',key:'hi3/kr/hoyolab',url:HI3_URL,async load(fetcher){
  const r=await fetcher(HI3_URL,{headers:{'x-rpc-language':'ko-kr'},signal:AbortSignal.timeout(15000),redirect:'manual'});
  if(!r.ok)throw Error('HTTP '+r.status);const text=await r.text();let value;try{value=JSON.parse(text);}catch{throw Error('HTTP 200 non-JSON/JavaScript shell');}
  return parseHi3Official(value);
 }
}];
for(const source of hi3WebsiteSources.filter(s=>s.locale==='ko'))sources.unshift({gameId:'hi3',key:'hi3/kr/official-website',url:source.url,async load(fetcher){
 const r=await fetcher(source.url,{signal:AbortSignal.timeout(15000),redirect:'manual'});if(!r.ok)throw Error('HTTP '+r.status);
 return parseHi3Website(await r.json(),source);
}});


/** Official role and lounge must both match; user posts must never enter the notice feed. */
export function parseNaverOfficial(value:any,gameId:'trickcal'|'stellasora'|'wuwa',lounge:string,region:'kr'|'global'):FastNotice[]{
 if(value?.code!==200||!Array.isArray(value?.content?.feeds))throw Error('Official API format changed');
 return value.content.feeds.filter((n:any)=>n?.user?.userRoleCode==='game_manager'&&String(n?.feed?.loungeId).toLowerCase()===lounge.toLowerCase()&&!n.feed.hideByCleanBot&&/^\d+$/.test(String(n.feed.feedId))).map((n:any)=>{
  const stamp=String(n.feed.createdDate||'');
  // This public API does not declare its clock zone. Retain its publication date only.
  const publishedAt=/^\d{14}$/.test(stamp)?`${stamp.slice(0,4)}-${stamp.slice(4,6)}-${stamp.slice(6,8)}`:null;
  return {gameId,region,locale:'ko',id:String(n.feed.feedId),title:String(n.feed.title||'').replace(/&#x([0-9a-f]+);/gi,(_:string,c:string)=>String.fromCodePoint(parseInt(c,16))).replace(/&#([0-9]+);/g,(_:string,c:string)=>String.fromCodePoint(Number(c))),url:`https://game.naver.com/lounge/${lounge}/board/detail/${n.feed.feedId}`,publishedAt};
 });
}
for(const config of [{gameId:'wuwa',lounge:'WutheringWaves',region:'global',boards:[28,1]},{gameId:'trickcal',lounge:'Trickcal',region:'kr',boards:[3,11,13,22,8]},{gameId:'stellasora',lounge:'stellasora',region:'global',boards:[3,16,1]}] as const){
 for(const board of config.boards){
  const url=`https://comm-api.game.naver.com/nng_main/v1/community/lounge/${config.lounge}/feed?offset=0&limit=30&order=NEW&buffFilteringYN=N&boardId=${board}`;
  sources.push({gameId:config.gameId,key:`${config.gameId}/kr/naver/${board}`,url,async load(fetcher){
   const r=await fetcher(url,{signal:AbortSignal.timeout(15000),redirect:'manual'});if(!r.ok)throw Error('HTTP '+r.status);
   let value;try{value=JSON.parse(await r.text());}catch{throw Error('HTTP 200 non-JSON/JavaScript shell');}
   return parseNaverOfficial(value,config.gameId,config.lounge,config.region);
  }});
 }
}
export const expandedOfficialSources=sources;
