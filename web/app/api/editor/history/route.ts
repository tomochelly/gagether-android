import {env} from 'cloudflare:workers';
import {editorIdentity} from '@/lib/editor-access';
import {editorHistory} from '@/lib/editor-history';
import {readEditorial,readBaseData,writeEditorial,resetEditorial,sameOrigin} from '@/lib/store';
import {applyEntryPatch} from '@/lib/editorial';
import {validateEditedEntry,settingsSchema} from '@/lib/editor-schema';
const headers={'Cache-Control':'no-store'};
export async function GET(request:Request){if(!await editorIdentity())return Response.json({error:'Editor access required'},{status:403});const id=new URL(request.url).searchParams.get('id');return Response.json({history:await editorHistory(id?'entry:'+id:undefined)},{headers});}
export async function POST(request:Request){
 const user=await editorIdentity();if(!user)return Response.json({error:'Editor access required'},{status:403});if(!sameOrigin(request)||request.headers.get('sec-fetch-site')==='cross-site')return Response.json({error:'Origin mismatch'},{status:403});
 try{const {seq,revision,side}=await request.json() as {seq:number;revision:number;side:string};if(!Number.isInteger(seq)||!Number.isInteger(revision)||revision<0||!['before','after'].includes(side))return Response.json({error:'seq, revision and side are required'},{status:400});
 const rows=await editorHistory();const row=rows.find(r=>r.seq===seq);if(!row)return Response.json({error:'History not found'},{status:404});const key=String(row.key),records=await readEditorial(key),current=records[0];if((current?.revision||0)!==revision)return Response.json({error:'Revision conflict'},{status:409});
 const raw=side==='before'?row.old_payload:row.new_payload;
 if(raw===null){if(!current)return Response.json({ok:true,unchanged:true},{headers});if(!await resetEditorial(key,revision))return Response.json({error:'Revision conflict'},{status:409});}
 else{const payload=JSON.parse(String(raw));if(key==='site'){if(!settingsSchema.safeParse(payload).success)return Response.json({error:'Invalid historical settings'},{status:400});}else{const id=key.slice(6),base=(await readBaseData({id})).entries.find(e=>e.id===id),valid=validateEditedEntry(applyEntryPatch(base,payload,id));if(!valid.ok)return Response.json({error:valid.error},{status:400});}if(!await writeEditorial(key,payload,revision,user.userId+':restore:'+seq))return Response.json({error:'Revision conflict'},{status:409});}
 return Response.json({ok:true,history:await editorHistory(key)},{headers});
 }catch{return Response.json({error:'Restore failed; input preserved'},{status:503});}
}
