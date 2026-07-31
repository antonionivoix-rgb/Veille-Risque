ALTER TABLE article_engagement ADD COLUMN archived_by TEXT;
ALTER TABLE article_engagement ADD COLUMN archived_at TEXT;

UPDATE article_engagement
SET archived_by = updated_by,
    archived_at = updated_at
WHERE archived = 1
  AND archived_by IS NULL;
