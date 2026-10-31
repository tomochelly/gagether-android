import type {Entry,Game,Locale} from './types';
import {games} from './games';
import {effectiveRegion} from './presentation';
import {currentVersion} from './version-hero';
import {spotlightSlides} from './spotlight';
import {artworkForLocale,serviceArtworkLocale,isBrandArtwork} from './artwork';
// A stored image URL is not evidence that it is usable in every display language.
// This queue deliberately does not approve candidates, invent art or change data.
export function artworkAudit(entries:Entry[],now=Date.now()){
 return games.flatMap(game=>[...new Set(game.regions.map(r=>effectiveRegion(game,r)))].flatMap(region=>{
  const scoped=entries.filter(e=>e.gameId===game.id&&e.region===region&&!e.hidden);
  const version=currentVersion(scoped,game,region,now),slides=spotlightSlides(scoped,now,game.id);
  const subjects=[{id:version?.id,kind:'version',art:version},...slides.filter(s=>s.entry.kind==='pickup').map(s=>({id:s.entry.id,kind:'pickup',art:s.art}))];
  return (['ko','en','ja','zh'] as Locale[]).map(locale=>{
   const issues=subjects.flatMap(subject=>{
    const resolved=subject.art?artworkForLocale(subject.art,locale,'full',serviceArtworkLocale(region,game.id)):undefined;
    const code=!subject.art?'missing-current-version':!resolved?.image||!resolved.imageVerified?(subject.art.imageVerified?'missing-locale-artwork':'missing-reviewed-artwork'):isBrandArtwork(resolved.image,game)?'game-brand-in-content':undefined;
    return code?[{id:subject.id,kind:subject.kind,name:subject.art?.title?.[locale],code}]:[];
   });
   return {gameId:game.id,region,locale,versionId:version?.id,pickupSubjects:slides.filter(s=>s.entry.kind==='pickup').length,status:issues.length?'needs-review':'covered',issues};
  });
 }));
}
