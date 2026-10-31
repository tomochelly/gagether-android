import {cache} from 'react';
import {notFound} from 'next/navigation';
import {games} from '@/lib/games';
import {isLocale,defaultRegionForLocale,supportedLocales} from '@/lib/visitor-locale';
import {effectiveRegion} from '@/lib/presentation';
import {readData} from '@/lib/store';
import {canonicalCatalogPath} from '@/lib/seo';
import {displayTitle,displaySummary} from '@/lib/content-display';
import {entryPath,gameSectionPath} from '@/lib/discovery';
import {directoryCopy,directoryPath,directoryMetadata,directoryKinds,directoryPage,directoryEntries,type DirectoryKind} from '@/lib/content-directory';
import type {Region} from '@/lib/types';
export const dynamic='force-dynamic';
type Props={params:Promise<{locale:string;gameId:string}>;searchParams:Promise<{region?:string;kind?:string;page?:string}>};
const load=cache(async(locale:string,gameId:string,requested:string|undefined,kind:string|undefined,value:string|undefined)=>{
 const game=games.find(g=>g.id===gameId);if(!isLocale(locale)||!game)notFound();const page=directoryPage(value);if(!page||!directoryKinds.includes((kind||'all')as DirectoryKind))notFound();
 const region=effectiveRegion(game,game.regions.includes(requested as Region)?requested as Region:defaultRegionForLocale(locale)),selectedKind=(kind||'all')as DirectoryKind,data=await readData({index:true,gameId});if(!data.persistent)throw Error('Saved directory unavailable');
 const selected=directoryEntries(data.entries,game,locale,region,selectedKind,page);if(page>selected.pages)notFound();const availableLocales=supportedLocales.filter(l=>page<=directoryEntries(data.entries,game,l,region,selectedKind,page).pages);return {locale,game,region,kind:selectedKind,page,availableLocales,...selected};
});
async function selection(props:Props){const p=await props.params,q=await props.searchParams;return load(p.locale,p.gameId,q.region,q.kind,q.page);}
export async function generateMetadata(props:Props){const s=await selection(props);return directoryMetadata(s.locale,s.game,s);}
export default async function GameContentDirectory(props:Props){const s=await selection(props),{locale,game,region,kind,page,rows,total,pages}=s,t=directoryCopy[locale];return <main className="document-reader content-directory"><nav className="document-navigation"><a href={'/'+locale}>GAGETHER</a><a href={directoryPath(locale)}>{t.title}</a><a href={canonicalCatalogPath(locale,game.id,region)}>{game.name[locale]} · {t.calendar}</a></nav><header className="document-header"><h1>{game.name[locale]} · {kind==='all'?t.title:t[kind]}</h1><p>{t.description}</p><p>{t[region]} · {total.toLocaleString(locale)} · {t.page} {page} / {pages}</p></header><nav className="directory-filters">{directoryKinds.filter(k=>k!=='weapon').map(k=><a key={k} href={directoryPath(locale,game.id,{region,kind:k})} aria-current={kind===k?'page':undefined}>{t[k]}</a>)}</nav><nav className="directory-filters" aria-label={t.region}>{[...new Set(game.regions.map(r=>effectiveRegion(game,r)))].map(r=><a key={r} href={directoryPath(locale,game.id,{region:r,kind})} aria-current={region===r?'page':undefined}>{t[r]}</a>)}<a href={gameSectionPath(locale,game.id,'characters')+'?region='+region}>{t.characters}</a><a href={gameSectionPath(locale,game.id,'leaks')}>{t.leaks}</a></nav>{rows.length?<ul className="content-directory-list">{rows.map(e=><li key={e.id}><small>{t[e.kind]} · {t[e.region]}</small><h2><a href={entryPath(locale,e)}>{displayTitle(e,locale)}</a></h2>{displaySummary(e,locale)&&<p>{displaySummary(e,locale).slice(0,240)}</p>}</li>)}</ul>:<p>{t.empty}</p>}<nav className="directory-filters">{page>1&&<a rel="prev" href={directoryPath(locale,game.id,{region,kind,page:page-1})}>{t.previous}</a>}{page<pages&&<a rel="next" href={directoryPath(locale,game.id,{region,kind,page:page+1})}>{t.next}</a>}</nav><nav className="document-languages">{(['ko','en','ja','zh']as const).map(l=><a key={l} href={directoryPath(l,game.id,{region,kind,page:s.availableLocales.includes(l)?page:1})} hrefLang={l}>{l.toUpperCase()}</a>)}</nav></main>}
