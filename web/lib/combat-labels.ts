import type {Locale} from './types';
export function combatSectionLabel(gameId:string,locale:Locale){return (gameId==='umamusume'?{ko:'레이스 콘텐츠',en:'Race challenges',ja:'レースコンテンツ',zh:'赛事玩法'}:gameId==='holodreams'?{ko:'라이브 · 도전',en:'Live challenges',ja:'ライブ・チャレンジ',zh:'演出与挑战'}:{ko:'전투 콘텐츠',en:'Combat challenges',ja:'戦闘コンテンツ',zh:'战斗玩法'})[locale];}
