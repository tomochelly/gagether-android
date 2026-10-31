import type {Locale} from './types';
export const calendarDisplayText:Record<Locale,{settings:string;games:string;all:string;favorites:string;selected:string;hint:string;failed:string;empty:string}>={
 ko:{settings:'달력 표시 설정',games:'표시할 게임',all:'모든 게임',favorites:'내 게임만',selected:'직접 선택',hint:'달력의 게임·일정 종류와 마지막으로 본 탭을 이 기기에 기억해요.',failed:'이 기기에 선택을 저장하지 못했어요.',empty:'표시할 일정 종류를 선택해 주세요.'},
 en:{settings:'Calendar display',games:'Games to show',all:'All games',favorites:'My games',selected:'Choose games',hint:'Calendar games, schedule types and the last viewed tab are remembered on this device.',failed:'Could not save this choice on this device.',empty:'Select schedule types to show.'},
 ja:{settings:'カレンダーの表示設定',games:'表示するゲーム',all:'すべてのゲーム',favorites:'マイゲームのみ',selected:'個別に選択',hint:'表示するゲーム・予定の種類と最後に開いたタブをこの端末に保存します。',failed:'この端末に選択を保存できませんでした。',empty:'表示する予定の種類を選択してください。'},
 zh:{settings:'日历显示设置',games:'显示的游戏',all:'全部游戏',favorites:'我的游戏',selected:'自行选择',hint:'此设备会记住日历游戏、日程类型及上次查看的标签。',failed:'无法在此设备保存选择。',empty:'请选择要显示的日程类型。'}
};
