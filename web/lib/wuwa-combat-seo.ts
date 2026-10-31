import type {Metadata} from 'next';
import type {Locale,Localized} from './types';
import {brandOrigin,searchBrand} from './brand';
import {supportedLocales} from './visitor-locale';
import {combatModes,combatPath,combatWords,type CombatMode,type CombatView} from './wuwa-combat';

const gameNames:Localized={ko:'명조: 워더링 웨이브',en:'Wuthering Waves',ja:'鳴潮',zh:'鸣潮'};
const teamLabels:Localized={ko:'파티 조합·전투 기록',en:'Teams & Clear Records',ja:'パーティ編成・クリア記録',zh:'队伍阵容与通关记录'};
const descriptions:Record<CombatMode,Localized>={
 'tower-of-adversity':{
  ko:'역경의 탑의 구역·층별 적 편성, 권장 속성과 전투 효과를 살펴보고 공개 클리어 기록의 파티 조합을 비교하세요.',
  en:'Explore Tower of Adversity areas and floors, enemy lineups, recommended attributes and combat effects, then compare teams in public clear records.',
  ja:'逆境深塔のエリア・階層別の敵編成、推奨属性、戦闘効果を確認し、公開クリア記録のパーティ編成を比較できます。',
  zh:'查看逆境深塔各区域与楼层的敌人阵容、推荐属性及战斗效果，并比较公开通关记录中的队伍阵容。'
 },
 'whimpering-wastes':{
  ko:'죽음의 노래와 바닷속 폐허의 스테이지별 적·웨이브·전투 효과를 확인하고 공개 기록의 파티 조합과 사용 증표를 살펴보세요.',
  en:'Explore Whimpering Wastes stages, enemies, waves and combat effects, with team compositions and tokens from public clear records.',
  ja:'死の歌が纏う海の廃墟のステージ別の敵・ウェーブ・戦闘効果と、公開記録のパーティ編成・使用トークンを確認できます。',
  zh:'查看冥歌海墟各关卡的敌人、波次及战斗效果，以及公开通关记录中的队伍阵容和使用信物。'
 },
 'endstate-matrix':{
  ko:'종말 매트릭스의 참여 조건, 스테이지별 적·저항 특성·웨이브와 선택 전투 효과를 살펴보고 공개 기록의 파티 조합을 비교하세요.',
  en:'Explore Endstate Matrix entry requirements, stage enemies, resistance tags, waves and selectable combat effects, then compare teams in public clear records.',
  ja:'終末マトリックスの参加条件、ステージ別の敵・耐性・ウェーブ・選択可能な戦闘効果と、公開記録のパーティ編成を確認できます。',
  zh:'查看终末矩阵的参与条件、各关卡敌人、抗性、波次与可选战斗效果，并比较公开通关记录中的队伍阵容。'
 }
};
const hubDescription:Localized={
 ko:'명조 역경의 탑, 죽음의 노래와 바닷속 폐허, 종말 매트릭스의 스테이지 정보, 파티 조합과 공개 클리어 기록을 살펴보세요.',
 en:'Explore Wuthering Waves Tower of Adversity, Whimpering Wastes and Endstate Matrix stages, team compositions and public clear records.',
 ja:'鳴潮の逆境深塔、死の歌が纏う海の廃墟、終末マトリックスのステージ情報、パーティ編成、公開クリア記録を確認できます。',
 zh:'查看鸣潮逆境深塔、冥歌海墟及终末矩阵的关卡信息、队伍阵容与公开通关记录。'
};
export const combatSubmissionScope:Localized={
 ko:'통계는 공개에 동의한 가게더 클리어 기록의 제출 표본을 집계합니다. 픽률은 집계 기록 중 해당 캐릭터를 포함한 비율이며 전체 이용자의 사용률이나 캐릭터 성능 순위가 아닙니다. 개인 저장 세팅은 공개 기록에 포함해 제출한 경우에만 공개됩니다.',
 en:'Statistics describe GAGETHER clears submitted with public consent. Pick rate is the share of counted clears containing a character, not population usage or a character-strength ranking. Saved private builds become public only when included in a submitted public record.',
 ja:'統計は公開に同意したGAGETHERクリア記録の投稿標本です。採用率は集計記録中に該当キャラを含む割合で、全プレイヤーの使用率や性能順位ではありません。個人保存設定は公開記録に含めて投稿した場合のみ公開されます。',
 zh:'统计基于同意公开的GAGETHER通关投稿。使用率是统计记录中包含该角色的比例，并非全体玩家使用率或角色强度排名。私人保存的配置仅在被纳入公开投稿时公开。'
};
export function wuwaCombatCopy(locale:Locale,mode?:CombatMode){
 const name=mode?combatModes[mode][locale]:combatWords[locale].title;
 return {heading:gameNames[locale]+' · '+name+(mode?' · '+teamLabels[locale]:''),description:mode?descriptions[mode][locale]:hubDescription[locale]};
}
export function wuwaCombatMetadata(locale:Locale,mode?:CombatMode,view:CombatView='stages'):Metadata{
 const copy=wuwaCombatCopy(locale,mode),title=copy.heading+' | '+searchBrand(locale),url=brandOrigin+combatPath(locale,mode);
 return {title,description:copy.description,alternates:{canonical:url,languages:Object.fromEntries(supportedLocales.map(l=>[l,brandOrigin+combatPath(l,mode)]))},robots:{index:view!=='setups',follow:true},openGraph:{title,description:copy.description,url,type:'website'},twitter:{card:'summary',title,description:copy.description}};
}
/** Describes only the public document; no personal builds or invented result statistics. */
export function wuwaCombatStructuredData(locale:Locale,mode?:CombatMode){
 const copy=wuwaCombatCopy(locale,mode),url=brandOrigin+combatPath(locale,mode),crumbs=[{name:'GAGETHER',url:brandOrigin+'/'+locale},{name:gameNames[locale],url:brandOrigin+`/${locale}/games/wuwa`},{name:combatWords[locale].title,url:brandOrigin+combatPath(locale)},...mode?[{name:combatModes[mode][locale],url}]:[]];
 return {'@context':'https://schema.org','@graph':[{'@type':'WebPage','@id':url,url,name:copy.heading,description:copy.description,inLanguage:locale},{'@type':'BreadcrumbList',itemListElement:crumbs.map((c,i)=>({'@type':'ListItem',position:i+1,name:c.name,item:c.url}))}]};
}
