import audit from '../content/wiki-sources.json' with {type:'json'};
import {games} from './games';
import {traitIcon} from './trait-icons';
import {statIcon} from './stat-icons';
import type {Entry} from './types';
/** Owner-facing gaps are computed from current data, never a blanket collection-success flag. */
export function wikiCoverage(entries:Entry[]){
 return games.map(game=>{
  const rows=entries.filter(e=>e.gameId===game.id),profiles=rows.flatMap(e=>e.entityDetails||[]),traits=profiles.flatMap(p=>p.traits||[]),stats=profiles.flatMap(p=>p.stats);
  return {gameId:game.id,sources:audit.games.find(row=>row.gameId===game.id)?.sources||[],profileOccurrences:profiles.length,traits:traits.length,traitsWithNativeIcon:traits.filter(t=>traitIcon(game.id,t)).length,stats:stats.length,statsWithNativeIcon:stats.filter(row=>statIcon(game.id,row)).length,materialGroups:profiles.reduce((n,p)=>n+(p.materials?.length||0),0),pickupEntriesWithoutProfiles:rows.filter(e=>e.kind==='pickup'&&!e.entityDetails?.length).map(e=>e.id)};
 });
}
