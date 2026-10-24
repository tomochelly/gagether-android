import type {MetadataRoute} from 'next';
import {brandOrigin} from '@/lib/brand';
export default function robots():MetadataRoute.Robots{return {rules:{userAgent:'*',allow:'/',disallow:['/api/','/owner/','/owner','/account']},sitemap:[brandOrigin+'/sitemap.xml',brandOrigin+'/sitemap-items.xml']};}
