import declared from '../content/arknights-preview-images.json' with {type:'json'};
import {rosterArtUrl} from './roster-art-framing';
const previews=new Map(declared.map(([original,url])=>[rosterArtUrl(original),{url}]));
/** Only independently declared, matching full-composition preview exports. */
export function declaredRosterPreview(url?:string,override?:{url:string}){return override||(url?previews.get(rosterArtUrl(url)):undefined);}
