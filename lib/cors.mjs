const ALLOWED = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

/**
 * Build a CORS header set for a given request origin.
 *
 * Echoes the origin back as `Access-Control-Allow-Origin` only when it
 * appears in `ALLOWED_ORIGINS`. Disallowed origins get the rest of the
 * CORS headers but no ACAO, so the browser blocks the response.
 */
export function corsHeadersFor(origin) {
  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  }
  if (origin && ALLOWED.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
  }
  return headers
}
