'use client';
import type {GameIcon,Locale} from '@/lib/types';
import {PhotoField} from './photo-field';
import {studioText} from '@/lib/studio-i18n';
export function IconEditor({value,onChange,locale}:{value?:GameIcon;onChange:(value:GameIcon|undefined)=>void;locale:Locale}){
 const change=(p:Partial<GameIcon>)=>p.image===''?onChange(undefined):onChange({...value||{image:'',imageSource:'https://',width:1,height:1,verifiedAt:new Date().toISOString()},...p});
 return <div className="editor-icon-field"><PhotoField value={{...value,imageVerified:!!value?.image,imageLocale:'neutral'}} locale={locale} cropPreview={false} label={studioText[locale].icon} onChange={p=>change(Object.fromEntries(Object.entries(p).filter(([k,v])=>['image','imageSource'].includes(k)&&v!==undefined)))} onAsset={a=>onChange({image:a.image,imageSource:a.imageSource,width:a.width,height:a.height,verifiedAt:a.verifiedAt})}/></div>;
}
