import type {LeakVideo} from './leaks';
export function leakVideoVariants(video:LeakVideo){return (video.variants?.length?video.variants:[{url:video.url,width:video.width,height:video.height}]).filter((v,i,a)=>a.findIndex(x=>x.url===v.url)===i).sort((a,b)=>(b.height||0)-(a.height||0)||(b.bitrate||0)-(a.bitrate||0));}
/** Keep full source quality choices; begin with a broadly playable resolution/bitrate. */
export function preferredLeakVideo(video:LeakVideo){const rows=leakVideoVariants(video);return rows.find(v=>(!v.height||v.height<=1080)&&(!v.bitrate||v.bitrate<=8000000))||rows[rows.length-1];}
export function lowerLeakVideo(video:LeakVideo,current:string,tried:string[]){const rows=leakVideoVariants(video),at=rows.findIndex(v=>v.url===current);return rows.slice(at+1).find(v=>!tried.includes(v.url));}
export function leakPostId(video:LeakVideo){try{const u=new URL(video.sourceUrl),id=/^\/[A-Za-z0-9_]+\/status\/(\d{16,24})\/?$/.exec(u.pathname)?.[1];return u.protocol==='https:'&&['x.com','twitter.com'].includes(u.hostname)&&!u.username&&!u.password&&!u.port&&id===video.sourcePostId?id:undefined;}catch{return;}}
