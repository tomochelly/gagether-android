import {preparePublicRead} from './public-delivery-context';
const projection="CASE WHEN json_valid(e.payload) THEN json_remove(e.payload,'$.entityDetails','$.detailImages','$.detailSections','$.contentBlocks','$.sourceBodies') ELSE e.payload END";
export async function readPublicEntryIndex(db:D1Database,gameId?:string){
 const where=gameId?' WHERE game_id=?':'',fallback=gameId?' AND e.game_id=?':'';
 const query=db.prepare('SELECT payload,source_updated_at AS updated_at,1 AS indexed FROM public_entry_index'+where+' UNION ALL SELECT '+projection+' AS payload,e.updated_at,0 AS indexed FROM entries e WHERE NOT EXISTS(SELECT 1 FROM public_entry_index p WHERE p.id=e.id)'+fallback+' ORDER BY updated_at DESC');
 const result=await(gameId?query.bind(gameId,gameId):query).all<{payload:string;updated_at:string;indexed:number}>();
 if(result.results.some(row=>!row.indexed))preparePublicRead('entry-index-backfill',()=>backfillPublicEntryIndex(db));
 return result;
}
/** Bounded, idempotent rollout outside schema migrations. The source and its
 * trigger-generated rows always win over a concurrent backfill. */
export async function backfillPublicEntryIndex(db:D1Database){
 for(let batch=0;batch<20;batch++){
  const result=await db.prepare('INSERT INTO public_entry_index(id,game_id,payload,source_updated_at) SELECT e.id,e.game_id,'+projection+',e.updated_at FROM entries e WHERE NOT EXISTS(SELECT 1 FROM public_entry_index p WHERE p.id=e.id) ORDER BY e.id LIMIT 500 ON CONFLICT(id) DO NOTHING').run();
  if((result.meta.changes||0)<500)break;
 }
}
