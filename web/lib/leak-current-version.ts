import {games} from './games';
import {reviewedLeakBaseline,compareLeakVersions,leakVersion} from './leak-horizon';
import {currentVersion} from './version-hero';
/** Use the existing released-version read model; future preview headers cannot advance the floor. */
export async function currentLeakBaseline(gameId:string){
 const fallback=reviewedLeakBaseline(gameId);if(!fallback)return undefined;
 try{const {readPublicCatalogSnapshot}=await import('./public-catalog-read'),snapshot=await readPublicCatalogSnapshot(gameId),game=games.find(g=>g.id===gameId)!,entry=currentVersion(snapshot.entries,game,'global',Date.now()),version=entry?.version&&leakVersion(entry.version);
  if(version&&entry&&compareLeakVersions(version,fallback.version)>=0)return {...fallback,version,startDate:entry.startDate||entry.startAt?.slice(0,10),sourceUrl:entry.sourceUrl,sourceAccess:'catalog' as const,checkedAt:entry.verifiedAt||fallback.checkedAt};
 }catch{/* The last reviewed floor remains usable when the public model is unavailable. */}
 return fallback;
}
