import rejected from '../content/character-rosters/rejected-artwork.json' with {type:'json'};
import restricted from '../content/character-rosters/restricted-artwork.json' with {type:'json'};
import type {RosterCharacter} from './character-roster';
type Art=NonNullable<RosterCharacter['image']>;
export function rejectedRosterArt(url:string){return rejected.some(a=>url===a.url||url.includes('/'+a.sha256+'.'));}
export function classifyRosterArt(a:Art):Art{return restricted.some(r=>a.url===r.url||a.url.includes('/'+r.sha256+'.'))?{...a,locale:'en'}:a;}
export function cleanRosterArt(c:RosterCharacter):RosterCharacter{
 const image=c.image&&!rejectedRosterArt(c.image.url)?classifyRosterArt(c.image):undefined;
 const fallback=restricted.find(r=>r.id===c.id&&[image,...c.images||[]].some(a=>a&&(a.url===r.url||a.url.includes('/'+r.sha256+'.'))))?.fallbackArtwork as Art|undefined;
 const images=[...c.images||[],...(fallback?[fallback]:[])].filter(a=>!rejectedRosterArt(a.url)).map(classifyRosterArt);
 return {...c,image,images:[...new Map(images.map(a=>[a.url,a])).values()]};
}
