import type {Locale,Region} from './types';
import {isLocale,supportedLocales} from './visitor-locale';
export {supportedLocales};
export const catalogPath=(locale:Locale,gameId?:string,service?:Region)=>`/${locale}${gameId?'/games/'+encodeURIComponent(gameId):''}${gameId&&service?'?region='+service:''}`;
export function catalogLocation(pathname:string){
 const parts=pathname.replace(/\/$/,'').split('/').slice(1);
 if(!isLocale(parts[0]))return null;
 if(parts.length===1)return {locale:parts[0],gameId:undefined};
 if(parts.length===3&&parts[1]==='games'&&/^[a-z0-9-]+$/.test(parts[2]))return {locale:parts[0],gameId:parts[2]};
 return null;
}

// Overwrite this internal hint from the URL, never from a client-supplied value.
export function catalogLocaleHeaders(request:Request){
 const headers=new Headers(request.headers);
 headers.delete('x-gagether-route-locale');
 const route=catalogLocation(new URL(request.url).pathname);
 if(route)headers.set('x-gagether-route-locale',route.locale);
 return headers;
}
