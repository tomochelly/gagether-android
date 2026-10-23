import type {Locale,Region,Topic} from './types';
const text={
  pickup:['픽업','Banners','ガチャ','卡池'],events:['이벤트','Events','イベント','活动'],notices:['공지','Notices','お知らせ','公告'],broadcast:['방송','Broadcasts','配信','直播'],overview:['요약','Overview','まとめ','概览'],
  current:['진행 중','Current','開催中','进行中'],upcoming:['예정','Upcoming','開催予定','即将开始'],ended:['종료','Ended','終了','已结束'],forecast:['예상','Forecast','予想','预测'],
  empty:['등록된 항목이 없습니다.','No matching items.','該当する情報はありません。','暂无相关内容。'],more:['다음','Next','次へ','下一页'],previous:['이전','Previous','前へ','上一页'],site:['가게더에서 보기','Open GAGETHER','GAGETHERで見る','在GAGETHER查看'],source:['원문','Source','原文','原文'],
  chooseService:['서비스 선택','Choose service','サービスを選択','选择区服'],search:['검색','Search','検索','搜索'],query:['검색어','Search term','キーワード','关键词'],
  alerts:['자동 알림','Automatic alerts','自動通知','自动通知'],newAlert:['새 알림 설정','New subscription','通知を設定','设置通知'],list:['설정 목록','Subscriptions','設定一覧','订阅列表'],
  manageOnly:['서버 관리 권한이 필요합니다.','Manage Server permission is required.','サーバー管理権限が必要です。','需要管理服务器权限。'],guildOnly:['디스코드 서버에서 사용해 주세요.','Use this command in a server.','サーバー内で使ってください。','请在服务器内使用。'],
  games:['게임 선택','Choose games','ゲームを選択','选择游戏'],topics:['알림 종류','Notification types','通知の種類','通知类型'],offsets:['미리 받을 시간','Reminder times','通知するタイミング','提前通知时间'],language:['알림 언어','Notification language','通知の言語','通知语言'],channel:['받을 채널','Delivery channel','通知先チャンネル','接收频道'],
  save:['저장','Save','保存','保存'],saved:['알림 설정을 저장했습니다.','Subscription saved.','通知設定を保存しました。','通知设置已保存。'],cancel:['취소','Cancel','キャンセル','取消'],
  disable:['알림 끄기','Disable','通知を停止','关闭通知'],enable:['알림 켜기','Enable','通知を再開','开启通知'],on:['켜짐','On','有効','已开启'],off:['꺼짐','Off','無効','已关闭'],
  hour:['1시간 전','1 hour before','1時間前','提前1小时'],day:['하루 전','1 day before','1日前','提前1天'],half:['30분 전','30 minutes before','30分前','提前30分钟'],quarter:['15분 전','15 minutes before','15分前','提前15分钟'],at:['시작·종료 시각','At the scheduled time','開始・終了時刻','开始或结束时'],
  expired:['설정이 변경됐거나 만료됐습니다. /알림을 다시 열어 주세요.','Settings changed or expired. Open /알림 again.','設定が変更されたか期限切れです。/알림を開き直してください。','设置已变更或过期，请重新打开 /알림。'],
  unavailable:['정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.','Could not load data. Please try again shortly.','情報を取得できませんでした。しばらくして再試行してください。','暂时无法获取信息，请稍后重试。'],
  invalid:['선택값을 확인해 주세요.','Check your selection.','選択内容を確認してください。','请检查所选内容。'],permission:['선택한 채널의 채널 보기·메시지 보내기·링크 삽입 권한을 확인해 주세요.','Allow View Channel, Send Messages and Embed Links in the selected channel.','選択したチャンネルで閲覧・送信・埋め込みリンクを許可してください。','请允许查看频道、发送消息和嵌入链接。'],
  ready:['아래 설정으로 자동 알림을 보냅니다.','Automatic alerts will use these settings.','以下の設定で自動通知を送ります。','将按以下设置自动发送通知。'],noSubscriptions:['저장된 알림 설정이 없습니다.','No subscriptions saved.','保存済みの通知設定はありません。','暂无已保存的订阅。'],
  held:['발송 확인 대기','Delivery confirmation pending','送信確認待ち','等待发送确认'],choose:['설정 선택','Choose subscription','設定を選択','选择订阅'],help:['게임 명령어 · /검색 · /알림','Game commands · /검색 · /알림','ゲームコマンド · /검색 · /알림','游戏命令 · /검색 · /알림'],
  searchTitle:['검색 결과','Search results','検索結果','搜索结果'],newNotice:['새 공지','New notice','新しいお知らせ','新公告'],live:['LIVE','LIVE','LIVE','LIVE'],
  start:['시작','Starts','開始','开始'],end:['종료','Ends','終了','结束'],broadcastReminder:['방송 예정','Upcoming broadcast','配信予定','直播预约'],
  stopped:['알림을 껐습니다.','Notifications disabled.','通知を停止しました。','已关闭通知。'],resumed:['알림을 켰습니다.','Notifications enabled.','通知を再開しました。','已开启通知。'],
} as const;
export type TextKey=keyof typeof text;
export const t=(key:TextKey,locale:Locale)=>text[key][(['ko','en','ja','zh'] as Locale[]).indexOf(locale)];
export const localeFor=(value?:string):Locale=>value?.startsWith('ja')?'ja':value?.startsWith('zh')?'zh':value?.startsWith('ko')?'ko':'en';
export const regionText=(region:Region,locale:Locale)=>({kr:['한국','Korea','韓国','韩国'],jp:['일본','Japan','日本','日本'],global:['글로벌','Global','グローバル','国际服'],cn:['중국','Mainland China','中国本土','中国大陆']}[region][(['ko','en','ja','zh'] as Locale[]).indexOf(locale)]);
export const topicText=(topic:Topic,locale:Locale)=>({
  'pickup-start':['픽업 시작','Banner starts','ガチャ開始','卡池开始'],'pickup-end':['픽업 종료','Banner ends','ガチャ終了','卡池结束'],
  'event-start':['이벤트 시작','Event starts','イベント開始','活动开始'],'event-end':['이벤트 종료','Event ends','イベント終了','活动结束'],
  'package-end':['판매 종료','Sale ends','販売終了','销售结束'],broadcast:['방송 예정·LIVE','Broadcast reminder · LIVE','配信予定・LIVE','直播预约・LIVE'],notice:['새 공지','New notices','新しいお知らせ','新公告'],
}[topic][(['ko','en','ja','zh'] as Locale[]).indexOf(locale)]);
