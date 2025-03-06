-- CreateEnum
CREATE TYPE "ArchiveReason" AS ENUM ('NOT_COMPLETED', 'POSTPONED', 'CANCELLED');

-- AlterTable
ALTER TABLE "TaskArchive" ADD COLUMN     "status" "ArchiveReason" NOT NULL DEFAULT 'NOT_COMPLETED';
