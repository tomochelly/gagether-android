/** Keep the finite anonymous read API separate from page rendering and private
 * session routing. The same handlers remain available through the framework. */
export async function dispatchPublicApi(request:Request){
 const path=new URL(request.url).pathname;
 let response:Response;
 if(path==='/api/characters'){const {readPublicCharacterRoster}=await import('./roster-public-read');response=await readPublicCharacterRoster(request);}
 else if(path==='/api/favorites'){const {GET}=await import('../app/api/favorites/route');response=await GET(request);}
 else if(path==='/api/data'){const {GET}=await import('../app/api/data/route');response=await GET(request);}
 else if(path==='/api/wuwa/library'){const {GET}=await import('../app/api/wuwa/library/route');response=await GET(request);}
 else throw Error('Not a registered public read');
 const headers=new Headers(response.headers);headers.set('X-Gagether-Public-Source','direct');
 return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
