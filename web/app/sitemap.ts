import type {MetadataRoute} from 'next';
import {brandOrigin} from '@/lib/brand';
import {games} from '@/lib/games';
import {supportedLocales} from '@/lib/catalog-paths';
import {catalogAlternates,canonicalCatalogPath} from '@/lib/seo';
import {effectiveRegion} from '@/lib/presentation';
export default function sitemap():MetadataRoute.Sitemap{
 const pages:MetadataRoute.Sitemap=[{url:brandOrigin+'/',changeFrequency:'daily',priority:1,alternates:{languages:catalogAlternates()}}];
 for(const locale of supportedLocales){
  pages.push({url:brandOrigin+'/'+locale+'/download',changeFrequency:'monthly',priority:.6,alternates:{languages:Object.fromEntries(supportedLocales.map(l=>[l,brandOrigin+'/'+l+'/download']))}},{url:brandOrigin+'/'+locale,changeFrequency:'daily',priority:.9,alternates:{languages:catalogAlternates()}});
  for(const game of games)for(const service of [...new Set(game.regions.map(r=>effectiveRegion(game,r)))])pages.push({url:brandOrigin+canonicalCatalogPath(locale,game.id,service),changeFrequency:'daily',priority:.8,alternates:{languages:catalogAlternates(game.id,service)}});
 }
 return [...new Map(pages.map(p=>[p.url,p])).values()];
}
