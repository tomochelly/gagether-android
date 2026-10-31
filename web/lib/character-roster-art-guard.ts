import rejected from '../content/character-rosters/rejected-artwork.json' with {type:'json'};
import restricted from '../content/character-rosters/restricted-artwork.json' with {type:'json'};
import type {RosterCharacter} from './character-roster';
type Art=NonNullable<RosterCharacter['image']>;
export const rosterImageBinding=(a:Art)=>[a.url,a.locale||'neutral',a.variantId||'',...(a.regions||[]).slice().sort()].join('|');
export function rejectedRosterArt(url:string){return rejected.some(a=>url===a.url||url.includes('/'+a.sha256+'.'));}
export function classifyRosterArt(a:Art):Art{
 let result=/^https:\/\/cdn\.prydwen\.gg\/images\/zenless-zone-zero\/characters\/[^/?#]+_card\.webp(?:[?#]|$)/.test(a.url)?{...a,kind:'card' as const}:a;
 if(/^https:\/\/cheeky\.tsuncloud\.com\/deploy\/com\.(?:epidgames\.trickcalrevive|bilibili\.trickcal)\/sprites\/rawsprites\/heroicons\//.test(a.url))result={...result,kind:'card'};
 if(restricted.some(r=>a.url===r.url||a.url.includes('/'+r.sha256+'.')))result={...result,locale:'en'};
 return result;
}
export function cleanRosterArt(c:RosterCharacter):RosterCharacter{
 const image=c.image&&!rejectedRosterArt(c.image.url)?classifyRosterArt(c.image):undefined;
 const fallback=restricted.find(r=>r.id===c.id&&[image,...c.images||[]].some(a=>a&&(a.url===r.url||a.url.includes('/'+r.sha256+'.'))))?.fallbackArtwork as Art|undefined;
 const images=[...c.images||[],...(fallback?[fallback]:[])].filter(a=>!rejectedRosterArt(a.url)).map(classifyRosterArt);
 return {...c,image,images:[...new Map(images.map(a=>[rosterImageBinding(a),a])).values()]};
}
