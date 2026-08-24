CREATE TABLE IF NOT EXISTS broadcast_programs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL CHECK (BTRIM(title) <> ''),
  program_type TEXT NOT NULL CHECK (program_type IN ('test_card','image','video')),
  media_ref TEXT,
  duration_ms BIGINT NOT NULL CHECK (duration_ms > 0),
  queue_position INTEGER NOT NULL UNIQUE CHECK (queue_position > 0),
  CHECK (program_type = 'test_card' OR NULLIF(BTRIM(media_ref), '') IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS broadcast_clock (
  singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton),
  started_at TIMESTAMPTZ
);

INSERT INTO broadcast_clock(singleton,started_at)
VALUES (TRUE,NULL)
ON CONFLICT (singleton) DO NOTHING;
