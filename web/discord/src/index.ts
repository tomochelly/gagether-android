import type {Env,Execution,Interaction} from './types';
import {verifySignature,snowflake} from './security';
import {initialResponse,handleInteraction,interactionError} from './interactions';
import {completeInteraction} from './rest';
import {localeFor} from './i18n';
import {runScheduler} from './scheduler';

export default {
  async fetch(request:Request,env:Env,ctx:Execution){
    const path=new URL(request.url).pathname;
    if(path==='/health'&&request.method==='GET')return Response.json({service:'gagether-discord',version:1,enabled:env.BOT_ENABLED==='true',schedulerConfigured:env.SCHEDULER_ENABLED==='true',credentialsConfigured:!!(env.DISCORD_PUBLIC_KEY&&env.DISCORD_BOT_TOKEN&&env.DISCORD_APPLICATION_ID)});
    if(path!=='/interactions'||request.method!=='POST')return new Response('Not found',{status:404});
    if(!env.DISCORD_PUBLIC_KEY||!env.DISCORD_APPLICATION_ID)return new Response('Not configured',{status:503});
    if(Number(request.headers.get('Content-Length')||0)>32768)return new Response('Too large',{status:413});
    const raw=await request.text();if(raw.length>32768)return new Response('Too large',{status:413});
    if(!await verifySignature(raw,request.headers.get('X-Signature-Ed25519'),request.headers.get('X-Signature-Timestamp'),env.DISCORD_PUBLIC_KEY))return new Response('Invalid signature',{status:401});
    let interaction:Interaction;try{interaction=JSON.parse(raw);}catch{return new Response('Invalid JSON',{status:400});}
    if(interaction.application_id!==env.DISCORD_APPLICATION_ID)return new Response('Wrong application',{status:403});
    if(interaction.type===1)return Response.json({type:1});
    if(env.BOT_ENABLED!=='true')return Response.json({type:4,data:{content:'GAGETHER 봇을 준비 중입니다.',flags:64}});
    if(![2,3,5].includes(interaction.type)||!snowflake(interaction.id)||!interaction.token||interaction.token.length>512)return new Response('Invalid interaction',{status:400});
    const initial=initialResponse(interaction);
    if(initial.type===9)return Response.json(initial);
    // Acknowledge within Discord's 3-second deadline; network/database work continues separately.
    ctx.waitUntil((async()=>{
      try{
        const receipt=await env.DB.prepare('INSERT OR IGNORE INTO interaction_receipts(id,expires_at) VALUES(?,?)').bind(interaction.id,Date.now()+900000).run();
        if(!receipt.meta?.changes)return;
        let result;
        try{result=await handleInteraction(env,interaction);}catch(error){result=interactionError(error,localeFor(interaction.locale));}
        await completeInteraction(env,interaction.token,result);
      }catch{
        // Never log the interaction token, body, bot token or a URL containing credentials.
        await env.DB.prepare('INSERT INTO bot_health(id,value,updated_at) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at').bind('interaction','{"status":"failed"}',Date.now()).run();
      }
    })());
    return Response.json(initial);
  },
  async scheduled(_controller:unknown,env:Env,ctx:Execution){ctx.waitUntil(runScheduler(env));},
};
