import {editorIdentity} from '@/lib/editor-access';
import {readUsage,pruneUsage} from '@/lib/usage-store';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store','Vary':'Cookie','X-Robots-Tag':'noindex, nofollow'};
export async function GET(request:Request){
 if(!await editorIdentity())return Response.json({error:'Owner access required'},{status:403,headers});
 const days=new URL(request.url).searchParams.get('days')==='30'?30:7;
 try{await pruneUsage();return Response.json(await readUsage(days),{headers});}catch{return Response.json({error:'통계를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'},{status:503,headers});}
}
