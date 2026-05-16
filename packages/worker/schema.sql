CREATE TABLE IF NOT EXISTS emails (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id  TEXT NOT NULL UNIQUE,
  sender      TEXT NOT NULL,
  recipient   TEXT NOT NULL,
  subject     TEXT NOT NULL DEFAULT '',
  raw_size    INTEGER,
  is_read     INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS email_bodies (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  email_id  INTEGER NOT NULL UNIQUE REFERENCES emails(id),
  text_body TEXT,
  html_body TEXT,
  headers   TEXT
);

CREATE INDEX IF NOT EXISTS idx_emails_recipient ON emails(recipient, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_message_id ON emails(message_id);
