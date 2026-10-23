import {z} from 'zod';
import {safeReference} from './types';
const localized=z.object({ko:z.string().max(2000),en:z.string().max(2000),ja:z.string().max(2000),zh:z.string().max(2000)});
const date=z.string().datetime({offset:true}).nullable();
const locale=z.enum(['ko','en','ja','zh']);const region=z.enum(['global','kr','jp','cn']);const sourceKind=z.enum(['official','community','video']);
const focus=z.object({x:z.number().min(0).max(100),y:z.number().min(0).max(100),zoom:z.number().min(1).max(6)});
const frame=z.object({x:z.number().min(-100).max(200),y:z.number().min(-100).max(200),zoom:z.number().min(.05).max(6),fit:z.enum(["cover","contain"])}).strict();
const framing=z.object({default:frame.optional(),banner:frame.optional(),card:frame.optional(),mobile:frame.optional()}).strict();
const bounds=z.object({left:z.number().min(0).max(100),top:z.number().min(0).max(100),right:z.number().min(0).max(100),bottom:z.number().min(0).max(100)}).refine(b=>b.right>b.left&&b.bottom>b.top,'Invalid preview bounds');
const imageKind=z.enum(['character','weapon','support','banner','splash']);
const imageLocale=z.enum(['ko','en','ja','zh','neutral']);
const asset=z.object({imageFraming:framing.optional(),imageCaption:localized.optional(),originalLanguageFallback:z.boolean().optional(),textFreePreview:z.boolean().optional(),image:z.string().max(1500),imageSource:z.string().url(),imageVerified:z.boolean(),imageKind:imageKind.optional(),imageLocale:imageLocale.optional(),width:z.number().int().positive().max(20000),height:z.number().int().positive().max(100000),previewFocus:focus.optional(),previewBounds:bounds.optional(),verifiedAt:z.string().datetime({offset:true})});
const artwork={imageFraming:framing.optional(),imageCaption:localized.optional(),originalLanguageFallback:z.boolean().optional(),textFreePreview:z.boolean().optional(),image:z.string().max(1500).optional(),imageSource:z.string().url().optional(),imageKind:imageKind.optional(),imageFit:z.enum(['contain','cover']).optional(),imagePosition:z.string().max(80).optional(),imageVerified:z.boolean().optional(),previewFocus:focus.optional(),previewBounds:bounds.optional(),imageLocale:imageLocale.optional(),previewArtwork:asset.optional(),localizedArtwork:z.object({ko:asset.optional(),en:asset.optional(),ja:asset.optional(),zh:asset.optional()}).optional()};
const reference=z.object({kind:sourceKind,url:z.string().url().max(1500),title:z.string().max(400),publisher:z.string().max(150).optional(),publishedAt:z.string().max(40).optional()});
export const gameIconSchema=z.object({image:z.string().max(1500),imageSource:z.string().url(),width:z.number().int().positive().max(10000),height:z.number().int().positive().max(10000),verifiedAt:z.string().datetime({offset:true})});
export const traitSchema=z.object({id:z.string().max(100),label:localized,value:localized,icon:gameIconSchema.optional(),officialLocales:z.array(locale).max(4).optional(),translatedLocales:z.array(locale).max(4).optional()});
export const rewardSchema=z.object({note:localized.optional(),acquisition:z.enum(["free","conditional","purchase"]).optional(),rewardId:z.string().regex(/^[a-z0-9_-]{1,100}$/).optional(),category:z.enum(['gacha-currency','gacha-ticket','resource']).optional(),officialLocales:z.array(locale).max(4).optional(),translatedLocales:z.array(locale).max(4).optional(),name:localized,quantity:z.string().max(200).optional(),icon:gameIconSchema.optional(),sourceUrl:z.string().url(),sourceKind:z.enum(['official','community'])});
export const videoSchema=z.object({originalTitle:z.string().max(500).optional(),titleOfficialLocales:z.array(locale).max(4).optional(),titleTranslatedLocales:z.array(locale).max(4).optional(),youtubeId:z.string().regex(/^[a-zA-Z0-9_-]{11}$/),kind:z.enum(['character','version']),format:z.enum(['pv','intro','demo']).optional(),title:localized,locale,channel:z.string().max(200),sourceUrl:z.string().url(),publishedAt:z.string().max(40).nullable().optional(),verifiedAt:z.string().datetime({offset:true}),official:z.boolean(),metadataVerified:z.boolean(),watched:z.literal(false),entityNames:z.array(localized).max(30).optional(),evidenceUrls:z.array(z.string().url()).max(10).optional()});
const statRow=z.object({label:localized,value:z.string().max(500),note:localized.optional()});
export const broadcastSchema=z.object({status:z.enum(['scheduled','live','ended','cancelled']),youtubeId:z.string().regex(/^[a-zA-Z0-9_-]{11}$/).optional(),channel:z.string().min(1).max(200).optional(),locale,sourceUrl:z.string().url(),announcementUrl:z.string().url(),originalTitle:z.string().min(1).max(500),announcedAt:z.string().max(40).nullable(),scheduledAt:date,programStartAt:date.optional(),thumbnailUrl:z.string().url().optional(),statusCheckedAt:z.string().datetime({offset:true}).optional(),scheduledDate:z.string().date().optional(),actualStartAt:date.optional(),endedAt:date,official:z.literal(true),metadataVerified:z.literal(true),watched:z.literal(false),verifiedAt:z.string().datetime({offset:true})});
export const entityProfileSchema=z.object({
 id:z.string().regex(/^[a-zA-Z0-9_-]{1,160}$/),name:localized,category:localized,basis:localized,officialLocales:z.array(locale).max(4).optional(),translatedLocales:z.array(locale).max(4).optional(),
 traits:z.array(traitSchema).max(24).optional(),stats:z.array(statRow).max(30),statSourceKind:sourceKind,
 groups:z.array(z.object({title:localized,body:localized,sourceKind,sourceUrls:z.array(z.string().url()).max(10).optional(),rows:z.array(statRow).max(30).optional()})).max(18),
 sources:z.array(reference).min(1).max(10),verifiedAt:z.string().datetime({offset:true}),notes:z.array(localized).max(10).optional()
});
const longLocalized=z.object({ko:z.string().max(40000),en:z.string().max(40000),ja:z.string().max(40000),zh:z.string().max(40000)});
export const contentBlockSchema=z.discriminatedUnion('type',[z.object({id:z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/),type:z.literal('text'),title:localized.optional(),body:longLocalized}).strict(),z.object({id:z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/),type:z.literal('image'),asset}).strict()]);
export const entrySchema=z.object({
 contentBlocks:z.array(contentBlockSchema).max(50).refine(rows=>new Set(rows.map(r=>r.id)).size===rows.length,'Duplicate content block ID').optional(),
 recurring:z.object({modeId:z.string().regex(/^[a-z0-9_-]{1,100}$/),cycleLabel:localized,sourceKind:z.enum(["official","community"]),sourceUrls:z.array(z.string().url()).min(1).max(10),verifiedAt:z.string().datetime({offset:true}),resetAt:date.optional(),resetDate:z.string().date().optional(),resetEvidence:z.object({kind:z.literal("owner-confirmed"),timeZone:z.string().min(1).max(100),note:localized,verifiedAt:z.string().datetime({offset:true})}).optional()}).optional(),
 collaboration:z.object({partner:localized,scope:z.enum(['ingame','offline','merchandise','online']),sourceUrls:z.array(z.string().url()).min(1).max(10),verifiedAt:z.string().datetime({offset:true})}).optional(),
 detailImages:z.array(asset).max(24).optional(),
 startDate:z.string().date().optional(),endDate:z.string().date().optional(),
 pickupArchive:z.object({status:z.enum(['past','announced','forecast']),startDate:z.string().date().optional(),endDate:z.string().date().optional(),note:localized.optional(),estimate:z.object({method:z.enum(['cycle','community']),scope:z.enum(['banner','version']),startDate:z.string().date(),alternativeStartDates:z.array(z.string().date()).max(3).optional(),anchorDate:z.string().date().optional(),cycleDays:z.number().int().min(1).max(366).optional(),basis:localized,sourceUrls:z.array(z.string().url()).min(1).max(10),verifiedAt:z.string().datetime({offset:true})}).optional()}).optional(),
 id:z.string().regex(/^[a-zA-Z0-9_-]{1,160}$/),gameId:z.string(),kind:z.enum(['pickup','weapon','event','package','update']),title:localized,summary:longLocalized,region,server:z.string().max(150),startAt:date,endAt:date,publishedAt:z.string().max(40).nullable(),verifiedAt:z.string().datetime({offset:true}),sourceUrl:z.string().url().max(1500),sourceTitle:z.string().max(400),...artwork,
 version:z.string().max(80).optional(),versionTitle:localized.optional(),versionHero:z.boolean().optional(),bannerName:localized.optional(),rarity:z.number().int().min(1).max(6).optional(),price:z.object({amount:z.number().nonnegative(),currency:z.string().max(80),platform:z.string().max(150)}).optional(),contents:z.array(localized).max(30).optional(),featured:z.boolean().optional(),timingNote:localized.optional(),
 signatureWeapons:z.array(z.object({entryId:z.string().min(1).max(160),memberName:z.string().min(1).max(200).optional(),sourceUrl:z.string().url().max(1500),sourceKind:z.enum(["official","community"]),verifiedAt:z.string().datetime({offset:true})})).max(12).optional(),
 pickupType:z.enum(['new','rerun','mixed','unknown']).optional(),pickupGroup:z.string().max(160).optional(),poolType:z.enum(['character','weapon','support','standard']).optional(),selectionCount:z.number().int().min(1).max(30).optional(),pickupMembers:z.array(z.object({name:localized,type:z.enum(['new','rerun','unknown']),role:z.enum(['featured','rate-up','candidate']).optional(),rarity:z.number().int().min(1).max(6).optional(),...artwork})).max(100).optional(),officialLocales:z.array(locale).max(4).optional(),translatedLocales:z.array(locale).max(4).optional(),sourceLocale:locale.optional(),localizationSources:z.object({ko:z.string().url().optional(),en:z.string().url().optional(),ja:z.string().url().optional(),zh:z.string().url().optional()}).optional(),
 sourceKind:sourceKind.optional(),relatedSources:z.array(reference).max(20).optional(),detailSections:z.array(z.object({audienceRegions:z.array(region).min(1).max(4).optional(),title:localized,body:longLocalized,sourceKind:sourceKind.optional(),sourceUrls:z.array(z.string().url()).max(10).optional()})).max(12).optional(),highlights:z.array(localized).max(5).optional(),marketRegion:region.optional(),audienceRegions:z.array(region).min(1).max(4).optional(),videos:z.array(videoSchema).max(30).optional(),broadcast:broadcastSchema.optional(),rewards:z.array(rewardSchema).max(12).optional(),rewardNote:localized.optional(),entityDetails:z.array(entityProfileSchema).max(30).optional()
});
export const safeImage=(image?:string)=>{
 if(!image)return true;
 if(/^\/api\/media\/[0-9a-f-]{36}\.(png|jpeg|webp|avif)$/.test(image))return true;
 if(image.startsWith('/assets/'))return !image.includes('..')&&/^\/assets\/[\w.\/-]+$/.test(image);
 try{const url=new URL(image);return url.protocol==='https:'&&!url.username&&!url.password;}catch{return false;}
};
export function safeArtwork(art:import('./types').EntityArtwork){
 const variants=[...Object.values(art.localizedArtwork||{}),...(art.previewArtwork?[art.previewArtwork]:[])];
 const reviewedFallback=(a:import('./types').EntityArtwork)=>!a.originalLanguageFallback||!!(a.imageVerified&&a.image&&a.imageSource&&a.imageLocale&&a.imageLocale!=='neutral'&&['banner','splash','support'].includes(a.imageKind||'')&&['ko','en','ja','zh'].every(l=>a.imageCaption?.[l as import('./types').Locale]));
 return safeImage(art.image)&&reviewedFallback(art)&&variants.every(a=>safeImage(a.image)&&reviewedFallback(a)&&/^https:\/\//.test(a.imageSource)&&Date.parse(a.verifiedAt)<=Date.now()+300000&&(!a.imageVerified||!!a.imageSource));
}

export const safeIcon=(icon?:import('./types').GameIcon)=>!icon||(safeImage(icon.image)&&!!icon.image&&safeHttps(icon.imageSource)&&Date.parse(icon.verifiedAt)<=Date.now()+300000);
export function safeExtras(e:import('./types').Entry){
 if(e.recurring&&(e.kind!=="event"||!!e.pickupArchive||Date.parse(e.recurring.verifiedAt)>Date.now()+300000||e.recurring.sourceUrls.some(u=>!safeReference(u,e.gameId,e.recurring!.sourceKind))||e.recurring.sourceKind!=="official"&&!e.recurring.resetEvidence&&(e.recurring.resetAt||e.recurring.resetDate)))return false;
 if(e.recurring?.resetEvidence){const x=e.recurring.resetEvidence;if(Date.parse(x.verifiedAt)>Date.now()+300000||Object.values(x.note).some(v=>!v.trim()))return false;try{new Intl.DateTimeFormat("en",{timeZone:x.timeZone});}catch{return false;}}
 if(e.collaboration&&(e.collaboration.sourceUrls.some(u=>!safeReference(u,e.gameId,'official'))||Date.parse(e.collaboration.verifiedAt)>Date.now()+300000))return false;
 if(e.contentBlocks?.some(b=>b.type==='image'&&(!b.asset.image||!b.asset.imageVerified||!b.asset.imageLocale||!safeArtwork(b.asset)||!safeHttps(b.asset.imageSource)||Date.parse(b.asset.verifiedAt)>Date.now()+300000)))return false;
 if(e.detailImages?.some(a=>!a.imageVerified||!safeArtwork(a)||!safeHttps(a.imageSource)||Date.parse(a.verifiedAt)>Date.now()+300000))return false;
 if(e.signatureWeapons?.length&&(e.kind!=='pickup'||e.poolType==='support'||e.poolType==='weapon'||e.signatureWeapons.some(w=>!safeHttps(w.sourceUrl)||Date.parse(w.verifiedAt)>Date.now()+300000)))return false;
 const b=e.broadcast;
 return (!b||(e.kind==='update'&&!e.startAt&&!e.endAt&&b.official&&b.metadataVerified&&(!b.statusCheckedAt||Date.parse(b.statusCheckedAt)<=Date.now()+300000)&&(!b.thumbnailUrl||/^https:\/\/i\.ytimg\.com\/vi\/[a-zA-Z0-9_-]{11}\//.test(b.thumbnailUrl)&&new URL(b.thumbnailUrl).pathname.split('/')[2]===b.youtubeId)&&safeHttps(b.sourceUrl)&&safeHttps(b.announcementUrl)&&Date.parse(b.verifiedAt)<=Date.now()+300000&&(!b.youtubeId||!!b.channel&&youtubeMatches(b.sourceUrl,b.youtubeId))&&(!b.actualStartAt||!b.endedAt||Date.parse(b.actualStartAt)<=Date.parse(b.endedAt))))&&!(e.videos||[]).some(v=>!v.metadataVerified||!v.official||Date.parse(v.verifiedAt)>Date.now()+300000||!youtubeMatches(v.sourceUrl,v.youtubeId)||v.evidenceUrls?.some(url=>!safeHttps(url)))&&!(e.rewards||[]).some(r=>!safeIcon(r.icon)||!safeHttps(r.sourceUrl))&&!(e.entityDetails||[]).some(p=>p.traits?.some(t=>!safeIcon(t.icon)));
}
function youtubeMatches(url:string,id:string){try{const u=new URL(url);return u.protocol==='https:'&&!u.username&&!u.password&&((u.hostname==='youtu.be'&&u.pathname==='/'+id)||(['youtube.com','www.youtube.com','m.youtube.com'].includes(u.hostname)&&(u.pathname==='/watch'&&u.searchParams.get('v')===id||['/shorts/'+id,'/live/'+id].includes(u.pathname))));}catch{return false;}}

function safeHttps(url:string){try{const u=new URL(url);return u.protocol==="https:"&&!u.username&&!u.password;}catch{return false;}}

export function safePickupArchive(e:import('./types').Entry){
 if(e.startDate&&e.endDate&&e.startDate>e.endDate)return false;
 if(e.broadcast&&(e.startDate||e.endDate))return false;
 const a=e.pickupArchive;if(!a)return true;
 if(a.estimate){
  const x=a.estimate;
  if(a.status!=='forecast'||e.sourceKind!=='community'||e.startAt||e.endAt||Date.parse(x.verifiedAt)>Date.now()+300000||x.sourceUrls.some(u=>!safeReference(u,e.gameId,'official')&&!safeReference(u,e.gameId,'community')))return false;
  if(x.scope==='version'&&(a.startDate||a.endDate))return false;
  if(x.method==='cycle'){
   if(!x.anchorDate||!x.cycleDays)return false;
   const date=new Date(x.anchorDate+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+x.cycleDays);
   if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==x.startDate)return false;
  }
 }
 return ['pickup','weapon'].includes(e.kind)&&!(a.startDate&&a.endDate&&a.startDate>a.endDate)&&!(a.status==='forecast'&&(e.startAt||e.endAt))&&!(a.status==='announced'&&(e.sourceKind||'official')!=='official');
}
