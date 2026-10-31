import snapshots from '../content/foresight.json' with {type:'json'};
import {foresightSchema} from './foresight';
export function readForesight(gameId:string){const raw=snapshots.find(row=>row.gameId===gameId);return raw?foresightSchema.parse(raw):null;}
