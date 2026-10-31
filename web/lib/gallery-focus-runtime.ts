import runtime from '../content/gallery-focus-runtime.json' with {type:'json'};
import {rosterArtUrl} from './roster-art-framing';
import type {ProtectedHead} from './gallery-framing';
type Row=[number,string,string,string|null,number,number,[number,number,number,number]];
const focus=new Map<string,{gameId:string;head:ProtectedHead}>();
for(const [prefix,suffix,gameId,sha,width,height,[left,top,right,bottom]] of runtime.entries as Row[]){
 const value={gameId,head:{left,top,right,bottom,width,height}};
 focus.set(rosterArtUrl(runtime.prefixes[prefix]+suffix),value);
 if(sha)for(const ext of ['png','webp','jpg'])focus.set(`/roster-bootstrap/${sha}.${ext}`,value);
}
/** Lossless generated projection; research receipts and complete source registries stay in Git. */
export function maintainedGalleryFocus(gameId:string|undefined,url?:string){const row=url?focus.get(rosterArtUrl(url)):undefined;return row?.gameId===gameId?row?.head:undefined;}
