import fs from 'fs/promises';
import { logger } from '../utils/logger';

const LAST_CHECK_FILE = 'last_check_info.json';

export interface LastCheckInfo {
  lastNoticeId: number;
  lastDate: string;
  lastCreatedAt: string;
}

export async function getLastCheckInfo(): Promise<LastCheckInfo> {
  try {
    const data = await fs.readFile(LAST_CHECK_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    logger.warn('Last check info not found, using default values');
    return { lastNoticeId: 1152527, lastDate: '2024-07-20', lastCreatedAt: '2024-07-21T13:25:03.223Z' };
  }
}

export async function saveLastCheckInfo(info: LastCheckInfo): Promise<void> {
  await fs.writeFile(LAST_CHECK_FILE, JSON.stringify(info));
  logger.info('Last check info updated');
}