export type Locale = 'ko' | 'en' | 'ja' | 'zh';
export type Region = 'kr' | 'jp' | 'global' | 'cn';
export type Topic = 'pickup-start' | 'pickup-end' | 'event-start' | 'event-end' | 'package-end' | 'broadcast' | 'notice';
export type Game = {id:string;name:string;icon?:string;color:string;regions:Region[];canonicalRegions:Record<Region,Region>};
export type Item = {
  id:string;gameId:string;region:Region;kind:'pickup'|'weapon'|'event'|'package'|'update';
  title:string;summary:string;url:string;sourceUrl?:string;sourceKind:string;
  startAt:string|null;endAt:string|null;startDate?:string;endDate?:string;publishedAt:string|null;
  forecast:boolean;timed:boolean;poolType?:string;group?:string;
  members:{name:string;role:string;type:string;rarity?:number;image?:string}[];image?:string;
  broadcast?:{status:'scheduled'|'live'|'ended'|'cancelled';scheduledAt:string|null;programStartAt?:string|null;scheduledDate?:string;checkedAt:string;url:string;locale:Locale;identity:string;live:boolean};
};
export type Catalog = {schemaVersion:1;locale:Locale;requestedRegion:Region;games:Game[];entries:Item[];revision:string;serverTime:string};
export type Settings = {games:string[];region:Region;locale:Locale;topics:Topic[];offsets:number[];channelId:string;baseRevision?:number};
export type Subscription = Settings & {id:string;guildId:string;actorId:string;enabled:boolean;revision:number;createdAt:number;updatedAt:number;initialized:boolean};
export type Session = {id:string;guildId:string;actorId:string;settings:Settings;revision:number;expiresAt:number};
export interface Statement {
  bind(...values:unknown[]):Statement;
  first<T=Record<string,unknown>>():Promise<T|null>;
  all<T=Record<string,unknown>>():Promise<{results:T[]}>;
  run():Promise<{meta?:{changes?:number}}>;
}
export interface Database {prepare(sql:string):Statement;batch(statements:Statement[]):Promise<unknown[]>}
export type Env = {
  DB:Database;DISCORD_APPLICATION_ID:string;DISCORD_PUBLIC_KEY:string;DISCORD_BOT_TOKEN:string;
  GAGETHER_ORIGIN:string;BOT_ENABLED?:string;SCHEDULER_ENABLED?:string;
};
export type Execution = {waitUntil(promise:Promise<unknown>):void};
export type Interaction = {
  id:string;application_id:string;type:number;token:string;guild_id?:string;channel_id?:string;
  locale?:string;member?:{user:{id:string};permissions?:string};user?:{id:string};
  data?:{name?:string;custom_id?:string;values?:string[];options?:{name:string;value?:string}[];
    components?:{components:{custom_id:string;value?:string}[]}[];
    resolved?:{channels?:Record<string,{id:string;type:number;permissions?:string;app_permissions?:string}>}};
};
export type Message = {content?:string;embeds?:Record<string,unknown>[];components?:Record<string,unknown>[];allowed_mentions?:{parse:string[]};flags?:number};
export const locales:Locale[]=['ko','en','ja','zh'];
export const regions:Region[]=['kr','jp','global','cn'];
export const topics:Topic[]=['pickup-start','pickup-end','event-start','event-end','package-end','broadcast','notice'];
export const offsets=[1440,60,30,15,0];
