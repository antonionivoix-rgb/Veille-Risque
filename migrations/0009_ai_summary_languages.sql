CREATE TABLE IF NOT EXISTS article_ai_summaries_i18n (
  article_id TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('fr', 'en')),
  bullets_json TEXT NOT NULL,
  source_url TEXT NOT NULL,
  generated_at TEXT NOT NULL,
  updated_by TEXT,
  updated_at TEXT,
  PRIMARY KEY (article_id, language)
);

INSERT OR IGNORE INTO article_ai_summaries_i18n (
  article_id, language, bullets_json, source_url, generated_at, updated_by, updated_at
)
SELECT article_id, 'fr', bullets_json, source_url, generated_at, updated_by, updated_at
FROM article_ai_summaries;

CREATE INDEX IF NOT EXISTS idx_article_ai_summaries_i18n_generated
ON article_ai_summaries_i18n(generated_at DESC);
