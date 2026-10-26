import {englishEntry} from '@/lib/english-content';
import {withWuwaCharacterVideos} from '@/lib/wuwa-character-videos';
import {readEntry} from '@/lib/store';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const id=new URL(request.url).searchParams.get('id');
 if(!id||id.length>200)return Response.json({error:'Invalid entry'},{status:400});
 const entry=await readEntry(id);
 if(!entry)return Response.json({error:'Entry not found'},{status:404,headers:{'Cache-Control':'no-store'}});
 return Response.json({entry:withWuwaCharacterVideos(englishEntry(entry))},{headers:{'Cache-Control':'private, no-cache'}});
}
