import type {Entry,Locale} from './types';
import {entryState} from './types';
import {dayKey} from './schedule';
import {officialRecurringRule} from './recurring-official-rules';
export type PickupPeriod='current'|'upcoming'|'past';
// Support cards are kept even where the shared content kind is "weapon".
export const isPickup=(e:Entry)=>e.poolType==='support'||e.kind==='pickup'&&e.poolType!=='weapon';
export function pickupPeriod(e:Entry,now:number):PickupPeriod{
 const a=e.pickupArchive;if(!a){const state=entryState(e,now);return state==='ended'?'past':state==='upcoming'?'upcoming':'current';}
 if(a.status==='forecast')return 'upcoming';
 if(e.startAt||e.endAt){const state=entryState(e,now);if(state==='active')return 'current';if(state==='ended')return 'past';if(state==='upcoming')return 'upcoming';}
 const today=dayKey(now);
 if(e.endAt&&Date.parse(e.endAt)<=now||a.endDate&&a.endDate<today)return 'past';
 if(e.startAt&&Date.parse(e.startAt)>now||a.startDate&&a.startDate>today)return 'upcoming';
 if(a.status==='past')return 'past';
 if((e.startAt&&Date.parse(e.startAt)<=now||a.startDate&&a.startDate<=today)&&(e.endAt||a.endDate))return 'current';
 return 'upcoming';
}
export const pickupStart=(e:Entry,zone='Asia/Tokyo')=>(e.startAt?dayKey(Date.parse(e.startAt),zone):e.startDate||e.pickupArchive?.startDate);
export const pickupEnd=(e:Entry,zone='Asia/Tokyo')=>(e.endAt?dayKey(Date.parse(e.endAt),zone):e.endDate||e.pickupArchive?.endDate);
// Date-only official schedules may be shown in the calendar, but never synthesize notification clocks.
export const timedSchedule=(e:Entry)=>e.pickupArchive?isPickup(e)&&e.pickupArchive.status!=='forecast'&&(e.sourceKind||'official')==='official'&&!!(e.startAt||e.endAt||pickupStart(e)||pickupEnd(e)):!!(e.startAt||e.endAt)||!!(e.startDate||e.endDate)&&((e.sourceKind||'official')==='official'||!!officialRecurringRule(e));
export const historyText:Record<Locale,{title:string;currentContent:string;current:string;upcoming:string;past:string;forecast:string;allGames:string;allPools:string;allMonths:string;dateOnly:string;unknownDate:string;official:string;community:string;empty:string;noUpcoming:string;noForecast:string;coverage:string;records:string;period:string;range:string;more:string;forecastNote:string}>={
 ko:{title:'픽업 기록',currentContent:'현재 콘텐츠',current:'진행 중',upcoming:'예정',past:'과거',forecast:'커뮤니티 예상',allGames:'모든 게임',allPools:'모든 픽업',allMonths:'전체 기간',dateOnly:'',unknownDate:'일정 미확정',official:'공식 공지',community:'커뮤니티 기록',empty:'확인해 등록한 픽업 기록이 없습니다.',noUpcoming:'등록된 예정 픽업이 없습니다.',noForecast:'근거를 확인해 등록한 커뮤니티 예상이 없습니다.',coverage:'확인된 기록만 표시합니다. 누락된 기간이 있을 수 있으며, 서버 간 순서를 확정 일정으로 간주하지 않습니다.',records:'기록',period:'픽업 기간',range:'등록된 과거 기록',more:'기록 더 보기',forecastNote:'커뮤니티 예상입니다. 공식 발표에 따라 캐릭터·순서·기간이 달라질 수 있습니다.'},
 en:{title:'Banner history',currentContent:'Current content',current:'Live',upcoming:'Upcoming',past:'Past',forecast:'Community outlook',allGames:'All games',allPools:'All pools',allMonths:'All dates',dateOnly:'',unknownDate:'Schedule unconfirmed',official:'Official notice',community:'Community record',empty:'No reviewed banners are registered.',noUpcoming:'No upcoming banners are registered yet.',noForecast:'No sourced community outlook is registered.',coverage:'Reviewed records only; some periods may be missing. Another server’s order is not a confirmed schedule.',records:'records',period:'Banner period',range:'Registered historical coverage',more:'Load more records',forecastNote:'Community expectation. Characters, order and dates may change with official announcements.'},
 ja:{title:'ガチャ履歴',currentContent:'開催中の情報',current:'開催中',upcoming:'開催予定',past:'過去',forecast:'コミュニティ予想',allGames:'すべてのゲーム',allPools:'すべての募集',allMonths:'全期間',dateOnly:'',unknownDate:'日程未確定',official:'公式告知',community:'コミュニティ記録',empty:'確認済みのガチャ記録はまだありません。',noUpcoming:'登録済みの開催予定はありません。',noForecast:'出典を確認したコミュニティ予想は登録されていません。',coverage:'確認できた記録のみ掲載しています。未収録期間がある場合があります。他サーバーの順番は確定日程ではありません。',records:'件',period:'開催期間',range:'登録済みの過去記録',more:'さらに表示',forecastNote:'コミュニティの予想です。公式発表により対象・順番・日程が変わる場合があります。'},
 zh:{title:'卡池记录',currentContent:'当前内容',current:'进行中',upcoming:'即将到来',past:'历史',forecast:'社区预测',allGames:'全部游戏',allPools:'全部卡池',allMonths:'全部日期',dateOnly:'',unknownDate:'日程未确定',official:'官方公告',community:'社区记录',empty:'暂无已核实并收录的卡池记录。',noUpcoming:'暂无已收录的未来卡池。',noForecast:'暂无有来源依据的社区预测。',coverage:'仅列出已核实记录，可能存在未收录时段。其他服务器的顺序不代表已确认日程。',records:'条记录',period:'卡池期间',range:'已收录历史范围',more:'加载更多记录',forecastNote:'社区预测。角色、顺序和日期可能随官方公告调整。'}
};
