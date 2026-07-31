ALTER TABLE custom_articles ADD COLUMN competitor_id TEXT;

CREATE INDEX IF NOT EXISTS idx_custom_articles_competitor
ON custom_articles(competitor_id, created_at DESC);
