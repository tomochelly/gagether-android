'use client';
import {Component,type ReactNode} from 'react';
import type {Locale} from '@/lib/types';

// Editor rendering/import failures must not replace the public page with an error screen.
export default class OwnerEditorBoundary extends Component<{children:ReactNode;locale:Locale;onClose:()=>void},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){
  if(!this.state.failed)return this.props.children;
  const t={ko:['편집 화면을 열지 못했습니다.','다시 시도','닫기'],en:['Could not open the editor.','Retry','Close'],ja:['編集画面を開けませんでした。','再試行','閉じる'],zh:['无法打开编辑器。','重试','关闭']}[this.props.locale];
  return <section className="owner-inline-form" role="alert"><p>{t[0]}</p><button type="button" onClick={()=>this.setState({failed:false})}>{t[1]}</button><button type="button" onClick={this.props.onClose}>{t[2]}</button></section>;
 }
}
