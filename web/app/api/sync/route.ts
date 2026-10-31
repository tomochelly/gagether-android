import {z} from 'zod';
import {saveEntries,saveEntryChanges,sameOrigin} from '@/lib/store';
import {safeSource,safeReference} from '@/lib/types';
import {games} from '@/lib/games';
import {officialChannelSchema,safeChannel} from '@/lib/official-social';
import {saveOfficialChannels} from '@/lib/official-social-store';
import {canWriteData} from '@/lib/write-access';
import {saveRewardAssets} from '@/lib/reward-asset-store';
export const dynamic='force-dynamic';
import {entrySchema as entry,safeImage,safeArtwork,safeExtras,safePickupArchive} from '@/lib/content-schema';
export async function POST(request:Request){
 if(!await canWriteData(request))return Response.json({error:'Authorized updater or editor access required'},{status:403,headers:{'Cache-Control':'no-store'}});
 if(!sameOrigin(request))return Response.json({error:'Origin mismatch'},{status:403});
 if(Number(request.headers.get('content-length')||0)>1000000)return Response.json({error:'Payload too large'},{status:413});
 try{
  const body=await request.text();if(body.length>1000000)return Response.json({error:'Payload too large'},{status:413});
  const result=z.object({entries:z.array(entry).max(100).default([]),entryChanges:z.array(z.object({before:entry.optional(),after:entry}).strict()).max(100).optional(),officialChannels:z.array(officialChannelSchema).max(100).optional(),rewardAssets:z.array(z.object({id:z.string().max(100),data:z.string().max(300000)})).max(10).optional()}).safeParse(JSON.parse(body));if(!result.success)return Response.json({error:'Invalid data',details:result.error.issues},{status:400});
  const changes=result.data.entryChanges||[],all=[...result.data.entries,...changes.map(c=>c.after)];if(all.length>100||new Set(all.map(e=>e.id)).size!==all.length||changes.some(c=>c.before&&(c.before.id!==c.after.id||c.before.gameId!==c.after.gameId||c.before.region!==c.after.region)))return Response.json({error:'Invalid change identities'},{status:400});
  if(result.data.officialChannels?.some(c=>!safeChannel(c)))return Response.json({error:'Invalid official channel metadata'},{status:400});
  for(const e of all){
   if(!safePickupArchive(e))return Response.json({error:'Invalid pickup archive or unconfirmed clock',id:e.id},{status:400});
   if((e.marketRegion==='cn'&&!['arknights','gfl2','reverse1999'].includes(e.gameId))||!games.some(g=>g.id===e.gameId&&g.regions.includes(e.region))||!safeReference(e.sourceUrl,e.gameId,e.sourceKind||'official')||Object.values(e.localizationSources||{}).some(url=>!safeSource(url,e.gameId))||e.relatedSources?.some(s=>!safeReference(s.url,e.gameId,s.kind))||e.detailSections?.some(section=>section.sourceUrls?.some(url=>!safeReference(url,e.gameId,'official')&&!safeReference(url,e.gameId,'community')&&!safeReference(url,e.gameId,'video')))||Date.parse(e.verifiedAt)>Date.now()+300000||(e.startAt&&e.endAt&&Date.parse(e.startAt)>=Date.parse(e.endAt))||!safeArtwork(e)||e.pickupMembers?.some(m=>!safeArtwork(m)))return Response.json({error:'Invalid provenance, window or asset',id:e.id},{status:400});
   if(!safeExtras(e)||e.rewards?.some(r=>!safeReference(r.sourceUrl,e.gameId,r.sourceKind))||e.broadcast&&[e.broadcast.sourceUrl,e.broadcast.announcementUrl].some(url=>!safeReference(url,e.gameId,'official')&&!safeReference(url,e.gameId,'video')))return Response.json({error:"Invalid broadcast, video, reward or icon provenance",id:e.id},{status:400});
   if(e.entityDetails?.some(profile=>Date.parse(profile.verifiedAt)>Date.now()+300000||profile.sources.some(source=>!safeReference(source.url,e.gameId,source.kind))||profile.groups.some(group=>group.sourceUrls?.some(url=>!safeReference(url,e.gameId,group.sourceKind)))))return Response.json({error:'Invalid stats provenance',id:e.id},{status:400});
   if(e.imageVerified&&(!e.image||!e.imageSource)||e.pickupMembers?.some(m=>m.imageVerified&&(!m.image||!m.imageSource)))return Response.json({error:'Verified artwork requires its asset and source',id:e.id},{status:400});
  }
  if(result.data.rewardAssets?.length&&!await saveRewardAssets(result.data.rewardAssets))return Response.json({error:'Reward icon must match an exact reviewed original'},{status:400});
  await saveEntries(result.data.entries);await saveEntryChanges(changes);if(result.data.officialChannels?.length)await saveOfficialChannels(result.data.officialChannels);return Response.json({ok:true,saved:all.length,channelsSaved:result.data.officialChannels?.length||0,rewardAssetsSaved:result.data.rewardAssets?.length||0,ids:all.map(e=>e.id)});
 }catch(error){return Response.json({error:error instanceof SyntaxError?'Invalid JSON':'Write failed'},{status:error instanceof SyntaxError?400:503});}
}
