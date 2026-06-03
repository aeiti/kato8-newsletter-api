import { corsHeadersFor } from '../../lib/cors.mjs'

/**
 * GET /health — uptime ping. Returns `{ ok: true }` if the function
 * is reachable. Does not touch the database.
 */
export default async (req) => {
  const cors = corsHeadersFor(req.headers.get('origin'))
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...cors },
  })
}
