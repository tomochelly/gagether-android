'use client';
import {useState} from 'react';
import {materialCopy,materialLocale,materialWords,materialGroupsForService,type RosterMaterialGroup} from '@/lib/roster-materials';
import type {Locale,Region} from '@/lib/types';
import type {RosterCharacter} from '@/lib/character-roster';
import RosterSourceLink from './roster-source-link';
function MaterialIcon({item}:{item:RosterMaterialGroup['items'][number]}){
 const [failed,setFailed]=useState('');if(!item.icon||failed===item.icon)return null;
 const sprite=item.sprite,scale=sprite?48/Math.max(sprite.width,sprite.height):1;
 return <span className="roster-material-icon" aria-hidden="true">{sprite?<span className="roster-material-sprite" style={{width:sprite.width*scale,height:sprite.height*scale}}><img src={item.icon} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={()=>setFailed(item.icon!)} style={{transform:`translate(${-sprite.x*scale}px,${-sprite.y*scale}px) scale(${scale})`}}/></span>:<img src={item.icon} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={()=>setFailed(item.icon!)}/>}</span>;
}
function MaterialCategory({groups,locale}:{groups:RosterMaterialGroup[];locale:Locale}){
 const [selected,setSelected]=useState(groups[0].id),group=groups.find(g=>g.id===selected)||groups[0],t=materialWords[locale];
 return <section className="roster-material-category"><header><h4>{materialCopy(group.category||group.title,locale)}</h4>{groups.length>1&&<label><span>{t.stage}</span><select aria-label={materialCopy(group.category||group.title,locale)+' · '+t.stage} value={group.id} onChange={e=>setSelected(e.target.value)}>{groups.map(g=><option key={g.id} value={g.id}>{materialCopy(g.title,locale)}</option>)}</select></label>}</header>{group.category&&<p className="roster-material-condition">{materialCopy(group.title,locale)}</p>}<ul>{group.items.map((item,index)=><li key={item.id+':'+index}><MaterialIcon item={item}/><span><strong lang={materialLocale(item.name,locale)}>{materialCopy(item.name,locale)}</strong><b>× {typeof item.quantity==='number'?new Intl.NumberFormat(locale).format(item.quantity):item.quantity}</b></span></li>)}</ul></section>;
}
export default function RosterMaterials({character,locale,service,originalSections=[]}:{character:RosterCharacter;locale:Locale;service:Region;originalSections?:NonNullable<RosterCharacter['sections']>}){
 const groups=materialGroupsForService(character.materialGroups,service),t=materialWords[locale];if(!groups.length)return null;
 const categories=new Map<string,RosterMaterialGroup[]>();for(const group of groups){const id=group.categoryId||group.id;categories.set(id,[...categories.get(id)||[],group]);}
 return <section className="roster-materials" data-character-section="materials"><h3>{t.heading(materialCopy(character.name,locale))}</h3>{[...categories].map(([id,items])=><MaterialCategory key={character.id+':'+service+':'+id} groups={items} locale={locale}/>)}{originalSections.length>0&&<details className="roster-material-original"><summary>{t.original}</summary>{originalSections.map(s=><section key={s.id}><h4>{materialCopy(s.title,locale)}</h4><p>{materialCopy(s.body,locale)}</p></section>)}</details>}</section>;
}
export function RosterMaterialSources({groups,locale,service}:{groups:RosterMaterialGroup[]|undefined;locale:Locale;service:Region}){
 return <>{[...new Map(materialGroupsForService(groups,service).map(g=>[g.sourceUrl,g])).values()].map(g=><RosterSourceLink key={g.sourceUrl} href={g.sourceUrl} locale={locale}>{materialWords[locale].source} · {(g.sourceKind==='official'?{ko:'공식',en:'Official',ja:'公式',zh:'官方'}:{ko:'커뮤니티',en:'Community',ja:'コミュニティ',zh:'社区'})[locale]} · {new URL(g.sourceUrl).hostname}</RosterSourceLink>)}</>;
}
