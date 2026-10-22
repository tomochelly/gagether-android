import type {MetadataRoute} from 'next';
import {brandOrigin} from '@/lib/brand';
import {games} from '@/lib/games';
import {catalogPath,supportedLocales} from '@/lib/catalog-paths';
import {catalogAlternates} from '@/lib/seo';
export default function sitemap():MetadataRoute.Sitemap{return [{url:brandOrigin+'/',changeFrequency:'daily',priority:1,alternates:{languages:catalogAlternates()}},...supportedLocales.flatMap(locale=>[undefined,...games.map(g=>g.id)].map(gameId=>({url:brandOrigin+catalogPath(locale,gameId),changeFrequency:'daily' as const,priority:gameId?.8:.9,alternates:{languages:catalogAlternates(gameId)}})))];}
