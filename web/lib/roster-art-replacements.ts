import hsr from '../content/hsr-gallery-focus.json' with {type:'json'};
import holo from '../content/holodreams-gallery-focus.json' with {type:'json'};
import four from '../content/four-games-gallery-focus.json' with {type:'json'};
import endfield from '../content/endfield-gallery-focus.json' with {type:'json'};
import {rosterArtUrl} from './roster-art-framing';
import type {ProtectedHead} from './gallery-framing';
import type {RosterCharacter} from './character-roster';
type Art=NonNullable<RosterCharacter['image']>;
type Reviewed={id:string;url:string;sha256:string;width:number;height:number;head:ProtectedHead|null;aliases?:string[];gameId:string;kind?:Art['kind']};
const rows:Reviewed[]=[...hsr.entries.map(r=>({...r,gameId:'hsr'})),...holo.entries.map(r=>({...r,gameId:'holodreams'})),...four.entries as Reviewed[],...endfield.entries as Reviewed[]];
const sources=new Map<string,Reviewed>();
for(const row of rows)for(const url of [row.url,...row.aliases||[],...['png','webp','jpg'].map(ext=>`/roster-bootstrap/${row.sha256}.${ext}`)]){
 const key=rosterArtUrl(url),prior=sources.get(key);if(prior&&prior.url!==row.url)throw Error('Conflicting reviewed artwork identity');sources.set(key,row);
}
export function reviewedRosterArtEntry(gameId:string|undefined,url?:string){const row=url?sources.get(rosterArtUrl(url)):undefined;return row?.gameId===gameId?row:undefined;}
/** Read-only presentation of known legacy source URLs; stored rosters and owner edits stay intact. */
export function upgradeReviewedRosterArt(art:Art):Art{
 const row=sources.get(rosterArtUrl(art.url));if(!row)return art;
 const preview=row.gameId==='holodreams'&&!art.preview&&row.aliases?.[0]?{url:row.aliases[0],sourceUrl:art.sourceUrl,width:1558,height:952}:art.preview;
 return {...art,url:row.url,width:row.width,height:row.height,...row.gameId==='holodreams'?{kind:'card' as const}:row.kind?{kind:row.kind}:{},...preview?{preview}:{}};
}
