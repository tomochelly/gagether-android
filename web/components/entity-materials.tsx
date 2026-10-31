'use client';
import type {MaterialGroup,Locale} from '@/lib/types';
import {NativeIcon} from './reward-display';
export default function EntityMaterials({groups,locale}:{groups:MaterialGroup[];locale:Locale}){
 return <div className="entity-materials">{groups.map(group=><section className="material-group" key={group.id}><h5>{group.title[locale]}</h5>{group.basis?.[locale]&&<p>{group.basis[locale]}</p>}<ul>{group.items.map(item=>{const name=item.name?.[locale]?.trim();return <li className={!name?'material-icon-only':''} key={item.id} title={name}><NativeIcon icon={item.icon} alt={name||{ko:'재료',en:'Material',ja:'素材',zh:'材料'}[locale]}/><span>{name&&<strong>{name}</strong>}<b>×{item.quantity}</b></span></li>;})}</ul></section>)}</div>;
}
