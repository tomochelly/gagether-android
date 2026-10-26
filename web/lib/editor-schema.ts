import {allowsRewards} from './content-roles';
import {z} from 'zod';
import {entrySchema,localizedTextStyle,textAppearanceSchema,safeImage,safeArtwork,safeExtras,safePickupArchive} from './content-schema';
import {games} from './games';
import {ui} from './i18n';
import {draftProblems} from './editor-draft';
import {sectionIds} from './site-layout';
import {safeAnnouncementLink} from './site-announcements';
const localized=z.object({ko:z.string().max(2000),en:z.string().max(2000),ja:z.string().max(2000),zh:z.string().max(2000)});
const picture=z.string().max(2000).refine(v=>!v||safeImage(v));
const https=z.string().refine(v=>{try{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}});
const sectionOrderSchema=z.array(z.enum(sectionIds)).max(sectionIds.length).refine(rows=>new Set(rows).size===rows.length,"Duplicate layout section");
export const settingsSchema=z.object({
 uiTextStyle:z.object(Object.fromEntries(['ko','en','ja','zh'].map(lang=>[lang,z.record(textAppearanceSchema).refine(v=>Object.keys(v).every(k=>k in ui.ko)).optional()]))).strict().optional(),
 layout:z.object({overview:sectionOrderSchema.optional(),game:sectionOrderSchema.optional(),timeline:sectionOrderSchema.optional()}).strict().optional(),
 announcements:z.array(z.object({textStyle:localizedTextStyle.optional(),id:z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/),title:localized.refine(v=>Object.values(v).every(s=>s.trim().length>0),'All four notice titles are required'),body:localized.refine(v=>Object.values(v).every(s=>s.trim().length>0),'All four notice bodies are required'),publishedDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v,'Invalid publication date').optional(),href:z.string().max(2000).refine(safeAnnouncementLink).optional(),enabled:z.boolean().optional()}).strict()).max(20).refine(rows=>new Set(rows.map(r=>r.id)).size===rows.length,'Duplicate notice ID').optional(),
 announcementSeconds:z.number().min(3).max(60).optional(),
 brand:z.object({textStyle:localizedTextStyle.optional(),name:z.string().max(60).optional(),tagline:z.string().max(100).optional(),logo:picture.optional()}).optional(),
 carouselSeconds:z.number().min(3).max(20).optional(),
 ui:z.object(Object.fromEntries(['ko','en','ja','zh'].map(lang=>[lang,z.record(z.string().max(2000)).refine(value=>Object.keys(value).every(key=>key in ui.ko)).optional()]))).optional(),
 games:z.record(z.object({textStyle:localizedTextStyle.optional(),name:localized.optional(),short:z.string().max(30).optional(),genre:localized.optional(),color:z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),logo:picture.optional(),localizedLogos:z.object({ko:picture.optional(),en:picture.optional(),ja:picture.optional(),zh:picture.optional()}).optional(),logoSources:z.object({ko:https.optional(),en:https.optional(),ja:https.optional(),zh:https.optional()}).optional(),icon:picture.optional(),iconSource:https.optional(),art:picture.optional(),artPosition:z.string().max(80).optional(),official:https.optional(),publisher:z.string().max(100).optional(),regionLabels:z.object({global:localized.optional(),kr:localized.optional(),jp:localized.optional(),cn:localized.optional()}).optional()})).refine(v=>Object.keys(v).every(id=>games.some(g=>g.id===id))).optional(),
});
export const entryChanges=entrySchema.omit({id:true,verifiedAt:true}).partial().extend({hidden:z.boolean().optional()}).strict();
const removableFields=Object.entries(entrySchema.shape).filter(([,schema])=>schema.isOptional()).map(([key])=>key);
export const editRequest=z.object({target:z.enum(['entry','site']),id:z.string().regex(/^[a-zA-Z0-9_-]{1,160}$/).optional(),revision:z.number().int().nonnegative(),changes:z.record(z.unknown()),removeFields:z.array(z.string().refine(k=>removableFields.includes(k))).max(50).optional(),create:z.boolean().optional()}).strict();
export function validateEditedEntry(value:unknown){
 const result=entrySchema.extend({hidden:z.boolean().optional()}).safeParse(value);if(!result.success)return {ok:false as const,error:result.error.issues.map(i=>`${i.path.join('.')}: ${i.message}`).join('; '),details:result.error.issues};
 const e=result.data;if(!allowsRewards(e)&&(e.rewards?.length||Object.values(e.rewardNote||{}).some(Boolean)))return {ok:false as const,error:'Rewards belong to event, update or package entries, not character/weapon stats'};if(!games.some(g=>g.id===e.gameId&&g.regions.includes(e.region)))return {ok:false as const,error:'Invalid game or schedule'};
 if(!safePickupArchive(e))return {ok:false as const,error:'Invalid pickup archive or unconfirmed clock'};
 const images=[e,...e.pickupMembers||[]];
 if(!safeExtras(e)||images.some(i=>!safeArtwork(i)))return {ok:false as const,error:'Invalid image URL'};
 const urls=[...e.sourceUrl?[e.sourceUrl]:[],...Object.values(e.localizationSources||{}),...(e.relatedSources||[]).map(s=>s.url),...(e.detailSections||[]).flatMap(s=>s.sourceUrls||[]),...(e.entityDetails||[]).flatMap(p=>[...p.sources.map(s=>s.url),...p.groups.flatMap(g=>g.sourceUrls||[]),...(p.materials||[]).flatMap(g=>g.items.map(m=>m.sourceUrl))])];
 if(urls.some(url=>!https.safeParse(url).success))return {ok:false as const,error:'Links must use HTTPS'};
 if(e.startAt&&e.endAt&&Date.parse(e.startAt)>=Date.parse(e.endAt))return {ok:false as const,error:'End must follow start'};
 if(e.marketRegion==='cn'&&!['arknights','gfl2','reverse1999'].includes(e.gameId))return {ok:false as const,error:'Unsupported sales region'};
 if(e.price&&(!e.marketRegion||!e.price.currency.trim()||!e.price.platform.trim()))return {ok:false as const,error:'A price requires its sales region, currency and platform'};
 const problems=draftProblems(e);if(problems.length)return {ok:false as const,error:problems.join('; ')};
 return {ok:true as const,data:e};
}
