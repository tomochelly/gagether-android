import {games} from './games';
import {readData} from './store';
import {directoryEntries} from './content-directory';
import {defaultRegionForLocale} from './visitor-locale';
import {effectiveRegion,entryTitle} from './presentation';
import {displaySummary} from './content-display';
import {entryPath} from './discovery';
import {characterPath,rosterCopy} from './character-roster';
import {forumList} from './forum-store';
import {forumPath} from './forum';
import {currentRosterReadRevision,currentWuwaReadRevision} from './roster-read-revision';
import {searchScore,type SearchHit} from './site-search';
import type {Locale,Localized,Region} from './types';
type NameRow={id:string;name:Localized;regions?:Region[]};
const names=new Map<string,{revision:string;rows:NameRow[]}>();
async function characterNames(game:string){
 const revision=await (game==='wuwa'?currentWuwaReadRevision():currentRosterReadRevision(game)),cached=names.get(game);
 if(revision&&cached?.revision===revision)return cached.rows;
 let rows:NameRow[];
 if(game==='wuwa'){const {readWuwaReference}=await import('./wuwa-reference-store');rows=(await readWuwaReference()).data.characters.map(c=>({id:c.id,name:c.name}));}
 else{const {readPublicCharacterRoster}=await import('./roster-public-read');const response=await readPublicCharacterRoster(new Request('https://gagether.wiki/api/characters?game='+encodeURIComponent(game)));if(!response.ok)throw Error('Roster unavailable');const value=await response.json() as {data:{characters:NameRow[]}};rows=value.data.characters.map(c=>({id:c.id,name:c.name,regions:c.regions}));}
 if(revision)names.set(game,{revision,rows});return rows;
}
export async function readSiteSearch(locale:Locale,query:string,gameId?:string){
 const selected=games.filter(g=>(!gameId||g.id===gameId)&&!g.launch),schedules:SearchHit[]=[],characters:SearchHit[]=[],community:SearchHit[]=[];let partial=false;
 try{const data=await readData({index:true,...gameId?{gameId}:{}});for(const game of selected){const region=effectiveRegion(game,defaultRegionForLocale(locale));for(let page=1;page<=50;page++){const batch=directoryEntries(data.entries,game,locale,region,'all',page);for(const e of batch.rows){const title=entryTitle(e,locale),detail=displaySummary(e,locale),score=searchScore(query,title,detail);if(score)schedules.push({id:e.id,gameId:game.id,title,detail:detail.slice(0,180),href:entryPath(locale,e),score});}if(page>=batch.pages)break;}}}catch{partial=true;}
 // Read only public names, three games at a time. No skills, art or user builds are retained.
 for(let i=0;i<selected.length;i+=3){const batch=await Promise.allSettled(selected.slice(i,i+3).map(async game=>{const region=effectiveRegion(game,defaultRegionForLocale(locale));return (await characterNames(game.id)).filter(c=>!c.regions||c.regions.includes(region)).map(c=>{const title=rosterCopy(c.name,locale);return {id:game.id+':'+c.id,gameId:game.id,title,href:characterPath(locale,game.id,c.id)+'?region='+region,score:searchScore(query,title,Object.values(c.name).join(' '))};}).filter(c=>c.score);}));for(const r of batch)if(r.status==='fulfilled')characters.push(...r.value);else partial=true;}
 try{const {posts}=await forumList({game:gameId,search:query});for(const p of posts)community.push({id:p.id,gameId:p.gameId,title:p.title,detail:p.excerpt,href:forumPath(locale,p.gameId,p.id),score:searchScore(query,p.title,p.excerpt||'')||1});}catch{partial=true;}
 const rank=(rows:SearchHit[])=>rows.sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title,locale)).slice(0,30);
 return {schedules:rank(schedules),characters:rank(characters),community:rank(community),partial};
}
