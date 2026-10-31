import catalog from '../content/entity-catalog.json' with {type:'json'};
import type {Entry,EntityProfile,Localized,Locale} from './types';
const locales:Locale[]=['ko','en','ja','zh'];
function sameName(a:Localized,b:Localized){const common=locales.filter(l=>a[l]?.trim()&&b[l]?.trim());return common.length>0&&common.every(l=>a[l].trim()===b[l].trim());}
/** Match exact entity/outfit names and actual service, never dates or neighboring cards. */
export function enrichEntityDetails(entry:Entry):Entry{
 if(entry.kind!=='pickup'&&entry.kind!=='weapon')return entry;
 const names=entry.pickupMembers?.length?entry.pickupMembers.filter(m=>!m.role||m.role==='featured').map(m=>m.name):[entry.title];
 const matches=catalog.filter(def=>def.gameId===entry.gameId&&def.kind===entry.kind&&(!('regions' in def)||!def.regions||def.regions.includes(entry.region))&&names.some(name=>def.names.some(alias=>sameName(name,alias))));
 if(!matches.length)return entry;
 const profiles=[...entry.entityDetails||[]];let changed=false;
 for(const match of matches){
  const data=match.profile as EntityProfile,index=profiles.findIndex(p=>p.id===data.id||sameName(p.name,data.name));
  if(index<0){profiles.push(data);changed=true;continue;}
  const old=profiles[index];
  const next={...old,stats:old.stats.length?old.stats:data.stats,traits:[...old.traits||[],...data.traits?.filter(t=>!old.traits?.some(o=>o.id===t.id))||[]],groups:old.groups.length?old.groups:data.groups,materials:old.materials?.length?old.materials:data.materials,basis:old.stats.length?old.basis:data.basis,statSourceKind:old.stats.length?old.statSourceKind:data.statSourceKind};
  // A known catalog enrichment supplies no schedule, artwork, rewards or owner fields.
  if(JSON.stringify(next)!==JSON.stringify(old)){next.sources=[...new Map([...old.sources,...data.sources].map(s=>[s.url,s])).values()].slice(0,10);next.verifiedAt=[old.verifiedAt,data.verifiedAt].sort().at(-1)!;profiles[index]=next;changed=true;}
 }
 return changed?{...entry,entityDetails:profiles}:entry;
}
