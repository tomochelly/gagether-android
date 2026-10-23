import {readFileSync} from 'node:fs';
const args=process.argv.slice(2),value=key=>args[args.indexOf(key)+1];
const guild=args.includes('--guild')?value('--guild'):process.env.DISCORD_TEST_GUILD_ID;
const global=args.includes('--global');
const id=process.env.DISCORD_APPLICATION_ID,token=process.env.DISCORD_BOT_TOKEN;
const commands=JSON.parse(readFileSync(new URL('../commands.json',import.meta.url),'utf8'));
if(args.includes('--dry-run')){
  console.log(JSON.stringify({commands:commands.map(c=>'/'+c.name),permissions:84992,gatewayRequired:false},null,2));process.exit(0);
}
if(!/^\d{15,22}$/.test(id||'')||!token||!global&&!/^\d{15,22}$/.test(guild||'')){
  console.error('Set DISCORD_APPLICATION_ID, DISCORD_BOT_TOKEN and DISCORD_TEST_GUILD_ID. Global registration requires --global.');process.exit(1);
}
async function api(path,method='GET',body){
  const r=await fetch('https://discord.com/api/v10'+path,{method,redirect:'error',signal:AbortSignal.timeout(10000),headers:{Authorization:'Bot '+token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
  if(!r.ok)throw new Error('Discord HTTP '+r.status);return r.json();
}
try{
  const application=await api('/oauth2/applications/@me');
  if(application.id!==id)throw new Error('Bot token belongs to another application');
  const path=`/applications/${id}${global?'':`/guilds/${guild}`}/commands`;
  // Complete set is intentional. It only replaces commands of this dedicated GAGETHER app.
  await api(path,'PUT',commands);
  const actual=await api(path);
  if(actual.length!==commands.length||commands.some(c=>!actual.some(a=>a.name===c.name)))throw new Error('Command readback mismatch');
  const invite=new URL('https://discord.com/oauth2/authorize');invite.searchParams.set('client_id',id);invite.searchParams.set('scope','bot applications.commands');invite.searchParams.set('permissions','84992');
  if(!global)invite.searchParams.set('guild_id',guild);
  console.log(`Registered and read back ${actual.length} commands (${global?'global':'test server'}).`);
  console.log('Invite: '+invite.href);
}catch(e){console.error(e instanceof Error?e.message:'Registration failed');process.exitCode=1;}
