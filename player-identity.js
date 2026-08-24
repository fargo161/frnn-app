export const ISSUE_NEXT_CANDIDATE_SQL = `
  SELECT code
  FROM access_codes
  WHERE status='unused'
    AND allocated_at IS NULL
    AND claimed_at IS NULL
    AND is_test=FALSE
  ORDER BY code
  FOR UPDATE SKIP LOCKED
  LIMIT 1
`;

export async function lockAccessCode(client, code) {
  const result = await client.query(
    'SELECT code,status,allocated_at,activated_at,claimed_at,is_test FROM access_codes WHERE code=$1 FOR UPDATE',
    [code]
  );
  return result.rows[0] || null;
}

export async function ensurePlayerIdentity(client, code) {
  await client.query('INSERT INTO players(code) VALUES($1) ON CONFLICT (code) DO NOTHING', [code]);
  const ownership = await client.query(
    `UPDATE access_codes
     SET status='active',
       activated_at=COALESCE(activated_at,NOW()),
       claimed_at=CASE WHEN is_test THEN claimed_at ELSE COALESCE(claimed_at,NOW()) END
     WHERE code=$1
     RETURNING code,status,allocated_at,activated_at,claimed_at,is_test`,
    [code]
  );
  await client.query('SELECT code FROM players WHERE code=$1 FOR UPDATE', [code]);
  return ownership.rows[0] || null;
}

export async function issueNextUnclaimedCode(client) {
  const result = await client.query(ISSUE_NEXT_CANDIDATE_SQL);
  const code = result.rows[0]?.code || null;
  if (!code) return null;
  await client.query('UPDATE access_codes SET allocated_at=NOW(),activated_at=NULL WHERE code=$1', [code]);
  return code;
}

export async function resetGameplay(client, code) {
  const access = await lockAccessCode(client, code);
  if (!access) return null;

  await client.query('DELETE FROM visits WHERE code=$1', [code]);
  await client.query('DELETE FROM video_answers WHERE code=$1', [code]);
  await client.query('DELETE FROM final_reflections WHERE code=$1', [code]);
  await client.query('UPDATE players SET updated_at=NOW() WHERE code=$1', [code]);

  if (access.is_test) {
    await client.query('DELETE FROM quick_start_claims WHERE code=$1', [code]);
    await client.query(
      "UPDATE access_codes SET status='unused',allocated_at=NULL,activated_at=NULL,claimed_at=NULL WHERE code=$1 AND is_test=TRUE",
      [code]
    );
  }

  return access;
}

export async function releasePlayerIdentity(client, code) {
  const access = await lockAccessCode(client, code);
  if (!access) return { error: 'PLAYER_NOT_FOUND', status: 404 };
  if (access.is_test) return { error: 'TEST_IDENTITY_RELEASE_NOT_ALLOWED', status: 409 };
  if (!access.claimed_at) return { error: 'PLAYER_IDENTITY_NOT_CLAIMED', status: 409 };

  await client.query('DELETE FROM quick_start_claims WHERE code=$1', [code]);
  await client.query('DELETE FROM prize_draws WHERE code=$1', [code]);
  await client.query('DELETE FROM player_profile_versions WHERE code=$1', [code]);
  await client.query('DELETE FROM player_profiles WHERE code=$1', [code]);
  await client.query('DELETE FROM players WHERE code=$1', [code]);
  await client.query(
    "UPDATE access_codes SET status='unused',allocated_at=NULL,activated_at=NULL,claimed_at=NULL WHERE code=$1",
    [code]
  );
  return { released: true };
}
