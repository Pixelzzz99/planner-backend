/*
  Warnings:

  - Added the required column `date` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `day` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "day" INTEGER NOT NULL;
