CREATE TABLE IF NOT EXISTS `editorial_history` (
	`seq` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`action` text NOT NULL,
	`old_payload` text,
	`new_payload` text,
	`old_revision` integer,
	`new_revision` integer,
	`actor` text,
	`at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `operations_health` (
	`key` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL
);

--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS editorial_audit_insert AFTER INSERT ON editorial BEGIN INSERT INTO editorial_history(key,action,new_payload,new_revision,actor,at) VALUES(NEW.key,'create',NEW.payload,NEW.revision,NEW.updated_by,NEW.updated_at); END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS editorial_audit_update AFTER UPDATE ON editorial BEGIN INSERT INTO editorial_history(key,action,old_payload,new_payload,old_revision,new_revision,actor,at) VALUES(NEW.key,'update',OLD.payload,NEW.payload,OLD.revision,NEW.revision,NEW.updated_by,NEW.updated_at); END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS editorial_audit_delete AFTER DELETE ON editorial BEGIN INSERT INTO editorial_history(key,action,old_payload,old_revision,actor,at) VALUES(OLD.key,'reset',OLD.payload,OLD.revision,OLD.updated_by,strftime('%Y-%m-%dT%H:%M:%fZ','now')); END;
--> statement-breakpoint
