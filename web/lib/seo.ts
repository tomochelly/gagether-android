import type {Metadata} from 'next';
import {brandOrigin} from './brand';
import type {Locale,Region} from './types';
import {catalogPath,supportedLocales} from './catalog-paths';
const searchCopy={
 ko:{title:'가게더 GAGETHER | 가챠 픽업 캘린더 · 복각·이벤트 일정',description:'15개 가챠 게임의 캐릭터 픽업, 복각, 서포트 카드와 이벤트 일정을 가게더에서 확인하세요. 한국·일본·글로벌 서비스별 공식 출처와 초기화 마감을 제공합니다.',gameTitle:'픽업 캘린더 · 복각·이벤트 일정',gameBody:'캐릭터 픽업과 복각 예정, 이벤트 보상, 주기 콘텐츠 초기화 일정을 확인하세요. 실제 서비스와 공식 출처·커뮤니티 예상을 구분합니다.',languages:'다른 언어',games:'게임별 픽업 캘린더'},
 en:{title:'GAGETHER | Gacha Banner Calendar, Reruns & Events',description:'Track character banners, reruns, support cards, events and reset deadlines across 15 gacha games. GAGETHER links official sources and separates regional services and community forecasts.',gameTitle:'Banner Schedule, Reruns & Event Calendar',gameBody:'Check character banners, upcoming reruns, event rewards and recurring challenge resets. Actual services, official sources and community forecasts are identified separately.',languages:'Languages',games:'Game banner calendars'},
 ja:{title:'GAGETHER | ガチャ・ピックアップカレンダー・復刻予定',description:'15タイトルのガチャ更新、キャラクターピックアップ、復刻、サポートカード、イベントとリセット期限を確認。日本・韓国・グローバルの実際のサービスと情報源を区別しています。',gameTitle:'ガチャ・ピックアップ予定と復刻・イベント日程',gameBody:'キャラクターのピックアップ、復刻予定、イベント報酬、周期コンテンツのリセット日程を確認できます。実際のサービス、公式情報、コミュニティの予想を区別しています。',languages:'表示言語',games:'ゲーム別ガチャカレンダー'},
 zh:{title:'GAGETHER | 抽卡游戏卡池日历・复刻与活动日程',description:'查看15款抽卡游戏的角色卡池、复刻、支援卡、活动及周期重置期限。区分实际服务器、官方来源和社区预测。',gameTitle:'卡池日历・复刻与活动日程',gameBody:'查看角色卡池、复刻预告、活动奖励和周期挑战重置日期。实际服务器、官方信息与社区预测分别标明。',languages:'语言',games:'各游戏卡池日历'}
};
export const seoCopy=searchCopy;
export function catalogAlternates(gameId?:string,service?:Region){return Object.fromEntries([...supportedLocales.map(l=>[l,brandOrigin+catalogPath(l,gameId,service)]),['x-default',gameId?brandOrigin+catalogPath('en',gameId,service):brandOrigin+'/']]);}
export function catalogMetadata(locale:Locale,game?:{id:string;name:string},root=false,service?:Region):Metadata{
 const c=searchCopy[locale],title=game?`${game.name} ${c.gameTitle} | GAGETHER`:c.title;
 const description=game?`${game.name}: ${c.gameBody}`:c.description;
 const url=brandOrigin+(root?'/':catalogPath(locale,game?.id,service));
 const ogLocales={ko:'ko_KR',en:'en_US',ja:'ja_JP',zh:'zh_CN'};
 return {title,description,alternates:{canonical:url,languages:catalogAlternates(game?.id,service)},robots:{index:true,follow:true},openGraph:{type:'website',url,siteName:'GAGETHER · 가게더',locale:ogLocales[locale],alternateLocale:supportedLocales.filter(l=>l!==locale).map(l=>ogLocales[l]),title,description},twitter:{card:'summary',title,description}};
}
export const homeMetadata:Metadata={
 title:'가게더 GAGETHER | 픽업 캘린더 · 가챠 게임 일정',
 description:'가게더(GAGETHER)에서 15개 게임의 캐릭터 픽업, 복각, 서포트 카드, 이벤트와 콜라보 일정을 확인하세요. 한국·일본·글로벌 서비스별 공식 출처와 픽업 캘린더를 제공합니다.',
 alternates:{canonical:brandOrigin+'/'},
 openGraph:{type:'website',url:brandOrigin+'/',siteName:'가게더 GAGETHER',locale:'ko_KR',alternateLocale:['en_US','ja_JP','zh_CN'],title:'가게더 GAGETHER | 픽업 캘린더',description:'15개 게임의 픽업·복각·이벤트·콜라보 일정을 공식 출처와 함께 한눈에.'},
 twitter:{card:'summary',title:'가게더 GAGETHER | 픽업 캘린더',description:'가챠 게임 픽업·복각·이벤트 일정과 공식 공지를 한곳에서.'},
};
export const websiteStructuredData={'@context':'https://schema.org','@type':'WebSite',name:'가게더 GAGETHER',alternateName:['가게더','GAGETHER'],url:brandOrigin+'/',description:homeMetadata.description,inLanguage:['ko','en','ja','zh']};
export const siteIntro={
 ko:{title:'가게더 · 픽업 캘린더',body:'가게더(GAGETHER)는 원신, 붕괴: 스타레일, 젠레스 존 제로, 명조, 우마무스메, 블루 아카이브, 니케, 명일방주, 엔드필드, 소녀전선2, 이환, 트릭컬 리바이브, 붕괴3rd, 리버스1999, 스텔라소라의 가챠 게임 일정을 모아 보여줍니다. 캐릭터 픽업과 복각, 서포트 카드, 이벤트·콜라보를 서비스별 공식 출처와 함께 확인하세요. 공식 예정과 커뮤니티 예상은 근거를 구분하며, 확인되지 않은 시각은 알림으로 만들지 않습니다.'},
 en:{title:'GAGETHER · Pickup calendar',body:'Browse character and support-card banners, reruns, events and collaborations across 15 gacha games. Check official sources and the schedule for each service. Official announcements and community forecasts are identified separately; unverified times are not used for reminders.'},
 ja:{title:'GAGETHER · ピックアップカレンダー',body:'15タイトルのキャラクター・サポートカードのピックアップ、復刻、イベント、コラボ情報をまとめています。各サービスの公式情報と開催期間をご確認ください。公式発表とコミュニティの予想は区別し、未確認の時刻から通知を作成しません。'},
 zh:{title:'GAGETHER · 卡池日历',body:'汇总15款抽卡游戏的角色与支援卡卡池、复刻、活动和联动信息，并提供各实际服务的官方来源与日程。官方预告与社区预测明确区分，未经确认的时间不用于提醒。'},
};
