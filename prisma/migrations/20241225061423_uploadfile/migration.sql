/*
  Warnings:

  - A unique constraint covering the columns `[fileName]` on the table `Rate` will be added. If there are existing duplicate values, this will fail.
  - Made the column `imageUrl` on table `Rate` required. This step will fail if there are existing NULL values in that column.
  - Made the column `transcript` on table `Rate` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Rate" ADD COLUMN     "fileName" TEXT,
ALTER COLUMN "imageUrl" SET NOT NULL,
ALTER COLUMN "transcript" SET NOT NULL,
ALTER COLUMN "rating" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Rate_fileName_key" ON "Rate"("fileName");
