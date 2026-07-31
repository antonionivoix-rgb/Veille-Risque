CREATE TABLE IF NOT EXISTS article_engagement (
  article_id TEXT PRIMARY KEY,
  recommendation TEXT NOT NULL DEFAULT 'standard',
  archived INTEGER NOT NULL DEFAULT 0,
  snapshot_json TEXT,
  updated_by TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_article_engagement_archived
ON article_engagement(archived, updated_at DESC);

CREATE TABLE IF NOT EXISTS article_votes (
  article_id TEXT NOT NULL,
  voter TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY(article_id, voter)
);

CREATE INDEX IF NOT EXISTS idx_article_votes_article
ON article_votes(article_id, created_at DESC);
