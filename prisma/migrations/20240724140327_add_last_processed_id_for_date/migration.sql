/*
  Warnings:

  - Added the required column `lastCreatedAt` to the `LastCheckInfo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastNoticeId` to the `LastCheckInfo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastTitle` to the `LastCheckInfo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastUrl` to the `LastCheckInfo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "LastCheckInfo" ADD COLUMN     "lastCreatedAt" TEXT NOT NULL,
ADD COLUMN     "lastNoticeId" INTEGER NOT NULL,
ADD COLUMN     "lastTitle" TEXT NOT NULL,
ADD COLUMN     "lastUrl" TEXT NOT NULL;
