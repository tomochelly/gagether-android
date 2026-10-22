import {env} from 'cloudflare:workers';
import {editorIdentity} from './editor-access';
import {matchesWriteToken} from './write-token';
export async function canWriteData(request:Request){
 const expected=(env as unknown as {GAGETHER_SYNC_TOKEN_SHA256?:string}).GAGETHER_SYNC_TOKEN_SHA256;
 if(await matchesWriteToken(request.headers.get('X-Gagether-Sync-Token'),expected))return true;
 return !!await editorIdentity();
}
