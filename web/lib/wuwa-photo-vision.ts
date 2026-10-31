import {parsePhotoText,normalizeEchoPhotoRows,type PhotoStat} from './wuwa-photo-import';
import {echoMainStatValue,echoSecondaryStat,isEchoSubstatStep} from './wuwa-echo-stat-rules';
import type {CombatCatalog,StatKey} from './wuwa-records';

export type OcrLine={text:string;confidence:number;bbox:{x0:number;y0:number;x1:number;y1:number}};
export type OcrData={text:string;confidence:number;blocks?:{paragraphs?:{lines?:OcrLine[]}[]}[]|null};
export type OcrRect={x:number;y:number;w:number;h:number};
export function ocrLines(data:OcrData):OcrLine[]{return(data.blocks||[]).flatMap(b=>(b.paragraphs||[]).flatMap(p=>p.lines||[])).filter(l=>l.text.trim()&&Object.values(l.bbox).every(Number.isFinite));}

/** Locate a regular Echo stat table from at least three observed, aligned OCR rows.
 * Missing rows define only a retry rectangle; their identities and values are never supplied. */
export function echoStatRect(data:OcrData,c:CombatCatalog,width:number,height:number,level:number):OcrRect|null{
 const lines=ocrLines(data).filter(l=>parsePhotoText(l.text,c).rows.length===1).sort((a,b)=>a.bbox.y0-b.bbox.y0);
 if(lines.length<3)return null;
 const first=lines[0],aligned=lines.filter(l=>Math.abs(l.bbox.x1-first.bbox.x1)<width*.08&&Math.abs(l.bbox.x0-first.bbox.x0)<width*.12);
 if(aligned.length<3)return null;
 const gaps=aligned.slice(1).map((l,i)=>(l.bbox.y0+l.bbox.y1-aligned[i].bbox.y0-aligned[i].bbox.y1)/2).filter(v=>v>2).sort((a,b)=>a-b);
 const pitch=gaps[Math.floor((gaps.length-1)/2)],rowHeight=(first.bbox.y1-first.bbox.y0);
 if(!pitch||pitch<rowHeight*.85||pitch>rowHeight*3)return null;
 // Require three adjacent rows before treating this as the game's stat table.
 if(aligned.filter(l=>Math.abs(((l.bbox.y0+l.bbox.y1-first.bbox.y0-first.bbox.y1)/2/pitch)-Math.round((l.bbox.y0+l.bbox.y1-first.bbox.y0-first.bbox.y1)/2/pitch))<.2).length<3)return null;
 const x=Math.max(0,Math.min(...aligned.map(l=>l.bbox.x0))-pitch*.45),y=Math.max(0,(first.bbox.y0+first.bbox.y1)/2-pitch*.6);
 const right=Math.min(width,Math.max(...aligned.map(l=>l.bbox.x1))+pitch*.4),bottom=Math.min(height,y+pitch*(2+Math.min(5,Math.max(0,Math.floor(level/5)))));
 return{x,y,w:right-x,h:bottom-y};
}

/** At most two incomplete numeric lines inside the observed stat table. A single-line
 * OCR retry changes segmentation only; the missing label still has to be read. */
export function echoUnreadableRects(data:OcrData,c:CombatCatalog,table:OcrRect):OcrRect[]{
 return ocrLines(data).filter(l=>{
  const b=l.bbox,center=(b.y0+b.y1)/2;
  return center>=table.y&&center<table.y+table.h&&Math.abs(b.x1-table.x-table.w)<table.w*.16&&/\d[\d., ]*[%％]?\s*$/.test(l.text.trim())&&!parsePhotoText(l.text,c).rows.length;
 }).slice(0,2).map(l=>{
  const padding=Math.max(3,(l.bbox.y1-l.bbox.y0)*.25),y=Math.max(table.y,l.bbox.y0-padding),bottom=Math.min(table.y+table.h,l.bbox.y1+padding);
  return{x:table.x,y,w:table.w,h:bottom-y};
 });
}

/** Local contrast removes broad translucent artwork; original pixels are never mutated.
 * A summed-area table keeps work linear and memory bounded for the small stat retry. */
export function echoTextContrast(rgba:Uint8ClampedArray,width:number,height:number):Uint8ClampedArray{
 if(width<1||height<1||width*height>2400*2400||rgba.length!==width*height*4)throw Error('Invalid OCR pixels');
 const gray=new Float32Array(width*height),sum=new Float64Array((width+1)*(height+1)),stride=width+1;
 for(let y=0;y<height;y++){let row=0;for(let x=0;x<width;x++){const i=y*width+x,j=i*4;gray[i]=rgba[j]*.299+rgba[j+1]*.587+rgba[j+2]*.114;row+=gray[i];sum[(y+1)*stride+x+1]=sum[y*stride+x+1]+row;}}
 const radius=4,out=new Uint8ClampedArray(rgba.length);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const left=Math.max(0,x-radius),right=Math.min(width,x+radius+1),top=Math.max(0,y-radius),bottom=Math.min(height,y+radius+1),i=(y*width+x)*4;
  const mean=(sum[bottom*stride+right]-sum[top*stride+right]-sum[bottom*stride+left]+sum[top*stride+left])/((right-left)*(bottom-top));
  out[i]=out[i+1]=out[i+2]=255-(gray[y*width+x]-mean)*8;out[i+3]=255;
 }
 return out;
}

const signature=(r:PhotoStat)=>r.key+':'+r.value;
function verified(row:PhotoStat,cost:number,level:number,rarity:number){const main=echoMainStatValue(cost,row.key,level,rarity),secondary=echoSecondaryStat(cost,level,rarity);return main!==null&&Math.abs(main-row.value)<.001||secondary?.key===row.key&&Math.abs(secondary.value-row.value)<.001||isEchoSubstatStep(row.key,row.value,rarity);}

/** Compare complete label/value lines at the same image position. Never join columns or
 * borrow a value from a neighbouring row. Conflicting exact readings require review. */
export function mergeEchoOcr(base:OcrData,retries:{data:OcrData;rect:OcrRect;scale:number}[],c:CombatCatalog,cost:number,level:number,rarity:number){
 const lines=ocrLines(base);if(!lines.length)return{text:base.text,conflicts:[] as StatKey[]};
 const groups=lines.map(line=>({line,alternatives:[] as OcrLine[]}));
 for(const retry of retries)for(const line of ocrLines(retry.data)){
  const mapped={...line,bbox:{x0:line.bbox.x0/retry.scale+retry.rect.x,y0:line.bbox.y0/retry.scale+retry.rect.y,x1:line.bbox.x1/retry.scale+retry.rect.x,y1:line.bbox.y1/retry.scale+retry.rect.y}};
  const match=groups.find(g=>{const a=g.line.bbox,b=mapped.bbox;return Math.abs((a.y0+a.y1-b.y0-b.y1)/2)<Math.max(a.y1-a.y0,b.y1-b.y0)*.55&&Math.abs(a.x1-b.x1)<Math.max(12,retry.rect.w*.12);});
  if(match)match.alternatives.push(mapped);
  else if(parsePhotoText(mapped.text,c).rows.length===1)groups.push({line:mapped,alternatives:[]});
 }
 const conflicts=new Set<StatKey>(),out:string[]=[];
 for(const group of groups.sort((a,b)=>a.line.bbox.y0-b.line.bbox.y0)){
  const candidates=[group.line,...group.alternatives].map(line=>({line,rows:normalizeEchoPhotoRows(parsePhotoText(line.text,c).rows,cost,level,rarity)}));
  const exact=candidates.filter(v=>v.rows.length===1&&verified(v.rows[0],cost,level,rarity));
  if(new Set(exact.map(v=>signature(v.rows[0]))).size>1)for(const v of exact)conflicts.add(v.rows[0].key);
  // Retain an existing recognized line, adding a retry only where its whole line was unreadable.
  const chosen=candidates[0].rows.length?candidates[0]:exact[0]||candidates[0];out.push(chosen.line.text.trim());
 }
 return{text:out.join('\n'),conflicts:[...conflicts]};
}
