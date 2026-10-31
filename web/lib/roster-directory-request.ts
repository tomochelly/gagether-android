/** Public directory only. Intent warming overlaps the code download and data read. */
const warmed=new Map<string,{at:number;request:Promise<Response>}>();
const url=(game:string)=>'/api/characters?'+new URLSearchParams({game});
export function prefetchRosterDirectory(game:string){
 const old=warmed.get(game);if(old&&Date.now()-old.at<15000)return old.request.then(()=>{});
 const request=fetch(url(game),{credentials:'omit',cache:'default'}).then(r=>{if(!r.ok)throw Error('Roster read failed');return r;});
 const row={at:Date.now(),request};warmed.delete(game);warmed.set(game,row);
 if(warmed.size>4)warmed.delete(warmed.keys().next().value!);
 void request.catch(()=>{if(warmed.get(game)===row)warmed.delete(game);});
 return request.then(()=>{});
}
export function requestRosterDirectory(game:string,options:RequestInit={}){
 const row=warmed.get(game),headers=new Headers(options.headers);
 // A forced owner refresh and conditional revalidation must reach the server.
 if(row&&!headers.has('X-Gagether-Public-Fresh')&&!headers.has('If-None-Match')){
  warmed.delete(game);if(Date.now()-row.at<15000)return row.request.then(r=>r.clone());
 }
 return fetch(url(game),{credentials:'omit',cache:'default',...options});
}
