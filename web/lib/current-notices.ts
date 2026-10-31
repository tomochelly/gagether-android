import replacements from '../content/reviewed-notice-replacements.json' with {type:'json'};
import type {Entry} from './types';

/** Current selections only. The catalog, saved records and original detail URLs
 * retain withdrawn posts, including any different original video. */
export function currentNotices(entries:Entry[]):Entry[]{
 const removed=new Set<string>();
 for(const rule of replacements){
  const old=entries.find(e=>e.id===rule.previous.id),next=entries.find(e=>e.id===rule.current.id);
  const exact=(entry:Entry|undefined,source:{id:string;url:string})=>!!entry&&!entry.hidden&&!entry.editor?.revision&&entry.gameId===rule.gameId&&entry.region===rule.region&&entry.kind==='update'&&entry.sourceKind==='official'&&entry.sourceLocale===rule.sourceLocale&&entry.sourceUrl===source.url&&entry.publishedAt===rule.publishedAt&&(['ko','en','ja','zh'] as const).every(locale=>entry.title[locale]===rule.title[locale]&&entry.summary[locale]===rule.summary[locale]);
  if(exact(old,rule.previous)&&exact(next,rule.current))removed.add(rule.previous.id);
 }
 return removed.size?entries.filter(e=>!removed.has(e.id)):entries;
}
