CREATE TABLE IF NOT EXISTS node_assignments (
  code TEXT NOT NULL REFERENCES players(code) ON DELETE CASCADE,
  node_key TEXT NOT NULL CHECK (node_key IN ('escape','attention','access','sensory')),
  assignment_type TEXT NOT NULL DEFAULT 'assigned_message'
    CHECK (assignment_type = 'assigned_message'),
  assigned_message TEXT NOT NULL
    CHECK (CHAR_LENGTH(BTRIM(assigned_message)) BETWEEN 1 AND 1000),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (code, node_key)
);
