/** App-level write authorization remains required on the public Site. */
export async function matchesWriteToken(token:string|null,expectedHash:string|undefined){
 if(!token||token.length<16||token.length>8192||!expectedHash||!/^\w{64}$/.test(expectedHash)||!/^[a-f0-9]+$/.test(expectedHash))return false;
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));
 const actual=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
 let difference=0;for(let i=0;i<64;i++)difference|=actual.charCodeAt(i)^expectedHash.charCodeAt(i);
 return difference===0;
}
