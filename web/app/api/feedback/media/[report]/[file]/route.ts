import {canWriteData} from '@/lib/write-access';
import {feedbackBucket,attachmentKey} from '@/lib/feedback-store';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{report:string;file:string}>}){
 if(!await canWriteData(request))return new Response('Owner required',{status:403,headers:{'Cache-Control':'private, no-store'}});
 const {report,file}=await params;if(!/^[a-f0-9-]{36}$/.test(report)||!/^[a-f0-9-]{36}$/.test(file))return new Response('Not found',{status:404});
 const object=await feedbackBucket().get(attachmentKey(report,file));if(!object)return new Response('Not found',{status:404});
 const headers=new Headers({'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Cross-Origin-Resource-Policy':'same-origin','X-Robots-Tag':'noindex, nofollow'});object.writeHttpMetadata(headers);return new Response(object.body,{headers});
}
