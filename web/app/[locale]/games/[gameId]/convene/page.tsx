import {nteDiscovery} from '@/lib/convene-discovery';
import {Suspense} from 'react';
import {notFound} from 'next/navigation';
import WuwaConvene from '@/components/wuwa-convene';
import {readWuwaConveneCatalog} from '@/lib/wuwa-convene-catalog';
import {conveneLabels,conveneCopy} from '@/lib/wuwa-convene-copy';
import {isLocale,supportedLocales} from '@/lib/visitor-locale';
import type {Locale} from '@/lib/types';
import type {ConveneCatalog} from '@/lib/wuwa-convene';
import {brandOrigin} from '@/lib/brand';
import NteBoard from '@/components/nte-board';
import {readNteBoardCatalog} from '@/lib/nte-board-catalog';
import NikkeRecruit from '@/components/nikke-recruit';
import {readNikkeRecruitCatalog} from '@/lib/nikke-recruit-catalog';
import {nikkeRecruitEnabled} from '@/lib/nikke-recruit-media';
import {nikkeRecruitCopy} from '@/lib/nikke-recruit-copy';
export const dynamic='force-dynamic';
type Props={params:Promise<{locale:string;gameId:string}>};
async function selection(props:Props){const p=await props.params;if(!isLocale(p.locale)||!['wuwa','nte',...(nikkeRecruitEnabled?['nikke']:[])].includes(p.gameId))notFound();return p.locale;}
export async function generateMetadata(props:Props){const locale=await selection(props),{gameId}=await props.params;if(gameId==='nikke'){const title={ko:'니케 가챠 시뮬레이터 · 특수 모집',en:'NIKKE Gacha Simulator · Special Recruit',ja:'NIKKE ガチャシミュレーター・特殊募集',zh:'妮姬抽卡模拟器 · 特殊招募'}[locale];return {title:title+' | GAGETHER',description:nikkeRecruitCopy[locale].local,alternates:{canonical:brandOrigin+`/${locale}/games/nikke/convene`,languages:Object.fromEntries(supportedLocales.map(l=>[l,brandOrigin+`/${l}/games/nikke/convene`]))},robots:{index:true,follow:true}};}if(gameId==='nte'){const c=nteDiscovery[locale],url=brandOrigin+`/${locale}/games/nte/convene`;return {title:c.title+' | GAGETHER',description:c.description,alternates:{canonical:url,languages:Object.fromEntries(supportedLocales.map(l=>[l,brandOrigin+`/${l}/games/nte/convene`]))},robots:{index:true,follow:true},openGraph:{type:'website',title:c.title,description:c.description,url},twitter:{card:'summary',title:c.title,description:c.description}};}const name={ko:'명조',en:'Wuthering Waves',ja:'鳴潮',zh:'鸣潮'}[locale],title=name+' · '+conveneLabels[locale]+' | GAGETHER';return {title,description:conveneCopy[locale].localNote,alternates:{canonical:brandOrigin+`/${locale}/games/wuwa/convene`,languages:Object.fromEntries(supportedLocales.map(l=>[l,brandOrigin+`/${l}/games/wuwa/convene`]))},robots:{index:true,follow:true}};}
async function Experience({locale}:{locale:Locale}){let catalog:ConveneCatalog|undefined;try{catalog=await readWuwaConveneCatalog();}catch{}return <WuwaConvene locale={locale} initialCatalog={catalog} copy={conveneCopy[locale]}/>;}
async function NteExperience({locale}:{locale:Locale}){let catalog;try{catalog=await readNteBoardCatalog();}catch{}const c=nteDiscovery[locale];return <><NteBoard locale={locale} catalog={catalog}/><section className="convene-discovery"><details><summary>{c.rules}</summary><p>{c.body}</p><p>{c.practice}</p></details><nav><a href={`/${locale}/games/nte`}>{c.schedule}</a><a href={`/${locale}/games/nte/characters`}>{c.characters}</a></nav></section><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({'@context':'https://schema.org','@type':'WebApplication',name:c.title,description:c.description,url:brandOrigin+`/${locale}/games/nte/convene`,applicationCategory:'GameApplication',operatingSystem:'Web browser',inLanguage:locale,isAccessibleForFree:true}).replace(/</g,'\\u003c')}}/></>;}
async function NikkeExperience({locale}:{locale:Locale}){let catalog;try{catalog=await readNikkeRecruitCatalog();}catch{}return <NikkeRecruit locale={locale} catalog={catalog}/>;}
export default async function Page(props:Props){const locale=await selection(props),{gameId}=await props.params;return <Suspense fallback={<main className="convene-loading"><a href={`/${locale}/games/${gameId}`}>GAGETHER</a><span className="convene-loading-rings"/><p>{gameId==='nikke'?'NIKKE':gameId==='nte'?'SCARBOROUGH FAIR':conveneCopy[locale].signal}…</p></main>}>{gameId==='nikke'?<NikkeExperience locale={locale}/>:gameId==='nte'?<NteExperience locale={locale}/>:<Experience locale={locale}/>}</Suspense>;}
