import {isCatalogGame} from '@/lib/catalog-scope';
import {matchesIfNoneMatch} from '@/lib/http-cache';
import {env} from 'cloudflare:workers';
import {publicCatalog,catalogObjectStorage} from '@/lib/public-catalog-cache';
import {catalogContentRevision} from '@/lib/catalog-revision';
import modelVersions from '../../../content/public-read-versions.json' with {type:'json'};
import {packCatalog} from '@/lib/catalog-transport';
import {initialData} from '@/lib/initial-data';
import {readData} from '@/lib/store';
import {canWriteData} from '@/lib/write-access';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const query=new URL(request.url).searchParams;
 const automatic=query.get('view')==='automatic',index=query.get('view')==='index';
 if(automatic&&!await canWriteData(request))return Response.json({error:'Authorized updater or editor access required'},{status:403,headers:{'Cache-Control':'no-store'}});
 const gameId=query.get('game')||undefined;
 if(query.has('game')&&(!index||automatic||!gameId||!isCatalogGame(gameId)))return Response.json({error:'Invalid public game scope'},{status:400,headers:{'Cache-Control':'no-store'}});
 const compact=index&&request.headers.get('Accept')?.includes('application/vnd.gagether.catalog+json');
 if(compact)return publicCatalog(request,{
  build:modelVersions.catalog,archive:query.get('archive')==='1',gameId,
  revision:()=>catalogContentRevision(env.DB!,gameId),storage:env.BUCKET?catalogObjectStorage(env.BUCKET):undefined,
  read:async()=>{const data=await readData({index:true,gameId,allSourceChecks:true});return {...(query.get('archive')==='1'?data:initialData(data)),...gameId?{gameScope:gameId}:{}};}
 });
 const full={...await readData({automatic,index,gameId,allSourceChecks:index}),...gameId?{gameScope:gameId}:{}};
 const data=!automatic&&(query.get('view')==='current'||index&&query.get('archive')!=='1')?initialData(full):full;
 if(automatic)return Response.json(data,{headers:{'Cache-Control':'no-store'}});
 // Ignore the request clock; send the full archive only when stored content changes.
 const {serverTime,...content}=data;
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(content)));
 const etag='"'+(compact?'compact-':'')+Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('')+'"';
 const headers={'Cache-Control':'private, no-cache',ETag:etag,Vary:'Accept'};
 if(matchesIfNoneMatch(request.headers.get('If-None-Match'),etag))return new Response(null,{status:304,headers});
 return Response.json({...content,serverTime},{headers});
}
