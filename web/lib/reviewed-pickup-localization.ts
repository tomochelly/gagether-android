import review from '../content/reviewed-pickup-localization.json' with {type:'json'};
import type {Entry,Localized} from './types';

type TextField='title'|'summary'|'timingNote';
type Rule={entryId:string;gameId:string;region:string;sourceUrl:string;kind?:Entry['kind'];expected:Partial<Record<TextField,Localized>>;proposed:Partial<Record<TextField,Localized>>;memberName?:{expected:Localized;proposed:Localized};sectionBodies?:{index:number;title:Localized;expected:Localized;proposed:Localized}[];sources:{kind:'official';url:string;title:string}[]};
const locales=['ko','en','ja','zh'] as const;

/** Exact pickup/campaign copy only. Originals and later per-locale owner edits win. */
export function reviewedPickupLocalization(entry:Entry):Entry{
 if(!['pickup','event','weapon','package','update'].includes(entry.kind))return entry;
 const rule=(review.changes as Rule[]).find(r=>r.entryId===entry.id&&r.gameId===entry.gameId&&r.region===entry.region&&r.sourceUrl===entry.sourceUrl&&(r.kind||'pickup')===entry.kind);
 if(!rule)return entry;
 const edited=(path:string)=>entry.editor?.fields.some(f=>f===path||path.startsWith(f+'.')||f.startsWith(path+'.'));
 const translated=(value:Localized|undefined,before:Localized,after:Localized,path:string)=>{
  if(!value)return value;
  let result=value;
  for(const locale of locales)if(value[locale]===before[locale]&&value[locale]!==after[locale]&&!edited(path+'.'+locale)){
   if(result===value)result={...value};result[locale]=after[locale];
  }
  return result;
 };
 let result=entry;
 for(const field of ['title','summary','timingNote'] as const){
  const before=rule.expected[field],after=rule.proposed[field];if(!before||!after)continue;
  const value=translated(entry[field],before,after,field);
  if(value!==entry[field]){if(result===entry)result={...entry};Object.assign(result,{[field]:value});}
 }
 if(entry.detailSections&&rule.sectionBodies){let changed=false;const sections=entry.detailSections.map((section,index)=>{
  const bodyRule=rule.sectionBodies!.find(r=>r.index===index&&locales.every(locale=>r.title[locale]===section.title[locale]));if(!bodyRule)return section;
  const body=translated(section.body,bodyRule.expected,bodyRule.proposed,'detailSections.'+index+'.body');
  if(body===section.body)return section;changed=true;return {...section,body:body!};
 });if(changed)result={...result,detailSections:sections};}
 if(entry.pickupMembers&&rule.memberName){const memberRule=rule.memberName;let changed=false;const members=entry.pickupMembers.map((member,index)=>{
  if(member.role!=='featured'||member.name.ko!==memberRule.expected.ko||member.name.en!==memberRule.expected.en)return member;
  const name=translated(member.name,memberRule.expected,memberRule.proposed,'pickupMembers.'+index+'.name');
  if(name===member.name)return member;changed=true;return {...member,name:name!};
 });if(changed)result={...result,pickupMembers:members};}
 if(result!==entry){const related=[...entry.relatedSources||[]];for(const source of rule.sources)if(!related.some(s=>s.url===source.url))related.push(source);result={...result,relatedSources:related};}
 return result;
}
