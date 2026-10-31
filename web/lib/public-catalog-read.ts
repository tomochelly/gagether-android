import {publicCatalogUrl} from './catalog-scope';
import {unpackCatalog,type PackedCatalog} from './catalog-transport';
import {deliveryContext} from './public-delivery-context';
import {deliverPublicRead} from './public-delivery';
/** SSR and browser reads share the prepared public model. This is an internal
 * call, not another HTTP hop; an edge HIT requires no D1 or R2 access. */
export async function readPublicCatalogSnapshot(gameId?:string){
 const {GET}=await import('../app/api/data/route');
 const request=new Request((deliveryContext()?.origin||'https://gagether.wiki')+publicCatalogUrl(gameId),{headers:{Accept:'application/vnd.gagether.catalog+json'}}),response=await deliverPublicRead(request,GET);
 if(response.status!==200)throw Error('Saved public catalog unavailable');
 const data=unpackCatalog(await response.json() as PackedCatalog);
 if(!data.persistent||data.gameScope!==gameId)throw Error('Incomplete public catalog scope');
 return {...data,serverTime:new Date().toISOString()};
}
