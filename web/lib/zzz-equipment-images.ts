import manifest from '../content/zzz-equipment-images.json' with {type:'json'};
export const zzzEquipmentImages=manifest.images;
if(manifest.version!==1||zzzEquipmentImages.length!==233||new Set(zzzEquipmentImages.map(a=>a.hash)).size!==zzzEquipmentImages.length||zzzEquipmentImages.some(a=>!/^[a-f0-9]{64}$/.test(a.hash)||!Number.isSafeInteger(a.bytes)||a.bytes<16||a.bytes>500000||!['image/png','image/webp'].includes(a.contentType)||!/^https:\/\/(enka\.network\/ui\/zzz\/|static\.nanoka\.cc\/assets\/zzz\/)[A-Za-z0-9_.&-]+\.(png|webp)$/.test(a.source)))throw Error('Invalid reviewed ZZZ equipment images');
export const zzzEquipmentImageByHash=new Map(zzzEquipmentImages.map(a=>[a.hash,a]));
const bySource=new Map(zzzEquipmentImages.map(a=>[a.source,a]));
export const zzzEquipmentImageKey=(hash:string)=>'zzz-equipment-icons/'+hash;
export const zzzEquipmentImageSource=(a:{source:string})=>a.source;
export function zzzEquipmentIcon(source:string){const a=bySource.get(source);if(!a)throw Error('Unreviewed ZZZ equipment image');return '/api/zzz/equipment-icons/'+a.hash;}
