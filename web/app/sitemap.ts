import {nikkeRecruitEnabled} from '@/lib/nikke-recruit-media';
import {forumPath} from '@/lib/forum';
import type {MetadataRoute} from 'next';
import {brandOrigin} from '@/lib/brand';
import {games} from '@/lib/games';
import {supportedLocales} from '@/lib/catalog-paths';
import {catalogAlternates,canonicalCatalogPath} from '@/lib/seo';
import {effectiveRegion} from '@/lib/presentation';
import {foresightGames,foresightPath} from '@/lib/foresight';
import {gameSectionPath} from '@/lib/discovery';
import {directoryPath,directoryMetadata} from '@/lib/content-directory';
import {combatModes,combatPath,type CombatMode} from '@/lib/wuwa-combat';
export default function sitemap():MetadataRoute.Sitemap{
 const pages:MetadataRoute.Sitemap=[{url:brandOrigin+'/',changeFrequency:'daily',priority:1,alternates:{languages:catalogAlternates()}}];
 for(const locale of supportedLocales){
  if(nikkeRecruitEnabled)pages.push({url:brandOrigin+`/${locale}/games/nikke/convene`,changeFrequency:'weekly',priority:.6,alternates:{languages:Object.fromEntries(supportedLocales.map(l=>[l,brandOrigin+`/${l}/games/nikke/convene`]))}});
  pages.push({url:brandOrigin+`/${locale}/games/wuwa/convene`,changeFrequency:'daily',priority:.6,alternates:{languages:Object.fromEntries(supportedLocales.map(l=>[l,brandOrigin+`/${l}/games/wuwa/convene`]))}});
  pages.push({url:brandOrigin+`/${locale}/games/nte/convene`,changeFrequency:'daily',priority:.6,alternates:{languages:Object.fromEntries(supportedLocales.map(l=>[l,brandOrigin+`/${l}/games/nte/convene`]))}});
  pages.push({url:brandOrigin+forumPath(locale),changeFrequency:'daily',priority:.6});
  for(const id of foresightGames)pages.push({url:brandOrigin+foresightPath(locale,id),changeFrequency:'daily',priority:.7,alternates:{languages:Object.fromEntries(supportedLocales.map(l=>[l,brandOrigin+foresightPath(l,id)]))}});
  for(const mode of Object.keys(combatModes)as CombatMode[])pages.push({url:brandOrigin+combatPath(locale,mode),changeFrequency:'daily',priority:.6,alternates:{languages:Object.fromEntries(supportedLocales.map(l=>[l,brandOrigin+combatPath(l,mode)]))}});
  pages.push({url:brandOrigin+combatPath(locale),changeFrequency:'daily',priority:.6,alternates:{languages:Object.fromEntries(supportedLocales.map(l=>[l,brandOrigin+combatPath(l)]))}});
  pages.push({url:brandOrigin+directoryPath(locale),changeFrequency:'daily',priority:.7,alternates:{languages:directoryMetadata(locale).alternates!.languages as Record<string,string>}});
  pages.push({url:brandOrigin+'/'+locale+'/download',changeFrequency:'monthly',priority:.6,alternates:{languages:Object.fromEntries(supportedLocales.map(l=>[l,brandOrigin+'/'+l+'/download']))}},{url:brandOrigin+'/'+locale,changeFrequency:'daily',priority:.9,alternates:{languages:catalogAlternates()}});
  for(const game of games.filter(g=>g.id!=='wuwa'&&(!g.launch||g.launch.fullPage)))pages.push({url:brandOrigin+`/${locale}/games/${game.id}/combat`,changeFrequency:'weekly',priority:.6,alternates:{languages:Object.fromEntries(supportedLocales.map(l=>[l,brandOrigin+`/${l}/games/${game.id}/combat`]))}});
  for(const game of games.filter(g=>(!g.launch||g.launch.fullPage)))for(const section of ['leaks','characters'] as const)pages.push({url:brandOrigin+gameSectionPath(locale,game.id,section),changeFrequency:'daily',priority:.6,alternates:{languages:Object.fromEntries(supportedLocales.map(l=>[l,brandOrigin+gameSectionPath(l,game.id,section)]))}});
  for(const game of games)for(const service of [...new Set(game.regions.map(r=>effectiveRegion(game,r)))]){
   pages.push({url:brandOrigin+canonicalCatalogPath(locale,game.id,service),changeFrequency:'daily',priority:.8,alternates:{languages:catalogAlternates(game.id,service)}});
   if(!game.launch||game.launch.fullPage)pages.push({url:brandOrigin+directoryPath(locale,game.id,{region:service}),changeFrequency:'daily',priority:.6,alternates:{languages:directoryMetadata(locale,game,{region:service}).alternates!.languages as Record<string,string>}});
  }
 }
 return [...new Map(pages.map(p=>[p.url,p])).values()];
}
