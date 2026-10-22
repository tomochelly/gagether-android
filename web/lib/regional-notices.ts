import type {FastNotice,FastSource} from './fast-notices';
export type RegionalNotice=FastNotice&{bodyHtml?:string};
export type RegionalSource=Omit<FastSource,'load'>&{region:FastNotice['region'];locale:FastNotice['locale'];load:(fetcher:typeof fetch)=>Promise<RegionalNotice[]>};
const date=(s:unknown)=>typeof s==='string'&&/^\d{4}-\d\d-\d\d/.test(s)?s.slice(0,10):null;
const epoch=(v:unknown)=>Number(v)>0?new Date(Number(v)).toISOString():null;
async function json(f:typeof fetch,url:string,init?:RequestInit){const r=await f(url,{...init,redirect:'manual',signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('HTTP '+r.status);try{return await r.json() as any;}catch{throw Error('HTTP 200 non-JSON/JavaScript shell');}}
export function parseYostar(d:any,region:'jp'|'global',locale:'ja'|'en'):RegionalNotice[]{
 if(d?.code!==0||!Array.isArray(d?.data?.rows))throw Error('Official API format changed');
 return d.data.rows.map((n:any)=>({gameId:'arknights',region,locale,id:String(n.id),title:String(n.title),url:`https://${region==='jp'?'arknights.jp':'www.arknights.global'}/news/${n.id}`,publishedAt:epoch(n.publishTime),bodyHtml:typeof n.content==='string'?n.content:undefined}));
}
export function parseAkCn(d:any):RegionalNotice[]{
 if(d?.code!==0||!Array.isArray(d?.data?.list))throw Error('Official API format changed');
 return d.data.list.map((n:any)=>({gameId:'arknights',region:'cn',locale:'zh',id:String(n.cid),title:String(n.title),url:'https://ak.hypergryph.com/news/'+n.cid,publishedAt:epoch(Number(n.displayTime)*1000)}));
}
export function parseUmaJp(d:any):RegionalNotice[]{
 if(!Array.isArray(d?.information_list))throw Error('Official API format changed');
 return d.information_list.map((n:any)=>({gameId:'umamusume',region:'jp',locale:'ja',id:String(n.announce_id),title:String(n.title),url:'https://umamusume.jp/news/detail?id='+n.announce_id,publishedAt:date(n.post_at),bodyHtml:typeof n.message==='string'?n.message:undefined}));
}
export function parseGflCn(d:any):RegionalNotice[]{
 if(d?.code!==0||!Array.isArray(d?.data?.list))throw Error('Official API format changed');
 return d.data.list.map((n:any)=>({gameId:'gfl2',region:'cn',locale:'zh',id:String(n.Id),title:String(n.Title),url:`https://gf2.sunborngame.com/NewsInfo?id=${n.Id}&typeId=${n.Type}`,publishedAt:date(n.Date),bodyHtml:n.Content||undefined}));
}
export function parseBaJp(d:any):RegionalNotice[]{
 if(!Array.isArray(d?.data?.rows))throw Error('Official API format changed');
 return d.data.rows.map((n:any)=>({gameId:'bluearchive',region:'jp',locale:'ja',id:String(n.id),title:String(n.title||n.summary),url:'https://bluearchive.jp/news/newsJump/'+n.id,publishedAt:epoch(n.publishTime),bodyHtml:typeof n.content==='string'?n.content:undefined}));
}
export function parseReverseCn(d:any):RegionalNotice[]{
 if(d?.code!==200||!Array.isArray(d?.data?.pageData))throw Error('Official API format changed');
 return d.data.pageData.filter((n:any)=>n.status===1).map((n:any)=>({gameId:'reverse1999',region:'cn',locale:'zh',id:String(n.id),title:String(n.title),url:'https://re.bluepoch.com/home/detail.html#newsId?'+n.id,publishedAt:date(n.onlineTime),bodyHtml:typeof n.content==='string'?n.content:undefined}));
}
export function parseStellaJp(d:any):RegionalNotice[]{
 if(d?.code!==0||!Array.isArray(d?.data?.rows))throw Error('Official API format changed');
 return d.data.rows.map((n:any)=>({gameId:'stellasora',region:'global',locale:'ja',id:String(n.id),title:String(n.title),url:'https://stellasora.jp/news/'+n.id,publishedAt:epoch(n.publishTime)}));
}
export function parseTrickcalJp(d:any):RegionalNotice[]{
 if(d?.code!==0||!Array.isArray(d?.data?.list))throw Error('Official API format changed');
 return d.data.list.map((n:any)=>({gameId:'trickcal',region:'global',locale:'ja',id:String(n.news_id),title:String(n.title),url:'https://trickcal.biligames.com/news/jp/h5/?news_detail_id='+n.news_id,publishedAt:date(n.publish_time)}));
}
export function parseHi3Jp(d:any):RegionalNotice[]{
 if(d?.retcode!==0||!Array.isArray(d?.data?.list))throw Error('Official API format changed');
 return d.data.list.map((n:any)=>({gameId:'hi3',region:'kr',locale:'ja',id:String(n.iInfoId),title:String(n.sTitle),url:'https://www.houkai3rd.com/news/'+n.iInfoId,publishedAt:date(n.dtStartTime),bodyHtml:n.sContent||undefined}));
}
const sources:RegionalSource[]=[];
function add(gameId:string,region:RegionalSource['region'],locale:RegionalSource['locale'],url:string,parse:(d:any)=>RegionalNotice[],init?:RequestInit){sources.push({gameId,region,locale,key:`${gameId}/${region}/${locale}/official`,url,load:async f=>parse(await json(f,url,init))});}
add('arknights','jp','ja','https://arknights.jp/api/resource/news/list?index=1&size=12',d=>parseYostar(d,'jp','ja'));
add('arknights','cn','zh','https://ak.hypergryph.com/api/news?category=LATEST&page=1',parseAkCn);
add('umamusume','jp','ja','https://umamusume.jp/api/ajax/pr_info_index?format=json&announce_label=0&limit=12&offset=0',parseUmaJp);
add('gfl2','cn','zh','https://gf2-web-preregister-api.sunborngame.com/website/news_list/4?page=1&limit=10',parseGflCn);
add('bluearchive','jp','ja','https://api-web.bluearchive.jp/api/news/list?typeId=0&pageNum=12&pageIndex=1',parseBaJp);
add('reverse1999','cn','zh','https://re.bluepoch.com/activity/official/websites/information/query',parseReverseCn,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({current:1,pageSize:12})});
add('stellasora','global','ja','https://stellasora.jp/api/resource/news?index=1&size=12&type=',parseStellaJp);
add('trickcal','global','ja','https://l11-web-api.biligames.com/game/news/page?game_base_id=113406&show_position=1&client_type=2&lang=ja&type=&page_num=1&page_size=12',parseTrickcalJp);
add('hi3','kr','ja','https://sg-public-api-static.hoyoverse.com/content_v2_user/app/9f099cd555854c14/getContentList?iChanId=555&iPageSize=12&iPage=1&sLangKey=ja-jp',parseHi3Jp);
export const regionalOfficialSources=sources;
export async function regionalDetail(n:FastNotice,fetcher:typeof fetch):Promise<string|undefined>{
 if(n.gameId==='gfl2'&&n.region==='cn')return (await json(fetcher,'https://gf2-web-preregister-api.sunborngame.com/website/news/'+n.id)).data?.Content;
 if(n.gameId==='umamusume'&&n.region==='jp'){const d=await json(fetcher,'https://umamusume.jp/api/ajax/pr_info_detail?format=json&announce_id='+n.id);return d.information?.message||d.message||d.data?.message;}
 if(n.gameId==='arknights'&&n.region==='jp')return (await json(fetcher,'https://arknights.jp/api/resource/news/detail?id='+n.id)).data?.content;
 if(n.gameId==='stellasora'&&n.locale==='ja')return (await json(fetcher,'https://stellasora.jp/api/resource/news/'+n.id)).data?.news?.content;
 if(n.gameId==='trickcal'&&n.locale==='ja')return (await json(fetcher,'https://l11-web-api.biligames.com/game/news/detail?game_base_id=113406&show_position=1&client_type=2&lang=ja&news_id='+n.id)).data?.content;
 return undefined;
}
