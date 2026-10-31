import {games} from './games';
export function isCatalogGame(value:string){return games.some(g=>g.id===value);}
export function publicCatalogUrl(gameId?:string,archive=false){
 if(gameId&&!isCatalogGame(gameId))throw Error('Unknown catalog game');
 return '/api/data?view=index'+(archive?'&archive=1':'')+(gameId?'&game='+encodeURIComponent(gameId):'');
}
/** Only the finite public index variants enter browser storage; owner payloads never do. */
export function publicCatalogScope(value:string){
 try{const u=new URL(value,'https://gagether.wiki');if(u.origin!=='https://gagether.wiki'||u.pathname!=='/api/data'||u.hash)return null;
  const p=u.searchParams,game=p.get('game')||undefined,archive=p.get('archive')==='1';
  if(p.get('view')!=='index'||[...p.keys()].some(k=>!['view','archive','game'].includes(k))||[...p.keys()].some(k=>p.getAll(k).length!==1)||p.has('archive')&&!archive||p.has('game')&&(!game||!isCatalogGame(game)))return null;
  if(value!==publicCatalogUrl(game,archive))return null;return {gameId:game,archive};
 }catch{return null;}
}
