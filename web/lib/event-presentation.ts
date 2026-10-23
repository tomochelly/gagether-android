import {allowsRewards} from './content-roles';
import type {Entry,Locale,RewardItem,Game} from './types';
import {dateInZone} from './display-time';
import {inSchedule} from './presentation';
import {rewardDefinition} from './reward-catalog';
export const eventText={
 ko:{title:'놓치지 말아야 할 이벤트',intro:'무엇을 받고, 언제까지 참여할 수 있는지 한눈에',all:'전체',gacha:'가챠 재화',collab:'콜라보',ending:'마감 임박',reward:'가챠 재화 보상',ongoingCollab:'콜라보 이벤트',offline:'오프라인 콜라보',merchandise:'콜라보 판매',online:'온라인 콜라보',ingame:'인게임 콜라보',starts:'시작까지',ends:'종료까지',dateOnly:'',unknown:'참여 기간 확인 중',today:'오늘까지',more:'이벤트 더 보기',empty:'해당 조건의 이벤트가 없습니다',myGames:'내게임',countNote:'공개 집계 시작 후 동기화된 브라우저 기준입니다. 기기 간 중복이 있을 수 있습니다.',countUnavailable:'집계 불러오기 실패',countSync:'내게임 수 반영 중',social:'공식 채널 소식',sourceLanguage:'원문',noLocale:'이 언어의 검수된 공식 채널을 확인 중입니다',blocked:'게시 목록을 읽을 수 없어 공식 채널 링크를 제공합니다',metadata:'제목·공개 정보 확인',viewChannel:'공식 채널 열기',noPosts:'확인된 게시물이 아직 없습니다',free:'보상',days:'일 남음'},
 en:{title:'Events worth keeping an eye on',intro:'See the rewards, requirements and time remaining',all:'All',gacha:'Pull rewards',collab:'Collabs',ending:'Ending soon',reward:'Pull currency rewards',ongoingCollab:'Collaboration event',offline:'Offline collaboration',merchandise:'Collaboration sale',online:'Online collaboration',ingame:'In-game collaboration',starts:'Starts in',ends:'Ends in',dateOnly:'',unknown:'Participation period unconfirmed',today:'Ends today',more:'More events',empty:'No events match this filter',myGames:'My games',countNote:'Browser selections synced since public counting began. Multiple devices may be counted separately.',countUnavailable:'Count unavailable',countSync:'Updating count',social:'Official channel updates',sourceLanguage:'Original',noLocale:'Verified official channels in this language are being checked',blocked:'Posts could not be read. Open the official channel for updates',metadata:'Title and public metadata checked',viewChannel:'Open official channel',noPosts:'No verified posts yet',free:'Rewards',days:'days left'},
 ja:{title:'見逃せないイベント',intro:'報酬・参加条件・残り期間をひと目で確認',all:'すべて',gacha:'ガチャ報酬',collab:'コラボ',ending:'終了間近',reward:'ガチャ通貨報酬',ongoingCollab:'コラボイベント',offline:'オフラインコラボ',merchandise:'コラボ販売',online:'オンラインコラボ',ingame:'ゲーム内コラボ',starts:'開始まで',ends:'終了まで',dateOnly:'',unknown:'参加期間を確認中',today:'本日まで',more:'イベントをもっと見る',empty:'該当するイベントはありません',myGames:'マイゲーム',countNote:'公開集計開始後に同期したブラウザー数です。複数端末が重複する場合があります。',countUnavailable:'集計を取得できません',countSync:'集計に反映中',social:'公式チャンネル情報',sourceLanguage:'原文',noLocale:'この言語の公式チャンネルを確認中です',blocked:'投稿一覧を取得できません。公式チャンネルをご確認ください',metadata:'タイトルと公開情報を確認',viewChannel:'公式チャンネルを開く',noPosts:'確認済みの投稿はまだありません',free:'報酬',days:'日残り'},
 zh:{title:'值得关注的活动',intro:'一览奖励、参与条件与剩余时间',all:'全部',gacha:'抽卡奖励',collab:'联动',ending:'即将结束',reward:'抽卡货币奖励',ongoingCollab:'联动活动',offline:'线下联动',merchandise:'联动销售',online:'线上联动',ingame:'游戏内联动',starts:'距离开始',ends:'距离结束',dateOnly:'',unknown:'参与时间待确认',today:'今天结束',more:'查看更多活动',empty:'没有符合条件的活动',myGames:'我的游戏',countNote:'公开统计开始后已同步的浏览器选择数。多个设备可能重复计数。',countUnavailable:'无法加载统计',countSync:'正在更新人数',social:'官方频道动态',sourceLanguage:'原文',noLocale:'正在核实此语言的官方频道',blocked:'无法读取帖子列表，请打开官方频道查看',metadata:'已核实标题及公开信息',viewChannel:'打开官方频道',noPosts:'暂无已核实的帖子',free:'奖励',days:'天剩余'}
};
export const rewardCategory=(gameId:string,r:RewardItem)=>r.category||rewardDefinition(gameId,r)?.category;
export const pullRewards=(e:Entry)=>!allowsRewards(e)?[]:(e.rewards||[]).filter(r=>['gacha-currency','gacha-ticket'].includes(rewardCategory(e.gameId,r)||''));
export const hasPullRewards=(e:Entry)=>pullRewards(e).length>0;
export const serviceZone=(e:Entry)=>e.region==='cn'?'Asia/Shanghai':e.region==='jp'?'Asia/Tokyo':e.region==='kr'?'Asia/Seoul':/UTC\+8|UTC\+08|\+08:00/.test(e.server)?'Asia/Shanghai':/UTC-7|UTC−7|UTC-07|\-07:00/.test(e.server)?'Etc/GMT+7':'Asia/Seoul';
export function eventState(e:Entry,now:number):'active'|'upcoming'|'ended'|'unconfirmed'{
 if(e.pickupArchive?.status==='forecast')return 'unconfirmed';
 const day=dateInZone(now,serviceZone(e));
 if(e.endAt&&Date.parse(e.endAt)<=now||!e.endAt&&e.endDate&&e.endDate<day)return 'ended';
 if(e.startAt&&Date.parse(e.startAt)>now||!e.startAt&&e.startDate&&e.startDate>day)return 'upcoming';
 // A publication time is not proof that an event has opened.
 if((e.startAt||e.startDate)&&(e.endAt||e.endDate))return 'active';
 return 'unconfirmed';
}
export const collaborationActive=(e:Entry,now:number)=>!!e.collaboration&&eventState(e,now)==='active'&&(e.sourceKind||'official')==='official';
export function activeGameCollaborations(entries:Entry[],game:Game,region:import('./types').Region,now:number){return entries.filter(e=>e.gameId===game.id&&!e.hidden&&inSchedule(e,game,region)&&collaborationActive(e,now));}
export function eventEndingSoon(e:Entry,now:number){
 if(eventState(e,now)!=='active')return false;
 if(e.endAt)return Date.parse(e.endAt)-now<=3*86400000;
 if(e.endDate){const days=(Date.parse(e.endDate)-Date.parse(dateInZone(now,serviceZone(e))))/86400000;return days>=0&&days<=3;}
 return false;
}
export function sortEvents(entries:Entry[],now:number){
 const score=(e:Entry)=>(e.recurring?-30:0)+(eventState(e,now)==='active'?0:eventState(e,now)==='upcoming'?10:20)-(e.collaboration?4:0)-(hasPullRewards(e)?2:0)-(eventEndingSoon(e,now)?1:0);
 return [...entries].sort((a,b)=>score(a)-score(b)||(a.endAt||a.endDate||'9999').localeCompare(b.endAt||b.endDate||'9999')||a.id.localeCompare(b.id));
}
