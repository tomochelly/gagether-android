import type {RosterCharacter} from './character-roster';
import {requestRosterDirectory} from './roster-directory-request';
type Directory={gameId:string;characters:RosterCharacter[]};
// Anonymous client data only; carousel unmounts must not discard an in-flight read.
const completed=new Map<string,{at:number;data:Directory}>(),pending=new Map<string,Promise<Directory>>();
export function cachedMontageDirectory(gameId:string){const row=completed.get(gameId);return row&&Date.now()-row.at<60000?row.data:undefined;}
export function loadMontageDirectory(gameId:string):Promise<Directory>{
 const saved=cachedMontageDirectory(gameId);if(saved)return Promise.resolve(saved);
 const active=pending.get(gameId);if(active)return active;
 const request=requestRosterDirectory(gameId,{signal:AbortSignal.timeout(12000)}).then(async response=>{if(!response.ok)throw Error('Roster read failed');const value=await response.json() as {data?:Directory};if(value.data?.gameId!==gameId||!Array.isArray(value.data.characters))throw Error('Invalid roster');const data=value.data;completed.delete(gameId);completed.set(gameId,{at:Date.now(),data});while(completed.size>4)completed.delete(completed.keys().next().value!);return data;}).finally(()=>{if(pending.get(gameId)===request)pending.delete(gameId);});
 pending.set(gameId,request);return request;
}
export function warmMontageDirectory(gameId:string){void loadMontageDirectory(gameId).catch(()=>{});}
