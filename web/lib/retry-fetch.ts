const transient=new Set([429,500,502,503,504]);
export async function retryFetch(url:string,init:RequestInit={},fetcher:typeof fetch=fetch,wait:(ms:number)=>Promise<void>=ms=>new Promise(r=>setTimeout(r,ms)),attempts=3):Promise<Response>{
 for(let i=0;i<attempts;i++){
  try{const response=await fetcher(url,{...init,signal:AbortSignal.timeout(15000)});if(!transient.has(response.status)||i===attempts-1)return response;
   const retry=Number(response.headers.get('retry-after'));await response.body?.cancel();await wait(Number.isFinite(retry)&&retry>0?Math.min(retry*1000,5000):Math.min(600*2**i,3000));
  }catch(error){if(i===attempts-1)throw error;await wait(600*2**i);}
 }
 throw Error('Retry limit reached');
}
