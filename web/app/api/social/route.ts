import {readOfficialChannels} from '@/lib/official-social-store';
import {byId} from '@/lib/games';
export const dynamic='force-dynamic';
export async function GET(request:Request){const gameId=new URL(request.url).searchParams.get('gameId');if(gameId&&!byId[gameId])return Response.json({error:'Unknown game'},{status:400});try{return Response.json({channels:await readOfficialChannels(gameId||undefined)},{headers:{'Cache-Control':'public,max-age=60'}});}catch{return Response.json({error:'Channel list unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});}}
