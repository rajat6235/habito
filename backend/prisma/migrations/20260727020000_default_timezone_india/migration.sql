-- Default timezone for new signups is now Asia/Kolkata instead of UTC. Only
-- affects the column default for future inserts — existing users' timezone
-- values are untouched.
ALTER TABLE "users" ALTER COLUMN "timezone" SET DEFAULT 'Asia/Kolkata';
