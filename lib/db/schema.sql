-- Schema for the roadmap site. Applied by `npm run db:migrate`.
--
-- Written for libSQL/SQLite. Every statement is idempotent so the migration
-- can be re-run against an existing database without dropping anything.

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------- users ----
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  -- Stored lowercased and trimmed. UNIQUE is enforced on that normalised form
  -- so Foo@Bar.com and foo@bar.com cannot both register.
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  -- Optional by design: requiring a phone number is the single biggest
  -- drop-off point on a signup form.
  phone         TEXT,
  -- scrypt, as `scrypt$N$r$p$salt$hash` — never a plaintext password.
  password_hash TEXT NOT NULL,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);

-- ------------------------------------------------------------- sessions ----
CREATE TABLE IF NOT EXISTS sessions (
  -- SHA-256 of the cookie token, never the token itself. A leaked database
  -- therefore cannot be used to mint working session cookies.
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  -- Coarse audit trail, useful when someone reports a hijacked account.
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions (expires_at);

-- ------------------------------------------------------------- progress ----
-- One row per completed stage. Absence of a row means "not done", so
-- un-checking is a DELETE and there is no tri-state to reason about.
CREATE TABLE IF NOT EXISTS progress (
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  path_slug    TEXT NOT NULL,
  stage_id     TEXT NOT NULL,
  completed_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, path_slug, stage_id)
);

CREATE INDEX IF NOT EXISTS progress_user_path_idx ON progress (user_id, path_slug);

-- --------------------------------------------------- chat conversations ----
-- Chat requires an account, so every conversation belongs to a user and is
-- removed with them.
CREATE TABLE IF NOT EXISTS chat_conversations (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Derived from the first user message, so the history list is readable
  -- without loading every conversation.
  title      TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  -- Ordering key for the history list, bumped on every new message.
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS chat_conversations_user_idx
  ON chat_conversations (user_id, updated_at DESC);

-- -------------------------------------------------------- chat messages ----
CREATE TABLE IF NOT EXISTS chat_messages (
  id              TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL
                    REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  -- The full parts array as JSON, not flattened text: an assistant turn
  -- interleaves prose with recommendation cards, and the order is the
  -- content. Flattening would lose where each card belonged.
  parts           TEXT NOT NULL,
  created_at      INTEGER NOT NULL,
  -- Ties messages to their order within a conversation independently of
  -- timestamp collisions, which happen when a turn is written in one batch.
  position        INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS chat_messages_conversation_idx
  ON chat_messages (conversation_id, position);
