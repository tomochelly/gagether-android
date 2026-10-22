import type {Locale,Localized} from './types';
export type SiteAnnouncement={id:string;title:Localized;body:Localized;publishedDate?:string;href?:string;enabled?:boolean};
const l=(ko:string,en:string,ja:string,zh:string):Localized=>({ko,en,ja,zh});
export const announcementCopy={
 label:l('가게더 소식','GAGETHER news','GAGETHERからのお知らせ','GAGETHER公告'),
 previous:l('이전 공지','Previous notice','前のお知らせ','上一条公告'),next:l('다음 공지','Next notice','次のお知らせ','下一条公告'),
 pause:l('자동 전환 일시정지','Pause rotation','自動切替を停止','暂停自动切换'),play:l('자동 전환 재개','Resume rotation','自動切替を再開','继续自动切换'),
 close:l('닫기','Close','閉じる','关闭'),more:l('관련 페이지','Related page','関連ページ','相关页面'),edit:l('공지 편집','Edit notices','お知らせを編集','编辑公告'),
 add:l('공지 추가','Add notice','お知らせを追加','添加公告'),seconds:l('공지 전환 간격(초)','Notice interval (seconds)','切替間隔（秒）','切换间隔（秒）'),
 title:l('공지 제목','Notice title','お知らせの見出し','公告标题'),body:l('공지 내용','Notice body','お知らせの本文','公告正文'),date:l('게시일','Publication date','掲載日','发布日期'),link:l('관련 링크(선택)','Related link (optional)','関連リンク（任意）','相关链接（可选）'),enabled:l('표시','Visible','表示','显示')
};
export const defaultAnnouncements:SiteAnnouncement[]=[
 {id:'android-app',publishedDate:'2026-10-23',title:l('Android 앱에서 일정 알림과 홈 화면 위젯을 설정하세요.','Set up schedule reminders and home screen widgets in the Android app.','Androidアプリで予定の通知とホーム画面ウィジェットを設定できます。','Android应用支持日程提醒和桌面小组件。'),body:l('관심 게임과 실제 서비스 지역을 선택한 뒤 앱 설정에서 알림을 켜세요. 알림은 기기에 저장된 일정으로 예약하며 OS 권한·절전 상태에 따라 지연될 수 있습니다. 최신 배포 버전과 설치 방법은 다운로드 페이지에서 확인하세요.','Select followed games and actual service regions, then enable reminders in App settings. Reminders use locally saved schedules; OS permissions and battery restrictions can delay them. See the download page for the published version and installation steps.','お気に入りのゲームと実際のサービスを選び、アプリ設定で通知を有効にしてください。保存した予定に基づく端末内通知で、OS権限や省電力によって遅れる場合があります。配布中のバージョンと手順はダウンロードページをご覧ください。','选择关注游戏及实际服务区后，在应用设置中启用提醒。提醒依据设备内保存的日程预约，权限及省电限制可能造成延迟。下载页提供已发布版本与安装步骤。'),href:'/download'},
 {id:'regional-pickup-review',publishedDate:'2026-10-23',title:l('일본·중국 서비스의 픽업 자료와 원본 이미지를 보강했습니다.','Regional pickup information and original artwork have been expanded.','日本・中国サービスの募集情報と原本画像を補強しました。','已补充日本、中国服务的招募资料与原图。'),body:l('실제 서비스별 일반·중견·한정 모집을 구분하고, 현재·과거 픽업 목록에 검수된 그림을 표시합니다. 시간대나 개별 그림을 확인하지 못한 항목은 미확인으로 유지합니다.','Standard, kernel and limited pools are checked per actual service. Reviewed artwork appears in current and historical pickup lists. Unverified timezones or individual illustrations remain unconfirmed.','通常・中堅・限定募集を実際のサービスごとに照合し、現在・過去の募集一覧に検証済み画像を表示します。未確認の時区や個別画像は未確認のまま保持します。','按实际服务区核对标准、中坚及限定招募，当前与历史列表展示已核实图片。未核实的时区或单角色图片保留未确认状态。')}
];
export function safeAnnouncementLink(value:string){if(!value||/[\s\\\u0000-\u001f]/.test(value))return false;try{const u=new URL(value,'https://gagether.wiki');return u.protocol==='https:'&&!u.username&&!u.password&&(value.startsWith('https://')||value.startsWith('/')&&!value.startsWith('//'));}catch{return false;}}
export function visibleAnnouncements(notices:SiteAnnouncement[]|undefined,locale:Locale){return (notices??defaultAnnouncements).filter(n=>n.enabled!==false&&!!n.title?.[locale]?.trim()&&!!n.body?.[locale]?.trim());}
