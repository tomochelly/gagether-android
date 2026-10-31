import {nteBoardBgm} from './nte-board-bgm';
import {nteBoardArt} from './nte-board-art';
export const nteBoardAudio=[
 {id:'dice',sha256:'0503f523d72b8215361da3efaafb2cbd86e2e3ca52d48398c6efb5efddef503f',bytes:10510,duration:1.578957},
 {id:'move',sha256:'74f3cafe39369bbe491dd00ddc8c0bbed5f57940b3e5ff39aacdb2cd7279605d',bytes:17134,duration:2.693515},
 {id:'chest',sha256:'5435da2f26f2b1eccdcb52ec068ff4177c11ce85a81439e7a4f062c56b4b5649',bytes:9003,duration:1.346757},
 {id:'character',sha256:'041984893b60f7fefe0bf90f9c6538fccf2f8dcb7f8fe251f45f2c92ebc06197',bytes:8675,duration:1.300317}
].map(a=>({...a,contentType:'audio/mp4',url:'/api/nte/board-media/'+a.sha256}));
export const nteBoardAudioByHash=new Map(nteBoardAudio.map(a=>[a.sha256,a]));
export const nteBoardMedia=[nteBoardBgm,...nteBoardAudio,...nteBoardArt.map(a=>({...a,url:'/api/nte/board-media/'+a.sha256}))];
export const nteBoardMediaByHash=new Map(nteBoardMedia.map(a=>[a.sha256,a]));
export const nteBoardMediaKey=(hash:string)=>nteBoardMediaByHash.get(hash)?.id==='bgm'?'nte-board-bgm/'+hash+'.mp3':nteBoardMediaByHash.get(hash)?.contentType==='image/webp'?'nte-board-art/'+hash+'.webp':'nte-board-audio/'+hash+'.m4a';
