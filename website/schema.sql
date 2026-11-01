-- REVIEW ONLY. No code applies this schema automatically.
-- Apply only after specific approval for the selected Neon database.
CREATE TABLE IF NOT EXISTS duodesk_counts (
  day date NOT NULL,
  event text NOT NULL CHECK (event IN ('view', 'download')),
  os text NOT NULL CHECK (os IN ('win', 'mac', 'linux', 'android', 'unknown')),
  count bigint NOT NULL DEFAULT 0 CHECK (count >= 0),
  PRIMARY KEY (day, event, os)
);
-- Only date, event kind, OS and aggregate count are stored.
-- No visitor IDs, IP addresses, user-agent strings, referrers or cookies.
