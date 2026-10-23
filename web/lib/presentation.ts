import type {Entry,Game,Locale,Region,Localized} from './types';
import {ui} from './i18n';

export const regionLabel=(game:Game,region:Region,locale:Locale,labels=ui[locale])=>game.serviceMode==='shared-global'&&region==='global'?labels.unifiedSchedule:game.regionLabels?.[region]?.[locale]||labels[region];
export const effectiveRegion=(game:Game,requested:Region):Region=>game.serviceMode==='shared-global'?'global':game.regionAliases?.[requested]||(game.regions.includes(requested)?requested:'global');
export const scheduleRegions=(game:Game):Region[]=>game.serviceMode==='shared-global'?[]:game.scheduleRegions||game.regions;
export const inSchedule=(entry:Entry,game:Game,requested:Region)=>(requested!=='cn'||game.regions.includes('cn'))&&entry.region===effectiveRegion(game,requested);
export const matchedArtwork=(entry:Entry)=>!!(entry.image&&entry.imageVerified);
export const featuredMembers=(entry:Entry)=>entry.pickupMembers?.filter(m=>m.role!=='rate-up'&&m.role!=='candidate');
export const editedEntryArtwork=(entry:Entry)=>featuredMembers(entry)?.length===1&&entry.editor?.fields.some(key=>['image','localizedArtwork','previewFocus','previewBounds','previewArtwork','imagePosition','imageLocale'].includes(key));
export const entryTitle=(entry:Entry,locale:Locale)=>entry.title[locale]||ui[locale].localizationPending;
export const localizedName=(name:Localized,locale:Locale)=>name[locale]||ui[locale].localizationPending;
export const platformLabel=(platform:string,locale:Locale)=>({
 'In-game shop; platform not specified':{ko:'게임 내 상점 · 결제 플랫폼 미공개',en:'In-game shop · payment platform unspecified',ja:'ゲーム内ショップ・決済プラットフォーム未公表',zh:'游戏内商店 · 支付平台未公布'},
 'Japan in-game shop; platform unspecified':{ko:'일본 게임 내 상점 · 결제 플랫폼 미공개',en:'Japan in-game shop · payment platform unspecified',ja:'日本版ゲーム内ショップ・決済プラットフォーム未公表',zh:'日本游戏内商店 · 支付平台未公布'},
 'In-game garment shop; platform not specified':{ko:'게임 내 의상 상점 · 결제 플랫폼 미공개',en:'In-game garment shop · payment platform unspecified',ja:'ゲーム内衣装ショップ・決済プラットフォーム未公表',zh:'游戏内服装商店 · 支付平台未公布'},
 'Movic online shop (tax included; per plush)':{ko:'Movic 온라인 숍 · 세금 포함 · 인형 1개당',en:'Movic online shop · tax included · per plush',ja:'ムービック通販・税込・ぬいぐるみ1個あたり',zh:'Movic网店 · 含税 · 每个玩偶'},
 'WORLD WIDE WATCH (tax included)':{ko:'WORLD WIDE WATCH · 세금 포함',en:'WORLD WIDE WATCH · tax included',ja:'WORLD WIDE WATCH・税込',zh:'WORLD WIDE WATCH · 含税'},
 'In-game store':{ko:'게임 내 상점',en:'In-game store',ja:'ゲーム内ショップ',zh:'游戏内商店'},
 'Unspecified':{ko:'플랫폼 미공개',en:'Platform unspecified',ja:'プラットフォーム未公表',zh:'平台未公布'},

 'In-game shop; operating system/payment platform not specified':{ko:'게임 내 상점 · 운영체제·결제 플랫폼 미공개',en:'In-game shop · OS/payment platform unspecified',ja:'ゲーム内ショップ・OS／決済プラットフォーム未公表',zh:'游戏内商店 · 操作系统／支付平台未公布'},
 'Web top-up center · 웹 충전 센터':{ko:'웹 충전 센터',en:'Web top-up center',ja:'Webチャージセンター',zh:'网页充值中心'},
 'Android · Google Play Korea':{ko:'Android · 한국 Google Play',en:'Android · Google Play Korea',ja:'Android・韓国Google Play',zh:'Android · 韩国Google Play'},
 'In-game Outfit Show Window':{ko:'게임 내 의상 쇼윈도',en:'In-game Outfit Show Window',ja:'ゲーム内衣装ショーウィンドウ',zh:'游戏内服装展示橱窗'},
 'Japan in-game shop (official notice)':{ko:'일본 서비스 게임 내 상점 · 공식 공지',en:'Japan in-game shop (official notice)',ja:'日本版ゲーム内ショップ（公式告知）',zh:'日服游戏内商店（官方公告）'},
 'In-game':{ko:'게임 내 상점',en:'In-game',ja:'ゲーム内ショップ',zh:'游戏内商店'},
 'Japan in-game shop; each pack':{ko:'일본 서비스 게임 내 상점 · 패키지별',en:'Japan in-game shop; each pack',ja:'日本版ゲーム内ショップ・各パック',zh:'日服游戏内商店 · 每个礼包'},
} as Record<string,Localized>)[platform]?.[locale]||platform;
export const languageLabel=(language:Locale,locale:Locale)=>new Intl.DisplayNames([locale],{type:'language'}).of(language)||language.toUpperCase();
export const versionCaption=(entry:Entry,locale:Locale)=>entry.versionTitle?.[locale]||(entry.version&&/^\d+(\.\d+)*$/.test(entry.version)?'V'+entry.version:locale==='en'?entry.version:undefined);
// Name-localization evidence can predate the current rotation. Open the current notice.
export const entrySource=(entry:Entry,_locale:Locale)=>entry.sourceUrl;
export function availableInLocale(entry:Entry,locale:Locale){
 if(!entry.id.startsWith('feed-'))return true;
 if(entry.officialLocales||entry.translatedLocales)return [...(entry.officialLocales||[]),...(entry.translatedLocales||[])].includes(locale);
 // Older feed rows copied one source title into all four fields. Only show the original language.
 const native=entry.sourceLocale||(entry.gameId==='bluearchive'?'ja':'en');
 return locale===native||entry.title[locale]!==entry.title[native];
}
export type PickupGroup={id:string;gameId:string;region:Region;poolType:string;entries:Entry[]};
export function groupPickups(entries:Entry[]):PickupGroup[]{
 const groups=new Map<string,PickupGroup>();
 for(const e of entries){
  if(e.kind!=='pickup'&&e.kind!=='weapon')continue;
  const pool=e.poolType||(e.kind==='weapon'?'weapon':'character');
  // A named rotation may contain different end dates. Always isolate service, pool and game.
  const id=[e.gameId,e.region,pool,e.pickupGroup||e.endAt||e.sourceUrl].join('|');
  if(!groups.has(id))groups.set(id,{id,gameId:e.gameId,region:e.region,poolType:pool,entries:[]});
  groups.get(id)!.entries.push(e);
 }
 const rank={new:0,mixed:1,rerun:2,unknown:3};
 return [...groups.values()].map(g=>({...g,entries:g.entries.sort((a,b)=>rank[a.pickupType||'unknown']-rank[b.pickupType||'unknown'])}));
}
export function mergeVerifiedEntry(current:Entry|undefined,incoming:Entry):Entry{
 return current&&Date.parse(current.verifiedAt)>Date.parse(incoming.verifiedAt)?current:retainEntityDetails(incoming,current);
}
export function retainEntityDetails(incoming:Entry,previous:Entry|undefined):Entry{
 const result=retainArtwork(incoming,previous);
 if(previous?.pickupMembers&&incoming.pickupMembers)result.pickupMembers=incoming.pickupMembers.map(member=>{
  const old=previous.pickupMembers!.find(candidate=>{
   const common=(['ko','en','ja','zh'] as const).filter(l=>member.name[l]&&candidate.name[l]);
   return common.length>0&&common.every(l=>member.name[l]===candidate.name[l])&&(member.role||'featured')===(candidate.role||'featured');
  });
  return retainArtwork(member,old);
 });
 if(incoming.pickupMembers===undefined&&previous?.pickupMembers)result.pickupMembers=previous.pickupMembers;
 for(const key of ['contentBlocks','recurring','signatureWeapons','entityDetails','videos','broadcast','rewards','rewardNote','marketRegion','audienceRegions','collaboration','pickupArchive','startDate','endDate'] as const)if(incoming[key]===undefined&&previous?.[key]!==undefined)Object.assign(result,{[key]:previous[key]});
 if(previous&&incoming.sourceUrl===previous.sourceUrl&&incoming.sourceTitle===previous.sourceTitle)for(const key of ['detailSections','detailImages','highlights','contents'] as const)if(incoming[key]===undefined&&previous[key]!==undefined)Object.assign(result,{[key]:previous[key]});
 if(result.pickupArchive?.status==='forecast'&&!result.pickupArchive.estimate&&!result.pickupArchive.startDate&&previous?.pickupArchive?.estimate)result.pickupArchive={...result.pickupArchive,estimate:previous.pickupArchive.estimate};
 return result;
}

// Routine metadata refreshes are sparse. An omitted asset/locale is not a delete.
// A changed original must carry its own classification/framing; do not graft the
// previous picture's locale, caption or crop onto a newly supplied file.
function retainArtwork<T extends import('./types').EntityArtwork>(incoming:T,previous:T|undefined):T{
 const result={...incoming};if(!previous)return result;
 if(previous.imageVerified&&incoming.image&&incoming.image!==previous.image&&incoming.imageVerified===undefined){
  for(const key of ['image','imageSource','imageKind','imageFit','imagePosition','imageVerified','imageLocale','imageCaption','originalLanguageFallback','textFreePreview','previewFocus','previewBounds','previewArtwork'] as const){delete result[key];if(previous[key]!==undefined)Object.assign(result,{[key]:previous[key]});}
 }
 if(previous.imageVerified&&(!incoming.image||incoming.image===previous.image))for(const key of ['image','imageSource','imageKind','imageFit','imagePosition','imageVerified','imageLocale','imageCaption','originalLanguageFallback','textFreePreview','previewFocus','previewBounds','previewArtwork'] as const)if(incoming[key]===undefined&&previous[key]!==undefined)Object.assign(result,{[key]:previous[key]});
 if(previous.localizedArtwork)result.localizedArtwork={...previous.localizedArtwork,...incoming.localizedArtwork};
 return result;
}
