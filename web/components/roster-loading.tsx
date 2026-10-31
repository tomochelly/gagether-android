import type {CSSProperties} from 'react';
import type {Locale} from '@/lib/types';

const copy={
 ko:['도감을 불러오는 중…','상세 정보를 불러오는 중…'],
 en:['Loading character database…','Loading character details…'],
 ja:['図鑑を読み込み中…','詳細情報を読み込み中…'],
 zh:['正在加载图鉴…','正在加载角色详情…'],
};

/** Indeterminate activity only: no progress estimate, timer or extra request. */
export default function RosterLoading({locale,detail=false,label,compact=false,accent}:{locale:Locale;detail?:boolean;label?:string;compact?:boolean;accent?:string}){
 return <div className={'roster-loading'+(compact?' roster-loading-compact':'')} role="status" aria-live="polite" aria-atomic="true" style={accent?{'--loading-accent':accent} as CSSProperties:undefined}>
  <span className="roster-loading-label">{label||copy[locale][detail?1:0]}</span>
  <div className="roster-loading-track" aria-hidden="true"><span/></div>
 </div>;
}
