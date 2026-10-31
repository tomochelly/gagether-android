import supplement from '../content/english-roster-supplement.json' with {type:'json'};
import globalFacts from '../content/trickcal-english-skills.json' with {type:'json'};
import translations from '../content/trickcal-korean-skill-translations.json' with {type:'json'};
import type {RosterCharacter} from './character-roster';
import type {Locale} from './types';
const names=new Map(supplement.names.map(r=>[r.gameId+'|'+r.id,r]));
const stripSlash=(url:string)=>url.replace(/\/$/,'');
export function englishRosterSummary(gameId:string,c:RosterCharacter):RosterCharacter{
 let next=c;const name=names.get(gameId+'|'+c.id);
 if(name&&c.name[name.sourceLocale as Locale]===name.sourceName&&!c.name.en){next={...next,name:{...next.name,en:name.en},nameSources:{...next.nameSources,en:{url:name.sourceUrl,kind:'translation'}}};}
 if(gameId==='hi3'&&c.traits){const traits=c.traits.map(t=>{const en=(supplement.weapons as Record<string,string>)[t.value.ko];return !t.value.en&&en?{...t,value:{...t.value,en}}:t});if(traits.some((t,i)=>t!==c.traits![i]))next={...next,traits};}
 return next;
}
const hash=async(text:string)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))].map(n=>n.toString(16).padStart(2,'0')).join('');
/** Applied after native detail hydration. Never feed this projection to writers. */
export async function englishRosterDetails(gameId:string,c:RosterCharacter):Promise<RosterCharacter>{
 let next=englishRosterSummary(gameId,c),sections=next.sections||[],sources=[...next.detailSources||[]];
 for(const rule of supplement.sections.filter(r=>r.gameId===gameId&&r.id===c.id)){
  sections=sections.map(s=>s.id===rule.sectionId&&!s.body.en&&s.body[rule.sourceLocale as Locale]===rule.sourceBody?{...s,title:{...s.title,en:s.title.en||rule.titleEn},body:{...s.body,en:rule.bodyEn}}:s);
  if(!sources.some(s=>s.url===rule.sourceUrl))sources.push({url:rule.sourceUrl,kind:'official',label:{ko:'스킬 원문 · 영어 번역',en:'Skill original · English translation',ja:'スキル原文・英訳',zh:'技能原文 · 英译'}});
 }
 if(gameId==='bluearchive'){
  const translated=supplement.blueArchive.find(r=>r.id===c.id&&r.sourceUrl===c.sourceUrl);
  if(translated){
   sections=sections.map(s=>{const rule=translated.rules.find(r=>r.collection==='sections'&&r.id===s.id&&r.field==='body'&&r.originalEnglish===s.body.en);return rule?{...s,body:{...s.body,en:rule.english}}:s});
   next={...next,skillTables:next.skillTables?.map(s=>{let n=s;for(const field of ['name','descriptionTemplate'] as const){const rule=translated.rules.find(r=>r.collection==='skillTables'&&r.id===s.id&&r.field===field&&r.originalEnglish===s[field]?.en);if(rule)n={...n,[field]:{...n[field],en:rule.english}}}return n})};
   if(!sources.some(s=>s.url===translated.sourceUrl&&s.label?.en==='Japanese names · English translations'))sources.push({url:translated.sourceUrl,kind:'community',label:{ko:'일본어 명칭 · 영어 번역',en:'Japanese names · English translations',ja:'日本語名称・英訳',zh:'日文名称 · 英译'}});
  }
 }
 if(gameId==='trickcal'){
  const translated=(translations as Array<{id:string;sourceUrl:string;sections:Array<{id:string;sourceHash:string;titleEn:string;bodyEn:string}>}>).find(r=>r.id===c.id);
  if(translated){sections=await Promise.all(sections.map(async s=>{const rule=translated.sections.find(r=>r.id===s.id);return rule&&!s.body.en&&s.regions?.includes('kr')&&await hash(s.body.ko)===rule.sourceHash?{...s,title:{...s.title,en:rule.titleEn},body:{...s.body,en:rule.bodyEn}}:s}));if(!sources.some(s=>s.url===translated.sourceUrl))sources.push({url:translated.sourceUrl,kind:'community',label:{ko:'한국 서비스 스킬 원문 · 영어 번역',en:'Korean-service skills · English translation',ja:'韓国版スキル原文・英訳',zh:'韩服技能原文 · 英译'}});}
  const facts=(globalFacts as Array<{characterId:string;sourceUrl:string;sourceHash:string;sections:Array<{id:string;title:string;body:string}>}>).find(r=>r.characterId===c.id&&stripSlash(r.sourceUrl)===stripSlash(c.sourceUrl));
  if(facts&&!sections.some(s=>s.regions?.includes('global')&&s.body.en)){
   sections=[...sections,...facts.sections.map(s=>({id:s.id,title:{ko:'글로벌 · '+s.title,en:'Global · '+s.title,ja:'グローバル · '+s.title,zh:'国际服 · '+s.title},body:{ko:'',en:s.body,ja:'',zh:''},regions:['global' as const]}))];
   if(!sources.some(s=>stripSlash(s.url)===stripSlash(facts.sourceUrl)))sources.push({url:facts.sourceUrl,kind:'community',label:{ko:'글로벌 서비스 스킬 · 영어 원문',en:'Global-service skills · English original',ja:'グローバル版スキル・英語原文',zh:'国际服技能 · 英语原文'}});
  }
 }
 return {...next,...sections.length?{sections}:{},...sources.length?{detailSources:sources}:{}};
}
