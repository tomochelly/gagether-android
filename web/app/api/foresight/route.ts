import {readForesight} from '@/lib/foresight-data';
import {hasForesight} from '@/lib/foresight';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const game=new URL(request.url).searchParams.get('game');
 if(!game||!hasForesight(game))return Response.json({error:'Unknown foresight game'},{status:404});
 const data=readForesight(game);if(!data)return Response.json({error:'Foresight data unavailable'},{status:503});
 return Response.json({data,contentType:'regional-release-foresight',excludedFrom:['calendar','notifications','official-notices']},{headers:{'Cache-Control':'public, max-age=300, stale-while-revalidate=3600'}});
}
