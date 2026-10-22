import {editorIdentity} from '@/lib/editor-access';
import {usageAllowed,usageInput} from '@/lib/usage';
import {recordUsage} from '@/lib/usage-store';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
export async function POST(request:Request){
 if(!usageAllowed(request))return new Response(null,{status:403,headers});
 if(Number(request.headers.get('content-length')||0)>2048)return new Response(null,{status:413,headers});
 try{
  const reader=request.body?.getReader();if(!reader)return new Response(null,{status:400,headers});
  let text='',length=0;const decoder=new TextDecoder();
  while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>2048){await reader.cancel();return new Response(null,{status:413,headers});}text+=decoder.decode(value,{stream:true});}text+=decoder.decode();
  const input=usageInput(JSON.parse(text));if(!input)return new Response(null,{status:400,headers});
  if(await editorIdentity())return new Response(null,{status:204,headers});
  await recordUsage(input);return new Response(null,{status:204,headers});
 }catch{return new Response(null,{status:503,headers});}
}
