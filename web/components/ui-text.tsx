'use client';
import type {ReactNode} from 'react';
import {useCatalog} from './catalog-context';
import {textAppearanceStyle} from '@/lib/text-appearance';
import type {ui} from '@/lib/i18n';
import {Pencil} from 'lucide-react';
/** UI labels retain plain string identities; only their saved presentation changes. */
export default function UiText({name,children}:{name:string;children:ReactNode}){
 const {settings={},locale='ko',editMode,openEditor,t}=useCatalog(),style=settings.uiTextStyle?.[locale]?.[name as keyof typeof ui.ko];
 const text=style?<span style={{...textAppearanceStyle(style),...(style.bodyFormat?.align?{display:'block',width:'100%'}:{})}}>{children}</span>:children;
 if(!editMode||!(name in t))return text;
 const label=({ko:'이 문구 편집',en:'Edit this label',ja:'この文言を編集',zh:'编辑此文本'})[locale],open=()=>openEditor({tab:'text',textKey:name});
 return <>{text}<span className="ui-field-pencil" role="button" tabIndex={0} title={label} aria-label={label} onClick={e=>{e.preventDefault();e.stopPropagation();open();}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();open();}}}><Pencil size={10}/></span></>;
}
