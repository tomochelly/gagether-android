-- Independent bot database. Never bind this database to the website's DB.
CREATE TABLE IF NOT EXISTS subscriptions (
 id TEXT PRIMARY KEY, guild_id TEXT NOT NULL, channel_id TEXT NOT NULL,
 actor_id TEXT NOT NULL, settings TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 1,
 revision INTEGER NOT NULL DEFAULT 1, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
 initialized INTEGER NOT NULL DEFAULT 0,
 UNIQUE(guild_id,channel_id,id)
);
CREATE INDEX IF NOT EXISTS subscriptions_enabled ON subscriptions(enabled);
CREATE TABLE IF NOT EXISTS sessions (
 id TEXT PRIMARY KEY, guild_id TEXT NOT NULL, actor_id TEXT NOT NULL,
 settings TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 0, expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS preferences (id TEXT PRIMARY KEY, region TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS catalog_cache (
 id TEXT PRIMARY KEY, etag TEXT NOT NULL, payload TEXT NOT NULL, fetched_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS notice_seen (
 subscription_id TEXT NOT NULL, notice_key TEXT NOT NULL,
 PRIMARY KEY(subscription_id,notice_key)
);
CREATE TABLE IF NOT EXISTS outbox (
 id TEXT PRIMARY KEY, subscription_id TEXT NOT NULL, guild_id TEXT NOT NULL, channel_id TEXT NOT NULL,
 payload TEXT NOT NULL, state TEXT NOT NULL DEFAULT 'pending', attempts INTEGER NOT NULL DEFAULT 0,
 available_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL,
 claim_token TEXT, message_id TEXT, last_error TEXT
);
CREATE INDEX IF NOT EXISTS outbox_due ON outbox(state,available_at);
CREATE TABLE IF NOT EXISTS leases (id TEXT PRIMARY KEY, token TEXT NOT NULL, expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS bot_health (id TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS audit (
 id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id TEXT NOT NULL, actor_id TEXT NOT NULL,
 action TEXT NOT NULL, target_id TEXT NOT NULL, created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS interaction_receipts (id TEXT PRIMARY KEY, expires_at INTEGER NOT NULL);
