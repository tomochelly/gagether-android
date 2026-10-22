import type {CatalogData} from './catalog-transport';

// The clock is serialized to make server/client rendering agree. Content and
// owner overrides arrive together from the effective public index after mount.
export function emptyCatalog():CatalogData{
 return {entries:[],sourceChecks:[],settings:{},settingsRevision:0,persistent:false,serverTime:new Date().toISOString()};
}
export function isInitialShellRequest(request:Request){
 const url=new URL(request.url);
 return request.method==='GET'&&['/','/mobile'].includes(url.pathname)&&!url.searchParams.get('entry');
}
