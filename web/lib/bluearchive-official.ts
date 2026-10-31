import reviewedBanners from '../content/bluearchive-reviewed-banners.json' with {type:'json'};
import reviewedEvents from '../content/bluearchive-reviewed-events.json' with {type:'json'};
import names from '../content/bluearchive-native-names.json' with {type:'json'};
import type {Entry,Localized,SourceBody} from './types';
import {sameEditValue} from './inline-edit';
const norm=(s:string)=>s.normalize('NFKC').replace(/\s+/g,'');
const blank=():Localized=>({ko:'',en:'',ja:'',zh:''});
const dictionary=new Map(names.map(c=>[norm(c.name.ko),c.name as Localized]));
const date=(y:number,m:number,d:number)=>{const s=`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;if(new Date(s+'T00:00:00Z').toISOString().slice(0,10)!==s)throw Error('Invalid Korean notice date');return s;};
const period=/(\d{1,2})\s*월\s*(\d{1,2})\s*일\s*\([^)]+\)\s*(점검\s*후|(?:오전|오후)\s*\d{1,2}\s*시(?:\s*\d{1,2}\s*분)?)\s*[~～]\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일\s*\([^)]+\)\s*((?:오전|오후)\s*\d{1,2}\s*시(?:\s*\d{1,2}\s*분)?)/;
function windowOf(text:string,year:number,month:number){
 const m=period.exec(text);if(!m)throw Error('Missing explicit Korean notice period');
 const startYear=year+(+m[1]<month-6?1:+m[1]>month+6?-1:0),startDate=date(startYear,+m[1],+m[2]),endDate=date(startYear+(+m[4]<+m[1]?1:0),+m[4],+m[5]);
 const clock=(s:string,d:string)=>{const t=/(오전|오후)\s*(\d+)\s*시(?:\s*(\d+)\s*분)?/.exec(s);if(!t)return null;const h=+t[2]%12+(t[1]==='오후'?12:0),min=+(t[3]||0);if(+t[2]<1||+t[2]>12||min>59)throw Error('Invalid Korean notice clock');return `${d}T${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}:00+09:00`;};
 const startAt=clock(m[3],startDate),endAt=clock(m[6],endDate);if(startDate>endDate||startAt&&endAt&&Date.parse(startAt)>=Date.parse(endAt))throw Error('Invalid Korean notice window');return {startDate,endDate,startAt,endAt};
}
type Window=ReturnType<typeof windowOf>;
const firstDay=(e:Entry)=>e.startDate||e.startAt?.slice(0,10)||e.pickupArchive?.startDate;
function officialBody(e:Entry):SourceBody|undefined{
 if(e.kind!=='update'||e.gameId!=='bluearchive'||e.region!=='kr'||e.sourceLocale!=='ko'||e.sourceKind!=='official')return;
 const u=new URL(e.sourceUrl);if(u.origin!=='https://forum.nexon.com'||u.pathname!=='/bluearchive/board_view'||!['1018','1076'].includes(u.searchParams.get('board')||''))return;
 const b=e.sourceBodies?.ko;if(b?.sourceKind==='official'&&b.sourceUrl===e.sourceUrl&&b.bodyHash&&b.text)return b;
}
/** Same-service native declarations only; no headline guesses or fixed JP/KR lag. */
export function blueArchiveOfficialChanges(entries:Entry[],checkedAt:string){
 const scoped=entries.filter(e=>e.gameId==='bluearchive'&&e.region==='kr'),result=new Map<string,{before?:Entry;after:Entry}>();
 const knownMember=(name:string)=>scoped.flatMap(e=>e.pickupMembers||[]).filter(m=>norm(m.name.ko)===norm(name)).sort((a,b)=>Number(!!b.imageVerified)-Number(!!a.imageVerified))[0];
 const apply=(source:Entry,body:SourceBody,w:Window,subjects:{name:string;type:'new'|'rerun'|'unknown'}[],selection=false)=>{
  const keys=subjects.map(s=>norm(s.name)).sort(),existing=scoped.find(e=>e.kind==='pickup'&&!!e.selectionCount===selection&&firstDay(e)===w.startDate&&sameEditValue((e.pickupMembers?.length?e.pickupMembers.filter(m=>m.role!=='rate-up').map(m=>norm(m.name.ko)):[norm(e.title.ko)]).sort(),keys));
  const title:Localized=selection?{ko:`리콜렉트 모집 · ${subjects.length}명 중 1명 선택`,en:`Recollect Recruitment · choose 1 of ${subjects.length}`,ja:`リコレクト募集・${subjects.length}人から1人指定`,zh:`回忆招募·${subjects.length}选一`}:Object.fromEntries(['ko','en','ja','zh'].map(l=>[l,subjects.map(s=>(dictionary.get(norm(s.name))||knownMember(s.name)?.name)?.[l as keyof Localized]||(l==='ko'?s.name:'')).filter(Boolean).join(' / ')])) as Localized;
  const members=subjects.map(s=>({...knownMember(s.name),name:{...(dictionary.get(norm(s.name))||knownMember(s.name)?.name||blank()),ko:s.name},type:s.type,rarity:3,role:selection?'candidate' as const:'featured' as const}));
  const caption={ko:'한국 공식 복각 모집 배너 · 전체 구도',en:'Official Korean rerun recruitment banner · complete composition',ja:'韓国公式復刻募集バナー・全体構図',zh:'韩服官方复刻招募横幅·完整构图'};
  for(const member of members){const a=reviewedBanners.find(a=>a.name===member.name.ko&&a.startDate===w.startDate);if(a){const art={image:a.image,imageSource:a.sourceUrl,width:a.width,height:a.height,verifiedAt:a.verifiedAt,imageKind:'banner' as const,imageFit:'contain' as const,imageLocale:'ko' as const,imageVerified:true,imageCaption:caption};Object.assign(member,art,{localizedArtwork:{...member.localizedArtwork,ko:art},previewArtwork:undefined,previewBounds:undefined,previewFocus:undefined,imagePosition:undefined,textFreePreview:undefined,imageFraming:undefined});}}
  const note={ko:'한국 공식 모집 일정. 점검 후 시작의 정확한 시각은 별도 확인 전까지 비워 둡니다.',en:'Official Korean recruitment schedule. A post-maintenance start has no inferred exact time.',ja:'韓国公式募集日程。メンテナンス後の開始時刻は推測しません。',zh:'韩服官方招募日程；维护后开始不推算具体时间。'};
  const id=existing?.id||`ba-kr-official-${w.startDate.replaceAll('-','')}-${selection?'recollect':'character'}`;
  const after:Entry={...existing,id,gameId:'bluearchive',region:'kr',server:'한국 서비스',kind:'pickup',poolType:'character',title:existing?.title||title,summary:selection?{ko:`대상 ${subjects.length}명 중 1명을 지정하는 리콜렉트 모집. 모집 포인트는 일반 모집과 별도로 집계됩니다.`,en:`Choose one of ${subjects.length} candidates. Recollect points are separate from regular recruitment.`,ja:`${subjects.length}人から1人を指定。ポイントは通常募集と別集計。`,zh:`从${subjects.length}位候选中指定一位；招募点数独立累计。`}:{ko:subjects.map(s=>s.name).join(' · ')+' 개별 픽업 모집',en:subjects.map(s=>dictionary.get(norm(s.name))?.en||s.name).join(' · ')+' individual recruitment',ja:'各対象生徒の個別ピックアップ募集',zh:'各对象学生的独立精选招募'},...w,pickupArchive:{status:'announced',startDate:w.startDate,endDate:w.endDate,note},pickupGroup:`ba-kr-${w.startDate}-${selection?'recollect':'character'}`,pickupType:subjects.every(s=>s.type==='rerun')?'rerun':subjects.every(s=>s.type==='new')?'new':subjects.every(s=>s.type==='unknown')?'unknown':'mixed',pickupMembers:members,...selection?{selectionCount:1}:{},sourceUrl:source.sourceUrl,sourceTitle:source.sourceTitle,sourceLocale:'ko',sourceKind:'official',officialLocales:['ko'],translatedLocales:['en','ja','zh'],localizationSources:{ko:source.sourceUrl},publishedAt:source.publishedAt,verifiedAt:checkedAt,sourceBodies:{...existing?.sourceBodies,ko:body},timingNote:note,relatedSources:[...existing?.relatedSources||[],...existing?.sourceUrl&&existing.sourceUrl!==source.sourceUrl?[{kind:existing.sourceKind||'official',url:existing.sourceUrl,title:existing.sourceTitle}]:[]]};
  if(!selection&&members[0]?.imageVerified){const m=members[0];for(const k of ['image','imageSource','imageKind','imageFit','imageLocale','imageVerified','imageCaption','previewFocus','imagePosition'] as const)if(m[k]!==undefined)(after as any)[k]=m[k];after.localizedArtwork={...existing?.localizedArtwork,ko:m.localizedArtwork?.ko};after.previewArtwork=undefined;after.previewBounds=undefined;after.previewFocus=undefined;after.imagePosition=undefined;after.imageFraming=undefined;}
  // An older forecast of this entire same pool is superseded by the native
  // announcement even when its predicted week was wrong. Retain its full record.
  for(const old of scoped){
   if(old.id===id||old.hidden||old.pickupArchive?.status!=='forecast'||!!old.selectionCount!==selection)continue;
   const oldKeys=(old.pickupMembers||[]).filter(m=>m.role!=='rate-up').map(m=>norm(m.name.ko)).sort(),oldDay=firstDay(old);
   if(!oldDay||!sameEditValue(oldKeys,keys)||Math.abs(Date.parse(oldDay)-Date.parse(w.startDate))>14*86400000)continue;
   const note={ko:`한국 공식 공지에서 동일 모집의 시작일을 ${w.startDate}로 확정했습니다. 이전 예상 기록은 원문과 함께 보존합니다.`,en:`The Korean official notice confirms this same pool for ${w.startDate}. The superseded forecast is retained with its original source.`,ja:`韓国公式が同じ募集の開始日を${w.startDate}と確定。旧予想は原文とともに保存。`,zh:`韩服官方确认同一卡池于${w.startDate}开始，旧预测及原始来源保留。`};
   result.set(old.id,{before:old,after:{...old,hidden:true,verifiedAt:checkedAt,pickupArchive:{...old.pickupArchive,note},relatedSources:[...old.relatedSources||[],{kind:'official',url:source.sourceUrl,title:source.sourceTitle}]}});
  }
  if(!existing||!sameEditValue({...existing,verifiedAt:checkedAt},after))result.set(id,{before:existing,after});
 };
 for(const source of scoped){
  const body=officialBody(source);if(!body||!source.publishedAt||Date.parse(checkedAt)-Date.parse(source.publishedAt)>35*86400000)continue;
  const text=body.text.replace(/\s+/g,' ').replace(/\(\s*/g,'(').replace(/\s*\)/g,')'),year=+source.publishedAt.slice(0,4);
  if(/업데이트.*상세/.test(source.sourceTitle)&&/한국\s*시간\s*기준/.test(text)){
   const groups=new Map<string,{w:Window;subjects:{name:string;type:'new'|'rerun'|'unknown'}[]}>();
   const pattern=/-\s*(?:\[\s*(복각|신규)\s*\]\s*)?([^()[\]]+?)\s*\(\s*★\s*3\s*(?:,\s*([^)]*))?\)\s*(?:특별\s*)?픽업\s*모집\s*일정\s*:/g;
   for(const m of text.matchAll(pattern)){
    const name=m[2].trim()+(m[3]?'('+m[3].trim()+')':''),w=windowOf(text.slice(m.index!+m[0].length,m.index!+m[0].length+180),year,+source.publishedAt.slice(5,7)),key=w.startDate+'|'+w.endDate;
    if(!dictionary.has(norm(name))&&!knownMember(name))throw Error('Unmatched official Blue Archive outfit: '+name);
    const group=groups.get(key)||{w,subjects:[]};if(!group.subjects.some(s=>s.name===name))group.subjects.push({name,type:m[1]==='복각'?'rerun':m[1]==='신규'?'new':'unknown'});groups.set(key,group);
   }
   if(!groups.size&&/픽업\s*모집\s*일정/.test(text))throw Error('Official Blue Archive recruitment format changed: '+source.id);
   for(const group of groups.values())apply(source,body,group.w,group.subjects);
  }
  if(source.sourceUrl===reviewedEvents.sourceUrl&&body.bodyHash===reviewedEvents.bodyHash)for(const row of reviewedEvents.entries){
   const existing=scoped.find(e=>e.id===row.id),after:Entry={...existing,...row,gameId:'bluearchive',region:'kr',server:'한국 서비스',kind:'event',sourceUrl:source.sourceUrl,sourceTitle:source.sourceTitle,sourceLocale:'ko',sourceKind:'official',officialLocales:['ko'],translatedLocales:['en','ja','zh'],publishedAt:source.publishedAt,verifiedAt:checkedAt,imageVerified:existing?.imageVerified||false,sourceBodies:{...existing?.sourceBodies,ko:body}};
   if(!existing||!sameEditValue({...existing,verifiedAt:checkedAt},after))result.set(after.id,{before:existing,after});
  }
  if(/리콜렉트\s*모집\s*안내/.test(source.sourceTitle)){
   const at=text.search(/리콜렉트\s*모집\s*기간\s*:/);if(at<0)continue;
   const w=windowOf(text.slice(at,at+240),year,+source.publishedAt.slice(5,7)),line=body.text.split('\n').find(l=>l.split('/').length>=2&&l.split('/').every(n=>dictionary.has(norm(n.trim()))||knownMember(n.trim())));
   if(!line||!/한\s*명/.test(text))throw Error('Unmatched Recollect selection pool');
   const subjects=line.trim().split('/').map(s=>({name:s.trim(),type:'rerun' as const}));
   if(subjects.some(s=>!dictionary.has(norm(s.name))&&!knownMember(s.name)))throw Error('Unknown Recollect candidate');
   apply(source,body,w,subjects,true);
  }
 }
 return [...result.values()];
}
