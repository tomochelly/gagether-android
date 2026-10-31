import {favoriteCookie,favoriteToken,favoriteInput,favoriteWriteAllowed} from '@/lib/public-favorites';
import {favoriteCountSnapshot,favoriteSession,saveFavoriteSelection} from '@/lib/public-favorites-store';
export const dynamic='force-dynamic';
const noStore={'Cache-Control':'no-store'};
export async function GET(request:Request){try{
 if(new URL(request.url).searchParams.get('session')==='1'){
  if(request.headers.get('x-gagether-favorites')!=='1'||request.headers.get('sec-fetch-site')==='cross-site')return Response.json({error:'Same-site session required'},{status:403,headers:noStore});
  const session=await favoriteSession(favoriteToken(request));const headers:Record<string,string>={...noStore};if(session.token)headers['Set-Cookie']=`${favoriteCookie}=${session.token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=31536000`;
  return Response.json({revision:session.revision,...await favoriteCountSnapshot()}, {headers});
 }
 return Response.json({...await favoriteCountSnapshot(),unit:'browser',asOf:new Date().toISOString()},{headers:{'Cache-Control':'public,max-age=30'}});
 }catch{return Response.json({error:'Counts unavailable'},{status:503,headers:noStore});}}
export async function POST(request:Request){
 if(!favoriteWriteAllowed(request))return Response.json({error:'Origin mismatch'},{status:403,headers:noStore});
 const token=favoriteToken(request);if(!token)return Response.json({error:'Browser cookie required'},{status:428,headers:noStore});
 try{const reader=request.body?.getReader();if(!reader)return Response.json({error:'Missing body'},{status:400,headers:noStore});let body='',size=0;const decoder=new TextDecoder();while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>2048){await reader.cancel();return Response.json({error:'Payload too large'},{status:413,headers:noStore});}body+=decoder.decode(value,{stream:true});}body+=decoder.decode();const input=favoriteInput(JSON.parse(body));if(!input)return Response.json({error:'Invalid selection'},{status:400,headers:noStore});const saved=await saveFavoriteSelection(token,input.favorites,input.revision);return Response.json({ok:saved.ok,revision:saved.revision,...await favoriteCountSnapshot()},{status:saved.ok?200:saved.revision==null?428:409,headers:noStore});
 }catch{return Response.json({error:'Could not save selection'},{status:503,headers:noStore});}
}
