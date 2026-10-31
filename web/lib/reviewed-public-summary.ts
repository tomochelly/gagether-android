import rules from '../content/reviewed-public-summaries.json' with {type:'json'};
import excerpt from '../content/reviewed-source-excerpt.json' with {type:'json'};
import type {Entry,Locale} from './types';

/** Exact editorial copy only. Raw source bodies, newer edits and sibling locales
 * remain literal; this result is never persisted as a catalog entry. */
export function reviewedPublicSummary(entry:Entry,locale:Locale):string|undefined{
 // A captured 320-unit excerpt ended midway through the next word. Match the
 // entire old excerpt for index reads; detailed reads also check the original.
 // Owner parent/child fields include explicit unsets in the effective model.
 if(locale==='ko'&&entry.id===excerpt.id&&entry.gameId===excerpt.gameId&&entry.region===excerpt.region&&entry.sourceUrl===excerpt.sourceUrl&&entry.sourceKind===excerpt.sourceKind&&entry.sourceLocale===excerpt.sourceLocale&&entry.summary.ko===excerpt.expected.ko&&!entry.editor?.fields.some(p=>['summary','sourceBodies'].some(root=>p===root||p.startsWith(root+'.')))){
  const body=entry.sourceBodies?.ko;
  if(!entry.sourceBodies||(body&&body.locale==='ko'&&body.sourceUrl===excerpt.sourceUrl&&body.bodyHash===excerpt.bodyHash&&body.text===excerpt.nativeText))return excerpt.proposed.ko;
 }
 const rule=rules.find(r=>r.id===entry.id&&r.gameId===entry.gameId&&r.sourceUrl===entry.sourceUrl);
 return rule&&entry.summary[locale]===rule.expected[locale]?rule.proposed[locale]:undefined;
}
