import {z} from 'zod';
import registry from '../content/community-research-sources.json' with {type:'json'};
import {games} from './games';
import {effectiveRegion} from './presentation';
import type {Locale,Region} from './types';
const gameIds=new Set(games.map(g=>g.id));
const https=z.string().max(2000).refine(value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&!/^(localhost|\d+\.\d+\.\d+\.\d+|\[)/i.test(u.hostname);}catch{return false;}});
const stamp=z.string().datetime({offset:true});
const verification=z.object({checkedAt:stamp,httpStatus:z.literal(200),bytes:z.number().int().min(1).max(1_500_000),sha256:z.string().regex(/^[a-f0-9]{64}$/),itemCount:z.number().int().min(1).optional(),articleCount:z.number().int().min(1).optional(),root:z.string().max(100).optional()}).strict();
const collection=z.object({kind:z.enum(['rss','atom','rdf','arca-listing']),url:https,enabled:z.boolean(),meaning:z.enum(['wiki-edit','community-post']),maxBytes:z.number().int().min(1).max(1_000_000),allowedOrigin:https,allowedPathPrefix:z.string().min(1).max(300),lastVerified:verification}).strict();
export const communityResearchSourceSchema=z.object({id:z.string().regex(/^[a-z0-9][a-z0-9_-]{0,99}$/),gameId:z.string().refine(id=>gameIds.has(id),'Unknown game'),label:z.string().min(1).max(300),url:https,homeUrl:https.optional(),platform:z.enum(['wiki','arca','dcinside','inven','reddit','x']),locale:z.enum(['ko','en','ja','zh']),sourceKind:z.literal('community'),routing:z.enum(['research','leak-gate']),sourceAccess:z.enum(['body','search-index','blocked','not-checked']),checkedAt:stamp,verifiedPart:z.string().max(40),topics:z.array(z.string().max(60)).max(12),accessNote:z.string().max(1500),scopeNote:z.string().max(1000),enabled:z.boolean(),mayPublishSchedule:z.literal(false),evidenceUrls:z.array(https).min(1).max(6),sampleArticleUrls:z.array(https).max(3).optional(),lastProbe:z.object({checkedAt:stamp.optional(),httpStatus:z.number().int().optional(),bytes:z.number().int().optional(),sha256:z.string().optional(),error:z.string().max(300).optional()}).strict().optional(),collection:collection.optional()}).strict().superRefine((source,ctx)=>{
 const c=source.collection;if(!c)return;
 const u=new URL(c.url),origin=new URL(c.allowedOrigin);
 if(source.sourceAccess!=='body'||c.allowedOrigin!==origin.origin||u.origin!==origin.origin||!(c.kind==='arca-listing'?u.pathname+'/'===c.allowedPathPrefix:u.pathname.startsWith(c.allowedPathPrefix)))ctx.addIssue({code:'custom',message:'Unverified or unbound collection endpoint'});
 if(c.kind==='arca-listing'&&(source.platform!=='arca'||u.hostname!=='arca.live'||!/^[\/]b[\/][a-zA-Z0-9_]+\/$/.test(c.allowedPathPrefix)||u.pathname+'/'!==c.allowedPathPrefix||!c.lastVerified.articleCount))ctx.addIssue({code:'custom',message:'Unbound Arca channel'});
 if(c.kind!=='arca-listing'&&(!c.lastVerified.itemCount||!c.lastVerified.root))ctx.addIssue({code:'custom',message:'Feed has no checked entries'});
 if(source.routing==='leak-gate'&&source.platform!=='reddit')ctx.addIssue({code:'custom',message:'No verified collector for this leak source'});
});
export type CommunityResearchSource=z.infer<typeof communityResearchSourceSchema>;
export type CommunityCollection=NonNullable<CommunityResearchSource['collection']>;
type CoverageRegistry={games:readonly {gameId:string}[];sources:readonly Pick<CommunityResearchSource,'id'|'gameId'>[]};
/** Released games require registered sources. An announced game may have none
 * until actual sources are verified; no placeholder identity grants collection. */
export function validateCommunityResearchCoverage(candidate:CoverageRegistry,catalog:readonly {id:string;launch?:unknown}[]=games){
 const known=new Set(catalog.map(g=>g.id)),registered=new Set(candidate.games.map(g=>g.gameId)),covered=new Set(candidate.sources.map(s=>s.gameId));
 const fail=(reason:string)=>{throw Error('Community source identity coverage mismatch: '+reason);};
 if(new Set(candidate.sources.map(s=>s.id)).size!==candidate.sources.length)fail('duplicate source id');
 if(registered.size!==candidate.games.length)fail('duplicate registry game id');
 if(candidate.games.some(g=>!known.has(g.gameId))||candidate.sources.some(s=>!known.has(s.gameId)))fail('unknown game');
 if(candidate.sources.some(s=>!registered.has(s.gameId)))fail('source game is not registered');
 if(catalog.some(g=>!g.launch&&(!registered.has(g.id)||!covered.has(g.id))))fail('released game missing');
}
const rows=registry.sources.map(s=>communityResearchSourceSchema.parse(s));
validateCommunityResearchCoverage({games:registry.games,sources:rows});
const byId=new Map(rows.map(s=>[s.id,s]));
const visible=(s:CommunityResearchSource,includeLeaks:boolean)=>s.enabled&&(includeLeaks||s.routing!=='leak-gate');
/** Fixed public source identities only. This does not fetch, publish or approve content. */
export function communityResearchSources(gameId?:string,{includeLeaks=false}:{includeLeaks?:boolean}={}){return structuredClone(rows.filter(s=>(gameId===undefined||s.gameId===gameId)&&visible(s,includeLeaks)));}
export function communityResearchSource(sourceId:string){const source=byId.get(sourceId);return source&&structuredClone(source);}
export function communityResearchTargets(gameId:string,{includeLeaks=false}:{includeLeaks?:boolean}={}){
 const game=games.find(g=>g.id===gameId);if(!game)return [];
 return communityResearchSources(gameId,{includeLeaks}).map(source=>{const requested:Region=source.locale==='ko'?'kr':source.locale==='ja'?'jp':source.locale==='zh'?'cn':'global',u=new URL(source.homeUrl||source.url),name=game.name[source.locale as Locale];return {...source,targetUrl:source.homeUrl||source.url,serviceHint:effectiveRegion(game,requested),researchQuery:'site:'+u.hostname+u.pathname+' '+name+(source.routing==='leak-gate'?' leak beta 유출':' update guide 정보'),researchOnly:true as const};});
}
/** Only actually parsed, fixed RSS/Atom/RDF candidates enter feed collection. */
export function collectibleCommunityFeeds(gameId?:string,{includeLeaks=false}:{includeLeaks?:boolean}={}){return communityResearchSources(gameId,{includeLeaks}).filter(s=>s.collection?.enabled&&s.collection.kind!=='arca-listing');}
/** Arca listings are separate HTML inputs, never falsely described as RSS. */
export function readableCommunityListings(gameId?:string){return communityResearchSources(gameId).filter(s=>s.collection?.enabled&&s.collection.kind==='arca-listing');}
export function collectibleCommunitySources(gameId:string){return communityResearchSources(gameId,{includeLeaks:true}).filter(s=>s.collection?.enabled);}
export function communitySourceCoverage(){return {games:new Set(rows.map(s=>s.gameId)).size,sources:rows.length,feeds:rows.filter(s=>s.collection?.enabled&&s.collection.kind!=='arca-listing').length,listings:rows.filter(s=>s.collection?.enabled&&s.collection.kind==='arca-listing').length,access:Object.fromEntries(['body','search-index','blocked','not-checked'].map(a=>[a,rows.filter(s=>s.sourceAccess===a).length]))};}
/** Source data never grants arbitrary fetch authority. Reject other hosts/games/admin paths. */
export function communityArticleURL(sourceId:string,value:string){
 const source=byId.get(sourceId),c=source?.collection;if(!source||!c?.enabled||typeof value!=='string'||value.length>2000)return;
 try{const u=new URL(value,c.url);if(u.protocol!=='https:'||u.username||u.password||u.port||u.origin!==c.allowedOrigin||!(source.platform==='reddit'?u.pathname.toLowerCase().startsWith(c.allowedPathPrefix.toLowerCase()):u.pathname.startsWith(c.allowedPathPrefix)))return;
  if(c.kind==='arca-listing'){if(!new RegExp('^'+c.allowedPathPrefix+'[0-9]+$').test(u.pathname))return;u.search='';}
  else if(source.platform==='reddit'){if(!u.pathname.toLowerCase().startsWith(c.allowedPathPrefix.toLowerCase()+'comments/'))return;u.search='';}
  else if(u.searchParams.has('cmd')||u.searchParams.has('plugin')||u.searchParams.has('action')||u.href===c.url)return;
  u.hash='';if(u.href===c.url)return;return u.href;
 }catch{return;}
}
