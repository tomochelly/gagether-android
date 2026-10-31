import type {Entry} from './types';
/** Past archive rows are loaded on demand. Upcoming/date-only schedules stay in calendars. */
export function initialEntries(entries:Entry[]){
 return entries.filter(e=>!e.pickupArchive||e.pickupArchive.status!=='past');
}
export function initialData<T extends {entries:Entry[]}>(data:T):T{return {...data,entries:initialEntries(data.entries)};}
