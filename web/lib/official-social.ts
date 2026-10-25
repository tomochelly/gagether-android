import {z} from 'zod';
import {byId} from './games';
import {safeSource} from './types';
const https=(u:string)=>{try{const x=new URL(u);return x.protocol==='https:'&&!x.username&&!x.password;}catch{return false;}};
export const officialPostSchema=z.object({url:z.string().url(),originalTitle:z.string().min(1).max(600),titleIsExcerpt:z.boolean().optional(),locale:z.enum(['ko','en','ja','zh']),publishedAt:z.string().datetime({offset:true}).optional(),publishedDate:z.string().date().optional(),youtubeId:z.string().regex(/^[\w-]{11}$/).optional(),thumbnailUrl:z.string().url().optional(),thumbnailLocale:z.enum(['ko','en','ja','zh','neutral']).optional(),verifiedAt:z.string().datetime({offset:true}),metadataVerified:z.literal(true),watched:z.literal(false),sourceAccess:z.enum(['metadata','body','search-index'])});
export const officialChannelSchema=z.object({id:z.string().regex(/^[a-zA-Z0-9_-]{1,140}$/),gameId:z.string(),region:z.enum(['kr','jp','global','cn']),locale:z.enum(['ko','en','ja','zh']),platform:z.enum(['youtube','x']),name:z.string().min(1).max(200),url:z.string().url(),official:z.literal(true),evidenceUrls:z.array(z.string().url()).min(1).max(10),verifiedAt:z.string().datetime({offset:true}),checkedAt:z.string().datetime({offset:true}),status:z.enum(['ok','blocked','js-only','error','metadata-only']),posts:z.array(officialPostSchema).max(12)});
export type OfficialChannel=z.infer<typeof officialChannelSchema>;
export type OfficialPost=z.infer<typeof officialPostSchema>;
export function safeChannel(c:OfficialChannel){
 const game=byId[c.gameId];if(!game||!game.regions.includes(c.region)||Date.parse(c.verifiedAt)>Date.now()+300000||Date.parse(c.checkedAt)>Date.now()+300000||c.evidenceUrls.some(u=>!https(u)))return false;
 const u=new URL(c.url);if(!https(c.url))return false;
 const channel=c.platform==='x'?['x.com','twitter.com','www.twitter.com'].includes(u.hostname)&&/^\/[A-Za-z0-9_]+\/?$/.test(u.pathname):['youtube.com','www.youtube.com'].includes(u.hostname)&&/^\/(?:@[\w.%+-]+|channel\/UC[\w-]+)(?:\/(?:videos|streams))?\/?$/.test(u.pathname);
 if(!channel)return false;
 return c.posts.every(p=>{const x=new URL(p.url);if(!https(p.url)||Date.parse(p.verifiedAt)>Date.now()+300000)return false;if(c.platform==='x'){return ['x.com','twitter.com','www.twitter.com'].includes(x.hostname)&&x.pathname.toLowerCase().startsWith(u.pathname.replace(/\/$/,'').toLowerCase()+'/status/')&&/^\/[\w]+\/status\/\d+$/.test(x.pathname)&&!p.youtubeId;}
 return !!p.youtubeId&&['youtube.com','www.youtube.com','youtu.be'].includes(x.hostname)&&(x.hostname==='youtu.be'?x.pathname==='/'+p.youtubeId:x.pathname==='/watch'&&x.searchParams.get('v')===p.youtubeId||['/shorts/'+p.youtubeId,'/live/'+p.youtubeId].includes(x.pathname))&&(!p.thumbnailUrl||p.thumbnailUrl.startsWith('https://i.ytimg.com/vi/'+p.youtubeId+'/'));
 });
}
