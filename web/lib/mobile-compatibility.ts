/** Distributed APKs reject a whole feed containing an unknown game. */
export const legacyMobileGameIds=['wuwa','bluearchive','nikke','endfield','umamusume','nte','gfl2','arknights','genshin','hsr','zzz','trickcal','hi3','reverse1999','stellasora'];
export function supportsExpandedCatalog(agent:string|null){
 const m=agent?.match(/GAGETHER(?:-Android)?\/(\d+)\.(\d+)\.(\d+)/i);if(!m)return true;
 const [major,minor,patch]=m.slice(1).map(Number);return major>1||major===1&&(minor>0||patch>=3);
}
/** An explicit native capability list wins. Version fallback also covers
 * intermediate bridge replies that omit the list, without silently dropping
 * newer favorites in a capable app. */
export function mobileSupportedGameIds(status:{supportedGameIds?:string[];appVersion?:string},releasedIds:string[]){
 if(Array.isArray(status.supportedGameIds))return releasedIds.filter(id=>status.supportedGameIds!.includes(id));
 return status.appVersion&&/^\d+\.\d+\.\d+/.test(status.appVersion)&&supportsExpandedCatalog('GAGETHER-Android/'+status.appVersion)?releasedIds:releasedIds.filter(id=>legacyMobileGameIds.includes(id));
}
