import manifest from '../content/reward-assets.json' with {type:'json'};

/** Immutable, visually reviewed originals; owner-provided images are never replaced. */
export const rewardAssets=manifest;
const byImage=new Map(rewardAssets.map(a=>[a.sourceImage,a]));
const byId=new Map(rewardAssets.map(a=>[a.id,a]));
export const rewardAsset=(id:string)=>byId.get(id);
export function rewardAssetUrl(original:string){
 const asset=byImage.get(original);
 return asset?`/api/reward-icons/${asset.id}?v=${asset.sha256}`:original;
}
export const rewardAssetKey=(asset:{id:string;sha256:string})=>`reviewed-rewards/${asset.id}/${asset.sha256}`;
export async function decodeRewardAsset(upload:{id:string;data:string}){
 const asset=rewardAsset(upload.id);
 if(!asset||upload.data.length>300000||!/^[A-Za-z0-9+/]+={0,2}$/.test(upload.data))return null;
 let bytes:Uint8Array<ArrayBuffer>;
 try{bytes=Uint8Array.from(atob(upload.data),c=>c.charCodeAt(0));}catch{return null;}
 if(bytes.byteLength!==asset.size)return null;
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
 return hash===asset.sha256?{asset,bytes}:null;
}
