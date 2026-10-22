import {refreshFeeds,feedGameIds} from '@/lib/feeds';
import {readData,sameOrigin} from '@/lib/store';
import {canWriteData} from '@/lib/write-access';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 if(!await canWriteData(request))return Response.json({error:'Authorized updater or editor access required'},{status:403,headers:{'Cache-Control':'no-store'}});
 if(!sameOrigin(request))return Response.json({error:'Origin mismatch'},{status:403});
 try{
  const before=await readData({automatic:true});
  const recent=feedGameIds.every(id=>before.sourceChecks.some(c=>c.gameId===id&&Date.now()-Date.parse(c.checkedAt)>=0&&Date.now()-Date.parse(c.checkedAt)<120000));
  const checks=recent?before.sourceChecks.filter(c=>feedGameIds.includes(c.gameId)):await refreshFeeds();
  const after=await readData({automatic:true});const old=new Map(before.entries.map(e=>[e.id,e]));
  const feed=after.entries.filter(e=>e.id.startsWith('feed-'));
  const comparable=(e:typeof feed[number])=>JSON.stringify([e.title,e.sourceUrl,e.publishedAt,e.image]);
  const added=feed.filter(e=>!old.has(e.id)).length;
  const changed=feed.filter(e=>old.has(e.id)&&comparable(e)!==comparable(old.get(e.id)!)).length;
  return Response.json({ok:checks.every(c=>c.status==='ok'),checks,added,changed,cached:recent,...await readData()},{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'Could not update sources'},{status:503});}
}
