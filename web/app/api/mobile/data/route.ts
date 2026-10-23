import {readData} from '@/lib/store';
import {mobileFeed} from '@/lib/mobile';
import {isLocale} from '@/lib/visitor-locale';
import {supportsExpandedCatalog,legacyMobileGameIds} from '@/lib/mobile-compatibility';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const url=new URL(request.url),language=url.searchParams.get('locale');
 const data=await readData();
 if(!data.persistent)return Response.json({error:'Data temporarily unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});
 const expanded=supportsExpandedCatalog(request.headers.get('User-Agent'));
 const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify([language,expanded,data.entries,data.settings])));
 const revision=Array.from(new Uint8Array(hash)).map(x=>x.toString(16).padStart(2,'0')).join('');
 const feed=mobileFeed(data.entries,data.settings,isLocale(language)?language:'ko',expanded?undefined:legacyMobileGameIds);
 const unchanged=url.searchParams.get('since')===revision;
 return Response.json({...unchanged?{schemaVersion:feed.schemaVersion,webRevision:feed.webRevision,unchanged:true}:feed,revision,serverTime:new Date().toISOString()},{headers:{'Cache-Control':'private, no-store','Vary':'Cookie'}});
}
