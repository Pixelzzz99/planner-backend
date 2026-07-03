-- AlterTable: add year column to Goal, defaulting existing rows to 2025
ALTER TABLE "Goal" ADD COLUMN "year" INTEGER NOT NULL DEFAULT 2025;
