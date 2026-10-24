import type {CSSProperties} from 'react';
import type {Entry,Locale,TextAppearance} from './types';
export const normalizeLineBreaks=(value:string)=>value.replace(/\r\n?/g,'\n');
export function authoredField(entry:Entry,field:string){return !!entry.editor?.fields.includes(field);}
export function textAppearance(entry:Entry|undefined,locale:Locale){return entry?.textStyle?.[locale];}
export function textAppearanceStyle(value:TextAppearance|undefined,role:'title'|'body'='body'):CSSProperties{
 const size=role==='title'?value?.titleSize:value?.bodySize;
 return {fontSize:size?size+'px':undefined,lineHeight:value?.lineHeight,whiteSpace:'pre-wrap',wordBreak:'keep-all',overflowWrap:'break-word'};
}
