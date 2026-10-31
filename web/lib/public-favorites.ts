import {games} from './games';
export const favoriteCookie='__Host-gagether-favorites';
export const favoriteIds=new Set(games.map(g=>g.id));
export function favoriteInput(raw:unknown):{favorites:string[];revision:number}|null{
 if(!raw||typeof raw!=='object')return null;const x=raw as Record<string,unknown>;
 if(!Number.isSafeInteger(x.revision)||Number(x.revision)<0||!Array.isArray(x.favorites)||x.favorites.length>games.length||x.favorites.some(v=>typeof v!=='string'||!favoriteIds.has(v)))return null;
 return {favorites:[...new Set(x.favorites as string[])].sort(),revision:Number(x.revision)};
}
export function favoriteToken(request:Request){const token=request.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(favoriteCookie+'='))?.slice(favoriteCookie.length+1);return token&&/^[a-f0-9]{64}$/.test(token)?token:null;}
export function favoriteWriteAllowed(request:Request){return request.headers.get('origin')===new URL(request.url).origin&&request.headers.get('sec-fetch-site')!=='cross-site'&&request.headers.get('content-type')?.split(';')[0]==='application/json';}
export async function tokenHash(token:string){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));return [...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('');}
