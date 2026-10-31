import manifest from '../content/wuwa-convene-media.json' with {type:'json'};
export const conveneClips=manifest.clips as ConveneMediaClip[];
export type ConveneMediaClip={grade?:number;sha256:string;bytes:number;duration:number;width:number;height:number;contentType:string;sourceUrl?:string;originalUrl?:string;starsStart?:number;beamEnd?:number;fit?:'screen';fallbackSha256?:string};
export type CharacterConveneClip=ConveneMediaClip&{characterId:string};
export const characterConveneClips=((manifest as unknown as {characters?:CharacterConveneClip[]}).characters||[]);
export const CONVENE_MEDIA_MAX_BYTES=24*1024*1024;
const retired=((manifest as unknown as {retired?:ConveneMediaClip[]}).retired||[]);
export const conveneClipByHash=new Map<string,ConveneMediaClip>([...conveneClips,...characterConveneClips,...retired].map(c=>[c.sha256,c]));
export const conveneCharacterClip=(id:string)=>id.startsWith('character:')?characterConveneClips.find(c=>c.characterId===id.slice(10)):undefined;
export const conveneMediaKey=(hash:string)=>'wuwa-convene-media/'+hash;
export const conveneClip=(grade:number)=>conveneClips.find(c=>c.grade===(grade===5?5:4))!;
export const conveneMediaUrl=(hash:string)=>'/api/wuwa/convene-media/'+hash;
/** A single byte range only. Bound all offsets before passing them to R2. */
export function conveneByteRange(value:string|null,size:number){
 if(value===null)return undefined;
 const m=/^bytes=(\d*)-(\d*)$/.exec(value);if(!m||(!m[1]&&!m[2]))return null;
 const first=m[1]?Number(m[1]):undefined,last=m[2]?Number(m[2]):undefined;
 if((first!==undefined&&!Number.isSafeInteger(first))||(last!==undefined&&!Number.isSafeInteger(last)))return null;
 if(first===undefined){if(!last)return null;const start=Math.max(0,size-last);return {offset:start,length:size-start};}
 if(first>=size||last!==undefined&&last<first)return null;
 return {offset:first,length:Math.min(last??size-1,size-1)-first+1};
}
