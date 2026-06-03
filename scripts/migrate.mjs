import { createClient } from '@libsql/client'
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const migrationsDir = join(__dirname, '..', 'migrations')

const url = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN
if (!url) {
  console.error(
    'TURSO_DATABASE_URL not set. Put it in .env (see .env.example) and run `npm run migrate`.',
  )
  process.exit(1)
}

const client = createClient({ url, authToken })

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort()

if (files.length === 0) {
  console.log('No migrations found.')
  process.exit(0)
}

for (const file of files) {
  console.log(`Applying ${file}…`)
  const sql = readFileSync(join(migrationsDir, file), 'utf8')
  await client.executeMultiple(sql)
}

console.log(`Done — applied ${files.length} migration(s).`)
process.exit(0)
