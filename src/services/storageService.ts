import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface LastCheckInfo {
  lastNoticeId: number;
  lastDate: string;
  lastCreatedAt: string;
  lastTitle: string;
  lastUrl: string;
}

export async function getLastCheckInfo(): Promise<LastCheckInfo> {
  try {
    const lastCheck = await prisma.lastCheckInfo.findFirst({
      orderBy: { id: 'desc' }
    });

    if (lastCheck) {
      return {
        lastNoticeId: lastCheck.lastNoticeId,
        lastDate: lastCheck.lastDate,
        lastCreatedAt: lastCheck.lastCreatedAt,
        lastTitle: lastCheck.lastTitle,
        lastUrl: lastCheck.lastUrl
      };
    } else {
      logger.warn('Last check info not found, using default values');
      return {
        lastNoticeId: 1,
        lastDate: '2024-07-22',
        lastCreatedAt: '2024-07-23 00:24:15.434',
        lastTitle: 'Notice regarding Ph.D. Admission Interview (International Students) for USICT',
        lastUrl: 'http://www.ipu.ac.in/Pubinfo2024/nt220724p431%20(11).pdf'
      };
    }
  } catch (error) {
    logger.error('Error retrieving last check info:', error);
    throw error;
  }
}

export async function saveLastCheckInfo(info: LastCheckInfo): Promise<void> {
  try {
    await prisma.lastCheckInfo.create({
      data: info
    });
    logger.info('Last check info updated');
  } catch (error) {
    logger.error('Error saving last check info:', error);
    throw error;
  }
}

// Don't forget to close the Prisma client when your app shuts down
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});