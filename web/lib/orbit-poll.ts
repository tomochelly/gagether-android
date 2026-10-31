export const orbitPollCampaign='orbit-beta-20261031';
export const orbitPollClosesAt=Date.parse('2026-11-14T14:59:59Z');
export const orbitPollCookie='__Host-gagether-orbit-poll';
export type OrbitVote='classic'|'orbit';
export function orbitVote(value:unknown):OrbitVote|null{return value==='classic'||value==='orbit'?value:null;}
export function orbitPollToken(request:Request){const token=request.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(orbitPollCookie+'='))?.slice(orbitPollCookie.length+1);return token&&/^[a-f0-9]{64}$/.test(token)?token:null;}
export function orbitPollAllowed(request:Request){return request.headers.get('origin')===new URL(request.url).origin&&request.headers.get('sec-fetch-site')!=='cross-site'&&request.headers.get('x-gagether-orbit-poll')==='1'&&request.headers.get('content-type')?.split(';')[0]==='application/json';}
export function orbitPollResult(classic:number,orbit:number){if(!Number.isSafeInteger(classic)||!Number.isSafeInteger(orbit)||classic<0||orbit<0)throw Error('Invalid vote totals');const total=classic+orbit;return {classic,orbit,total,percent:total?{classic:Math.round(classic/total*1000)/10,orbit:Math.round(orbit/total*1000)/10}:null};}
