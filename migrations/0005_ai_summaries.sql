CREATE TABLE IF NOT EXISTS article_ai_summaries (
  article_id TEXT PRIMARY KEY,
  bullets_json TEXT NOT NULL,
  source_url TEXT NOT NULL,
  generated_at TEXT NOT NULL
);

UPDATE article_assessments
SET exposure = 'Indirecte'
WHERE exposure = 'Plausible';
