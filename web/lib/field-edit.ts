const forbidden=new Set(['__proto__','prototype','constructor']);
export function fieldParts(path:string){const p=path.split('.');if(!p.length||p.some(x=>!x||forbidden.has(x)||!/^[\w-]+$/.test(x)))throw Error('Invalid field path');return p;}
export function fieldValue(value:unknown,path:string):any{return fieldParts(path).reduce((v:any,k)=>v?.[k],value);}
export function setFieldValue<T>(value:T,path:string,next:unknown):T{const parts=fieldParts(path),root=structuredClone(value) as any;let node=root;for(const p of parts.slice(0,-1)){if(!node[p]||typeof node[p]!=='object')throw Error('Field no longer exists');node=node[p];}node[parts.at(-1)!]=next;return root;}
