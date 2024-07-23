-- CreateTable
CREATE TABLE "LastCheckInfo" (
    "id" SERIAL NOT NULL,
    "lastNoticeId" INTEGER NOT NULL,
    "lastDate" TEXT NOT NULL,
    "lastCreatedAt" TEXT NOT NULL,
    "lastTitle" TEXT NOT NULL,
    "lastUrl" TEXT NOT NULL,

    CONSTRAINT "LastCheckInfo_pkey" PRIMARY KEY ("id")
);
