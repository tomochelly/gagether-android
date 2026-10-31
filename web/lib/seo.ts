import {gameLaunchLabel} from './game-launch';
import type {Metadata} from 'next';
import {brandOrigin,searchBrand} from './brand';
import {games} from './games';
import {effectiveRegion} from './presentation';
import {defaultRegionForLocale} from './visitor-locale';
import type {Locale,Region} from './types';
import {catalogPath,supportedLocales} from './catalog-paths';
const searchCopy={
 ko:{title:'가게더 | 픽업 캘린더 · 게임 픽업·복각·이벤트 일정',description:'18개 게임의 캐릭터 픽업, 복각, 서포트 카드와 이벤트 일정을 가게더에서 확인하세요. 한국·일본·글로벌 서비스별 공식 출처와 초기화 마감을 제공합니다.',gameTitle:'픽업 캘린더 · 복각·이벤트 일정',gameBody:'캐릭터 픽업과 복각, 버전 업데이트, 이벤트 보상과 전투 콘텐츠 초기화 일정을 확인하세요.',languages:'다른 언어',games:'게임별 픽업 캘린더'},
 en:{title:'GAGETHER | Gacha Banner Calendar, Reruns & Events',description:'Track character banners, reruns, support cards, events and reset deadlines across 18 games. GAGETHER links official sources and separates regional services and community forecasts.',gameTitle:'Banner Schedule, Reruns & Event Calendar',gameBody:'Find character banners and reruns, version updates, event rewards and recurring combat resets.',languages:'Languages',games:'Game banner calendars'},
 ja:{title:'GAGETHER | ガチャ・ピックアップカレンダー・復刻予定',description:'18タイトルのガチャ更新、キャラクターピックアップ、復刻、サポートカード、イベントとリセット期限を確認。日本・韓国・グローバルの実際のサービスと情報源を区別しています。',gameTitle:'ガチャ・ピックアップ予定と復刻・イベント日程',gameBody:'キャラクターのピックアップ・復刻、バージョン更新、イベント報酬、戦闘コンテンツのリセット日程を確認できます。',languages:'表示言語',games:'ゲーム別ガチャカレンダー'},
 zh:{title:'GAGETHER | 抽卡游戏卡池日历・复刻与活动日程',description:'查看18款抽卡游戏的角色卡池、复刻、支援卡、活动及周期重置期限。区分实际服务器、官方来源和社区预测。',gameTitle:'卡池日历・复刻与活动日程',gameBody:'查看角色卡池与复刻、版本更新、活动奖励及周期战斗玩法的重置日程。',languages:'语言',games:'各游戏卡池日历'}
};
for(const locale of supportedLocales)searchCopy[locale].description=searchCopy[locale].description.replace('18',String(games.filter(g=>!g.launch).length));
export const seoCopy=searchCopy;
export function localeMetadataDefaults(locale:Locale):Metadata{const c=seoCopy[locale];return {title:c.title,description:c.description,applicationName:'GAGETHER',openGraph:{siteName:searchBrand(locale),title:c.title,description:c.description,locale:({ko:'ko_KR',en:'en_US',ja:'ja_JP',zh:'zh_CN'})[locale]},twitter:{card:'summary',title:c.title,description:c.description}};}
export function canonicalCatalogPath(locale:Locale,gameId?:string,service?:Region){
 const game=games.find(g=>g.id===gameId);if(!game)return catalogPath(locale,gameId);
 const actual=effectiveRegion(game,service||defaultRegionForLocale(locale));
 return catalogPath(locale,gameId,actual===effectiveRegion(game,defaultRegionForLocale(locale))?undefined:actual);
}
export function catalogAlternates(gameId?:string,service?:Region){return Object.fromEntries([...supportedLocales.map(l=>[l,brandOrigin+canonicalCatalogPath(l,gameId,service)]),['x-default',gameId?brandOrigin+canonicalCatalogPath('en',gameId,service):brandOrigin+'/']]);}
export function catalogMetadata(locale:Locale,game?:{id:string;name:string},root=false,service?:Region):Metadata{
 if(root&&!game)return {...homeMetadata,alternates:{canonical:brandOrigin+'/',languages:catalogAlternates()},robots:{index:true,follow:true}};
 const c=searchCopy[locale],planned=games.find(g=>g.id===game?.id&&g.launch),title=game?`${game.name} ${planned?({ko:'출시 예정 · 공개 정보',en:'Upcoming · Official Information',ja:'配信予定・公開情報',zh:'即将上线 · 公开信息'})[locale]:c.gameTitle} | GAGETHER`:c.title;
 const description=planned?`${planned.name[locale]}: ${planned.launch!.summary[locale]} ${gameLaunchLabel(planned,locale,service)}`:game?`${game.name}: ${c.gameBody}`:c.description;
 const actual=game?effectiveRegion(games.find(g=>g.id===game.id)!,service||defaultRegionForLocale(locale)):undefined;
 const url=brandOrigin+(root?'/':canonicalCatalogPath(locale,game?.id,actual));
 const ogLocales={ko:'ko_KR',en:'en_US',ja:'ja_JP',zh:'zh_CN'};
 return {title,description,alternates:{canonical:url,languages:catalogAlternates(game?.id,actual)},robots:{index:true,follow:true},openGraph:{type:'website',url,siteName:searchBrand(locale),locale:ogLocales[locale],alternateLocale:supportedLocales.filter(l=>l!==locale).map(l=>ogLocales[l]),title,description},twitter:{card:'summary',title,description}};
}
export const homeMetadata:Metadata={
 title:'가게더 GAGETHER | 픽업 캘린더 · 가챠 게임 일정',
 description:`가게더(GAGETHER)에서 ${games.length}개 게임의 캐릭터 픽업, 복각, 서포트 카드, 이벤트와 콜라보 일정을 확인하세요. 한국·일본·글로벌 서비스별 공식 출처와 픽업 캘린더를 제공합니다.`,
 alternates:{canonical:brandOrigin+'/'},
 openGraph:{type:'website',url:brandOrigin+'/',siteName:'가게더 GAGETHER',locale:'ko_KR',alternateLocale:['en_US','ja_JP','zh_CN'],title:'가게더 GAGETHER | 픽업 캘린더',description:`${games.length}개 게임의 픽업·복각·이벤트·콜라보 일정을 공식 출처와 함께 한눈에.`},
 twitter:{card:'summary',title:'가게더 GAGETHER | 픽업 캘린더',description:'가챠 게임 픽업·복각·이벤트 일정과 공식 공지를 한곳에서.'},
};
export const websiteStructuredData={'@context':'https://schema.org','@type':'WebSite',name:'가게더',alternateName:['GAGETHER','가게더 GAGETHER'],url:brandOrigin+'/',description:homeMetadata.description,inLanguage:['ko','en','ja','zh']};
export function websiteStructuredDataForLocale(locale:Locale){return {...websiteStructuredData,name:searchBrand(locale),alternateName:locale==='ko'?['가게더','GAGETHER']:['GAGETHER'],description:seoCopy[locale].description,inLanguage:locale};}
export const siteIntro={
 ko:{title:'가게더 · 픽업 캘린더',body:'가게더(GAGETHER)는 원신, 붕괴: 스타레일, 젠레스 존 제로, 명조, 우마무스메, 블루 아카이브, 니케, 명일방주, 엔드필드, 소녀전선2, 이환, 트릭컬 리바이브, 붕괴3rd, 리버스1999, 스텔라소라, 림버스 컴퍼니, 듀엣 나이트 어비스, hololive Dreams의 게임 일정을 모아 보여줍니다. 캐릭터 픽업과 복각, 서포트 카드, 이벤트·콜라보를 서비스별 공식 출처와 함께 확인하세요. 공식 예정과 커뮤니티 예상은 근거를 구분하며, 확인되지 않은 시각은 알림으로 만들지 않습니다.'},
 en:{title:'GAGETHER · Pickup calendar',body:'Browse character and support-card banners, reruns, events and collaborations across 18 games. Check official sources and the schedule for each service. Official announcements and community forecasts are identified separately; unverified times are not used for reminders.'},
 ja:{title:'GAGETHER · ピックアップカレンダー',body:'18タイトルのキャラクター・サポートカードのピックアップ、復刻、イベント、コラボ情報をまとめています。各サービスの公式情報と開催期間をご確認ください。公式発表とコミュニティの予想は区別し、未確認の時刻から通知を作成しません。'},
 zh:{title:'GAGETHER · 卡池日历',body:'汇总18款抽卡游戏的角色与支援卡卡池、复刻、活动和联动信息，并提供各实际服务的官方来源与日程。官方预告与社区预测明确区分，未经确认的时间不用于提醒。'},
};

for(const locale of supportedLocales)siteIntro[locale].body=siteIntro[locale].body.replace('18',String(games.length));
