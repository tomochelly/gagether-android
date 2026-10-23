import {decodeSourceHtml} from './collection-review';
import {noticeText,textOnly,type FastNotice,type FastSource} from './fast-notices';
import {hi3WebsiteSources,parseHi3Website} from './hi3-notices';
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
export function blueArchiveTitle(n:any):string{const heading=typeof n.content==='string'?n.content.match(/<p[^>]*>\s*<(?:strong|b)[^>]*>([\s\S]*?)<\/(?:strong|b)>\s*<\/p>/i)?.[1]:undefined;const summary=String(n.summary||'').trim();return heading&&(!summary||textOnly(heading).startsWith(summary.replace(/[.…]+$/,'').slice(0,30)))?textOnly(heading):summary||String(n.title||'');}
export function parseBaJp(d:any):RegionalNotice[]{
 if(!Array.isArray(d?.data?.rows))throw Error('Official API format changed');
 return d.data.rows.map((n:any)=>({gameId:'bluearchive',region:'jp',locale:'ja',id:String(n.id),title:blueArchiveTitle(n),url:'https://bluearchive.jp/news/newsJump/'+n.id,publishedAt:epoch(n.publishTime),bodyHtml:typeof n.content==='string'?n.content:undefined}));
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
for(const source of hi3WebsiteSources)add('hi3',source.region,source.locale,source.url,d=>parseHi3Website(d,source));
for(const locale of ['ja','en'] as const)for(const label of [496,892]){
 const region=locale==='ja'?'jp':'global',url='https://na-community.playerinfinite.com/api/gpts.information_feeds_svr.InformationFeedsSvr/GetContentByLabel';
 sources.push({gameId:'nikke',region,locale,key:`nikke/${region}/${locale}/${label}`,url,load:async f=>{
  const d=await json(f,url,{method:'POST',headers:{'Content-Type':'application/json','X-GameId':'16','X-AreaId':'na','X-Source':'pc_web','X-Language':locale},body:JSON.stringify({primary_label_id:309,secondary_label_id:label,offset:0,get_num:10,disable_use_default_language:true})});
  if(d.code!==0||!Array.isArray(d.data?.info_content))throw Error('Official API format changed');
  return d.data.info_content.map((n:any)=>({gameId:'nikke',region,locale,id:n.content_id,title:n.title,url:`https://nikke-${locale==='ja'?'jp':'en'}.com/newsdetail.html?content_id=${n.content_id}`,publishedAt:epoch(Number(n.pub_timestamp)*1000)}));
 }});
}
export const regionalOfficialSources=sources;
export async function regionalDetail(n:FastNotice,fetcher:typeof fetch):Promise<string|undefined>{
 const hi3=hi3WebsiteSources.find(s=>n.gameId==='hi3'&&s.region===n.region&&s.locale===n.locale&&n.url===s.site+n.id);
 if(hi3)return parseHi3Website(await json(fetcher,hi3.url),hi3).find(row=>row.id===n.id)?.bodyHtml;
 // This is the ordinary public endpoint used by the official lounge frontend.
 // Match the full known source URL, not a user-supplied API URL or a loose ID.
 const lounge={trickcal:'Trickcal',stellasora:'stellasora',reverse1999:'reverse1999'}[n.gameId as 'trickcal'|'stellasora'|'reverse1999'];
 if(lounge&&n.locale==='ko'&&n.url===`https://game.naver.com/lounge/${lounge}/board/detail/${n.id}`){
  const d=await json(fetcher,'https://comm-api.game.naver.com/nng_main/v1/community/lounge/'+lounge+'/feed/'+n.id);
  const feed=d?.content?.feed;
  if(d?.code!==200||String(feed?.feedId)!==n.id||feed?.loungeId!==lounge||typeof feed.contents!=='string'||!feed.contents.trim())throw Error('Official lounge body format or identity changed');
  return feed.contents;
 }
 if(n.gameId==='wuwa'){
  const language={ko:'kr',ja:'jp',en:'en',zh:'zh'}[n.locale],d=await json(fetcher,`https://hw-media-cdn-mingchao.kurogame.com/akiwebsite/website2.0/json/G152/${language}/article/${encodeURIComponent(n.id)}.json`);
  if(String(d.articleId)!==n.id||d.gameId!=='G152-'+language||typeof d.articleContent!=='string')throw Error('Notice body identity mismatch');return d.articleContent;
 }
 if(n.gameId==='nikke'&&['ko','ja','en'].includes(n.locale)){
  const id=new URL(n.url).searchParams.get('content_id');if(!id||id!==n.id)throw Error('Notice identity mismatch');
  const d=await json(fetcher,'https://na-community.playerinfinite.com/api/gpts.information_feeds_svr.InformationFeedsSvr/GetContentInfoById',{method:'POST',headers:{'Content-Type':'application/json','X-GameId':'16','X-AreaId':'na','X-Source':'pc_web','X-Language':n.locale},body:JSON.stringify({content_id:id,gameid:'16',language:[n.locale]})});if(d.code!==0||d.data?.content_id!==id||typeof d.data?.content!=='string')throw Error('Notice body identity mismatch');return d.data.content;
 }
 if((n.gameId==='nte'||n.gameId==='umamusume')&&n.url.startsWith('https://pf.kakao.com/')){
  const profile=n.gameId==='nte'?'_uSxfcG':'_DzxjIb';if(n.url!==`https://pf.kakao.com/${profile}/${n.id}`)throw Error('Notice identity mismatch');
  const d=await json(fetcher,`https://pf.kakao.com/rocket-web/web/v2/profiles/${profile}/posts/${n.id}`);if(String(d.id)!==n.id||d.author?.id!==profile||d.is_private||d.status!=='published')throw Error('Notice body identity mismatch');
  const escape=(t:string)=>t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  return (d.contents||[]).filter((c:any)=>c.t==='text').map((c:any)=>'<p>'+escape(String(c.v))+'</p>').join('')+(d.media||[]).filter((m:any)=>m.type==='image'&&/^https:\/\//.test(m.url||'')).map((m:any)=>'<img src="'+escape(m.url)+'">').join('');
 }
 if(n.gameId==='arknights'&&n.region==='cn'){
  const r=await fetcher(n.url,{redirect:'manual',signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('HTTP '+r.status);const html=await r.text();
  const bodies=[...html.matchAll(/self\.__next_f\.push\((\[1,"(?:[^"\\]|\\.)*"\])\)/g)].flatMap(m=>{try{const p=decodeSourceHtml(JSON.parse(m[1])[1]);const start=p.indexOf('<');return start>=0&&/^(?:[a-z0-9]+:T[0-9a-f]+,)?\s*</i.test(p)&&/<(?:p|div|img)\b/i.test(p)?[p.slice(start)]:[];}catch{return [];}});
  if(bodies.length)return bodies.join('\n');return html;
 }
 const hoyo={genshin:'a1b1f9d3315447cc',hsr:'113fe6d3b4514cdd',zzz:'3e9196a4b9274bd7'}[n.gameId as 'genshin'|'hsr'|'zzz'];
 if(hoyo){const lang={ko:'ko-kr',en:'en-us',ja:'ja-jp',zh:n.gameId==='genshin'?'zh-tw':'zh-cn'}[n.locale];const d=await json(fetcher,`https://sg-public-api-static.hoyoverse.com/content_v2_user/app/${hoyo}/getContent?iInfoId=${encodeURIComponent(n.id)}&sLangKey=${lang}`);if(d.retcode!==0||String(d.data?.iInfoId)!==n.id||typeof d.data?.sContent!=='string')throw Error('Notice body identity mismatch');return d.data.sContent;}
 if(n.gameId==='bluearchive'&&n.locale==='ko'){
  const u=new URL(n.url),board=u.searchParams.get('board');
  if(u.hostname!=='forum.nexon.com'||u.pathname!=='/bluearchive/board_view'||!['1018','1076'].includes(board||'')||u.searchParams.get('thread')!==n.id)return undefined;
  const d=await json(fetcher,'https://forum.nexon.com/api/v1/thread/'+encodeURIComponent(n.id));
  if(String(d.threadId)!==n.id||String(d.boardId)!==board||String(d.communityId)!=='148'||!d.user?.isAdmin||d.isDelete||d.isWebHide||typeof d.content!=='string'||!d.content.trim())throw Error('Official thread body identity mismatch');return d.content;
 }
 if(n.gameId==='bluearchive'&&n.region==='jp')return (await json(fetcher,'https://api-web.bluearchive.jp/api/news/detail?id='+encodeURIComponent(n.id))).data?.news?.content;
 if(n.gameId==='gfl2'&&n.region==='cn')return (await json(fetcher,'https://gf2-web-preregister-api.sunborngame.com/website/news/'+n.id)).data?.Content;
 if(n.gameId==='umamusume'&&n.region==='jp'){const d=await json(fetcher,'https://umamusume.jp/api/ajax/pr_info_detail?format=json&announce_id='+n.id);return d.detail?.message||d.information?.message||d.message||d.data?.message;}
 if(n.gameId==='arknights'&&n.region==='jp')return (await json(fetcher,'https://arknights.jp/api/resource/news/detail?id='+n.id)).data?.content;
 if(n.gameId==='stellasora'&&n.locale==='ja')return (await json(fetcher,'https://stellasora.jp/api/resource/news/'+n.id)).data?.news?.content;
 if(n.gameId==='trickcal'&&n.locale==='ja')return (await json(fetcher,'https://l11-web-api.biligames.com/game/news/detail?game_base_id=113406&show_position=1&client_type=2&lang=ja&news_id='+n.id)).data?.content;
 return undefined;
}

// Metadata changes are independent of automatic original-body publication.
export function regionalMetadataChanges(entries:import('./types').Entry[],notices:RegionalNotice[],checkedAt:string){
 return notices.flatMap(n=>entries.filter(e=>e.sourceUrl===n.url&&e.gameId===n.gameId&&e.region===n.region&&e.sourceLocale===n.locale&&/^(quick-|feed-)/.test(e.id)).flatMap(e=>{
  const title=noticeText(n.title);if(e.sourceTitle===title&&e.publishedAt===n.publishedAt)return [];
  return [{...e,sourceTitle:title,title:{...e.title,[n.locale]:title},publishedAt:n.publishedAt,verifiedAt:checkedAt}];
 }));
}
