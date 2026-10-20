-- 18+ bio pages: visitors confirm their age before seeing links, and links to
-- adult hosts are only accepted on galleries with this flag set.

ALTER TABLE link_galleries ADD COLUMN is_sensitive INTEGER NOT NULL DEFAULT 0;
