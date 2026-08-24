ALTER TABLE access_codes ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;

UPDATE access_codes a
SET claimed_at=p.created_at
FROM players p
WHERE p.code=a.code
  AND a.is_test=FALSE
  AND a.claimed_at IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM players p
    JOIN access_codes a ON a.code=p.code
    WHERE a.is_test=FALSE AND a.claimed_at IS NULL
  ) THEN
    RAISE EXCEPTION 'durable identity backfill left a non-test player unclaimed';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS access_codes_unclaimed_idx
  ON access_codes(code)
  WHERE claimed_at IS NULL AND is_test=FALSE;
