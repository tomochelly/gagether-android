import {env} from 'cloudflare:workers';
// Triggers run in the same SQLite transaction as the successful CAS write.
// Schema and audit triggers are installed by versioned deployment migration0010.
export async function ensureEditorHistory(){}
export async function editorHistory(key?:string){
 await ensureEditorHistory();
 const q=key?env.DB!.prepare('SELECT * FROM editorial_history WHERE key=? ORDER BY seq DESC LIMIT 100').bind(key):env.DB!.prepare('SELECT * FROM editorial_history ORDER BY seq DESC LIMIT 100');
 return (await q.all()).results;
}
