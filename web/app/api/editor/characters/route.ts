import {z} from 'zod';
import {editorIdentity} from '@/lib/editor-access';
import {sameOrigin,writeEditorial,resetEditorial} from '@/lib/store';
import {editorHistory} from '@/lib/editor-history';
import {games} from '@/lib/games';
import {readRosterArtFrames,rosterArtSource} from '@/lib/roster-art-framing-store';
import {rosterArtFramesSchema,rosterArtKey,rosterArtUrl} from '@/lib/roster-art-framing';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'},game=z.string().refine(id=>games.some(g=>g.id===id)),id=z.string().min(1).max(200);
export async function GET(request:Request){
 if(!await editorIdentity())return Response.json({error:'Editor access required'},{status:403,headers});
 const q=new URL(request.url).searchParams,g=q.get('game'),character=q.get('id');if(!game.safeParse(g).success||character!==null&&!id.safeParse(character).success)return Response.json({error:'Invalid character target'},{status:400,headers});
 try{const source=await rosterArtSource(g!,character||undefined);if(!source)return Response.json({error:'Character not found'},{status:404,headers});if(!character)return Response.json(source,{headers});
 const saved=(await readRosterArtFrames(g!,character))[0],history=await editorHistory(rosterArtKey(g!,character));
 return Response.json({kind:source.kind,character:source.character,frames:saved?.value||{images:[]},revision:saved?.revision||0,history:history.slice(0,30).map(r=>({seq:r.seq,created_at:r.at,action:r.action}))},{headers});
 }catch{return Response.json({error:'Saved framing unavailable. Your edits have not been changed.'},{status:503,headers});}
}
export async function POST(request:Request){
 const user=await editorIdentity();if(!user)return Response.json({error:'Editor access required'},{status:403,headers});
 if(!sameOrigin(request)||request.headers.get('sec-fetch-site')==='cross-site')return Response.json({error:'Origin mismatch'},{status:403,headers});
 try{const text=await request.text();if(new TextEncoder().encode(text).length>50000)return Response.json({error:'Framing request too large'},{status:413,headers});
 const parsed=z.object({gameId:game,characterId:id,revision:z.number().int().nonnegative(),changes:rosterArtFramesSchema}).strict().safeParse(JSON.parse(text));if(!parsed.success)return Response.json({error:'Invalid image framing'},{status:400,headers});
 const b=parsed.data,source=await rosterArtSource(b.gameId,b.characterId);if(!source||!source.urls)return Response.json({error:'Character not found'},{status:404,headers});
 const prior=(await readRosterArtFrames(b.gameId,b.characterId))[0];if((prior?.revision||0)!==b.revision)return Response.json({error:'This character changed. Reload before saving; your draft is preserved.'},{status:409,headers});
 // An old exact-image placement may remain, but cannot be edited onto another file.
 for(const row of b.changes.images){const url=rosterArtUrl(row.url),old=prior?.value.images.find(a=>rosterArtUrl(a.url)===url);if(!source.urls.has(url)&&JSON.stringify(old)!==JSON.stringify(row))return Response.json({error:'Choose an original belonging to this exact character'},{status:400,headers});}
 const key=rosterArtKey(b.gameId,b.characterId),saved=b.changes.images.length?await writeEditorial(key,b.changes,b.revision,user.userId):!prior||await resetEditorial(key,b.revision,user.userId);
 if(!saved)return Response.json({error:'This character changed. Reload before saving; your draft is preserved.'},{status:409,headers});
 const check=(await readRosterArtFrames(b.gameId,b.characterId))[0];if(JSON.stringify(check?.value||{images:[]})!==JSON.stringify(b.changes))throw Error('Framing readback mismatch');
 return Response.json({ok:true,frames:check?.value||{images:[]},revision:check?.revision||0,history:(await editorHistory(key)).slice(0,30).map(r=>({seq:r.seq,created_at:r.at,action:r.action}))},{headers});
 }catch(e){return Response.json({error:e instanceof SyntaxError?'Invalid JSON':'Save was not confirmed. Your draft is preserved; reload the saved value before retrying.'},{status:e instanceof SyntaxError?400:503,headers});}
}
