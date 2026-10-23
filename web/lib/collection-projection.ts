import type {Entry} from './types';
// Internal collection checks need provenance, clocks and members, not full artwork,
// multilingual skill tables or long detail bodies. Never expose this as a catalog.
export const collectionFields=['region','server','kind','title','summary','sourceUrl','sourceTitle','sourceLocale','sourceKind','officialLocales','translatedLocales','localizationSources','publishedAt','verifiedAt','startAt','endAt','startDate','endDate','version','versionTitle','versionHero','pickupArchive','pickupType','pickupGroup','poolType','bannerName','selectionCount','signatureWeapons','broadcast','videos','marketRegion','audienceRegions','hidden'] as const;
export const collectionSql="json_object('id',id,'gameId',game_id,"+collectionFields.map(k=>`'${k}',json_extract(payload,'$.${k}')`).join(',')+",'pickupMembers',(SELECT json_group_array(json_object('name',json_extract(value,'$.name'),'type',json_extract(value,'$.type'),'role',json_extract(value,'$.role'),'rarity',json_extract(value,'$.rarity'))) FROM json_each(payload,'$.pickupMembers')))";
export function collectionEntry(entry:Entry):Entry{
 const row:Record<string,unknown>={id:entry.id,gameId:entry.gameId};for(const k of collectionFields)if(entry[k]!==undefined&&entry[k]!==null)row[k]=entry[k];
 if(entry.pickupMembers)row.pickupMembers=entry.pickupMembers.map(({name,type,role,rarity})=>({name,type,...role?{role}:{},...rarity?{rarity}:{}}));
 return row as unknown as Entry;
}
