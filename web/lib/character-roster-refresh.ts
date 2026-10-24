import {env} from 'cloudflare:workers';
import {games} from './games';
import {githubIdentity} from './refresh-identity';
export const rosterAudience='https://gagether.wiki/api/characters';
export const rosterWorkflow='tomochelly/gagether-android/.github/workflows/gagether-rosters.yml@refs/heads/main';
export const rosterGames=games.filter(g=>g.id!=='wuwa').map(g=>g.id);
export async function rosterIdentity(request:Request){const token=request.headers.get('X-Gagether-Collection-OIDC');return token?await githubIdentity(token,rosterAudience,rosterWorkflow):null;}
export async function recordRosterHealth(value:{gameId:string;status:string;checkedAt:string;[key:string]:unknown}){await env.DB!.prepare('INSERT INTO operations_health(key,payload) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET payload=excluded.payload').bind('character-roster-health:'+value.gameId,JSON.stringify(value)).run();}
/** The fixed GitHub collector owns external parsing; Worker requests never pretend to run it. */
export async function refreshCharacterRostersStep(gameId?:string){
 if(gameId&&!rosterGames.includes(gameId))throw Error('Unknown character roster');const checkedAt=new Date().toISOString();
 const rows=await env.DB!.prepare("SELECT payload FROM operations_health WHERE key LIKE 'character-roster-health:%'").all<{payload:string}>(),health=rows.results.map(r=>JSON.parse(r.payload));
 const expected=gameId?[gameId]:rosterGames,stale=expected.filter(g=>!health.some(h=>h.gameId===g&&h.lastSuccessAt&&Date.now()-Date.parse(h.lastSuccessAt)<12*3600000));
 return {done:true,source:'characters/collection',status:stale.length?'limited':'ok',checkedAt,cadenceHours:6,stale,health:health.filter(h=>expected.includes(h.gameId)),...(stale.length?{error:'One or more GitHub collection receipts are missing or older than twelve hours'}:{})};
}
