import { createClient } from '@libsql/client'

let client = null

/**
 * Lazily-constructed Turso client. Reuses the connection across function
 * invocations within the same Lambda warm window — cheaper than rebuilding
 * per request.
 *
 * Throws if `TURSO_DATABASE_URL` is missing. `TURSO_AUTH_TOKEN` is required
 * for hosted Turso DBs but optional for local libsql files, so we don't
 * enforce it here.
 */
export function db() {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL
    if (!url) throw new Error('TURSO_DATABASE_URL not set')
    client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN })
  }
  return client
}
