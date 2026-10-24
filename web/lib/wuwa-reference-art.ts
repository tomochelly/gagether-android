import registry from '../content/wuwa-reference-splashes.json' with {type:'json'};
export type FullCharacterArt={url:string;originalUrl:string;sourceUrl:string;width:number;height:number;bytes:number;sha256:string;extension:string;contentType:string;kind:'full-splash'|'full-standing'|'shared-promotional-illustration';imageLocale:string;checkedAt:string;focus?:{x:number;y:number}};
export const fullCharacterArt=registry.entries as Record<string,FullCharacterArt>;
export const fullArtByHash=new Map(Object.values(fullCharacterArt).map(a=>[a.sha256,a]));
export const fullArtKey=(hash:string)=>'wuwa-reference-art/'+hash;
export const fullArtHash=async(bytes:ArrayBuffer)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
/** New releases may use only files actually declared by the upstream full-splash resolver. */
export function declaredFullArtwork(url:unknown){return typeof url==='string'&&/^https:\/\/raw\.githubusercontent\.com\/DommyMM\/wuwabuild\/main\/public\/images\/splash\/(?:\d+|Rover)\.webp$/.test(url)?url:undefined;}
