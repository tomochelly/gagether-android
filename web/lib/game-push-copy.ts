import type {Locale} from './types';
export const gamePushCopy:Record<Locale,{title:string;note:string;upgrade:string;pending:string;connection:string;checking:string}>={
 ko:{title:'내 게임 소식',note:'알림을 켜면 내 게임의 일정과 새 소식을 받아요. 새 소식 수신을 위해 Google 알림 서비스에 기기와 선택 게임·언어를 등록해요. 조용한 시간에는 표시하지 않아요.',upgrade:'내 게임 새 소식 알림은 업데이트된 Android 앱에서 받을 수 있어요.',pending:'게임 알림을 연결 중이에요. 네트워크가 연결되면 다시 시도해요.',connection:'새 소식 연결 확인',checking:'연결 확인 중'},
 en:{title:'My games news',note:'Turning on notifications enables schedule reminders and news for My games. News delivery registers this device and game/language topics with Google messaging. Quiet hours still apply.',upgrade:'My games news requires the updated Android app.',pending:'Connecting game notifications. Retrying when the network is available.',connection:'Last news connection check',checking:'Checking connection'},
 ja:{title:'マイゲームのお知らせ',note:'通知をオンにすると、マイゲームの予定と新着情報を受け取ります。新着情報の配信にはGoogleの通知サービスへ端末とゲーム・言語のトピックを登録します。おやすみ時間には表示しません。',upgrade:'マイゲームの新着通知は更新済みのAndroidアプリで利用できます。',pending:'ゲーム通知を接続しています。ネットワーク接続後に再試行します。',connection:'新着通知の最終接続確認',checking:'接続を確認中'},
 zh:{title:'我的游戏新消息',note:'开启通知后可接收我的游戏日程和新消息。新消息推送会向Google通知服务注册设备及游戏、语言主题，免打扰时段不显示。',upgrade:'我的游戏新消息通知需要更新后的Android应用。',pending:'正在连接游戏通知，网络恢复后将重试。',connection:'新消息最近连接检查',checking:'正在检查连接'}
};
