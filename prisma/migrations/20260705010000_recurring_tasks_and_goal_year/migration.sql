-- AlterTable Goal year default
ALTER TABLE "Goal" ALTER COLUMN "year" SET DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::int;

-- CreateTable RecurringTask
CREATE TABLE "RecurringTask" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "duration" INTEGER NOT NULL DEFAULT 0,
    "day" INTEGER NOT NULL,
    "categoryId" UUID,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecurringTask_pkey" PRIMARY KEY ("id")
);

-- AlterTable Task
ALTER TABLE "Task" ADD COLUMN "recurringTaskId" UUID;

-- CreateIndex
CREATE INDEX "RecurringTask_userId_active_idx" ON "RecurringTask"("userId", "active");

-- CreateIndex
CREATE INDEX "Task_weekPlanId_recurringTaskId_idx" ON "Task"("weekPlanId", "recurringTaskId");

-- AddForeignKey
ALTER TABLE "RecurringTask" ADD CONSTRAINT "RecurringTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringTask" ADD CONSTRAINT "RecurringTask_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_recurringTaskId_fkey" FOREIGN KEY ("recurringTaskId") REFERENCES "RecurringTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;
