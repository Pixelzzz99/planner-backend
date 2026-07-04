-- CreateTable
CREATE TABLE "RevokedToken" (
    "tokenHash" VARCHAR(64) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevokedToken_pkey" PRIMARY KEY ("tokenHash")
);

-- CreateIndex
CREATE INDEX "RevokedToken_expiresAt_idx" ON "RevokedToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "YearPlan_userId_year_key" ON "YearPlan"("userId", "year");
