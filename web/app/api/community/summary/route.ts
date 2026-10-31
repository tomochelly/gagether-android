import {env} from 'cloudflare:workers';
import type {CommunitySummary} from '@/lib/community';
export const dynamic='force-dynamic';
// Public aggregates only. No sessions, identity fields or full catalog reads.
export async function GET(request:Request){
 const targets=[...new Set(new URL(request.url).searchParams.getAll('target'))];
 if(!targets.length||targets.length>30||targets.some(t=>! /^[a-f0-9]{64}$/.test(t)))return Response.json({error:'Invalid targets'},{status:400});
 try{
 const rows=await env.DB!.prepare(`SELECT r.target,AVG(r.stars) average,COUNT(*) count,SUM(CASE WHEN r.body<>'' THEN 1 ELSE 0 END) comments,
 (SELECT substr(c.body,1,120) FROM community_reviews c WHERE c.target=r.target AND c.hidden=0 AND c.body<>'' ORDER BY c.updated_at DESC,c.id DESC LIMIT 1) excerpt
 FROM community_reviews r WHERE r.target IN (${targets.map(()=>'?').join(',')}) AND r.hidden=0 GROUP BY r.target`).bind(...targets).all<CommunitySummary&{target:string}>();
 const summaries:Record<string,CommunitySummary>={};for(const target of targets)summaries[target]={average:null,count:0,comments:0,excerpt:null};
 for(const {target,...summary} of rows.results)summaries[target]=summary;
 // Tiny public payload; client deduplicates and retains it for 30s. No shared
 // stale cache: moderation/deletion and a writer's refresh take effect at once.
 return Response.json({summaries},{headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 }catch{return Response.json({error:'Community unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
