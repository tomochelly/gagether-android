import {z} from 'zod';
import type {Locale,Region} from './types';
const copy=z.object({ko:z.string(),en:z.string(),ja:z.string(),zh:z.string()});
const https=z.string().url().refine(s=>s.startsWith('https://'));
export const rosterMaterialGroupSchema=z.object({
 id:z.string(),title:copy,categoryId:z.string().optional(),category:copy.optional(),
 regions:z.array(z.enum(['kr','global','jp','cn'])).optional(),
 items:z.array(z.object({id:z.string(),name:copy,quantity:z.union([z.number().nonnegative(),z.string()]),icon:https.optional(),
 sprite:z.object({x:z.number(),y:z.number(),width:z.number().positive(),height:z.number().positive(),sheetWidth:z.number().positive().optional(),sheetHeight:z.number().positive().optional()}).optional()})),
 sourceUrl:https,sourceKind:z.enum(['official','community']),originalSectionId:z.string().optional()
});
export type RosterMaterialGroup=z.infer<typeof rosterMaterialGroupSchema>;
export const materialWords={
 ko:{title:'필요 재료',heading:(name:string)=>name+' 육성 · 필요 재료',stage:'육성 단계',original:'기존 재료 설명',source:'재료 출처',seo:'필요 재료 · 스테이터스'},
 en:{title:'Materials',heading:(name:string)=>name+' upgrade materials',stage:'Upgrade stage',original:'Material details',source:'Material sources',seo:'Upgrade materials · Stats'},
 ja:{title:'育成素材',heading:(name:string)=>name+'の育成素材',stage:'育成段階',original:'素材の詳細',source:'素材の出典',seo:'育成素材・ステータス'},
 zh:{title:'养成材料',heading:(name:string)=>name+'养成材料',stage:'养成阶段',original:'材料详情',source:'材料来源',seo:'养成材料・属性'}
};
export function materialGroupsForService(groups:RosterMaterialGroup[]|undefined,service:Region){return (groups||[]).filter(g=>g.items.length&&(!g.regions||g.regions.includes(service)));}
export function materialCopy(value:Partial<Record<Locale,string>>|undefined,locale:Locale){return value?.[locale]||value?.en||value?.ja||value?.zh||value?.ko||'';}
export function materialLocale(value:Partial<Record<Locale,string>>|undefined,locale:Locale):Locale|undefined{return value?.[locale]?locale:(['en','ja','zh','ko'] as const).find(l=>value?.[l]);}
export function isMaterialSection(section:{id:string}){return /(?:^|[-_:])materials?(?:$|[-_:])|^ascension-materials$/.test(section.id);}
