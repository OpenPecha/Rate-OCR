-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'ANNOTATOR', 'REVIEWER');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "Rate" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT,
    "transcript" TEXT,
    "rating" INTEGER NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'PENDING',
    "modified_by_id" TEXT,
    "reviewed_by_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Rate" ADD CONSTRAINT "Rate_modified_by_id_fkey" FOREIGN KEY ("modified_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rate" ADD CONSTRAINT "Rate_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
