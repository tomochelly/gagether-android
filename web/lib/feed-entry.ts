import {localized,type Entry,type Locale,type Localized,type Region} from './types';

export type FeedNotice={id:string|number;titles:Partial<Localized>;urls:Partial<Record<Locale,string>>;sourceLocale:Locale;image?:string;date?:string|null};
const locales:Locale[]=['ko','en','ja','zh'];
const pending=localized('','','','');
const generic=localized('','','','');

export function feedEntry(gameId:string,region:Region,n:FeedNotice,checkedAt:string,old?:Entry):Entry{
 const native=n.sourceLocale;
 // Reviewed display titles can differ from the original source headline.
 const sameSourceLanguage=old?.sourceLocale===native||(!old?.sourceLocale&&old?.sourceUrl===n.urls[native]);
 const unchanged=!!old&&(sameSourceLanguage?old.sourceTitle===n.titles[native]:old.title[native]===n.titles[native]?.slice(0,240));
 const title={...pending};const officialLocales:Locale[]=unchanged?[...old!.officialLocales||[]]:[];const translatedLocales:Locale[]=unchanged?[...old!.translatedLocales||[]]:[];
 const localizationSources:Partial<Record<Locale,string>>=unchanged?{...old!.localizationSources}:{};
 if(unchanged)for(const locale of locales){
  if(old!.officialLocales?.includes(locale)||old!.translatedLocales?.includes(locale)){
   title[locale]=old!.title[locale];
  }
 }
 for(const locale of locales)if(n.titles[locale]){
  // Collection fills missing locales; it does not replace reviewed presentation.
  if(!officialLocales.includes(locale)&&!translatedLocales.includes(locale)){
   title[locale]=String(n.titles[locale]).slice(0,240);officialLocales.push(locale);
  }
  localizationSources[locale]=n.urls[locale];
 }
 // Keep a reviewed Korean original even if it drops out of the short Korean feed.
 const sourceLocale=officialLocales.includes('ko')&&localizationSources.ko?'ko':native;
 const sourceTitle=n.titles[sourceLocale]||(unchanged&&old!.sourceLocale===sourceLocale?old!.sourceTitle:title[sourceLocale]);
 const metadata={title,sourceUrl:localizationSources[sourceLocale]||n.urls[native]!,sourceTitle,sourceLocale,officialLocales,translatedLocales,localizationSources};
 if(unchanged){
  const next={...old!,...metadata};
  return Object.keys(metadata).every(key=>JSON.stringify(next[key as keyof Entry])===JSON.stringify(old![key as keyof Entry]))?old!:{...next,verifiedAt:checkedAt};
 }
 const image=typeof n.image==='string'&&n.image.startsWith('https://')?n.image:undefined;
 return {id:`feed-${gameId}-${n.id}`,gameId,kind:'update',summary:generic,region,server:region==='jp'?'Japan · UTC+9':'Global',startAt:null,endAt:null,publishedAt:n.date||null,verifiedAt:checkedAt,image,...metadata};
}
