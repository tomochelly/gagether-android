import manifest from '../ops/assets-manifest.json' with {type:'json'};
export const catalogAssets=manifest.map(a=>({...a,path:a.path.replace(/^public\//,''),contentType:({png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',avif:'image/avif',svg:'image/svg+xml',ico:'image/x-icon'} as Record<string,string>)[a.path.split('.').at(-1)!]||'application/octet-stream'}));
const byPath=new Map(catalogAssets.map(a=>[a.path,a]));
export const catalogAsset=(path:string)=>byPath.get(path.replace(/^\//,''));
export const catalogAssetKey=(a:{sha256:string})=>'catalog-assets/'+a.sha256;
export const assetHash=async(bytes:ArrayBuffer)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
export function canonicalAsset(a:{sha256:string}){return catalogAssets.find(v=>v.sha256===a.sha256)!;}
