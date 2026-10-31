import packed from '../content/roster-material-runtime.json' with {type:'json'};
import type {RosterCharacter} from './character-roster';
import {isMaterialSection,rosterMaterialGroupSchema,type RosterMaterialGroup} from './roster-materials';
type Copy={ko:string;en:string;ja:string;zh:string};
type Icon={id:string;name:Partial<Copy>;icon?:string;sprite?:RosterMaterialGroup['items'][number]['sprite']};
type Requirement=Omit<RosterMaterialGroup,'items'>&{items:{id:string;quantity:number|string}[]};
type Catalog={icons:Icon[];characters:Record<string,Requirement[]>};
const locales=['ko','en','ja','zh'] as const,copy=(v:Partial<Copy>|undefined):Copy=>({ko:v?.ko||'',en:v?.en||'',ja:v?.ja||'',zh:v?.zh||''});
let cached:{game:string;data:Catalog}|undefined;
async function catalog(game:string):Promise<Catalog|undefined>{
 if(cached?.game===game)return cached.data;
 const form=(packed.games as Record<string,{payload:string;bytes:number;sha256:string}>)[game];if(!form)return;
 const reader=new Blob([Uint8Array.from(atob(form.payload),c=>c.charCodeAt(0))]).stream().pipeThrough(new DecompressionStream('gzip')).getReader(),chunks:Uint8Array[]=[];let size=0;
 try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>form.bytes||size>40000000){await reader.cancel();throw Error('Material data exceeds declared size');}chunks.push(value);}}finally{reader.releaseLock();}
 if(size!==form.bytes)throw Error('Material data size mismatch');const bytes=new Uint8Array(size);let pos=0;for(const chunk of chunks){bytes.set(chunk,pos);pos+=chunk.length;}
 const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');if(hash!==form.sha256)throw Error('Material data hash mismatch');
 const data=JSON.parse(new TextDecoder().decode(bytes)) as Catalog;cached={game,data};return data;
}
/** Present saved material prose using exact same-game names and unchanged quantities. */
function savedMaterials(c:RosterCharacter,icons:Icon[]):RosterMaterialGroup[]{
 const result:RosterMaterialGroup[]=[];
 for(const section of c.sections||[]){
  if(!isMaterialSection(section))continue;
  const rows=Object.fromEntries(locales.map(l=>[l,section.body[l]?.split('\n').filter(s=>s.trim())||[]])) as Record<keyof Copy,string[]>;
  const base=locales.find(l=>rows[l].length);if(!base)continue;
  const groups:RosterMaterialGroup[]=[];let valid=true;
  for(let index=0;index<rows[base].length;index++){
   const parsed=Object.fromEntries(locales.map(l=>{
    const line=rows[l][index]||'',prefix=/^((?:돌파|Ascension|突破)\s*\d+)[:：]\s*/i.exec(line),body=prefix?line.slice(prefix[0].length):line;
    const items=body?body.split(/,\s+(?=[^,]*[×x]\s*\d)/).map(part=>{const m=/^(.+?)\s*[×x]\s*(\d[\d,]*(?:\.\d+)?)\s*$/.exec(part);return m?{name:m[1].trim(),quantity:Number(m[2].replaceAll(',',''))}:null;}):[];
    return [l,{prefix:prefix?.[1],items}];
   })) as Record<keyof Copy,{prefix?:string;items:({name:string;quantity:number}|null)[]}>;
   const native=parsed[base];if(!native.items.length||native.items.some(x=>!x)){valid=false;break;}
   const items=native.items.map((item,i)=>{
    const name=copy(Object.fromEntries(locales.map(l=>[l,parsed[l].items.length===native.items.length&&parsed[l].items[i]?.quantity===item!.quantity?parsed[l].items[i]!.name:''])));
    const matches=icons.filter(icon=>locales.some(l=>name[l]&&icon.name[l]===name[l]));const icon=matches.length===1?matches[0]:undefined;
    return {id:icon?.id||section.id+':'+index+':'+i,name,quantity:item!.quantity,...icon?.icon?{icon:icon.icon,...icon.sprite?{sprite:icon.sprite}:{}}:{}};
   });
   const categoryId=section.id==='ascension-materials'?'ascension':section.id.replace(/^zzz-materials-/,''),title=copy(Object.fromEntries(locales.map(l=>[l,parsed[l].prefix||section.title[l]])));
   // Plain one-item lines belong to one saved group, not a separate stage.
   if(!native.prefix&&groups[0])groups[0].items.push(...items);
   else groups.push({id:section.id+':'+index,title,categoryId,category:copy(section.title),items,sourceUrl:c.sourceUrl,sourceKind:c.sourceKind,originalSectionId:section.id,...section.regions?{regions:section.regions}:{}});
  }
  if(valid)result.push(...groups);
 }
 return result;
}
/** Public presentation only: never persist this overlay into collected/owner records. */
export async function withRosterMaterials(game:string,c:RosterCharacter):Promise<RosterCharacter>{
 if(c.availability?.status==='announced'||c.materialGroups?.length)return c;
 const data=await catalog(game);if(!data)return c;
 const icons=new Map(data.icons.map(i=>[i.id,i])),saved=savedMaterials(c,data.icons),savedCategories=new Set(saved.map(g=>g.categoryId));
 const groups=(data.characters[c.id]||[]).filter(g=>!savedCategories.has(g.categoryId)).map(g=>({...g,title:copy(g.title),...g.category?{category:copy(g.category)}:{},items:g.items.map(item=>{const icon=icons.get(item.id);return {...item,name:copy(icon?.name),...icon?.icon?{icon:icon.icon,...icon.sprite?{sprite:icon.sprite}:{}}:{}};})}));
 const all=[...saved,...groups].filter(g=>g.items.length&&g.items.every(i=>Object.values(i.name).some(Boolean)));
 return all.length?{...c,materialGroups:all.map(g=>rosterMaterialGroupSchema.parse(g))}:c;
}
