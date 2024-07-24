import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface LastCheckInfo {
  lastNoticeId: number; // Keep this for backward compatibility
  lastDate: string;
  lastCreatedAt: string; // Keep this for backward compatibility
  lastTitle: string; // Keep this for backward compatibility
  lastUrl: string; // Keep this for backward compatibility
  lastProcessedIdForDate: number;
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
        lastUrl: lastCheck.lastUrl,
        lastProcessedIdForDate: lastCheck.lastProcessedIdForDate || lastCheck.lastNoticeId // Use lastNoticeId as fallback
      };
    } else {
      logger.warn('Last check info not found, using default values');
      return {
        lastNoticeId: 37057,
        lastDate: '2024-07-23',
        lastCreatedAt: '2024-07-23T13:00:14.889Z',
        lastTitle: 'List of selected candidates, Ph.D. Admission in USMS (Management) PET Code 221, Academic Session 2024-25',
        lastUrl: 'http://www.ipu.ac.in/Pubinfo2024/nt230724450p%20(1).pdf',
        lastProcessedIdForDate: 37057
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
      data: {
        lastNoticeId: info.lastProcessedIdForDate, 
        lastDate: info.lastDate,
        lastCreatedAt: info.lastCreatedAt,
        lastTitle: info.lastTitle,
        lastUrl: info.lastUrl,
        lastProcessedIdForDate: info.lastProcessedIdForDate
      }
    });
    logger.info('Last check info updated');
  } catch (error) {
    logger.error('Error saving last check info:', error);
    throw error;
  }
}


process.on('beforeExit', async () => {
  await prisma.$disconnect();
});