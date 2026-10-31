import type {Locale} from './types';
export const combatModes={
 'tower-of-adversity':{ko:'역경의 탑',en:'Tower of Adversity',ja:'逆境深塔',zh:'逆境深塔'},
 'whimpering-wastes':{ko:'죽음의 노래와 바닷속 폐허',en:'Whimpering Wastes',ja:'死の歌が纏う海の廃墟',zh:'冥歌海墟'},
 'endstate-matrix':{ko:'종말 매트릭스',en:'Endstate Matrix',ja:'終末マトリックス',zh:'终末矩阵'}
} as const;
export type CombatMode=keyof typeof combatModes;
export const combatWords={
 ko:{title:'전투 콘텐츠',cycle:'회차',current:'진행 기간',upcoming:'예정',past:'지난 회차',archive:'수록 회차',areas:'구역',stages:'스테이지',floor:'층',team:'편성',enemies:'등장 적',enemyTypes:'적 종류',recommended:'권장 속성',enemyElement:'적 속성',effects:'전투 효과',expand:'효과 모두 펼치기',collapse:'효과 모두 접기',wave:'웨이브',conditions:'참여 조건',source:'출처 보기',empty:'등록된 회차가 없습니다.',noEnemies:'출처에 등록된 적이 없습니다.',tools:'외부 전투 통계',scope:'제출 표본 기준 · 전체 이용자 통계가 아닙니다.',external:'통계 사이트 보기',undated:'기간 미등록',level:'레벨',overview:'구역 바로가기'},
 en:{title:'Combat challenges',cycle:'Cycle',current:'Within date range',upcoming:'Upcoming',past:'Past',archive:'Data occurrence',areas:'Areas',stages:'Stages',floor:'Floor',team:'Team',enemies:'Enemy lineup',enemyTypes:'Enemy types',recommended:'Recommended attributes',enemyElement:'Enemy attribute',effects:'Combat effects',expand:'Expand all effects',collapse:'Collapse all effects',wave:'Wave',conditions:'Entry requirements',source:'View source',empty:'No saved cycles.',noEnemies:'No enemies listed by the source.',tools:'External combat statistics',scope:'Submitted samples · not the whole player population.',external:'Open statistics site',undated:'Dates not listed',level:'Level',overview:'Jump to an area'},
 ja:{title:'戦闘コンテンツ',cycle:'開催回',current:'開催日程内',upcoming:'開催予定',past:'過去',archive:'収録回',areas:'エリア',stages:'ステージ',floor:'階',team:'編成',enemies:'出現する敵',enemyTypes:'敵の種類',recommended:'推奨属性',enemyElement:'敵属性',effects:'戦闘効果',expand:'効果をすべて開く',collapse:'効果をすべて閉じる',wave:'ウェーブ',conditions:'参加条件',source:'出典を見る',empty:'収録された開催回はありません。',noEnemies:'提供元に敵の記載がありません。',tools:'外部の戦闘統計',scope:'投稿された標本の集計・全プレイヤーの統計ではありません。',external:'統計サイトを見る',undated:'日程未収録',level:'レベル',overview:'エリアへ移動'},
 zh:{title:'战斗玩法',cycle:'期次',current:'日期范围内',upcoming:'即将开始',past:'往期',archive:'收录期次',areas:'区域',stages:'关卡',floor:'层',team:'编队',enemies:'敌人阵容',enemyTypes:'敌人种类',recommended:'推荐属性',enemyElement:'敌人属性',effects:'战斗效果',expand:'展开全部效果',collapse:'折叠全部效果',wave:'波次',conditions:'参与条件',source:'查看来源',empty:'暂无收录期次。',noEnemies:'来源未列出敌人。',tools:'外部战斗统计',scope:'基于提交样本，并非全体玩家统计。',external:'查看统计网站',undated:'未收录日期',level:'等级',overview:'跳转到区域'}
};
export type CombatView='stages'|'records'|'statistics'|'setups';
export const isCombatMode=(value:unknown):value is CombatMode=>typeof value==='string'&&Object.hasOwn(combatModes,value);
export const combatView=(value:unknown):CombatView=>value==='records'||value==='statistics'||value==='setups'?value:'stages';
/** Every mode has one clean document URL. Views and archived cycles are optional state. */
export function combatPath(locale:Locale,mode?:CombatMode,state?:{view?:CombatView;cycle?:string}){
 const path=`/${locale}/games/wuwa/combat`+(mode?'/'+mode:''),query=new URLSearchParams();
 if(state?.view&&state.view!=='stages')query.set('view',state.view);
 if(mode&&state?.cycle?.startsWith(mode+':')&&/^[-a-z]+:\d+$/.test(state.cycle))query.set('cycle',state.cycle);
 return path+(query.size?'?'+query:'');
}
