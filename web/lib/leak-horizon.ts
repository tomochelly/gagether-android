import baselines from '../content/leaks/version-baselines.json' with {type:'json'};
import type {LeakItem} from './leaks';
export type LeakBaseline={gameId:string;version:string;checkedAt:string;sourceUrl:string;sourceAccess:'body'|'search-index'|'catalog';startDate?:string};
export function leakVersions(value:string){return [...new Set([...value.matchAll(/(?<!\d)(\d{1,2}\.\d{1,2})(?!\d)/g)].map(m=>m[1]))];}
export function compareLeakVersions(a:string,b:string){const left=a.split('.').map(Number),right=b.split('.').map(Number);return left[0]-right[0]||left[1]-right[1];}
export function leakVersion(value:string){return leakVersions(value).sort(compareLeakVersions).at(-1);}
export function reviewedLeakBaseline(gameId:string):LeakBaseline|undefined{return (baselines as LeakBaseline[]).find(b=>b.gameId===gameId);}
export function leakHorizon(item:Pick<LeakItem,'version'|'sourceTitle'>,current:string){const version=leakVersion(item.version||item.sourceTitle);return !version?'unknown':compareLeakVersions(version,current)>0?'future':'archive';}
