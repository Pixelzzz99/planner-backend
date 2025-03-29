-- CreateEnum
CREATE TYPE "FocusStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'CANCELED');

-- AlterTable
ALTER TABLE "Focus" ADD COLUMN     "status" "FocusStatus" NOT NULL DEFAULT 'IN_PROGRESS';
