'use client';
import {games} from '@/lib/games';
import {canonicalCatalogPath} from '@/lib/seo';
import {discoveryWords,gameSectionPath} from '@/lib/discovery';
import {supportedLocales} from '@/lib/catalog-paths';
import type {Locale} from '@/lib/types';
import LeaksPanel from './leaks-panel';
export default function LeakLanding({gameId,locale,selectedId,heading}:{gameId:string;locale:Locale;selectedId?:string;heading?:string}){const game=games.find(g=>g.id===gameId)!,t=discoveryWords[locale];return <main className="document-reader leak-landing"><nav className="document-navigation"><a href={canonicalCatalogPath(locale)}>GAGETHER <small>가게더</small></a><a href={canonicalCatalogPath(locale,gameId)}>← {game.name[locale]}</a></nav><header className="document-header"><h1>{heading||game.name[locale]+" "+t.leaks}</h1><p>{t.leakBody}</p></header><LeaksPanel key={gameId+":"+selectedId} selectedId={selectedId} gameId={gameId} locale={locale} onBack={()=>window.location.assign(canonicalCatalogPath(locale,gameId))}/><nav className="document-languages">{supportedLocales.map(l=><a key={l} href={gameSectionPath(l,gameId,'leaks')} hrefLang={l} lang={l}>{({ko:'한국어',en:'English',ja:'日本語',zh:'中文'})[l]}</a>)}</nav></main>}
