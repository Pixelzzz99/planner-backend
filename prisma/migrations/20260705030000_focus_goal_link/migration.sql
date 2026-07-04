-- AlterTable
ALTER TABLE "Focus" ADD COLUMN "goalId" UUID;

-- CreateIndex
CREATE INDEX "Focus_goalId_idx" ON "Focus"("goalId");

-- AddForeignKey
ALTER TABLE "Focus" ADD CONSTRAINT "Focus_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
