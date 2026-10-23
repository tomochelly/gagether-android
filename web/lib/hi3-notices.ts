import type {FastNotice} from './fast-notices';
export const hi3WebsiteSources=[
 {region:'kr',locale:'ko',url:'https://sg-public-api-static.hoyoverse.com/content_v2_user/app/f4395662cb524b05/getContentList?iChanId=457&iPageSize=12&iPage=1&sLangKey=ko-kr',site:'https://honkaiimpact3.hoyoverse.com/kr/ko-kr/news/'},
 {region:'global',locale:'en',url:'https://sg-public-api-static.hoyoverse.com/content_v2_user/app/5fcd2aa439ca4aea/getContentList?iChanId=514&iPageSize=12&iPage=1&sLangKey=en-us',site:'https://honkaiimpact3.hoyoverse.com/global/en-us/news/'}
] as const;
export function parseHi3Website(data:any,source:typeof hi3WebsiteSources[number]):(FastNotice&{bodyHtml?:string})[]{
 if(data?.retcode!==0||!Array.isArray(data?.data?.list))throw Error('Official HI3 website API format changed');
 return data.data.list.filter((n:any)=>/^\d+$/.test(String(n.iInfoId))&&typeof n.sTitle==='string').map((n:any)=>({gameId:'hi3',region:source.region,locale:source.locale,id:String(n.iInfoId),title:n.sTitle,url:source.site+n.iInfoId,publishedAt:typeof n.dtStartTime==='string'&&/^\d{4}-\d\d-\d\d/.test(n.dtStartTime)?n.dtStartTime.slice(0,10):null,bodyHtml:typeof n.sContent==='string'?n.sContent:undefined}));
}
