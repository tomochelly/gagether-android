import {Search,ArrowUpRight} from 'lucide-react';
import type {Locale} from '@/lib/types';
import {searchCopy} from '@/lib/site-search';
export default function SearchEntry({locale,gameId}:{locale:Locale;gameId?:string}){
 const t=searchCopy[locale];return <form role="search" className="site-search-entry" action={`/${locale}/search`}><Search size={18}/><input name="q" aria-label={t.title} placeholder={t.placeholder} maxLength={80} minLength={2} required/>{gameId&&<input type="hidden" name="game" value={gameId}/>}<button type="submit">{t.search}<ArrowUpRight size={14}/></button></form>;
}
