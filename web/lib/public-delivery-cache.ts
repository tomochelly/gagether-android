import type {DeliveryCache} from './public-delivery-context';
/** Namespaced Workers disable caches.default. Open the site's isolated named
 * cache inside each request, never share request-owned promises globally. */
export async function openPublicDeliveryCache(storage?:{open:(name:string)=>Promise<DeliveryCache>}):Promise<DeliveryCache|undefined>{
 if(!storage)return undefined;
 try{return await storage.open('gagether-public-reads-v1');}
 catch(error){console.error('Public named cache unavailable',String(error).slice(0,200));return undefined;}
}
