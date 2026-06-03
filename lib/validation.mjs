const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_EMAIL_LEN = 254
const MAX_SOURCE_LEN = 64

/**
 * Validate and normalise a signup payload.
 *
 * Returns `{ ok: true, value: { email, source } }` on a valid payload.
 * Returns `{ ok: true, isBot: true }` when the honeypot field was filled —
 * the caller should short-circuit to a 200 without writing to the DB so
 * the bot can't distinguish honeypot rejection from a real success.
 * Returns `{ ok: false, error }` on invalid input (caller returns 400).
 */
export function validateSignup(body) {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'invalid_payload' }
  }

  // Honeypot: legitimate clients always send this empty.
  if (typeof body.website === 'string' && body.website.length > 0) {
    return { ok: true, isBot: true }
  }

  const email =
    typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email || email.length > MAX_EMAIL_LEN || !EMAIL_RE.test(email)) {
    return { ok: false, error: 'invalid_email' }
  }

  const rawSource = typeof body.source === 'string' ? body.source.trim() : ''
  const source =
    rawSource && rawSource.length <= MAX_SOURCE_LEN ? rawSource : 'unknown'

  return { ok: true, value: { email, source } }
}
