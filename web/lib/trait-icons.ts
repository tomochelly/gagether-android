import catalog from '../content/trait-icons.json' with {type:'json'};
import type {EntityTrait,GameIcon,Locale} from './types';
/** Reuse only a reviewed icon for the same game's exact trait/value, across service languages. */
export function traitIcon(gameId:string|undefined,trait:EntityTrait):GameIcon|undefined{
 if(trait.icon)return trait.icon;
 if(!gameId)return undefined;
 const id=gameId==='bluearchive'?({'attack-type':'attack','armor-type':'armor','weapon-type':'weapon'} as Record<string,string>)[trait.id]||trait.id:trait.id;
 const matches=catalog.filter(row=>row.gameId===gameId&&row.id===id&&(['ko','en','ja','zh'] as Locale[]).some(locale=>!!trait.value[locale]&&row.values[locale].includes(trait.value[locale])));
 const unique=new Map(matches.map(row=>[row.icon.image,row.icon]));
 return unique.size===1?[...unique.values()][0]:undefined;
}

/** Blue Archive uses the native white sword/shield on its type color. */
export function traitTone(gameId:string|undefined,trait:EntityTrait){
 if(gameId!=='bluearchive'||!['attack','armor','attack-type','armor-type'].includes(trait.id))return '';
 const values=Object.values(trait.value);
 const groups=[['explosive',['Explosive','Explosion','폭발','爆発','爆发','Light Armor','경장갑','軽装備','轻装甲']],['piercing',['Piercing','관통','貫通','贯通','Heavy Armor','중장갑','重装甲']],['mystic',['Mystic','신비','神秘','Special Armor','특수장갑','特殊装甲']],['sonic',['Sonic','진동','振動','振动','Elastic Armor','탄력장갑','弾力装甲','弹性装甲']],['normal',['Normal','일반','ノーマル','普通','Normal Armor','일반장갑','通常装甲','普通装甲']]] as const;
 return groups.find(([,names])=>values.some(v=>(names as readonly string[]).includes(v)))?.[0]?'ba-type-'+groups.find(([,names])=>values.some(v=>(names as readonly string[]).includes(v)))![0]:'';
}
