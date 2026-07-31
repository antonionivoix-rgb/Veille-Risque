CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL,
  author TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comments_article ON comments(article_id, created_at);

CREATE TABLE IF NOT EXISTS article_overrides (
  article_id TEXT PRIMARY KEY,
  cat_code TEXT NOT NULL,
  risk_id TEXT,
  updated_by TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS custom_articles (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT,
  cat_code TEXT NOT NULL,
  risk_id TEXT,
  author TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_custom_articles_created ON custom_articles(created_at DESC);

CREATE TABLE IF NOT EXISTS feed_cache (
  source_id TEXT PRIMARY KEY,
  payload TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending',
  item_count INTEGER NOT NULL DEFAULT 0,
  fetched_at TEXT,
  last_success_at TEXT,
  last_error TEXT
);

CREATE TABLE IF NOT EXISTS system_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT OR IGNORE INTO system_state(key, value) VALUES ('refresh_cursor', '0');
