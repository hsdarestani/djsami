-- Run once against your Cloudflare D1 database before activating booking requests.
CREATE TABLE IF NOT EXISTS booking_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_date TEXT NOT NULL,
  location TEXT NOT NULL,
  guest_count INTEGER,
  message TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL DEFAULT 'en',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','confirmed','declined')),
  client_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_booking_requests_created ON booking_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_booking_requests_email_date ON booking_requests(email,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_booking_requests_client_date ON booking_requests(client_hash,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_booking_requests_event ON booking_requests(event_date,status);