import {cookies,headers} from 'next/headers';
import {isLocale,localeForVisitor} from './visitor-locale';

export async function requestLocale(){
 const [h,c]=await Promise.all([headers(),cookies()]);
 const routeLocale=h.get('x-gagether-route-locale');
 if(isLocale(routeLocale))return {locale:routeLocale,manual:true};
 const preference=c.get('patchwork.locale')?.value;
 return {locale:localeForVisitor(h.get('x-patchwork-country')||h.get('cf-ipcountry'),h.get('accept-language'),preference),manual:isLocale(preference)};
}
