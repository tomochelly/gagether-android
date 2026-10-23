import type {Env,Message} from './types';
export class DiscordError extends Error {
  constructor(public status:number,public retryAfter:number=0){super(`Discord HTTP ${status}`);}
}
// Fixed API origin; interaction tokens never go into logs, source or an arbitrary host.
export async function discordRequest(env:Env,path:string,method='GET',body?:unknown,useToken=true){
  if(!/^\/(?:channels|applications|webhooks|users|guilds)\//.test(path))throw new Error('Invalid Discord API route');
  const response=await fetch('https://discord.com/api/v10'+path,{method,redirect:'error',signal:AbortSignal.timeout(8000),
    headers:{'Content-Type':'application/json',...(useToken?{Authorization:'Bot '+env.DISCORD_BOT_TOKEN}:{})},
    body:body===undefined?undefined:JSON.stringify(body)});
  if(!response.ok){
    let delay=Number(response.headers.get('Retry-After')||0)*1000;
    if(response.status===429){try{delay=Math.max(delay,Number((await response.json() as {retry_after?:number}).retry_after||0)*1000);}catch{}}
    throw new DiscordError(response.status,Math.min(3600000,Math.max(1000,delay)));
  }
  return response.status===204?null:response.json() as Promise<Record<string,unknown>>;
}
export async function completeInteraction(env:Env,token:string,message:Message){
  // Deferred responses are edited, never followed up with a second public message on retry.
  for(let attempt=0;attempt<3;attempt++){
    try{return await discordRequest(env,`/webhooks/${env.DISCORD_APPLICATION_ID}/${encodeURIComponent(token)}/messages/@original`,'PATCH',{
      content:'',embeds:[],components:[],...message,allowed_mentions:{parse:[]},
    },false);}catch(error){
      if(attempt===2||error instanceof DiscordError&&error.status!==429&&error.status<500)throw error;
      const delay=error instanceof DiscordError?error.retryAfter:500;
      if(delay>3000)throw error;
      await new Promise(resolve=>setTimeout(resolve,Math.max(delay,500*2**attempt)));
    }
  }
}
