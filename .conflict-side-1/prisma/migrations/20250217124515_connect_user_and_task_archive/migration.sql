/*
  Warnings:

  - Added the required column `userId` to the `TaskArchive` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TaskArchive" ADD COLUMN     "userId" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "TaskArchive" ADD CONSTRAINT "TaskArchive_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
