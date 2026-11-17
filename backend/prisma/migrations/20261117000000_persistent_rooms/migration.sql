ALTER TABLE "Match" ADD COLUMN "roomId" TEXT;
CREATE UNIQUE INDEX "Match_roomId_key" ON "Match"("roomId");
