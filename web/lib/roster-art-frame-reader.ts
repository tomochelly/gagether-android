import {env} from 'cloudflare:workers';
import {rosterArtFramesSchema,rosterArtKey} from './roster-art-framing';
export async function readRosterArtFrames(gameId:string,id?:string){
 const prefix='roster-art:'+gameId+':',query=id?env.DB!.prepare('SELECT key,payload,revision FROM editorial WHERE key=?').bind(rosterArtKey(gameId,id)):env.DB!.prepare('SELECT key,payload,revision FROM editorial WHERE key>=? AND key<? ORDER BY key').bind(prefix,prefix+'\uffff');
 const result=await query.all<{key:string;payload:string;revision:number}>();
 return result.results.map(r=>({key:r.key,id:decodeURIComponent(r.key.slice(prefix.length)),revision:r.revision,value:rosterArtFramesSchema.parse(JSON.parse(r.payload))}));
}
