CREATE TABLE `public_favorite_totals` (
	`game_id` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TRIGGER public_favorite_totals_insert AFTER INSERT ON public_favorite_browsers BEGIN
 INSERT INTO public_favorite_totals(game_id,count) SELECT DISTINCT value,1 FROM json_each(NEW.favorites) WHERE type='text' AND value<>'__ready__' ON CONFLICT(game_id) DO UPDATE SET count=count+1;
 UPDATE public_favorite_totals SET count=count+1 WHERE game_id='__ready__' AND json_array_length(NEW.favorites)>0;
END;
--> statement-breakpoint
CREATE TRIGGER public_favorite_totals_update AFTER UPDATE OF favorites ON public_favorite_browsers WHEN OLD.favorites<>NEW.favorites BEGIN
 UPDATE public_favorite_totals SET count=MAX(0,count-1) WHERE game_id IN (SELECT value FROM json_each(OLD.favorites) EXCEPT SELECT value FROM json_each(NEW.favorites));
 INSERT INTO public_favorite_totals(game_id,count) SELECT value,1 FROM (SELECT value FROM json_each(NEW.favorites) EXCEPT SELECT value FROM json_each(OLD.favorites)) WHERE value<>'__ready__' ON CONFLICT(game_id) DO UPDATE SET count=count+1;
 UPDATE public_favorite_totals SET count=count+1 WHERE game_id='__ready__';
END;
--> statement-breakpoint
CREATE TRIGGER public_favorite_totals_delete AFTER DELETE ON public_favorite_browsers BEGIN
 UPDATE public_favorite_totals SET count=MAX(0,count-1) WHERE game_id IN (SELECT value FROM json_each(OLD.favorites));
 UPDATE public_favorite_totals SET count=count+1 WHERE game_id='__ready__' AND json_array_length(OLD.favorites)>0;
END;
