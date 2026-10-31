import manifest from '../content/wuwa-combat-image-repairs.json' with {type:'json'};
export const combatImages=manifest.images;
if(manifest.version!==1||combatImages.length!==6||new Set(combatImages.map(a=>a.hash)).size!==6||combatImages.some(a=>!/^[a-f0-9]{64}$/.test(a.hash)||!Number.isSafeInteger(a.bytes)||a.bytes<16||a.bytes>100000))throw Error('Invalid combat image repairs');
export const combatImageByHash=new Map(combatImages.map(a=>[a.hash,a]));
export const combatImageKey=(hash:string)=>'wuwa-combat-images/'+hash;
