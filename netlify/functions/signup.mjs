import crypto from 'node:crypto'
import { db } from '../../lib/db.mjs'
import { validateSignup } from '../../lib/validation.mjs'
import { corsHeadersFor } from '../../lib/cors.mjs'

/**
 * POST /signup — accept a newsletter signup.
 *
 * Body: `{ email: string, source?: string, website?: string }`
 *   - `website` is the honeypot; legitimate clients send it empty.
 *
 * Responses:
 *   200 { ok: true }                        — stored, or honeypot, or duplicate
 *   400 { error: 'invalid_email' | … }      — validation failed
 *   405 { error: 'method_not_allowed' }     — wrong HTTP verb
 *   500 { error: 'server_error' }           — DB or other failure
 *
 * Duplicates return 200 deliberately so probing for membership ("is
 * adam@example.com on the list?") leaks nothing.
 */
export default async (req) => {
  const cors = corsHeadersFor(req.headers.get('origin'))

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors })
  }
  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405, cors)
  }

  let body
  try {
    body = await req.json()
  } catch {
    return json({ error: 'invalid_json' }, 400, cors)
  }

  const result = validateSignup(body)
  if (!result.ok) {
    return json({ error: result.error }, 400, cors)
  }
  if (result.isBot) {
    // Honeypot tripped — pretend success, write nothing.
    return json({ ok: true }, 200, cors)
  }

  const { email, source } = result.value
  const ip =
    req.headers.get('x-nf-client-connection-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    ''
  const salt = process.env.IP_HASH_SALT || ''
  const ipHash = ip
    ? crypto.createHash('sha256').update(ip + salt).digest('hex')
    : null
  const userAgent = req.headers.get('user-agent') || null

  try {
    await db().execute({
      sql: 'INSERT INTO subscribers (email, source, user_agent, ip_hash) VALUES (?, ?, ?, ?)',
      args: [email, source, userAgent, ipHash],
    })
    return json({ ok: true }, 200, cors)
  } catch (err) {
    // UNIQUE-constraint failures mean the email is already subscribed.
    // Surface as success so we don't leak membership.
    const msg = err && err.message ? String(err.message) : ''
    if (msg.includes('UNIQUE') || msg.includes('SQLITE_CONSTRAINT')) {
      return json({ ok: true }, 200, cors)
    }
    console.error('signup error', err)
    return json({ error: 'server_error' }, 500, cors)
  }
}

function json(body, status, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  })
}
