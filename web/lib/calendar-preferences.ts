import type {Kind} from './types';
import {linkedWeaponOnly} from './linked-weapon-presentation';
export const calendarKinds:Kind[]=['pickup','event','package','update'];
export type CalendarPreferences={version:1;kinds:Kind[];pools:('character'|'support')[];games:'all'|'favorites'|'selected';gameIds:string[];mode:'changes'|'active'|'notes';fullMonth:boolean};
export const CALENDAR_PREFERENCES_CHANGED='gagether:calendar-display-changed';
export const calendarPreferencesKey=(gameId?:string)=>'gagether.calendar-display.v1:'+(gameId||'board');
export const defaultCalendarPreferences=(myOnly=false):CalendarPreferences=>({version:1,kinds:[...calendarKinds],pools:['character','support'],games:myOnly?'favorites':'all',gameIds:[],mode:'changes',fullMonth:false});
export function calendarPreferences(value:unknown,myOnly=false):CalendarPreferences{
 const d=defaultCalendarPreferences(myOnly);if(!value||typeof value!=='object'||Array.isArray(value))return d;
 const p=value as Partial<CalendarPreferences>;if(p.version!==1)return d;
 const selectedKinds=Array.isArray(p.kinds)?calendarKinds.filter(k=>p.kinds!.includes(k)):d.kinds;
 const kinds=selectedKinds.length||!Array.isArray(p.kinds)||!p.kinds.includes('weapon')?selectedKinds:['pickup' as const];
 return {version:1,kinds,pools:Array.isArray(p.pools)?(['character','support'] as const).filter(k=>p.pools!.includes(k)):d.pools,games:['all','favorites','selected'].includes(p.games||'')?p.games!:d.games,gameIds:Array.isArray(p.gameIds)?[...new Set(p.gameIds.filter((v):v is string=>typeof v==='string'&&/^[a-z0-9-]{1,60}$/.test(v)))].slice(0,100):[],mode:['changes','active','notes'].includes(p.mode||'')?p.mode!:d.mode,fullMonth:p.fullMonth===true};
}
export function calendarIncludesGame(p:CalendarPreferences,id:string,favorites:string[]){return p.games==='all'||(p.games==='favorites'?favorites:p.gameIds).includes(id);}
export function calendarIncludesKind(p:CalendarPreferences,e:Pick<import('./types').Entry,'kind'|'poolType'>){if(linkedWeaponOnly(e))return false;const kind=e.poolType==='support'?'pickup':e.kind;return p.kinds.includes(kind)&&(kind!=='pickup'||p.pools.includes(e.poolType==='support'?'support':'character'));}
