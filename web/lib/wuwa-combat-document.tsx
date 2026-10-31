import WuwaReferencePanel from '@/components/wuwa-reference';
import {deliverPublicRead} from './public-delivery';
import {brandOrigin} from './brand';
import {supportedLocales} from './visitor-locale';
import type {Locale} from './types';
import type {WuwaReference} from './wuwa-reference';
import {combatPath,combatView,type CombatMode} from './wuwa-combat';
import {combatSubmissionScope,wuwaCombatCopy,wuwaCombatStructuredData} from './wuwa-combat-seo';

export type CombatSearchParams={mode?:string;region?:string;view?:string;cycle?:string};
export default async function WuwaCombatDocument({locale,mode,query={}}:{locale:Locale;mode?:CombatMode;query?:CombatSearchParams}){
 const {GET}=await import('@/app/api/wuwa/library/route');
 // The server document reads only the existing anonymous combat reference.
 // Personal loadouts and account cookies never enter this read or its markup.
 const response=await deliverPublicRead(new Request(brandOrigin+'/api/wuwa/library?view=combat'),GET);
 if(response.status!==200)throw Error('Saved combat reference unavailable');
 const initialRead=await response.json() as {data:WuwaReference;view:string;revision:string};
 if(initialRead.data?.gameId!=='wuwa'||initialRead.view!=='combat')throw Error('Combat reference scope mismatch');
 const view=combatView(query.view),selectedMode=mode||'tower-of-adversity',cycle=initialRead.data.cycles.find(c=>c.id===query.cycle&&c.modeId===selectedMode)?.id;
 const copy=wuwaCombatCopy(locale,mode),links={ko:['스테이지 정보','공개 파티·전투 기록','파티 조합·픽률 통계'],en:['Stage guide','Public teams & clears','Team compositions & pick rates'],ja:['ステージ情報','公開パーティ・クリア記録','パーティ編成・採用率'],zh:['关卡信息','公开队伍与通关记录','队伍阵容与使用率']}[locale];
 return <main className="document-reader combat-landing">
  <nav className="document-navigation"><a href={'/'+locale}>GAGETHER</a><a href={`/${locale}/games/wuwa`}>{({ko:'명조 픽업 캘린더',en:'Wuthering Waves banner calendar',ja:'鳴潮ガチャカレンダー',zh:'鸣潮卡池日历'})[locale]}</a><a href={`/${locale}/games/wuwa/characters`}>{({ko:'캐릭터 도감',en:'Character database',ja:'キャラクター図鑑',zh:'角色图鉴'})[locale]}</a>{mode&&<a href={combatPath(locale)}>{({ko:'모든 전투 콘텐츠',en:'All combat challenges',ja:'すべての戦闘コンテンツ',zh:'全部战斗玩法'})[locale]}</a>}</nav>
  <WuwaReferencePanel locale={locale} section="combat" heading={copy.heading} introduction={copy.description} initialMode={mode} initialView={view} initialCycle={cycle} standalone now={Date.now()} initialRead={{...initialRead,revision:response.headers.get('X-Gagether-Roster-Revision')||initialRead.revision,etag:response.headers.get('ETag')||undefined,readAt:Date.now(),stale:response.headers.get('X-Gagether-Public-Cache')==='STALE'}}/>
  <section className="site-intro combat-records-intro" aria-label={links[2]}><h2>{mode?wuwaCombatCopy(locale,selectedMode).heading:links[2]}</h2><p>{combatSubmissionScope[locale]}</p><nav className="document-navigation">{(['stages','records','statistics'] as const).map((v,i)=><a key={v} href={combatPath(locale,selectedMode,{view:v,cycle})}>{links[i]}</a>)}</nav></section>
  <nav className="document-languages" aria-label="Languages">{supportedLocales.map(l=><a key={l} href={combatPath(l,mode||(cycle?selectedMode:undefined),{view,cycle})} hrefLang={l} lang={l} aria-current={l===locale?'page':undefined}>{({ko:'한국어',en:'English',ja:'日本語',zh:'中文'})[l]}</a>)}</nav>
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(wuwaCombatStructuredData(locale,mode)).replace(/</g,'\\u003c')}}/>
 </main>;
}
