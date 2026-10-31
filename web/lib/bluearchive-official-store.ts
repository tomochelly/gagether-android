import {readBaseData,saveEntryChanges} from './store';
import {blueArchiveOfficialChanges} from './bluearchive-official';
/** Full originals and CAS preserve concurrent native bodies and owner records. */
export async function importBlueArchiveOfficial(){
 const checkedAt=new Date().toISOString(),data=await readBaseData({gameId:'bluearchive'});
 if(!data.persistent)throw Error('Blue Archive originals unavailable');
 const changes=blueArchiveOfficialChanges(data.entries,checkedAt);
 for(let i=0;i<changes.length;i+=8)await saveEntryChanges(changes.slice(i,i+8));
 const saved=changes.length?await readBaseData({ids:changes.map(c=>c.after.id)}):{persistent:true,entries:[]};
 if(!saved.persistent||changes.some(c=>!saved.entries.some(e=>e.id===c.after.id&&e.sourceUrl===c.after.sourceUrl&&(c.after.kind!=='pickup'||e.pickupArchive?.status===c.after.pickupArchive?.status)&&e.endAt===c.after.endAt)))throw Error('Blue Archive recruitment readback failed');
 return {source:'bluearchive/kr/official-recruitment',status:'ok',checkedAt,count:changes.length,changedEntries:changes.map(c=>c.after.id)};
}
