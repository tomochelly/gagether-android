CREATE TABLE `public_catalog_versions` (
	`game_id` text PRIMARY KEY NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `public_entry_index` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`payload` text NOT NULL,
	`source_updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `public_entry_index_game` ON `public_entry_index` (`game_id`,`source_updated_at`,`id`);--> statement-breakpoint
CREATE INDEX `editorial_key_revision` ON `editorial` (`key`,`revision`,`updated_at`);--> statement-breakpoint
CREATE INDEX `entries_game_updated` ON `entries` (`game_id`,`updated_at`,`id`);--> statement-breakpoint
CREATE TRIGGER public_entry_index_insert AFTER INSERT ON entries BEGIN
 INSERT INTO public_entry_index(id,game_id,payload,source_updated_at) VALUES(NEW.id,NEW.game_id,CASE WHEN json_valid(NEW.payload) THEN json_remove(NEW.payload,'$.entityDetails','$.detailImages','$.detailSections','$.contentBlocks','$.sourceBodies') ELSE NEW.payload END,NEW.updated_at) ON CONFLICT(id) DO UPDATE SET game_id=excluded.game_id,payload=excluded.payload,source_updated_at=excluded.source_updated_at;
 INSERT INTO public_catalog_versions(game_id,revision) VALUES(NEW.game_id,1) ON CONFLICT(game_id) DO UPDATE SET revision=revision+1;
END;
--> statement-breakpoint
CREATE TRIGGER public_entry_index_update AFTER UPDATE OF payload,game_id ON entries WHEN OLD.payload<>NEW.payload OR OLD.game_id<>NEW.game_id BEGIN
 INSERT INTO public_entry_index(id,game_id,payload,source_updated_at) VALUES(NEW.id,NEW.game_id,CASE WHEN json_valid(NEW.payload) THEN json_remove(NEW.payload,'$.entityDetails','$.detailImages','$.detailSections','$.contentBlocks','$.sourceBodies') ELSE NEW.payload END,NEW.updated_at) ON CONFLICT(id) DO UPDATE SET game_id=excluded.game_id,payload=excluded.payload,source_updated_at=excluded.source_updated_at;
 INSERT INTO public_catalog_versions(game_id,revision) VALUES(NEW.game_id,1) ON CONFLICT(game_id) DO UPDATE SET revision=revision+1;
 INSERT INTO public_catalog_versions(game_id,revision) SELECT OLD.game_id,1 WHERE OLD.game_id<>NEW.game_id ON CONFLICT(game_id) DO UPDATE SET revision=revision+1;
END;
--> statement-breakpoint
CREATE TRIGGER public_entry_index_delete AFTER DELETE ON entries BEGIN
 DELETE FROM public_entry_index WHERE id=OLD.id;
 INSERT INTO public_catalog_versions(game_id,revision) VALUES(OLD.game_id,1) ON CONFLICT(game_id) DO UPDATE SET revision=revision+1;
END;
--> statement-breakpoint
CREATE TRIGGER public_catalog_editor_insert AFTER INSERT ON editorial WHEN NEW.key='site' OR NEW.key LIKE 'entry:%' BEGIN
 INSERT INTO public_catalog_versions(game_id,revision) SELECT value,1 FROM (SELECT '*' AS value WHERE NEW.key='site' UNION SELECT game_id FROM entries WHERE id=substr(NEW.key,7) UNION SELECT CASE WHEN json_valid(NEW.payload) THEN json_extract(NEW.payload,'$.gameId') END WHERE NEW.key LIKE 'entry:%') WHERE value IS NOT NULL ON CONFLICT(game_id) DO UPDATE SET revision=revision+1;
END;
--> statement-breakpoint
CREATE TRIGGER public_catalog_editor_update AFTER UPDATE OF payload,revision ON editorial WHEN NEW.key='site' OR NEW.key LIKE 'entry:%' BEGIN
 INSERT INTO public_catalog_versions(game_id,revision) SELECT value,1 FROM (SELECT '*' AS value WHERE NEW.key='site' UNION SELECT game_id FROM entries WHERE id=substr(NEW.key,7) UNION SELECT CASE WHEN json_valid(NEW.payload) THEN json_extract(NEW.payload,'$.gameId') END WHERE NEW.key LIKE 'entry:%' UNION SELECT CASE WHEN json_valid(OLD.payload) THEN json_extract(OLD.payload,'$.gameId') END WHERE OLD.key LIKE 'entry:%') WHERE value IS NOT NULL ON CONFLICT(game_id) DO UPDATE SET revision=revision+1;
END;
--> statement-breakpoint
CREATE TRIGGER public_catalog_editor_delete AFTER DELETE ON editorial WHEN OLD.key='site' OR OLD.key LIKE 'entry:%' BEGIN
 INSERT INTO public_catalog_versions(game_id,revision) SELECT value,1 FROM (SELECT '*' AS value WHERE OLD.key='site' UNION SELECT game_id FROM entries WHERE id=substr(OLD.key,7) UNION SELECT CASE WHEN json_valid(OLD.payload) THEN json_extract(OLD.payload,'$.gameId') END WHERE OLD.key LIKE 'entry:%') WHERE value IS NOT NULL ON CONFLICT(game_id) DO UPDATE SET revision=revision+1;
END;
--> statement-breakpoint
CREATE TRIGGER public_catalog_check_insert AFTER INSERT ON source_checks BEGIN
 INSERT INTO public_catalog_versions(game_id,revision) VALUES(NEW.game_id,1) ON CONFLICT(game_id) DO UPDATE SET revision=revision+1;
END;
--> statement-breakpoint
CREATE TRIGGER public_catalog_check_update AFTER UPDATE ON source_checks WHEN OLD.status IS NOT NEW.status OR OLD.count IS NOT NEW.count OR OLD.error IS NOT NEW.error BEGIN
 INSERT INTO public_catalog_versions(game_id,revision) VALUES(NEW.game_id,1) ON CONFLICT(game_id) DO UPDATE SET revision=revision+1;
END;
--> statement-breakpoint
CREATE TRIGGER public_catalog_check_delete AFTER DELETE ON source_checks BEGIN
 INSERT INTO public_catalog_versions(game_id,revision) VALUES(OLD.game_id,1) ON CONFLICT(game_id) DO UPDATE SET revision=revision+1;
END;
