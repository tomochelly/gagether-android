import {env} from 'cloudflare:workers';
// Triggers run in the same SQLite transaction as the successful CAS write.
export async function ensureEditorHistory(){
 await env.DB!.batch([
  env.DB!.prepare('CREATE TABLE IF NOT EXISTS editorial_history (seq INTEGER PRIMARY KEY AUTOINCREMENT,key TEXT NOT NULL,action TEXT NOT NULL,old_payload TEXT,new_payload TEXT,old_revision INTEGER,new_revision INTEGER,actor TEXT,at TEXT NOT NULL)'),
  env.DB!.prepare("CREATE TRIGGER IF NOT EXISTS editorial_audit_insert AFTER INSERT ON editorial BEGIN INSERT INTO editorial_history(key,action,new_payload,new_revision,actor,at) VALUES(NEW.key,'create',NEW.payload,NEW.revision,NEW.updated_by,NEW.updated_at); END"),
  env.DB!.prepare("CREATE TRIGGER IF NOT EXISTS editorial_audit_update AFTER UPDATE ON editorial BEGIN INSERT INTO editorial_history(key,action,old_payload,new_payload,old_revision,new_revision,actor,at) VALUES(NEW.key,'update',OLD.payload,NEW.payload,OLD.revision,NEW.revision,NEW.updated_by,NEW.updated_at); END"),
  env.DB!.prepare("CREATE TRIGGER IF NOT EXISTS editorial_audit_delete AFTER DELETE ON editorial BEGIN INSERT INTO editorial_history(key,action,old_payload,old_revision,actor,at) VALUES(OLD.key,'reset',OLD.payload,OLD.revision,OLD.updated_by,strftime('%Y-%m-%dT%H:%M:%fZ','now')); END")
 ]);
}
export async function editorHistory(key?:string){
 await ensureEditorHistory();
 const q=key?env.DB!.prepare('SELECT * FROM editorial_history WHERE key=? ORDER BY seq DESC LIMIT 100').bind(key):env.DB!.prepare('SELECT * FROM editorial_history ORDER BY seq DESC LIMIT 100');
 return (await q.all()).results;
}
