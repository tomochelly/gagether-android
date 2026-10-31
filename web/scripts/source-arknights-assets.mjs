// Fixed, immutable native asset mirror exports. No proxy or caller-supplied URL.
function source(a,directory){
 if(a.gameId!=='arknights'||a.sourceKind!=='community'||!/^[a-f0-9]{40}$/.test(a.assetCommit||'')||!/^[a-f0-9]{40}$/.test(a.gitBlobSha||''))return;
 const u=new URL(a.url);if(u.protocol!=='https:'||u.hostname!=='raw.githubusercontent.com'||u.port||u.username||u.password||u.search||u.hash)return;
 const path=decodeURIComponent(u.pathname),prefix='/fexli/ArknightsResource/'+a.assetCommit+'/'+directory+'/';
 if(!path.startsWith(prefix))return;return path.slice(prefix.length);
}
export function isArknightsSourceArtwork(a){
 try{
  const file=source(a,'charpack'),id=a.sourceId?.replace(/^illust_/,'');
  if(!file||!/^char_[a-z0-9_]+$/.test(a.characterId||'')||!id?.startsWith(a.characterId+'_'))return false;
  if(!/^\d+\+?$/.test(id.slice(a.characterId.length+1)))return false;
  return file===id+(a.preview?'b':'')+'.png'&&Number.isInteger(a.width)&&a.width>0&&Number.isInteger(a.height)&&a.height>0;
 }catch{return false;}
}
export function isArknightsSourceIcon(a){
 try{const file=source(a,'skills');return !!file&&file===a.sourceId+'.png'&&/^skill_icon_[a-zA-Z0-9_\[\]-]+$/.test(a.sourceId||'')&&a.width>=8&&a.height>=8;}catch{return false;}
}
