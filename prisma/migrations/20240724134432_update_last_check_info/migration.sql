/*
  Warnings:

  - You are about to drop the column `lastCreatedAt` on the `LastCheckInfo` table. All the data in the column will be lost.
  - You are about to drop the column `lastNoticeId` on the `LastCheckInfo` table. All the data in the column will be lost.
  - You are about to drop the column `lastTitle` on the `LastCheckInfo` table. All the data in the column will be lost.
  - You are about to drop the column `lastUrl` on the `LastCheckInfo` table. All the data in the column will be lost.
  - Added the required column `lastProcessedIdForDate` to the `LastCheckInfo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "LastCheckInfo" DROP COLUMN "lastCreatedAt",
DROP COLUMN "lastNoticeId",
DROP COLUMN "lastTitle",
DROP COLUMN "lastUrl",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "lastProcessedIdForDate" INTEGER NOT NULL;
