/** Content invalidation follows the actual selected game. Read-status clocks
 * are refreshed at a bounded minute interval, not by every other game's poll. */
export async function catalogContentRevision(db:D1Database,gameId?:string,now=Date.now()){
 try{const q=db.prepare('SELECT game_id,revision FROM public_catalog_versions'+(gameId?' WHERE game_id IN (?,?)':'')+' ORDER BY game_id'),r=await(gameId?q.bind(gameId,'*'):q).all<{game_id:string;revision:number}>();if(!Array.isArray(r.results))throw Error('Revision rows unavailable');const bytes=new TextEncoder().encode(JSON.stringify([Math.floor(now/60000),r.results]));return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');}catch{/* Older deployments use the same semantic metadata fallback. */}
 const entries=gameId?' WHERE game_id=?':'',edits=gameId?" WHERE key='site' OR (key LIKE 'entry:%' AND (json_extract(payload,'$.gameId')=? OR substr(key,7) IN (SELECT id FROM entries WHERE game_id=?)))":" WHERE key='site' OR key LIKE 'entry:%'",checks=gameId?' WHERE game_id=?':'';
 const sql="SELECT 'entry:'||id AS key,updated_at AS revision FROM entries"+entries+" UNION ALL SELECT 'edit:'||key,CAST(revision AS TEXT)||':'||updated_at FROM editorial"+edits+" UNION ALL SELECT 'feed:'||game_id,status||':'||count||':'||COALESCE(error,'') FROM source_checks"+checks+' ORDER BY key';
 const query=db.prepare(sql),rows=await(gameId?query.bind(gameId,gameId,gameId,gameId):query).all<{key:string;revision:string}>();
 if(!Array.isArray(rows.results))throw Error('Content revision unavailable');
 const bytes=new TextEncoder().encode(JSON.stringify([Math.floor(now/60000),rows.results]));
 return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
}
