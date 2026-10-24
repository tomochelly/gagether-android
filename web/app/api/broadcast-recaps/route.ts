import {readBroadcastRecaps,publishBroadcastRecapsStep} from '@/lib/broadcast-recaps';
import {canWriteData} from '@/lib/write-access';
import {sameOrigin} from '@/lib/store';
export const dynamic='force-dynamic';
export async function GET(request:Request){if(!await canWriteData(request))return Response.json({error:'Owner or updater required'},{status:403});return Response.json({items:await readBroadcastRecaps(),videoAnalysis:'not-connected'},{headers:{'Cache-Control':'no-store'}});}
export async function POST(request:Request){if(!sameOrigin(request)||!await canWriteData(request))return Response.json({error:'Owner or updater required'},{status:403});return Response.json(await publishBroadcastRecapsStep(),{headers:{'Cache-Control':'no-store'}});}
