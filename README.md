# kato8-newsletter-api

Netlify Functions backend for newsletter signups on [kato8studios.com](https://kato8studios.com/).
The static SPA in `terrytkato8/external-site` posts to `POST /signup`; this
service validates and persists the email to a [Turso](https://turso.tech)
(SQLite-as-a-service) database.

## Endpoints

| Method | Path      | Purpose |
|--------|-----------|---------|
| POST   | `/signup` | Accept a newsletter signup. Body: `{ email, source }`. |
| GET    | `/health` | Uptime ping. Returns `{ ok: true }`. No DB touch. |

`/signup` responses:

- `200 { ok: true }` — stored (or duplicate, or honeypot — all look identical)
- `400 { error: 'invalid_email' \| 'invalid_payload' \| 'invalid_json' }`
- `405 { error: 'method_not_allowed' }`
- `500 { error: 'server_error' }`

## Schema

See [migrations/001_subscribers.sql](./migrations/001_subscribers.sql). One
table, `subscribers`, keyed on `email`. IPs are stored as a salted SHA-256
hash, not the raw value.

## Local development

```bash
nvm use                 # Node 20+
npm install
npm install -g netlify-cli    # one-time, ~200MB

cp .env.example .env
# fill in TURSO_* (use a separate "dev" Turso DB), IP_HASH_SALT, ALLOWED_ORIGINS

npm run migrate         # one-time: apply migrations to the dev DB
npm run dev             # netlify dev — functions on http://localhost:8888
```

Smoke test:

```bash
curl http://localhost:8888/health
curl -X POST http://localhost:8888/signup \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","source":"curl"}'
```

When testing from the SPA, set `VITE_NEWSLETTER_ENDPOINT=http://localhost:8888/signup`
in `external-site`'s `.env.local`.

## Production setup (Netlify)

1. Push this repo to GitHub.
2. In Netlify: **Add new site → Import from Git → pick this repo**. Leave the
   build command and publish dir at the defaults — `netlify.toml` handles
   both.
3. **Site configuration → Environment variables**, add:
   - `TURSO_DATABASE_URL` — prod Turso URL
   - `TURSO_AUTH_TOKEN` — prod Turso token (mark as secret)
   - `IP_HASH_SALT` — random 32+ char hex string (mark as secret)
   - `ALLOWED_ORIGINS` — `https://kato8studios.com,https://aeiti.github.io`
4. Trigger a redeploy so the env vars take effect.
5. Apply migrations to prod once from a local checkout with the prod creds
   loaded:

   ```bash
   TURSO_DATABASE_URL=… TURSO_AUTH_TOKEN=… npm run migrate
   ```

6. Smoke test against the live URL:

   ```bash
   curl https://<your-site>.netlify.app/health
   curl -X POST https://<your-site>.netlify.app/signup \
     -H 'Content-Type: application/json' \
     -d '{"email":"…","source":"curl"}'
   ```

7. In `external-site` (and `kato8-staging`), set the GitHub Actions repo
   variable `VITE_NEWSLETTER_ENDPOINT` to
   `https://<your-site>.netlify.app/signup` and update the deploy workflow
   to pass it into the Vite build env.

## Not in scope (yet)

- Double opt-in (`POST /confirm/:token` + outbound email via Resend or similar).
- Unsubscribe endpoint.
- Rate limiting. The honeypot catches naive bots; add per-IP throttling
  (Netlify Blobs or similar) if abuse becomes a problem.
- CSV export of subscribers. Trivial to add — `turso db shell` works in the
  meantime.
