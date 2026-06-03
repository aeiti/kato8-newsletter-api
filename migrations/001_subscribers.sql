-- Newsletter subscribers. One row per email.
--
-- `consented_at` is the moment the visitor submitted the form.
-- `confirmed_at` stays NULL until a future double opt-in flow lands;
-- treat NULL as "not yet confirmed" once that's wired up.

CREATE TABLE IF NOT EXISTS subscribers (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT    NOT NULL UNIQUE,
  source        TEXT,
  user_agent    TEXT,
  ip_hash       TEXT,
  consented_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  confirmed_at  TEXT
);

CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);
