import type {Metadata} from 'next';
import type {Entry,Locale} from './types';
import {games} from './games';
import {brandOrigin,searchBrand} from './brand';
import {supportedLocales} from './catalog-paths';
import {displayTitle,displaySummary,cleanDisplayText} from './content-display';
import {artworkForLocale,serviceArtworkLocale} from './artwork';
export const discoveryWords={
 ko:{item:'상세 페이지',source:'원문',back:'게임 일정',notice:'공지',pickup:'캐릭터 픽업·복각',weapon:'무기·장비',event:'이벤트·보상',package:'패키지·가격',update:'업데이트 공지',leaks:'유출·차기 버전 정보',leakBody:'차기 버전 캐릭터, 스킨, 모델링과 베타 소식을 원문 출처·이미지와 함께 확인하세요. 미확정 커뮤니티 정보이며, 진입 시 스포일러 경고를 표시합니다.',characters:'캐릭터 도감',guides:'공략 · 참고 자료',published:'게시',period:'기간'},
 en:{item:'Detail page',source:'Original',back:'Game calendar',notice:'Notice',pickup:'Character banners & reruns',weapon:'Weapons & equipment',event:'Events & rewards',package:'Packs & prices',update:'Update notes',leaks:'Leaks & next-version news',leakBody:'Explore next-version characters, outfits, models and beta news with original sources and images. Unconfirmed community information; a spoiler warning appears before entry.',characters:'Character database',guides:'Guides & references',published:'Published',period:'Period'},
 ja:{item:'詳細ページ',source:'原文',back:'ゲーム日程',notice:'お知らせ',pickup:'キャラクターガチャ・復刻',weapon:'武器・装備',event:'イベント・報酬',package:'パック・価格',update:'アップデート情報',leaks:'リーク・次期バージョン情報',leakBody:'次期バージョンのキャラクター、衣装、モデル、ベータ情報を原文・画像とともに掲載。未確定のコミュニティ情報です。閲覧前にネタバレ警告を表示します。',characters:'キャラクター図鑑',guides:'攻略・参考資料',published:'掲載',period:'期間'},
 zh:{item:'详情页面',source:'原文',back:'游戏日程',notice:'公告',pickup:'角色卡池・复刻',weapon:'武器・装备',event:'活动・奖励',package:'礼包・价格',update:'版本更新公告',leaks:'爆料・下版本信息',leakBody:'查看下版本角色、服装、模型及测试服消息，并提供原文来源与图片。内容属于未确认社区信息，进入前显示剧透提醒。',characters:'角色图鉴',guides:'攻略与参考资料',published:'发布',period:'时间'}
};
export function entryPath(locale:Locale,entry:Pick<Entry,'gameId'|'id'>){return `/${locale}/games/${encodeURIComponent(entry.gameId)}/items/${encodeURIComponent(entry.id)}`;}
export function gameSectionPath(locale:Locale,gameId:string,section:'leaks'|'characters'){return `/${locale}/games/${encodeURIComponent(gameId)}/${section}`;}
export function discoverableEntry(e:Entry,locale:Locale){return !e.hidden&&!e.broadcast&&!!e.title?.[locale]?.trim()&&games.some(g=>g.id===e.gameId&&g.regions.includes(e.region));}
export function entryDiscoveryMetadata(e:Entry,locale:Locale):Metadata{
 const game=games.find(g=>g.id===e.gameId)!,t=discoveryWords[locale],title=`${displayTitle(e,locale)} · ${t[e.kind]} | ${game.name[locale]} · ${searchBrand(locale)}`,url=brandOrigin+entryPath(locale,e);
 const body=displaySummary(e,locale)||e.sourceBodies?.[locale]?.text||e.detailSections?.map(s=>cleanDisplayText(s.body[locale])).filter(Boolean).join(' ')||'';
 const description=(game.name[locale]+' · '+displayTitle(e,locale)+(body?' — '+body.replace(/\s+/g,' '):' · '+t[e.kind])).slice(0,170);
 const languages=Object.fromEntries(supportedLocales.filter(l=>discoverableEntry(e,l)).map(l=>[l,brandOrigin+entryPath(l,e)]));
 return {title,description,alternates:{canonical:url,languages},robots:{index:discoverableEntry(e,locale),follow:true},openGraph:{type:'article',url,title,description,siteName:searchBrand(locale)},twitter:{card:'summary',title,description}};
}
export function sectionDiscoveryMetadata(gameId:string,locale:Locale,section:'leaks'|'characters'):Metadata{
 const game=games.find(g=>g.id===gameId)!,t=discoveryWords[locale],title=`${game.name[locale]} ${t[section]} | ${searchBrand(locale)}`,url=brandOrigin+gameSectionPath(locale,gameId,section);
 const description=section==='leaks'?`${game.name[locale]} · ${t.leakBody}`:`${game.name[locale]} · ${t.characters} · ${({ko:'캐릭터 목록, 등급, 속성, 의상, 스테이터스와 일러스트',en:'Characters, rarity, attributes, outfits, stats and illustrations',ja:'キャラクター一覧・レアリティ・属性・衣装・ステータス・イラスト',zh:'角色列表、稀有度、属性、服装、数值与立绘'})[locale]}`;
 return {title,description,alternates:{canonical:url,languages:Object.fromEntries(supportedLocales.map(l=>[l,brandOrigin+gameSectionPath(l,gameId,section)]))},robots:{index:true,follow:true},openGraph:{type:'website',url,title,description,siteName:searchBrand(locale)},twitter:{card:'summary',title,description}};
}
export function entryStructuredData(e:Entry,locale:Locale){
 const game=games.find(g=>g.id===e.gameId)!,meta=entryDiscoveryMetadata(e,locale),art=artworkForLocale(e,locale,'full',serviceArtworkLocale(e.region,e.gameId));
 return {'@context':'https://schema.org','@type':'Article',headline:displayTitle(e,locale),description:meta.description,inLanguage:locale,url:brandOrigin+entryPath(locale,e),mainEntityOfPage:brandOrigin+entryPath(locale,e),about:{'@type':'VideoGame',name:game.name[locale]},publisher:{'@type':'Organization',name:searchBrand(locale),url:brandOrigin},isBasedOn:e.sourceUrl,...e.publishedAt?{datePublished:e.publishedAt}:{},...art.image?{image:[art.image.startsWith('/')?brandOrigin+art.image:art.image]}:{}};
}

export function leakPath(locale:Locale,item:{gameId:string;id:string}){return gameSectionPath(locale,item.gameId,'leaks')+'/'+encodeURIComponent(item.id);}
