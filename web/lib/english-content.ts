import definitions from '../content/english-entry-supplement.json' with {type:'json'};
import type {Entry} from './types';
/** Source-bound public copy only. Canonical rows and owner drafts are unchanged. */
export function englishEntry(entry:Entry):Entry{
 const names=definitions.nameTranslations;
 if(entry.id===names.id&&entry.sourceUrl===names.sourceUrl&&entry.sourceTitle===names.sourceTitle){
  const translate=(copy:Entry['title'])=>{let en=copy.en;for(const [original,name]of Object.entries(names.names))en=en.replaceAll(original,name);return en===copy.en?copy:{...copy,en}};
  entry={...entry,...!entry.editor?.fields.includes('title')?{title:translate(entry.title)}:{},...!entry.editor?.fields.includes('summary')?{summary:translate(entry.summary)}:{},...!entry.editor?.fields.includes('detailSections')&&entry.detailSections?{detailSections:entry.detailSections.map(s=>({...s,body:translate(s.body)}))}:{}};
 }
 const rule=definitions.entries.find(r=>r.id===entry.id&&r.gameId===entry.gameId&&r.sourceUrl===entry.sourceUrl);
 if(!rule)return entry;
 const language=rule.sourceLocale as 'ja';
 if(entry.title[language]!==rule.sourceTitle||entry.summary[language]!==rule.sourceSummary)return entry;
 const title=!entry.title.en.trim()&&!entry.editor?.fields.includes('title'),summary=!entry.summary.en.trim()&&!entry.editor?.fields.includes('summary');
 if(!title&&!summary)return entry;
 return {...entry,...title?{title:{...entry.title,en:rule.en.title},translatedLocales:[...new Set([...entry.translatedLocales||[],'en' as const])]}:{},...summary?{summary:{...entry.summary,en:rule.en.summary}}:{}};
}
