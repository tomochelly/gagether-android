import {env} from 'cloudflare:workers';
import {editorIdentity} from '@/lib/editor-access';
import {databaseInventory,databasePart,exportHeaders,r2Page,r2Archive} from '@/lib/migration-export';
export const dynamic='force-dynamic';
const missing=()=>new Response('Not Found',{status:404,headers:exportHeaders});
export async function GET(request:Request){
 const owner=await editorIdentity();
 if(!owner||request.method!=='GET'||request.headers.get('sec-fetch-site')==='cross-site')return missing();
 const url=new URL(request.url),kind=url.searchParams.get('kind');
 if(!['d1-inventory','d1-part','r2-list','r2-bundle'].includes(kind||''))return missing();
 // Deliberately no URLs, table names, SQL, object keys, data, or credentials in logs.
 console.info(JSON.stringify({event:'migration-export',actor:owner.userId,at:new Date().toISOString()}));
 try{
  if(!env.DB||!env.BUCKET)return new Response('Storage unavailable',{status:503,headers:exportHeaders});
  if(kind==='d1-inventory')return Response.json(await databaseInventory(env.DB,Number(url.searchParams.get('offset')||0)),{headers:exportHeaders});
  if(kind==='d1-part')return Response.json(await databasePart(env.DB,url.searchParams.get('table')||'',Number(url.searchParams.get('offset')||0)),{headers:exportHeaders});
  const cursor=url.searchParams.get('cursor')||undefined;if(cursor&&cursor.length>8192)return missing();
  const page=await r2Page(env.BUCKET,cursor);
  if(kind==='r2-list')return Response.json(page,{headers:exportHeaders});
  if(url.searchParams.get('expected')!==page.expected)return Response.json({error:'목록 이후 객체가 변경됐습니다. 새 목록을 만든 뒤 다시 받아 주세요.'},{status:409,headers:exportHeaders});
  return new Response(r2Archive(env.BUCKET,page),{headers:{...exportHeaders,'Content-Type':'application/x-tar','Content-Disposition':'attachment; filename="gagether-r2-'+page.expected.slice(0,16)+'.tar"'}});
 }catch{return Response.json({error:'내보내기를 완료하지 못했습니다. 다시 시도해 주세요. 계속 실패하면 운영자가 해당 데이터 유형을 확인해야 합니다.'},{status:503,headers:exportHeaders});}
}
// No mutation methods exist. Unknown methods reveal neither data nor authorization.
export const POST=missing,PUT=missing,PATCH=missing,DELETE=missing,HEAD=missing,OPTIONS=missing;
