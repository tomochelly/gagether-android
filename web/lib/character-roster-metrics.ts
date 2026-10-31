import {rosterCopy,type RosterCharacter} from './character-roster';
import type {Locale} from './types';

type Growth=NonNullable<RosterCharacter['statGrowth']>;
type Skill=NonNullable<RosterCharacter['skillTables']>[number];
const starBonuses={hp:[0,500,700,900,1400],attack:[0,1000,1200,1400,1700],healing:[0,750,1000,1200,1500],none:[0,0,0,0,0]};

/** SchaleDB's Standard interpolation, including both published rounding stages.
 * The level100 endpoint is an anchor; maxLevel separately bounds the selector. */
export function rosterGrowthValue(growth:Growth,stat:Growth['stats'][number],level:number){
 if(!Number.isInteger(level)||level<growth.minLevel||level>growth.maxLevel)throw Error('Level outside source range');
 const scale=Number(((level-1)/99).toFixed(4));
 const base=Math.round(Number((stat.base+(stat.anchor-stat.base)*scale).toFixed(4)));
 const bonus=starBonuses[stat.bonus].slice(0,growth.starGrade).reduce((sum,n)=>sum+n,0);
 return String(Math.ceil(Number((base*(1+bonus/10000)).toFixed(4))));
}
export function rosterSkillValue(levels:string[],rank:number){return levels.length===1?levels[0]:levels[rank-1]||undefined;}
export function rosterSkillMaxLevel(skill:Skill){return skill.maxLevel||Math.max(1,...skill.values.map(v=>v.levels.length));}
export function rosterSkillDescriptionLocale(skill:Skill,locale:Locale){
 const text=skill.descriptionTemplate||skill.description;
 return [...new Set([locale,'en','ja','zh','ko'] as Locale[])].find(l=>text?.[l]);
}
export function rosterSkillDescription(skill:Skill,locale:Locale,rank:number){
 if(!skill.descriptionTemplate)return rosterCopy(skill.description,locale);
 const native=rosterSkillDescriptionLocale(skill,locale);
 if(!native)return '';
 return skill.descriptionTemplate[native].replace(/\{(\d+)\}/g,(_,index)=>rosterSkillValue((skill.parameters?.[native]||skill.parameters?.en)?.[Number(index)-1]||[],rank)||'');
}
