/** Exact publisher announcement scope; other games and source prose stay literal. */
export function isGfl2SteamNotice(gameId:string,sourceUrl:string){
 if(gameId!=='gfl2')return false;
 try{const u=new URL(sourceUrl);return u.protocol==='https:'&&u.hostname==='steamcommunity.com'&&!u.username&&!u.password&&!u.port&&/^\/games\/3308670\/announcements\/detail\/\d+\/?$/.test(u.pathname);}catch{return false;}
}
/** Historic captured site chrome, never an excerpt of the publisher's article.
 * This only classifies the exact known corruption; it never rewrites the input. */
export function isGfl2SteamShellText(gameId:string,sourceUrl:string,text:string){
 if(!isGfl2SteamNotice(gameId,sourceUrl))return false;
 const plain=text.replace(/\s+/g,' ').trim();
 const navigation=/\bSign in\s+Store\s+Home\s+Discovery Queue\b/i.test(plain);
 const scriptTail=/["']\s*\)\s*;\s*\}\s*;/.test(plain);
 return /^Steam\s*::/i.test(plain)&&navigation||scriptTail&&(navigation||/©\s*Valve Corporation[.]/.test(plain));
}
