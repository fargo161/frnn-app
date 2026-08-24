export const DEFAULT_EVENT_ID = 1;
export const DEFAULT_EVENT_SLUG = 'as-above-so-below';

const THEME_KEYS = Object.freeze([
  'background', 'panel', 'ink', 'accent', 'secondary', 'highlight', 'muted'
]);
const SAFE_COLOR = /^(?:#[0-9a-f]{3,8}|(?:rgb|hsl)a?\([0-9.% ,/+-]+\))$/i;

export function safeThemeTokens(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(THEME_KEYS.flatMap(key => {
    const token = typeof value[key] === 'string' ? value[key].trim() : '';
    return token && token.length <= 48 && SAFE_COLOR.test(token) ? [[key, token]] : [];
  }));
}

export function publicEvent(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    slug: row.slug,
    festivalName: row.festival_name,
    festivalShortName: row.festival_short_name,
    networkName: row.network_name,
    networkShortName: row.network_short_name,
    showName: row.show_name,
    timezone: row.timezone,
    theme: safeThemeTokens(row.theme_json)
  };
}

export async function getDefaultEvent(client) {
  const result = await client.query(
    `SELECT id,slug,timezone,festival_name,festival_short_name,
            network_name,network_short_name,show_name,theme_json
     FROM events WHERE id=$1 AND status='active'`,
    [DEFAULT_EVENT_ID]
  );
  return publicEvent(result.rows[0]);
}
