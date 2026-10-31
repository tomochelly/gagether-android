'use client';
import {Star,ChevronDown,Check} from 'lucide-react';
import type {Locale} from '@/lib/types';
import {useCatalog} from './catalog-context';
import {ownerUi} from '@/lib/owner-ui';
export default function MyGamesFilter({locale,enabled,favorites,onChange,onFavorite}:{locale:Locale;enabled:boolean;favorites:string[];onChange:(value:boolean)=>void;onFavorite:(id:string)=>void}){
 const {games}=useCatalog();const t=ownerUi[locale];
 return <div className="my-games-control"><button className={'my-filter prominent'+(enabled?' active':'')} onClick={()=>onChange(!enabled)} aria-pressed={enabled}><Star size={18} fill={enabled?'currentColor':'none'}/><span>{t.myGames}</span><b>{favorites.length}</b></button><details className="my-games-picker"><summary>{t.manage}<ChevronDown size={13}/></summary><div className="my-games-options"><p>{t.noGames}</p>{games.map(g=><button key={g.id} aria-pressed={favorites.includes(g.id)} onClick={()=>onFavorite(g.id)}><img src={g.icon||g.logo} alt=""/><span>{g.name[locale]}</span>{favorites.includes(g.id)?<Check size={16}/>:<Star size={15}/>}</button>)}</div></details></div>;
}
