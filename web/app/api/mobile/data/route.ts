import {env} from 'cloudflare:workers';
import {readData} from '@/lib/store';
import {mobileFeed,webRevision} from '@/lib/mobile';
import {isLocale} from '@/lib/visitor-locale';
import {catalogContentRevision} from '@/lib/catalog-revision';
import {cachedMobileFeed} from '@/lib/mobile-feed-cache';
import {supportsExpandedCatalog,legacyMobileGameIds} from '@/lib/mobile-compatibility';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const url=new URL(request.url),language=url.searchParams.get('locale'),locale=isLocale(language)?language:'ko';
 const expanded=supportsExpandedCatalog(request.headers.get('User-Agent'));
 return cachedMobileFeed(request,{build:webRevision,locale,expanded,revision:()=>catalogContentRevision(env.DB!),read:async()=>{
  const data=await readData({index:true});
  if(!data.persistent)throw Error('Persistent mobile data unavailable');
  return mobileFeed(data.entries,data.settings,locale,expanded?undefined:legacyMobileGameIds);
 }});
}
