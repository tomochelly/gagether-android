import {readBroadcastRecaps,publishBroadcastRecapsStep} from '@/lib/broadcast-recaps';
import {boundedBroadcastBody,submitBroadcastReview,BroadcastReviewError,broadcastAnalysisStatus} from '@/lib/broadcast-analysis';
import {canWriteData} from '@/lib/write-access';
import {sameOrigin} from '@/lib/store';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
export async function GET(request:Request){if(!await canWriteData(request))return Response.json({error:'Owner or updater required'},{status:403,headers});return Response.json({items:await readBroadcastRecaps(),videoAnalysis:broadcastAnalysisStatus,automaticVideoInference:false},{headers});}
export async function POST(request:Request){
 if(!sameOrigin(request)||request.headers.get('sec-fetch-site')==='cross-site'||!await canWriteData(request))return Response.json({error:'Owner or updater required'},{status:403,headers});
 try{const input=await boundedBroadcastBody(request);if(input?.action==='review')return Response.json(await submitBroadcastReview(input),{headers});if(input!==null&&(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>k!=='action')||input.action!==undefined&&input.action!=='publish-descriptions'))return Response.json({error:'Choose a supported recap action'},{status:400,headers});return Response.json(await publishBroadcastRecapsStep(),{headers});}
 catch(error){return Response.json({error:error instanceof BroadcastReviewError?error.message:'Invalid or unavailable broadcast review'},{status:error instanceof BroadcastReviewError?error.status:error instanceof SyntaxError||error instanceof Error&&error.name==='ZodError'?400:503,headers});}
}
