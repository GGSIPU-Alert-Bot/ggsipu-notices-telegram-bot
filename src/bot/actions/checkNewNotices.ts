import { bot } from '../index';
import { config } from '../../config/config';
import { getLatestNotices } from '../../services/apiService';
import { getLastCheckInfo, LastCheckInfo, saveLastCheckInfo } from '../../services/storageService';
import { Notice } from '../../models/Notice';
import { logger } from '../../utils/logger';
import axios from 'axios';
import { Readable } from 'stream';

async function downloadPdf(url: string): Promise<Buffer> {
  try {
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'arraybuffer'
    });
    return Buffer.from(response.data, 'binary');
  } catch (error) {
    logger.error(`Error downloading PDF from ${url}:`, error);
    throw new Error('Failed to download PDF');
  }
}

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
        lastCreatedAt: notices[0].createdAt,
        lastTitle: notices[0].title,
        lastUrl: notices[0].url
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
  const noticeDate = new Date(notice.date);
  const lastCheckDate = new Date(lastCheckInfo.lastDate);
  const noticeCreatedAt = new Date(notice.createdAt);
  const lastCheckCreatedAt = new Date(lastCheckInfo.lastCreatedAt);

  // If the notice date is newer, it's definitely a new notice
  if (noticeDate > lastCheckDate) {
    return true;
  }

  // If the dates are the same, check the createdAt timestamp
  if (noticeDate.getTime() === lastCheckDate.getTime()) {
    if (noticeCreatedAt > lastCheckCreatedAt) {
      return true;
    }

    // If createdAt is also the same, compare title and URL
    if (noticeCreatedAt.getTime() === lastCheckCreatedAt.getTime()) {
      return notice.title !== lastCheckInfo.lastTitle || notice.url !== lastCheckInfo.lastUrl;
    }
  }

  return false;
}

async function sendNoticeMessage(notice: Notice): Promise<void> {
  const caption = formatNoticeCaption(notice);
  try {
    const pdfBuffer = await downloadPdf(notice.url);
    const filename = `Notice_${notice.id}.pdf`;

    await bot.telegram.sendDocument(
      config.channelId, 
      { source: Readable.from(pdfBuffer), filename: filename },
      { 
        caption: caption,
        parse_mode: 'HTML'
      }
    );
    logger.info(`Sent notice: ${notice.id}`);
  } catch (error) {
    logger.error(`Error sending notice ${notice.id}:`, error);
  }
}

function formatNoticeCaption(notice: Notice): string {
  return `
📢 <b>New Notice</b>

📅 <b>Date:</b> ${new Date(notice.date).toLocaleDateString('en-US', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})}

📄 <b>Title:</b> ${notice.title}
  `.trim();
}