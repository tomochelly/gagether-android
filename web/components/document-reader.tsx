import {PageReference} from './page-references';
import {englishEntry} from '@/lib/english-content';
import {withWuwaCharacterVideos} from '@/lib/wuwa-character-videos';
import {EntryVideos} from './video-library';
import {recurringDisplayEntry} from '@/lib/recurring-schedule';
import type {Entry,Locale} from '@/lib/types';
import {games} from '@/lib/games';
import {supportedLocales} from '@/lib/catalog-paths';
import {canonicalCatalogPath} from '@/lib/seo';
import {discoveryWords,entryPath,discoverableEntry,entryStructuredData} from '@/lib/discovery';
import {displayTitle,displaySummary,displaySection} from '@/lib/content-display';
import {cleanPublicInformationText} from '@/lib/public-information-text';
import {contentInAudience,audienceMarket} from '@/lib/content-audience';
import {detailArtworkForLocale,artworkForLocale,serviceArtworkLocale} from '@/lib/artwork';
import {authoredField,textAppearance,textAppearanceStyle} from '@/lib/text-appearance';
import ArtworkMedia from './artwork-media';
import DetailCopy from './detail-copy';
import SourceArticle from './source-article';
import EntityDetails from './entity-details';
import {RewardDetails} from './reward-display';
import ContentBlocks from './content-blocks';
import DocumentPeriod from './document-period';
export default function DocumentReader({entry,locale}:{entry:Entry;locale:Locale}){
 const e=withWuwaCharacterVideos(englishEntry(recurringDisplayEntry(entry,Date.now())));
 const game=games.find(g=>g.id===e.gameId)!,t=discoveryWords[locale],art=artworkForLocale(e,locale,'full',serviceArtworkLocale(e.region,e.gameId)),title=displayTitle(e,locale),summary=displaySummary(e,locale),market=audienceMarket(game,e.region,locale);
 const sections=e.detailSections?.filter(s=>displaySection(s.title[locale],s.body[locale],authoredField(e,'detailSections'))&&(!s.audienceRegions?.length||s.audienceRegions.includes(market)))||[];
 return <main className="document-reader"><nav className="document-navigation"><a href={canonicalCatalogPath(locale)}>GAGETHER {locale==='ko'&&<small>가게더</small>}</a><a href={canonicalCatalogPath(locale,game.id,e.region)}>← {game.name[locale]}</a></nav><article><header className="document-header"><p>{game.name[locale]} · {t[e.kind]}</p><h1 style={textAppearanceStyle(textAppearance(e,locale),'title')}>{title}</h1>{e.publishedAt&&<time dateTime={e.publishedAt}>{t.published} · {e.publishedAt.slice(0,10)}</time>}</header>{art.image&&<div className="document-hero"><ArtworkMedia art={e} alt={title} mode="full" locale={locale} serviceLocale={serviceArtworkLocale(e.region,e.gameId)}/></div>}{summary&&<DetailCopy text={summary} locale={locale} gameId={game.id} preserve={authoredField(e,'summary')} appearance={textAppearance(e,locale)}/>}{(e.startAt||e.endAt||e.startDate||e.endDate)&&<dl className="document-dates"><dt>{t.period}</dt><DocumentPeriod locale={locale} startAt={e.startAt} endAt={e.endAt} startDate={e.startDate} endDate={e.endDate}/></dl>}<SourceArticle entry={e} locale={locale}/><RewardDetails entry={e} locale={locale}/>{!!e.entityDetails?.length&&<EntityDetails profiles={e.entityDetails} locale={locale} gameId={game.id}/>}<EntryVideos entry={e} locale={locale}/><div className="content-details">{sections.map((s,i)=><section className="detail-section" key={i}>{cleanPublicInformationText(s.title[locale]).trim()&&<h2 style={textAppearanceStyle(s.textStyle?.[locale]||textAppearance(e,locale),'title')}>{cleanPublicInformationText(s.title[locale])}</h2>}<DetailCopy text={s.body[locale]} locale={locale} gameId={game.id} preserve={authoredField(e,'detailSections')} appearance={s.textStyle?.[locale]||textAppearance(e,locale)}/></section>)}</div>{!!e.contents?.some(c=>cleanPublicInformationText(c[locale]).trim())&&<ul className="document-contents">{e.contents.filter(c=>cleanPublicInformationText(c[locale]).trim()).map((c,i)=><li key={i}>{cleanPublicInformationText(c[locale])}</li>)}</ul>}{detailArtworkForLocale(e,locale).map(a=><figure key={a.image}><ArtworkMedia art={a} alt={cleanPublicInformationText(a.imageCaption?.[locale])||title} locale={locale} serviceLocale={serviceArtworkLocale(e.region,e.gameId)} mode="full"/>{cleanPublicInformationText(a.imageCaption?.[locale]).trim()&&<figcaption style={textAppearanceStyle(textAppearance(e,locale))}>{cleanPublicInformationText(a.imageCaption?.[locale])}</figcaption>}</figure>)}<ContentBlocks entry={e} locale={locale}/><footer className="document-sources"><PageReference locale={locale}>{e.sourceUrl&&<a href={e.sourceUrl} target="_blank" rel="noreferrer">{t.source} ↗</a>}{!!e.relatedSources?.length&&<details><summary>{t.guides}</summary>{e.relatedSources.map(s=><a key={s.url} href={s.url} target="_blank" rel="noreferrer">{s.title} ↗</a>)}</details>}</PageReference><nav aria-label="Languages">{supportedLocales.filter(l=>discoverableEntry(e,l)&&contentInAudience(e,game,e.region,l)).map(l=><a key={l} href={entryPath(l,e)} hrefLang={l} lang={l} aria-current={l===locale?'page':undefined}>{({ko:'한국어',en:'English',ja:'日本語',zh:'中文'})[l]}</a>)}</nav></footer></article><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(entryStructuredData(e,locale)).replace(/</g,'\\u003c')}}/></main>;
}
