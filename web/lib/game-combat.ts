import registry from '../content/game-combat-modes.json' with {type:'json'};
import research from '../content/combat-display.json' with {type:'json'};
import type {Localized} from './types';
export type GameCombatMode={gameId:string;id:string;name:Localized;objective?:Localized;teamSize?:number;teams?:number|null;guide:string;statistics?:string;sourceKind?:string;category?:string;variantsNote?:string;serviceNote?:string;guideScope?:string;guidePublishedDate?:string};
export type CombatSample={gameId:string;modeId:string;regionScope:string;version:string;phaseVersion?:string;phaseName?:string;asOf:string|null;sampleSize:number;sampleUnit:string;stage?:string;teams:{rank:number;members:{id?:string;name:Localized;icon?:string;rosterMatched?:boolean}[];usageRate:number|null;observations?:number;usageMetric?:string}[];enemies:{id:string;name:Localized;originalLocale?:string;sourceUrl:string;notes?:Localized}[];sourceUrl:string;credit?:string;license?:string;denominator:{kind:string;description:string;notOwnershipRate:boolean;notPopulationRate:boolean;sumMayExceed100:boolean}};
export const gameCombatModes=registry.modes as unknown as GameCombatMode[];
export const combatSamples=research.snapshots as unknown as CombatSample[];
export {combatSectionLabel} from './combat-labels';
