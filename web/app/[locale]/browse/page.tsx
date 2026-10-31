import {notFound} from 'next/navigation';
import {games} from '@/lib/games';
import {isLocale} from '@/lib/visitor-locale';
import {catalogPath} from '@/lib/catalog-paths';
import {directoryCopy,directoryPath,directoryMetadata} from '@/lib/content-directory';
import {gameSectionPath} from '@/lib/discovery';
type Props={params:Promise<{locale:string}>};
export async function generateMetadata({params}:Props){const {locale}=await params;if(!isLocale(locale))notFound();return directoryMetadata(locale);}
export default async function ContentDirectory({params}:Props){const {locale}=await params;if(!isLocale(locale))notFound();const t=directoryCopy[locale];return <main className="document-reader content-directory"><nav className="document-navigation"><a href={'/'+locale}>GAGETHER</a></nav><header className="document-header"><h1>{t.title}</h1><p>{t.description}</p></header><div className="content-directory-grid">{games.map(game=><article key={game.id}><h2><a href={catalogPath(locale,game.id)}>{game.name[locale]}</a></h2><nav><a href={directoryPath(locale,game.id)}>{t.browse}</a><a href={gameSectionPath(locale,game.id,'characters')}>{game.name[locale]} · {t.characters}</a></nav><nav>{game.id==='wuwa'&&<a href={`/${locale}/games/wuwa/combat`}>{({ko:'전투 콘텐츠',en:'Combat challenges',ja:'戦闘コンテンツ',zh:'战斗玩法'})[locale]}</a>}{(['pickup','event','package','update']as const).map(kind=><a key={kind} href={directoryPath(locale,game.id,{kind})}>{t[kind]}</a>)}</nav></article>)}</div><nav className="document-languages">{(['ko','en','ja','zh']as const).map(l=><a key={l} href={directoryPath(l)} hrefLang={l}>{l.toUpperCase()}</a>)}</nav></main>}
