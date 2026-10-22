import type {Locale} from './types';
export const brandName='GAGETHER';
export const brandOrigin='https://gagether.wiki';
export const brandTagline:Record<Locale,string>={ko:'가게더 · 가챠 게임 캘린더',en:'Gacha Game Calendar',ja:'ガチャゲームカレンダー',zh:'抽卡游戏日历'};
export const publicText:Record<Locale,{admin:string;refresh:string;refreshed:string;access:string}>={
 ko:{admin:'관리자 로그인',refresh:'일정 새로고침',refreshed:'최신 저장 일정을 불러왔습니다.',access:'일반 이용에는 로그인이 필요하지 않습니다.'},
 en:{admin:'Admin sign in',refresh:'Refresh schedules',refreshed:'Latest saved schedules loaded.',access:'No sign-in is needed to browse.'},
 ja:{admin:'管理者ログイン',refresh:'予定を更新',refreshed:'最新の保存済み予定を読み込みました。',access:'閲覧にログインは必要ありません。'},
 zh:{admin:'管理员登录',refresh:'刷新日程',refreshed:'已加载最新保存的日程。',access:'浏览无需登录。'}
};
