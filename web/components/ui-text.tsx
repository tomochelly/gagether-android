'use client';
import type {ReactNode} from 'react';
import {useCatalog} from './catalog-context';
import {textAppearanceStyle} from '@/lib/text-appearance';
import type {ui} from '@/lib/i18n';
/** UI labels retain plain string identities; only their saved presentation changes. */
export default function UiText({name,children}:{name:string;children:ReactNode}){
 const {settings={},locale='ko'}=useCatalog(),style=settings.uiTextStyle?.[locale]?.[name as keyof typeof ui.ko];
 return style?<span style={{...textAppearanceStyle(style),...(style.bodyFormat?.align?{display:'block',width:'100%'}:{})}}>{children}</span>:children;
}
