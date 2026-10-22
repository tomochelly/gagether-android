import {officialXAccounts} from './official-x-accounts';
import {isReviewedCollaborationSource} from './collaboration-sources';
import type {PickupEstimate} from './pickup-estimates';
import recurringSources from '../content/recurring-sources.json' with {type:'json'};
const reviewedRecurringSource=(url:string,gameId:string,kind:string)=>{try{const u=new URL(url);return u.protocol==='https:'&&!u.username&&!u.password&&recurringSources.some(s=>s.gameId===gameId&&s.kind===kind&&new URL(s.url).href===u.href);}catch{return false;}};
export type Locale = "ko" | "en" | "ja" | "zh";
export type Region = "global" | "kr" | "jp" | "cn";
export type Localized = Record<Locale, string>;
export type Kind = "pickup" | "weapon" | "event" | "package" | "update";
export type PickupType = "new" | "rerun" | "mixed" | "unknown";
export type PoolType = "character" | "weapon" | "support" | "standard";
export type SourceKind = "official" | "community" | "video";
export interface RelatedSource {kind:SourceKind;url:string;title:string;publisher?:string;publishedAt?:string}
export interface GameIcon {image:string;imageSource:string;width:number;height:number;verifiedAt:string}
export interface EntityTrait {id:string;label:Localized;value:Localized;icon?:GameIcon;officialLocales?:Locale[];translatedLocales?:Locale[]}
export interface RewardItem {rewardId?:string;category?:'gacha-currency'|'gacha-ticket'|'resource';officialLocales?:Locale[];translatedLocales?:Locale[];name:Localized;quantity?:string;icon?:GameIcon;sourceUrl:string;sourceKind:"official"|"community"}
export interface VideoClip {originalTitle?:string;titleOfficialLocales?:Locale[];titleTranslatedLocales?:Locale[];youtubeId:string;kind:"character"|"version";format?:"pv"|"intro"|"demo";title:Localized;locale:Locale;channel:string;sourceUrl:string;publishedAt?:string|null;verifiedAt:string;official:boolean;metadataVerified:boolean;watched:false;entityNames?:Localized[];evidenceUrls?:string[]}
export interface OfficialBroadcast {
 status:'scheduled'|'live'|'ended'|'cancelled';youtubeId?:string;channel?:string;locale:Locale;
 sourceUrl:string;announcementUrl:string;originalTitle:string;announcedAt:string|null;
 scheduledAt:string|null;scheduledDate?:string;programStartAt?:string|null;actualStartAt?:string|null;endedAt:string|null;
 thumbnailUrl?:string;official:true;metadataVerified:true;watched:false;verifiedAt:string;statusCheckedAt?:string;
}
export interface StatRow {label:Localized;value:string;note?:Localized}
export interface EntityProfile {
 id:string;name:Localized;category:Localized;basis:Localized;officialLocales?:Locale[];translatedLocales?:Locale[];
 traits?:EntityTrait[];stats:StatRow[];statSourceKind:SourceKind;
 groups:{title:Localized;body:Localized;sourceKind:SourceKind;sourceUrls?:string[];rows?:StatRow[]}[];
 sources:RelatedSource[];verifiedAt:string;notes?:Localized[];
}
export interface PreviewFocus {x:number;y:number;zoom:number}
export interface PreviewBounds {left:number;top:number;right:number;bottom:number}
export interface ArtworkAsset {imageCaption?:Localized;originalLanguageFallback?:boolean;textFreePreview?:boolean;image:string;imageSource:string;imageVerified:boolean;imageKind?:"character"|"weapon"|"support"|"banner"|"splash";imageLocale?:Locale|'neutral';width:number;height:number;previewFocus?:PreviewFocus;previewBounds?:PreviewBounds;verifiedAt:string}
export interface EntityArtwork {imageCaption?:Localized;originalLanguageFallback?:boolean;textFreePreview?:boolean;image?:string;imageSource?:string;imageKind?:"character"|"weapon"|"support"|"banner"|"splash";imageFit?:"contain"|"cover";imagePosition?:string;imageVerified?:boolean;previewFocus?:PreviewFocus;previewBounds?:PreviewBounds;imageLocale?:Locale|'neutral';previewArtwork?:ArtworkAsset;localizedArtwork?:Partial<Record<Locale,ArtworkAsset>>}
export interface Game {
 id:string;name:Localized;short:string;genre:Localized;color:string;logo:string;icon?:string;iconSource?:string;art:string;artPosition?:string;
 official:string;publisher:string;regions:Region[];sources:{label:string;url:string;region:Region}[];
 serviceMode?:"regional"|"shared-global";
 scheduleRegions?:Region[];regionAliases?:Partial<Record<Region,Region>>;
 regionLabels?:Partial<Record<Region,Localized>>;
}
export interface Entry extends EntityArtwork {
 recurring?:{modeId:string;cycleLabel:Localized;sourceKind:"official"|"community";sourceUrls:string[];verifiedAt:string;resetAt?:string|null;resetDate?:string;resetEvidence?:{kind:'owner-confirmed';timeZone:string;note:Localized;verifiedAt:string}};
 audienceRegions?:Region[];
 collaboration?:{partner:Localized;scope:'ingame'|'offline'|'merchandise'|'online';sourceUrls:string[];verifiedAt:string};
 pickupArchive?:{status:'past'|'announced'|'forecast';startDate?:string;endDate?:string;note?:Localized;estimate?:PickupEstimate};
 id:string;gameId:string;kind:Kind;title:Localized;summary:Localized;region:Region;server:string;
 startAt:string|null;endAt:string|null;startDate?:string;endDate?:string;publishedAt:string|null;verifiedAt:string;sourceUrl:string;
 sourceTitle:string;image?:string;imageSource?:string;version?:string;versionTitle?:Localized;versionHero?:boolean;rarity?:number;
 price?:{amount:number;currency:string;platform:string};contents?:Localized[];featured?:boolean;
 timingNote?:Localized;
 pickupType?:PickupType;pickupGroup?:string;poolType?:PoolType;bannerName?:Localized;
 signatureWeapons?:{entryId:string;memberName?:string;sourceUrl:string;sourceKind:"official"|"community";verifiedAt:string}[];
 selectionCount?:number;
 pickupMembers?:({name:Localized;type:"new"|"rerun"|"unknown";rarity?:number;role?:"featured"|"rate-up"|"candidate"}&EntityArtwork)[];
 officialLocales?:Locale[];translatedLocales?:Locale[];
 localizationSources?:Partial<Record<Locale,string>>;
 sourceLocale?:Locale;
 sourceKind?:SourceKind;relatedSources?:RelatedSource[];
 detailSections?:{audienceRegions?:Region[];title:Localized;body:Localized;sourceKind?:SourceKind;sourceUrls?:string[]}[];
 highlights?:Localized[];marketRegion?:Region;detailImages?:ArtworkAsset[];
 entityDetails?:EntityProfile[];videos?:VideoClip[];broadcast?:OfficialBroadcast;rewards?:RewardItem[];rewardNote?:Localized;
 hidden?:boolean;editor?:{revision:number;updatedAt:string;fields:string[]};
}
export function safeReference(url:string,gameId:string,kind:SourceKind):boolean{
 if(reviewedRecurringSource(url,gameId,kind))return true;
 if(kind==='community'&&gameId==='arknights'&&['https://theqoo.net/game/4383295279','https://theqoo.net/game/4380417668','https://gameludens.com/arknights/8911/','https://www.taptap.cn/moment/861997162374891420'].includes(url))return true;
 if(kind==='official')return safeSource(url,gameId);
 try{const u=new URL(url);if(u.protocol!=='https:'||u.username||u.password)return false;const host=u.hostname;
  if(kind==='video')return (host==='youtu.be'&&/^\/[\w-]{11}$/.test(u.pathname))||(['www.youtube.com','youtube.com','m.youtube.com'].includes(host)&&(u.pathname==='/watch'&&/^[\w-]{11}$/.test(u.searchParams.get('v')||'')||/^\/(shorts|live)\/[\w-]{11}$/.test(u.pathname)));
  const researchPaths:Record<string,Record<string,string[]>>={
   genshin:{'wiki.hoyolab.com':['/pc/genshin/entry/']},hsr:{'www.gamsgo.com':['/ko/blog/%EB%B6%95%EA%B4%B4-%EC%8A%A4%ED%83%80%EB%A0%88%EC%9D%BC-4-6-%ED%94%BD%EC%97%85'],'bannerhistory.app':['/ko/hsr-pickup-history'],'wiki.hoyolab.com':['/pc/hsr/entry/']},
   bluearchive:{'mollulog.net':['/futures'],'game8.jp':['/blue-archive/'],'github.com':['/SchaleDB/SchaleDB']},
   nikke:{'www.prydwen.gg':['/nikke/characters/']},
   umamusume:{'gametora.com':['/umamusume/characters/'],'umamusu.wiki':['/Game:'],'wiki.biligame.com':['/umamusume/']},
   arknights:{'prts.wiki':['/w/'],'www.gacha.gg':['/arknights/banners'],'dal.wiki':['/t/b85DVWlJuO0V/e/','/t/IbM473NkLrAE/e/']},
   gfl2:{'refittingroom.app':['/characters/'],'iopwiki.com':['/wiki/'],'gf2.mcc.wiki':['/doll/']},
   endfield:{'theqoo.net':['/game/4332646143'],'endfieldhub.org':['/characters/'],'www.enfieldbuild.com':['/builds']},
   nte:{'www.kaiden.gg':['/nte/characters/'],'appmedia.jp':['/nte/']}
  };
  if(gameId==='arknights'&&host==='raw.githubusercontent.com'&&/^\/ArknightsAssets\/ArknightsGamedata\/master\/(kr|jp|en)\/gamedata\/excel\/gacha_table\.json$/.test(u.pathname))return true;
  const reviewedPaths:Record<string,Record<string,string[]>>={
   wuwa:{'wuther.in':['/ko/activity/100390001/','/ko/activity/100300002/'],'github.com':['/wuwatracker/i18n/blob/main/ko.json','/wuwatracker/i18n/blob/main/ja.json','/wuwatracker/i18n/blob/main/zh-TW.json']},
   bluearchive:{'appmedia.jp':['/blue_archive/78140060'],'mollulog.net':['/events/recollect-recruitment-2']},
   arknights:{'raw.githubusercontent.com':['/Kengxxiao/ArknightsGameData/master/zh_CN/gamedata/excel/gacha_table.json']},
   genshin:{'gamewith.jp':['/genshin/article/show/565495'],'www.siliconera.com':['/7-2-genshin-impact-patch-adds-armory-palaces-mitya-and-valeriy/']},
   hsr:{'www.gamsgo.com':['/ko/blog/honkai-star-rail-4-7-banners'],'wotpack.ru':['/ko/honkai-star-rail-raspisanie-bannerov-2023/'],'gnn.gamer.com.tw':['/detail.php']},
   zzz:{'www.u7buy.com':['/blog/zzz-x-hsr-collab/'],'www.zzz-build.com':['/news/zzz-3-3-special-program']},
   endfield:{'www.pickupcal.com':['/events/919210/'],'www.reddit.com':['/r/Endfield/comments/1x68wup/patch_16_sanctuary_of_ink_gacha_megathread/']},
   umamusume:{'uma.guide':['/guides/release-schedule-october26'],'swallow91.tistory.com':['/502'],'www.gamsgo.com':['/blog/uma-musume-banners'],'www.ldshop.gg':['/blog/umamusume-pretty-derby/umamusume-banners.html']}
  };
  if(reviewedPaths[gameId]?.[host]?.includes(u.pathname))return gameId!=='hsr'||host!=='gnn.gamer.com.tw'||u.searchParams.get('sn')==='311717';
  if(gameId==='umamusume'&&host==='gametora.com'&&/^\/(?:ja|zh-tw)\/umamusume\/(?:characters|supports)\/[a-z0-9-]+$/.test(u.pathname))return true;
  if(gameId==='umamusume'&&host==='umamusume.wikiru.jp'&&['/','/index.php'].includes(u.pathname)){
   const params=[...u.searchParams];
   // PukiWiki's ordinary page links use the whole page name as a query key.
   return params.length===0||params.length===1&&!params[0][1]&&!['cmd','plugin','page'].includes(params[0][0])||u.searchParams.get('cmd')==='read'&&!!u.searchParams.get('page')&&params.every(([key])=>['cmd','page'].includes(key));
  }
  if(researchPaths[gameId]?.[host]?.some(prefix=>u.pathname.startsWith(prefix)))return true;
  if(gameId==='wuwa'){
   const prefixes:Record<string,string[]>={'ludinote.com':['/wuthering-waves-pickup/'],'phro.love':['/db/weapon/'],'wuthering.gg':['/ko/weapons/','/characters/'],'wutheringlab.com':['/weapon/'],'gamevika.com':['/ko/wuwa/weapon/'],'www.prydwen.gg':['/wuthering-waves/characters/'],'prydwen.gg':['/wuthering-waves/characters/']};
   if(prefixes[host]?.some(prefix=>u.pathname.startsWith(prefix)))return true;
   if(host==='gamevika.com'&&u.pathname==='/ko/wuwa/hsin')return true;
   if(host==='wuwaguide.kurogames.com'&&u.pathname==='/ko/'&&/^\d+$/.test(u.searchParams.get('role_id')||'')&&/^\d+$/.test(u.searchParams.get('strategy_id')||''))return true;
  }
  if(gameId==='arknights'&&((host==='m.namu.moe'&&decodeURIComponent(u.pathname)==='/w/명일방주/헤드헌팅')||(host==='gameludens.com'&&u.pathname==='/arknights/259/')))return true;
  return ['inven.co.kr','vortexgaming.io','arca.live','dcinside.com'].some(h=>host===h||host.endsWith('.'+h));
 }catch{return false;}
}
export interface SourceCheck {gameId:string;checkedAt:string;status:string;count:number;error?:string}
export const localized=(ko:string,en:string,ja:string,zh:string):Localized=>({ko,en,ja,zh});
export function entryState(e:Entry,now:number):"active"|"upcoming"|"ended"|"notice"{
 if(e.pickupArchive?.status==='forecast')return "upcoming";
 if(e.endAt&&new Date(e.endAt).getTime()<=now)return "ended";
 if(e.startAt&&new Date(e.startAt).getTime()>now)return "upcoming";
 const today=new Date(now+9*3600000).toISOString().slice(0,10);
 const start=e.startDate||e.pickupArchive?.startDate,end=e.endDate||e.pickupArchive?.endDate;
 if(!e.startAt&&start&&start>today)return "upcoming";
 if(!e.endAt&&end&&end<today)return "ended";
 if(e.endAt)return "active";
 if((e.sourceKind||'official')==='official'&&start&&start<=today&&end)return "active";
 return "notice";
}
// History metadata records provenance. Official clock windows drive every live view.
export function liveContent(e:Entry,now:number){
 return !e.pickupArchive||e.pickupArchive.status!=='forecast'&&entryState(e,now)==='active';
}
export function safeSource(url:string,gameId:string):boolean{
 // This exact syndicated post exposes the verified publisher identity; no general Sina allowlist.
 if(gameId==='arknights'&&url==='https://sina.cn/news/detail/5356487804978990.html')return true;
 if(reviewedRecurringSource(url,gameId,'official'))return true;
 if(isReviewedCollaborationSource(url,gameId))return true;
 const hosts:Record<string,string[]>={trickcal:["trickcal.com","trickcal.biligames.com"],hi3:["honkaiimpact3.hoyoverse.com","www.houkai3rd.com","www.hoyolab.com"],reverse1999:["reverse1999.haoplay.com","re1999.bluepoch.com","re.bluepoch.com"],stellasora:["stellasora.kr","stellasora.jp","stellasora.global"],wuwa:["wutheringwaves.kurogames.com","wuwaguide.kurogames.com"],bluearchive:["bluearchive.nexon.com","bluearchive.jp","forum.nexon.com","bluearchive.nexon.co.jp"],nikke:["nikke-en.com","nikke-kr.com","nikke-jp.com","nikke.hotcool.tw","nikke-global.com"],endfield:["endfield.gryphline.com","endfield.hypergryph.com"],umamusume:["umamusume.com","umamusume.jp","umamusume.kakaogames.com","bbs.kakaogames.com","pf.kakao.com"],nte:["nte.perfectworld.com","nte.perfectworldgames.com"],gfl2:["gf2.haoplay.com","gf2exilium.sunborngame.com","gf2.sunborngame.com"],arknights:["arknights.global","arknights.jp","arknights.kr","ak.hypergryph.com"],genshin:["genshin.hoyoverse.com","www.hoyolab.com","ys.mihoyo.com"],hsr:["hsr.hoyoverse.com","www.hoyoverse.com","www.hoyolab.com","sr.mihoyo.com"],zzz:["zenless.hoyoverse.com","www.hoyoverse.com","www.hoyolab.com","zzz.mihoyo.com"]};
 try{const u=new URL(url);if(gameId==='genshin'&&u.protocol==='https:'&&u.hostname==='blog.ko.playstation.com'&&decodeURIComponent(u.pathname)==='/2024/05/27/〈원신〉-4-7-버전에-추가되는-장기-도전-비경-그리고/')return true;if(u.protocol!=="https:")return false;if(["x.com","twitter.com","www.twitter.com"].includes(u.hostname)&&/^\/[A-Za-z0-9_]+\/status\/\d+\/?$/.test(u.pathname)&&officialXAccounts[gameId]?.includes(u.pathname.split("/")[1].toLowerCase()))return true;if(gameId==='hsr'&&u.hostname==='wiki.hoyolab.com'&&u.pathname==='/pc/hsr/entry/10393')return true;if(u.hostname==='play.google.com')return gameId==='stellasora'&&u.pathname==='/store/apps/details'&&u.searchParams.get('id')==='com.Stargazer.StellaSora';if(u.hostname==='act.hoyoverse.com')return gameId==='hi3'&&u.pathname==='/puzzle/bh3/e20261016preview_1456/index.html';if(u.hostname==='apps.apple.com'){if(gameId==='reverse1999'&&/^\/cn\/app\/(?:[^/]+\/)?id1611712418$/.test(u.pathname))return true;const ids:Record<string,string>={wuwa:'6475033368',hi3:'1286705196',reverse1999:'6449023119'};return !!ids[gameId]&&new RegExp('^/[a-z]{2}/app/(?:[^/]+/)?id'+ids[gameId]+'$').test(u.pathname);}if(u.hostname==='guide-server.aki-game.net')return gameId==='wuwa'&&u.pathname==='/introduction/info'&&/^\d+$/.test(u.searchParams.get('roleGbId')||'')&&/^\d+$/.test(u.searchParams.get('id')||'');if(u.hostname==='www.taptap.cn')return gameId==='arknights'&&['/moment/856135623801572080','/moment/859523733377781690'].includes(u.pathname)||gameId==='reverse1999'&&['/moment/847867884553112990','/moment/850773912890379954','/moment/851909349566578689','/moment/859501469164898588'].includes(u.pathname);if(u.hostname==='gf2-web-preregister-api.sunborngame.com')return gameId==='gfl2'&&/^\/website\/news\/\d+$/.test(u.pathname);if(u.hostname==='steamcommunity.com')return gameId==='gfl2'&&/^\/games\/3308670\/announcements\/detail\/\d+\/?$/.test(u.pathname)||gameId==='hi3'&&/^\/games\/1672740\/announcements\/detail\/\d+\/?$/.test(u.pathname);if(u.hostname==='pf.kakao.com')return gameId==='umamusume'&&/^\/_DzxjIb\/\d+\/?$/.test(u.pathname)||gameId==='nte'&&/^\/_uSxfcG\/\d+\/?$/.test(u.pathname);if(u.hostname==='x.com')return gameId==='umamusume'&&u.pathname==='/umamusume_eng/status/2110132265825296734'||gameId==='arknights'&&/^\/(ArknightsKorea|ArknightsStaff|ArknightsEN)\/status\/\d+\/?$/i.test(u.pathname);if(u.hostname==='www.facebook.com')return (gameId==='arknights'&&(/^\/ArknightsGlobal\/posts\/[a-z0-9-]+\/\d+\/?$/.test(u.pathname)||u.pathname==='/ArknightsKorea/posts/1708602874146479/'))||(gameId==='umamusume'&&u.pathname==='/umamusume.eng/posts/122248762970353111/');if(u.hostname==='game.naver.com'){const lounge={trickcal:'Trickcal',stellasora:'stellasora',reverse1999:'reverse1999'}[gameId as 'trickcal'|'stellasora'|'reverse1999'];if(lounge&&new RegExp('^/lounge/'+lounge+'/board/detail/[0-9]+/?$','i').test(u.pathname))return true;}if(u.hostname==='cafe.naver.com'&&gameId==='hi3'&&/^\/honkai3rd(?:\/\d+)?\/?$/.test(u.pathname))return true;if(u.hostname==='game.naver.com')return gameId==='nte'&&/^\/lounge\/NTE\/board\/detail\/\d+\/?$/.test(u.pathname)||gameId==='wuwa'&&['8212393','8276655','8328738','8311300'].some(id=>u.pathname==='/lounge/WutheringWaves/board/detail/'+id);if(u.hostname==='media-cdn-mingchao.kurogame.com')return gameId==='wuwa'&&u.pathname.startsWith('/akiwebsite/website2.0/json/G152/');return (hosts[gameId]||[]).some(h=>u.hostname===h||u.hostname.endsWith("."+h));}catch{return false;}
}
