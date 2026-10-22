import {env} from 'cloudflare:workers';
import {rewardAssetKey,decodeRewardAsset} from './reward-assets';

export async function saveRewardAssets(uploads:{id:string;data:string}[]){
 const decoded=await Promise.all(uploads.map(decodeRewardAsset));
 if(decoded.some(a=>!a))return false;
 const bucket=(env as unknown as {BUCKET:R2Bucket}).BUCKET;
 for(const record of decoded){
  if(!record)continue;
  const {asset,bytes}=record;
  await bucket.put(rewardAssetKey(asset),bytes,{httpMetadata:{contentType:asset.contentType,cacheControl:'public, max-age=31536000, immutable'},customMetadata:{sha256:asset.sha256,sourceImage:asset.sourceImage}});
 }
 return true;
}
