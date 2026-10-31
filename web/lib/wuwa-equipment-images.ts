
import manifest from '../content/wuwa-equipment-images.json' with {type:'json'};
const root='https://raw.githubusercontent.com/DommyMM/wuwabuild/'+manifest.commit+'/public/';
export const equipmentImages=manifest.images;
if(manifest.version!==1||!/^[a-f0-9]{40}$/.test(manifest.commit)||equipmentImages.length!==389||new Set(equipmentImages.map(a=>a.hash)).size!==equipmentImages.length||equipmentImages.some(a=>!/^[a-f0-9]{64}$/.test(a.hash)||!Number.isSafeInteger(a.bytes)||a.bytes<16||a.bytes>500000||!/^assets\/UIResources\/[A-Za-z0-9_./-]+\.webp$/.test(a.path)||a.path.includes('..')))throw Error('Invalid reviewed equipment images');
export const equipmentImageByHash=new Map(equipmentImages.map(a=>[a.hash,a]));
const bySource=new Map(equipmentImages.map(a=>[root+a.path,a]));
export const equipmentImageKey=(hash:string)=>'wuwa-equipment-icons/'+hash;
export const equipmentImageSource=(a:{path:string})=>root+a.path;
export function equipmentIcon(source:string){const a=bySource.get(source);if(!a)throw Error('Unreviewed equipment image');return '/api/wuwa/equipment-icons/'+a.hash;}
