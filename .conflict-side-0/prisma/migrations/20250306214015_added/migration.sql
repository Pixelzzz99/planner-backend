/*
  Warnings:

  - You are about to drop the `TaskArchive` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TaskArchive" DROP CONSTRAINT "TaskArchive_taskId_fkey";

-- DropForeignKey
ALTER TABLE "TaskArchive" DROP CONSTRAINT "TaskArchive_userId_fkey";

-- DropForeignKey
ALTER TABLE "TaskArchive" DROP CONSTRAINT "TaskArchive_weekPlanId_fkey";

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "archiveReason" TEXT,
ADD COLUMN     "archivedAt" TIMESTAMP(3);

-- DropTable
DROP TABLE "TaskArchive";

-- DropEnum
DROP TYPE "ArchiveReason";

-- CreateIndex
CREATE INDEX "Task_weekPlanId_isArchived_idx" ON "Task"("weekPlanId", "isArchived");

-- CreateIndex
CREATE INDEX "Task_isArchived_day_idx" ON "Task"("isArchived", "day");
