CREATE TABLE IF NOT EXISTS article_assessments (
  article_id TEXT PRIMARY KEY,
  nature TEXT NOT NULL,
  impact TEXT NOT NULL,
  exposure TEXT NOT NULL,
  timing TEXT NOT NULL,
  confidence TEXT NOT NULL,
  level TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
