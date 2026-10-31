import {Suspense} from 'react';
import {notFound} from 'next/navigation';
import {games} from '@/lib/games';
import {isLocale} from '@/lib/visitor-locale';
import {searchCopy,searchFeatures} from '@/lib/site-search';
import {readSiteSearch} from '@/lib/site-search-read';
import type {Locale} from '@/lib/types';
export const dynamic='force-dynamic';
type Props={params:Promise<{locale:string}>;searchParams:Promise<{q?:string;game?:string}>};
export async function generateMetadata({params}:Props){const {locale}=await params;if(!isLocale(locale))notFound();return {title:searchCopy[locale].title+' | GAGETHER',description:searchCopy[locale].placeholder,robots:{index:false,follow:true}};}
async function Results({locale,q,game}:{locale:Locale;q:string;game?:string}){
 const t=searchCopy[locale],result=await readSiteSearch(locale,q,game),features=searchFeatures(locale,q,game),groups=[['features',features],['schedules',result.schedules],['characters',result.characters],['community',result.community]] as const;
 return <div className="site-search-results">{result.partial&&<p role="status">{t.partial}</p>}{groups.map(([key,rows])=><section key={key} aria-label={t[key]}><h2>{t[key]} <small>{rows.length}</small></h2>{rows.length?<ul>{rows.map(r=><li key={r.id}><a href={r.href}><span>{games.find(g=>g.id===r.gameId)?.name[locale]}</span><strong>{r.title}</strong>{'detail'in r&&r.detail&&<p>{r.detail}</p>}</a></li>)}</ul>:<p>{t.empty}</p>}</section>)}</div>;
}
export default async function Page({params,searchParams}:Props){const {locale}=await params;if(!isLocale(locale))notFound();const input=await searchParams,q=typeof input.q==='string'?input.q.trim().slice(0,80):'',game=games.some(g=>g.id===input.game)?input.game:undefined,t=searchCopy[locale];return <main className="document-reader site-search-page"><nav className="document-navigation"><a href={'/'+locale}>GAGETHER · {t.home}</a></nav><header><h1>{t.title}</h1></header><form className="site-search-form" action={`/${locale}/search`} role="search"><input name="q" aria-label={t.title} defaultValue={q} placeholder={t.placeholder} minLength={2} maxLength={80} required/><select name="game" aria-label={t.all} defaultValue={game||''}><option value="">{t.all}</option>{games.filter(g=>!g.launch).map(g=><option key={g.id} value={g.id}>{g.name[locale]}</option>)}</select><button type="submit">{t.search}</button></form>{q.length<2?<p>{t.hint}</p>:<Suspense key={q+game} fallback={<p role="status">{({ko:'검색 중…',en:'Searching…',ja:'検索中…',zh:'搜索中…'})[locale]}</p>}><Results locale={locale} q={q} game={game}/></Suspense>}</main>;}
