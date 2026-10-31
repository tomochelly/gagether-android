import {wuwaAnnouncements} from '@/lib/wuwa-announcements';
import {characterPath,rosterCopy,rosterArt} from '@/lib/character-roster';
import {languageLabel} from '@/lib/presentation';
import type {WuwaCharacter} from '@/lib/wuwa-reference';
import type {Locale} from '@/lib/types';
export default function WuwaAnnouncements({characters,locale,search='',filtered=false}:{characters:WuwaCharacter[];locale:Locale;search?:string;filtered?:boolean}){
 const rows=filtered?[]:wuwaAnnouncements(characters).filter(c=>Object.values(c.name).some(n=>n.toLowerCase().includes(search.trim().toLowerCase())));
 if(!rows.length)return null;
 const label=({ko:'출시 예정',en:'Upcoming',ja:'実装予定',zh:'即将登场'})[locale];
 return <section className="reference-announcements" aria-label={label}><h2>{label}<small>{rows.length}</small></h2><div>{rows.map(c=>{const art=rosterArt(c,locale,'global');return <a className="reference-announcement-card" href={characterPath(locale,'wuwa',c.id)} key={c.id}>{art&&<img src={art.url} alt="" width={art.width} height={art.height} loading="lazy" decoding="async"/>}<span><strong>{rosterCopy(c.name,locale)}</strong>{art?.locale&&art.locale!=='neutral'&&art.locale!==locale&&<small>{languageLabel(art.locale,locale)} · {({ko:'원본',en:'Original',ja:'原文',zh:'原文'})[locale]}</small>}</span><span>{({ko:'공식 발표',en:'Official announcement',ja:'公式発表',zh:'官方公告'})[locale]} ↗</span></a>})}</div></section>;
}
