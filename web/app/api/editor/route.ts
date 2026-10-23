import {editorIdentity} from '@/lib/editor-access';
import {readData,readEntry,readEditorial,readBaseData,writeEditorial,resetEditorial,sameOrigin} from '@/lib/store';
import {editRequest,entryChanges,settingsSchema,validateEditedEntry} from '@/lib/editor-schema';
import {applyEntryPatch} from '@/lib/editorial';
export const dynamic='force-dynamic';
export async function GET(request?:Request){
 if(!await editorIdentity())return Response.json({error:'Editor access required'},{status:403});
 const id=request?new URL(request.url).searchParams.get('id'):null;
 try{if(id){if(!/^[a-zA-Z0-9_-]{1,160}$/.test(id))return Response.json({error:'Invalid item ID'},{status:400});const entry=await readEntry(id,{includeHidden:true,requirePersistent:true});return entry?Response.json({entry},{headers:{'Cache-Control':'no-store'}}):Response.json({error:'Item not found'},{status:404});}
 return Response.json(await readData({includeHidden:true}),{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'Could not load current saved item'},{status:503});}
}
export async function POST(request:Request){
 const user=await editorIdentity();if(!user)return Response.json({error:'Editor access required'},{status:403});
 if(!sameOrigin(request)||request.headers.get('sec-fetch-site')==='cross-site')return Response.json({error:'Origin mismatch'},{status:403});
 try{
  const body=await request.text();if(body.length>500000)return Response.json({error:'Payload too large'},{status:413});
  const parsed=editRequest.safeParse(JSON.parse(body));if(!parsed.success)return Response.json({error:'Invalid edit',details:parsed.error.issues},{status:400});
  const data=parsed.data;const key=data.target==='site'?'site':'entry:'+data.id;
  const records=await readEditorial(key);const existing=records.find(r=>r.key===key);
  if((existing?.revision||0)!==data.revision)return Response.json({error:'This item changed. Reload before saving.'},{status:409});
  let payload:Record<string,unknown>;
  if(data.target==='site'){
   const settings=settingsSchema.safeParse(data.changes);if(!settings.success)return Response.json({error:'Invalid settings',details:settings.error.issues},{status:400});payload=settings.data;
  }else{
   if(!data.id)return Response.json({error:'Item ID required'},{status:400});
   const patch=entryChanges.safeParse(data.changes);if(!patch.success)return Response.json({error:'Invalid fields',details:patch.error.issues},{status:400});
   const snapshot=await readBaseData({id:data.id});if(!snapshot.persistent)return Response.json({error:'Current saved item unavailable. Your input has not been changed.'},{status:503});const base=snapshot.entries.find(e=>e.id===data.id);
   if(!base&&!existing&&!data.create)return Response.json({error:'Item not found'},{status:404});
   payload={...existing?.payload,...patch.data};
   const removed=new Set(Array.isArray(existing?.payload.$unset)?existing.payload.$unset as string[]:[]);
   for(const field of Object.keys(patch.data))removed.delete(field);
   for(const field of data.removeFields||[]){removed.add(field);delete payload[field];}
   if(removed.size)payload.$unset=[...removed];else delete payload.$unset;
   if(!base&&!existing){payload.id=data.id;payload.verifiedAt=new Date().toISOString();}
   const candidate=applyEntryPatch(base,payload,data.id);const valid=validateEditedEntry(candidate);
   if(!valid.ok)return Response.json({error:valid.error},{status:400});
  }
  if(!await writeEditorial(key,payload,data.revision,user.userId))return Response.json({error:'This item changed. Reload before saving.'},{status:409});
  const scoped=new URL(request.url).searchParams.get('view')==='entry'&&data.target==='entry';
  return Response.json(scoped?{ok:true,entry:await readEntry(data.id!,{includeHidden:true,requirePersistent:true})}:{ok:true,...await readData({includeHidden:true})},{headers:{'Cache-Control':'no-store'}});
 }catch(error){return Response.json({error:error instanceof SyntaxError?'Invalid JSON input':'Could not save changes. Compare the current item before retrying.'},{status:error instanceof SyntaxError?400:503});}
}
export async function DELETE(request:Request){
 const user=await editorIdentity();if(!user)return Response.json({error:'Editor access required'},{status:403});if(!sameOrigin(request)||request.headers.get('sec-fetch-site')==='cross-site')return Response.json({error:'Origin mismatch'},{status:403});
 try{const data=await request.json() as {target:string;id?:string;revision:number};if(!['entry','site'].includes(data.target)||!Number.isInteger(data.revision)||data.revision<1)return Response.json({error:'Invalid reset'},{status:400});
  const key=data.target==='site'?'site':'entry:'+data.id;if(!await resetEditorial(key,data.revision,user.userId))return Response.json({error:'This item changed. Reload before resetting.'},{status:409});return Response.json({ok:true,...await readData({includeHidden:true})});
 }catch{return Response.json({error:'Could not reset changes'},{status:503});}
}
