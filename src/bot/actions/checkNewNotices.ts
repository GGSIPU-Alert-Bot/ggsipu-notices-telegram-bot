import { bot } from '../index';
import { config } from '../../config/config';
import { getLatestNotices } from '../../services/apiService';
import { getLastCheckInfo, LastCheckInfo, saveLastCheckInfo } from '../../services/storageService';
import { Notice } from '../../models/Notice';
import { logger } from '../../utils/logger';

export async function checkForNewNotices(): Promise<void> {
  try {
    logger.info('Checking for new notices');
    const lastCheckInfo = await getLastCheckInfo();
    const notices = await getLatestNotices();

    const newNotices = notices.filter(notice => isNewNotice(notice, lastCheckInfo));

    if (newNotices.length > 0) {
      logger.info(`Found ${newNotices.length} new notices`);
      for (const notice of newNotices.reverse()) {
        await sendNoticeMessage(notice);
      }

      const updatedLastCheckInfo = {
        lastNoticeId: Math.max(...notices.map(notice => notice.id)),
        lastDate: notices[0].date,
        lastCreatedAt: notices[0].createdAt
      };
      await saveLastCheckInfo(updatedLastCheckInfo);
    } else {
      logger.info('No new notices found');
    }
  } catch (error) {
    logger.error('Error checking for new notices:', error);
  }
}

function isNewNotice(notice: Notice, lastCheckInfo: LastCheckInfo): boolean {
  return (new Date(notice.date) > new Date(lastCheckInfo.lastDate) && new Date(notice.createdAt) > new Date(lastCheckInfo.lastCreatedAt));
}

async function sendNoticeMessage(notice: Notice): Promise<void> {
  const message = formatNoticeMessage(notice);
  try {
    await bot.telegram.sendMessage(config.channelId, message, { parse_mode: 'HTML' });
    logger.info(`Sent notice: ${notice.id}`);
  } catch (error) {
    logger.error(`Error sending notice ${notice.id}:`, error);
  }
}

function formatNoticeMessage(notice: Notice): string {
  return `
<b>New Notice</b>

<b>Title:</b> ${notice.title}
<b>Date:</b> ${notice.date}
<b>URL:</b> ${notice.url}
  `.trim();
}