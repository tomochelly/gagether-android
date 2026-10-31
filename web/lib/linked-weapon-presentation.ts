import type {Entry} from './types';

/** Retain weapon records for linked details, but omit their standalone schedule. */
export function linkedWeaponOnly(entry:Pick<Entry,'kind'|'poolType'>){
 return entry.poolType==='weapon'||entry.kind==='weapon'&&entry.poolType!=='support';
}
