import type {Locale,Region} from './types';

export const supportedLocales:Locale[]=['ko','en','ja','zh'];
export const isLocale=(value:unknown):value is Locale=>supportedLocales.includes(value as Locale);
export function localeForVisitor(country:string|null,acceptLanguage:string|null,preference?:string):Locale{
 if(isLocale(preference))return preference;
 const code=country?.toUpperCase();
 if(code==='KR')return 'ko';
 if(code==='JP')return 'ja';
 if(['CN','TW','HK','MO'].includes(code||''))return 'zh';
 if(code&&/^[A-Z]{2}$/.test(code)&&!['XX','T1'].includes(code))return 'en';
 const languages=(acceptLanguage||'').split(',').map((part,index)=>{
  const [tag,...parameters]=part.trim().split(';');
  const q=parameters.find(p=>p.trim().startsWith('q='));
  return {locale:tag.toLowerCase().split('-')[0],quality:q?Number(q.trim().slice(2)):1,index};
 }).filter(item=>item.quality>0&&Number.isFinite(item.quality)).sort((a,b)=>b.quality-a.quality||a.index-b.index);
 return languages.find(item=>isLocale(item.locale))?.locale as Locale||'en';
}
export const defaultRegionForLocale=(locale:Locale):Region=>locale==='ko'?'kr':locale==='ja'?'jp':'global';
