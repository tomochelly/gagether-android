import {games} from './games';
import {dirtyPublicGroup,preparePublicRead,deliveryContext} from './public-delivery-context';
export function rosterReadChanged(gameId:string){
 if(!games.some(g=>g.id===gameId))return;
 dirtyPublicGroup('roster:'+gameId);
 preparePublicRead('roster:'+gameId,async()=>{
  const {primePublicRead}=await import('./public-delivery'),origin=deliveryContext()?.origin||'https://gagether.wiki';
  if(gameId==='wuwa'){
   const {GET}=await import('../app/api/wuwa/library/route');
   for(const view of ['directory','combat']){const request=new Request(origin+'/api/wuwa/library?view='+view),response=await GET(request);if(response.status!==200)throw Error('WuWa public projection unavailable');await primePublicRead(request,response);}
  }else{
   const {readPublicCharacterRoster}=await import('./roster-public-read'),request=new Request(origin+'/api/characters?game='+encodeURIComponent(gameId)),response=await readPublicCharacterRoster(request);
   if(response.status!==200)throw Error('Public roster projection unavailable: '+gameId);await primePublicRead(request,response);
  }
 });
}
export function catalogReadChanged(gameIds:string[]=[]){
 const ids=gameIds.filter(id=>games.some(g=>g.id===id));dirtyPublicGroup('catalog:all');
 for(const id of (ids.length?ids:games.map(g=>g.id)))dirtyPublicGroup('catalog:'+id);
 preparePublicRead('catalog:all',()=>prepareCatalog());
 for(const id of ids)preparePublicRead('catalog:'+id,()=>prepareCatalog(id));
}
async function prepareCatalog(gameId?:string){
 const [{GET},{primePublicRead},{publicCatalogUrl}]=await Promise.all([import('../app/api/data/route'),import('./public-delivery'),import('./catalog-scope')]);
 const request=new Request((deliveryContext()?.origin||'https://gagether.wiki')+publicCatalogUrl(gameId),{headers:{Accept:'application/vnd.gagether.catalog+json'}}),response=await GET(request);
 if(response.status!==200)throw Error('Public catalog projection unavailable');await primePublicRead(request,response);
}
export function favoriteReadChanged(){
 dirtyPublicGroup('counts');preparePublicRead('counts',async()=>{
  const [{favoriteCountSnapshot},{primePublicRead}]=await Promise.all([import('./public-favorites-store'),import('./public-delivery')]);
  const response=Response.json({...await favoriteCountSnapshot(),unit:'browser',asOf:new Date().toISOString()},{headers:{'Cache-Control':'public,max-age=5'}});
  await primePublicRead(new Request((deliveryContext()?.origin||'https://gagether.wiki')+'/api/favorites'),response);
 });
}
