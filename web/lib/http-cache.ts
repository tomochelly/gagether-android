/** RFC 9110 §13.1.2: GET validators compare opaque tags weakly, including gzip's W/ tags. */
export function matchesIfNoneMatch(header:string|null,current:string){
 if(!header)return false;const value=header.trim(),target=current.startsWith('W/')?current.slice(2):current;
 if(value==='*')return true;let i=0,matched=false;
 const space=()=>{while(value[i]===' '||value[i]==='\t')i++;};
 while(i<value.length){
  space();if(value[i]===','){i++;continue;}if(i===value.length)break;if(value.slice(i,i+2)==='W/')i+=2;
  const start=i;if(value[i++]!=='"')return false;
  while(i<value.length&&value[i]!=='"'){const c=value.charCodeAt(i++);if(c!==0x21&&!(c>=0x23&&c<=0x7e)&&!(c>=0x80&&c<=0xff))return false;}
  if(value[i++]!=='"')return false;matched ||=value.slice(start,i)===target;space();
  if(i<value.length&&value[i]!==',')return false;
 }
 return matched;
}
