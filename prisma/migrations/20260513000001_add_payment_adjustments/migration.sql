-- CreateTable
CREATE TABLE "payment_adjustments" (
    "id" SERIAL NOT NULL,
    "memberId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "memo" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_adjustments_memberId_idx" ON "payment_adjustments"("memberId");

-- AddForeignKey
ALTER TABLE "payment_adjustments" ADD CONSTRAINT "payment_adjustments_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
