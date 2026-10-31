import type {Locale,Region} from './types';
import {isLocale,supportedLocales} from './visitor-locale';
import {isCombatMode} from './wuwa-combat';
export {supportedLocales};
export const catalogPath=(locale:Locale,gameId?:string,service?:Region)=>`/${locale}${gameId?'/games/'+encodeURIComponent(gameId):''}${gameId&&service?'?region='+service:''}`;
export function catalogLocation(pathname:string){
 const parts=pathname.replace(/\/$/,'').split('/').slice(1);
 if(!isLocale(parts[0]))return null;
 if(parts.length===1)return {locale:parts[0],gameId:undefined};
 if((parts.length===2&&['browse','community','search','download'].includes(parts[1]))||(parts.length===3&&parts[1]==='community'&&/^[a-f0-9-]{36}$/.test(parts[2])))return {locale:parts[0],gameId:undefined};
 if(parts.length===5&&parts[1]==='games'&&parts[2]==='wuwa'&&parts[3]==='combat'&&isCombatMode(parts[4]))return {locale:parts[0],gameId:'wuwa'};
 if(parts.length>=3&&parts[1]==='games'&&((parts.length===3)||(parts.length===4&&['wuwa','nte','nikke'].includes(parts[2])&&parts[3]==='convene')||(parts.length===4&&(['leaks','characters','browse','foresight','combat'].includes(parts[3])))||(parts.length===5&&['items','characters','leaks'].includes(parts[3])&&!!parts[4]))&&/^[a-z0-9-]+$/.test(parts[2]))return {locale:parts[0],gameId:parts[2]};
 return null;
}

// Overwrite this internal hint from the URL, never from a client-supplied value.
export function catalogLocaleHeaders(request:Request){
 const headers=new Headers(request.headers);
 headers.delete('x-gagether-route-locale');
 const url=new URL(request.url),route=catalogLocation(url.pathname),queryLocale=url.searchParams.get('locale');
 const orbitLocale=/^\/orbit\/(ko|en|ja|zh)(?:\/|$)/.exec(url.pathname)?.[1];
 if(route)headers.set('x-gagether-route-locale',route.locale);
 else if(isLocale(orbitLocale))headers.set('x-gagether-route-locale',orbitLocale);
 else if(['/mobile','/account','/calendar-privacy','/usage-privacy'].includes(url.pathname)&&isLocale(queryLocale))headers.set('x-gagether-route-locale',queryLocale);
 return headers;
}
