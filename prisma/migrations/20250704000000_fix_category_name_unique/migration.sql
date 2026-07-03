-- Drop the global unique constraint on Category.name
-- The per-user uniqueness is already enforced by @@unique([userId, name])
DROP INDEX IF EXISTS "Category_name_key";
