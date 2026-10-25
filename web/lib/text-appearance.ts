import type {CSSProperties} from 'react';
import type {Entry,Locale,TextAppearance} from './types';
export const normalizeLineBreaks=(value:string)=>value.replace(/\r\n?/g,'\n');
export function authoredField(entry:Entry,field:string){return !!entry.editor?.fields.includes(field);}
export function textAppearance(entry:Entry|undefined,locale:Locale){return entry?.textStyle?.[locale];}
export function textAppearanceStyle(value:TextAppearance|undefined,role:'title'|'body'='body'):CSSProperties{
 const size=role==='title'?value?.titleSize:value?.bodySize,format=role==='title'?value?.titleFormat:value?.bodyFormat;
 return {fontSize:size?size+'px':undefined,lineHeight:value?.lineHeight,fontWeight:format?.bold===undefined?undefined:format.bold?700:400,fontStyle:format?.italic===undefined?undefined:format.italic?'italic':'normal',textDecoration:format?.underline||format?.strike?[format.underline?'underline':'',format.strike?'line-through':''].filter(Boolean).join(' '):undefined,textAlign:format?.align,color:format?.color,whiteSpace:'pre-wrap',wordBreak:'keep-all',overflowWrap:'break-word'};
}
