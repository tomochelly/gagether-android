'use client';
import {useContext,useEffect,useId,useRef,useState} from 'react';
import {Image as ImageIcon,Upload,RotateCcw,X} from 'lucide-react';
import type {ArtworkAsset,EntityArtwork,Locale} from '@/lib/types';
import {editingArtwork,patchArtworkSlot,replaceArtworkSlot,assetFromArtwork,type ArtworkSlot} from '@/lib/editor-artwork';
import {replacementArtwork} from '@/lib/editor-preview';
import {previewFocus} from '@/lib/artwork';
import {editorText} from '@/lib/editor-i18n';
import {ownerUi} from '@/lib/owner-ui';
import {OwnerUploadContext} from './owner-upload-context';
import PhotoPositionEditor from './photo-position-editor';
import type {FrameBox} from '@/lib/image-framing';
import ArtworkMedia from './artwork-media';
let activePhotoReplacement:string|null=null;
const names={ko:'한국어',en:'English',ja:'日本語',zh:'中文'};
export async function imageDimensions(url:string):Promise<{width:number;height:number}>{return new Promise((resolve,reject)=>{const image=new Image(),timer=setTimeout(()=>{image.src='';reject(new Error('Image could not be decoded.'));},15000);image.onload=()=>{clearTimeout(timer);image.naturalWidth&&image.naturalHeight?resolve({width:image.naturalWidth,height:image.naturalHeight}):reject(new Error('Image dimensions unavailable.'));};image.onerror=()=>{clearTimeout(timer);reject(new Error('Image could not be loaded.'));};image.src=url;});}
export function PhotoField({value,onChange,onAsset,locale,editingLocale,serviceLocale,label,cropPreview=true,onBusyChange,frameBox}:{value:EntityArtwork;onChange:(patch:Partial<EntityArtwork>)=>void;onAsset?:(asset:ArtworkAsset)=>void;locale:Locale;editingLocale?:Locale;serviceLocale?:Locale;label?:string;cropPreview?:boolean;onBusyChange?:(id:string,busy:boolean)=>void;frameBox?:FrameBox}){
 const localized=cropPreview&&!onAsset;
 const [slot,setSlot]=useState<ArtworkSlot>(editingLocale||serviceLocale||locale);
 useEffect(()=>{setSlot(editingLocale||serviceLocale||locale);},[editingLocale,serviceLocale,locale]);
 const [dimensions,setDimensions]=useState<{width:number;height:number}>();
 const selected=localized?editingArtwork(value,slot):value;
 useEffect(()=>{let active=true;setDimensions(undefined);if(selected.image)void imageDimensions(selected.image).then(size=>{if(active)setDimensions(size);},()=>{});return()=>{active=false;};},[selected.image]);
 const anotherUpload={ko:'다른 사진의 업로드를 완료하거나 취소한 후 진행해 주세요.',en:'Complete or cancel the other image upload first.',ja:'別の画像のアップロードを完了または取り消してください。',zh:'请先完成或取消另一张图片的上传。'}[locale];
 const uploadContext=useContext(OwnerUploadContext);onBusyChange=onBusyChange||uploadContext;
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[full,setFull]=useState(false),[localPreview,setLocalPreview]=useState(''),[url,setUrl]=useState(selected.image||''),[pending,setPending]=useState(false),[drag,setDrag]=useState(false);
 const input=useRef<HTMLInputElement>(null),controller=useRef<AbortController|null>(null),preview=useRef(''),retryFile=useRef<File|null>(null),id=useId(),latest=useRef({onChange,onAsset,onBusyChange,value});latest.current={onChange,onAsset,onBusyChange,value};const t=editorText[locale],focus=previewFocus(selected),imageLocale=localized?slot:value.imageLocale||serviceLocale||locale;
 const update=(p:Partial<EntityArtwork>)=>onChange(localized?patchArtworkSlot(value,slot,p,dimensions):p);
 const copy={ko:{drop:'사진을 끌어 놓거나 클립보드 이미지를 붙여넣으세요. 원본은 그대로 저장하고 아래 틀에서 구도를 조정합니다. 최대 25 MB.',apply:'주소 적용',retry:'다시 업로드',cancel:'교체 취소',language:'이미지 언어',size:'PNG·JPEG·WebP·AVIF, 최대 25 MB 이미지를 선택하세요.'},en:{drop:'Drop or paste an image. The original is preserved; adjust framing in the guide below. Up to 25 MB.',apply:'Apply URL',retry:'Retry upload',cancel:'Cancel replacement',language:'Image language',size:'Choose PNG, JPEG, WebP or AVIF up to 25 MB.'},ja:{drop:'画像をドロップ、または貼り付け。原本を保持し、下の枠で構図を調整できます。25 MBまで。',apply:'URLを適用',retry:'再アップロード',cancel:'差し替え取消',language:'画像の言語',size:'25 MBまでのPNG・JPEG・WebP・AVIFを選択してください。'},zh:{drop:'拖放或粘贴图片。保留原图，可在下方调整构图。最多25 MB。',apply:'应用地址',retry:'重新上传',cancel:'取消替换',language:'图片语言',size:'请选择不超过25 MB的PNG、JPEG、WebP或AVIF。'}}[locale];
 useEffect(()=>setUrl(selected.image||''),[selected.image,slot]);
 useEffect(()=>()=>{if(activePhotoReplacement===id)activePhotoReplacement=null;controller.current?.abort();if(preview.current)URL.revokeObjectURL(preview.current);latest.current.onBusyChange?.(id,false);},[id]);
 function clear(){if(activePhotoReplacement===id)activePhotoReplacement=null;if(preview.current)URL.revokeObjectURL(preview.current);preview.current='';retryFile.current=null;setLocalPreview('');setPending(false);latest.current.onBusyChange?.(id,false);}
 function cancel(){controller.current?.abort();controller.current=null;clear();setBusy(false);setError('');setUrl(selected.image||'');}
 async function commit(next:string,dimensions?:{width:number;height:number},signal?:AbortSignal){
  const patch=replacementArtwork(next,window.location.origin,imageLocale);
  const size=dimensions||(next?await imageDimensions(next):{width:1,height:1});
  if(signal?.aborted)return;
  if(latest.current.onAsset){latest.current.onAsset(assetFromArtwork(patch,size,new Date().toISOString()));return;}
  if(!localized){latest.current.onChange(patch);return;}
  const current=latest.current.value;
  const backup=slot==='neutral'&&current.image&&current.imageLocale&&current.imageLocale!=='neutral'&&!current.localizedArtwork?.[current.imageLocale]?assetFromArtwork(current,await imageDimensions(current.image),new Date().toISOString()):undefined;
  if(signal?.aborted)return;
  latest.current.onChange(replaceArtworkSlot(current,slot,next,window.location.origin,size,backup));
 }
 async function upload(file?:File){if(!file||controller.current)return;if(!/^image\/(png|jpeg|webp|avif)$/.test(file.type)||!file.size||file.size>25*1024*1024){setError(copy.size);return;}if(activePhotoReplacement&&activePhotoReplacement!==id){setError(anotherUpload);return;}activePhotoReplacement=id;setError('');setBusy(true);setPending(true);latest.current.onBusyChange?.(id,true);const request=new AbortController();controller.current=request;retryFile.current=file;
  try{if(preview.current)URL.revokeObjectURL(preview.current);preview.current=URL.createObjectURL(file);setLocalPreview(preview.current);const dimensions=await imageDimensions(preview.current);if(request.signal.aborted)return;const body=new FormData();body.append('image',file);const response=await fetch('/api/editor/upload',{method:'POST',body,signal:request.signal}),data=await response.json() as {url?:string;error?:string};if(!response.ok||!data.url)throw new Error(data.error||t.failed);if(!request.signal.aborted){await commit(data.url,dimensions,request.signal);clear();}}
  catch(e){if(!request.signal.aborted)setError(e instanceof Error?e.message:t.failed);}
  finally{if(controller.current===request){controller.current=null;setBusy(false);}}
 }
 async function applyUrl(){if(controller.current)return;if(activePhotoReplacement&&activePhotoReplacement!==id){setError(anotherUpload);return;}activePhotoReplacement=id;const request=new AbortController();controller.current=request;setError('');setBusy(true);setPending(true);latest.current.onBusyChange?.(id,true);try{const dimensions=url?await imageDimensions(url):{width:1,height:1};if(!request.signal.aborted){await commit(url,dimensions,request.signal);clear();}}catch(e){if(!request.signal.aborted)setError(e instanceof Error?e.message:t.failed);}finally{if(controller.current===request){controller.current=null;setBusy(false);}}}
 const adjust=(axis:'x'|'y'|'zoom',next:number)=>update({previewFocus:{...focus,[axis]:next}});
 return <div className={'editor-photo'+(drag?' is-dragging':'')} data-editor-section="image" aria-busy={busy} onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();e.stopPropagation();setDrag(false);void upload(e.dataTransfer.files[0]);}} onPaste={e=>{const f=[...e.clipboardData.items].find(i=>i.type.startsWith('image/'))?.getAsFile();if(f){e.preventDefault();void upload(f);}}}>
  <div className="editor-photo-top"><strong>{label||t.image}</strong><button type="button" className="editor-small-button" disabled={busy} onClick={()=>input.current?.click()}><Upload size={13}/>{busy?t.uploading:t.upload}</button><input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/avif" hidden onChange={e=>{void upload(e.target.files?.[0]);e.target.value='';}}/></div><p className="editor-photo-help">{copy.drop}</p><div className="editor-photo-preview">{localPreview?<img src={localPreview} alt={t.preview} style={{objectFit:'contain'}}/>:selected.image?(cropPreview?<ArtworkMedia editorPreview locale={locale} serviceLocale={imageLocale==='neutral'?undefined:imageLocale} art={selected} alt={t.preview} mode={full?'full':'preview'}/>:<img src={selected.image} alt={t.preview} style={{objectFit:'contain'}}/>):<ImageIcon size={30}/>}</div>
  {cropPreview&&<><div className="editor-art-tabs"><button type="button" aria-pressed={!full} onClick={()=>setFull(false)}>{t.preview}</button><button type="button" aria-pressed={full} onClick={()=>setFull(true)}>{t.fullIllustration}</button></div><label className="editor-field"><span>{copy.language}</span><select disabled={busy||pending} value={imageLocale} onChange={e=>localized?setSlot(e.target.value as ArtworkSlot):onChange({imageLocale:e.target.value as EntityArtwork['imageLocale']})}>{Object.entries(names).map(([k,v])=><option key={k} value={k}>{v}</option>)}<option value="neutral">{{ko:'무문자 · 공통',en:'No text · shared',ja:'文字なし・共通',zh:'无文字・通用'}[locale]}</option></select></label></>}
  {cropPreview&&selected.image&&!pending&&<PhotoPositionEditor key={slot+selected.image} art={selected} onChange={update} locale={locale} serviceLocale={imageLocale==='neutral'?undefined:imageLocale} initialBox={frameBox}/>}
  <div className="owner-url-input"><label className="editor-field"><span>{t.url}</span><input value={url} disabled={busy} onChange={e=>setUrl(e.target.value)} placeholder="https://…"/></label><button type="button" className="editor-small-button" disabled={busy||url===(selected.image||'')} onClick={()=>void applyUrl()}>{copy.apply}</button></div>
  <details><summary>{ownerUi[locale].autoPhoto}</summary><div className="editor-grid"><label className="editor-field"><span>{t.source}</span><input value={selected.imageSource||''} onChange={e=>update({imageSource:e.target.value||undefined})}/></label>{cropPreview&&!selected.imageFraming&&(['x','y','zoom'] as const).map(axis=><label className="editor-field" key={axis}><span>{axis==='x'?t.positionX:axis==='y'?t.positionY:t.previewZoom} · {focus[axis]}</span><input type="range" min={axis==='zoom'?1:0} max={axis==='zoom'?6:100} step={axis==='zoom'?0.05:1} value={focus[axis]} onChange={e=>adjust(axis,Number(e.target.value))}/></label>)}</div></details>
  {pending&&<div className="owner-inline-actions">{error&&retryFile.current&&<button type="button" disabled={busy} onClick={()=>void upload(retryFile.current!)}><RotateCcw size={13}/>{copy.retry}</button>}<button type="button" onClick={cancel}><X size={13}/>{copy.cancel}</button></div>}{error&&<p className="editor-error" role="alert">{error}</p>}
 </div>;
}
