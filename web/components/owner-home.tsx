import {ArrowUpRight,Bell,ChartNoAxesCombined,Images,LayoutDashboard,MessageCircle,MessageSquare,Pencil,ShieldCheck,Workflow} from 'lucide-react';
import type {Locale} from '@/lib/types';

export default function OwnerHome({locale}:{locale:Locale}){
 const T=(ko:string,en:string,ja:string,zh:string)=>({ko,en,ja,zh})[locale];
 const tools=[
  {href:'/owner/push',icon:Bell,title:T('게임별 앱 알림','Game announcements','ゲーム別アプリ通知','游戏应用通知'),description:T('게임과 언어를 골라 알림을 작성하고 발송해요.','Write and send notifications by game and language.','ゲームと言語を選んで通知を作成・配信します。','按游戏和语言编写并发送通知。')},
  {href:'/owner?view=site',icon:Pencil,title:T('사이트 내용 편집','Edit site content','サイト内容の編集','编辑网站内容'),description:T('일정·픽업 배너·방송 요약·리딤 코드와 이미지를 수정해요.','Edit schedules, banners, broadcast recaps, redeem codes and artwork.','予定・バナー・配信まとめ・交換コード・画像を編集します。','编辑日程、卡池横幅、直播总结、兑换码及图片。')},
  {href:'/owner/operations',icon:Workflow,title:T('운영 상태·변경 이력','Operations and history','稼働状況・変更履歴','运行状态与变更记录'),description:T('자동 갱신 상태와 저장된 변경 내역을 확인해요.','Check automatic refreshes and saved changes.','自動更新の状態と保存済みの変更を確認します。','查看自动更新状态及已保存的变更。')},
  {href:'/owner/analytics',icon:ChartNoAxesCombined,title:T('방문 통계','Visit statistics','アクセス統計','访问统计'),description:T('이용 현황과 게임별 관심도를 확인해요.','View site activity and interest by game.','利用状況とゲーム別の関心を確認します。','查看网站使用情况及各游戏关注度。')},
  {href:'/owner/feedback',icon:MessageSquare,title:T('오류·개선 제보','Reports and feedback','不具合・改善の報告','报错与建议'),description:T('이용자가 보낸 오류와 개선 의견을 확인해요.','Read issues and suggestions sent by visitors.','利用者からの不具合や改善提案を確認します。','查看用户提交的问题与改进建议。')},
  {href:'/owner/community',icon:MessageCircle,title:T('커뮤니티 관리','Community moderation','コミュニティ管理','社区管理'),description:T('게시글·댓글·평가와 신고를 관리해요.','Manage posts, replies, reviews and reports.','投稿・返信・評価・通報を管理します。','管理帖子、评论、评价及举报。')},
  {href:'/owner/characters',icon:Images,title:T('도감 이미지 편집','Character artwork','図鑑の画像編集','图鉴图片编辑'),description:T('게임별 캐릭터 이미지와 표시 구도를 조정해요.','Adjust character artwork and framing by game.','ゲーム別にキャラクター画像と構図を調整します。','调整各游戏角色图片及展示构图。')},
  {href:'/owner/discord',icon:ShieldCheck,title:T('Discord 로그인 연결','Discord sign-in setup','Discordログイン設定','Discord登录设置'),description:T('Discord 로그인 연결 설정을 확인해요.','Review the Discord sign-in connection.','Discordログインの接続設定を確認します。','检查Discord登录连接设置。')},
 ];
 return <main className="owner-home"><nav><a href={'/'+locale}><LayoutDashboard size={16}/>{T('사이트로 돌아가기','Back to site','サイトに戻る','返回网站')}</a></nav><header><small>GAGETHER / OWNER</small><h1>{T('운영자 페이지','Site management','運営者ページ','网站管理')}</h1><p>{T('관리할 항목을 선택하세요. PC와 폰에서 같은 기능을 사용할 수 있어요.','Choose a tool. The same controls work on desktop and mobile.','管理する項目を選択してください。PCとスマートフォンで利用できます。','选择管理项目，电脑和手机均可使用。')}</p></header><div className="owner-home-tools">{tools.map(({href,icon:Icon,title,description})=><a href={href} key={href}><Icon className="owner-home-icon" size={23}/><div><h2>{title}</h2><p>{description}</p></div><ArrowUpRight size={17}/></a>)}</div></main>;
}
