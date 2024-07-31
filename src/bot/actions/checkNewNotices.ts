import { bot } from '../index';
import { config } from '../../config/config';
import { getLatestNotices } from '../../services/apiService';
import { getLastCheckInfo, LastCheckInfo, saveLastCheckInfo } from '../../services/storageService';
import { Notice } from '../../models/Notice';
import { logger } from '../../utils/logger';
import axios from 'axios';
import { InputFile } from 'telegraf/typings/core/types/typegram';
import { retry } from 'ts-retry-promise';

// Custom sleep function
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Set global axios timeout
axios.defaults.timeout = 60000; // 60 seconds

async function downloadPdfWithRetry(url: string): Promise<Buffer> {
  return retry(async () => {
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'arraybuffer'
    });
    const pdfBuffer = Buffer.from(response.data, 'binary');
    if (pdfBuffer.length > 50 * 1024 * 1024) { // If larger than 50MB
      throw new Error('PDF too large to send directly');
    }
    return pdfBuffer;
  }, { retries: 3, delay: 1000 });
}

export async function checkForNewNotices(): Promise<void> {
  try {
    logger.info('Checking for new notices');
    const lastCheckInfo = await getLastCheckInfo();
    const notices = await getLatestNotices();

    const newNotices = notices.filter(notice => isNewNotice(notice, lastCheckInfo));

    if (newNotices.length > 0) {
      logger.info(`Found ${newNotices.length} new notices`);
      
      const sortedNewNotices = newNotices.sort((a, b) => {
        const dateComparison = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateComparison !== 0) return dateComparison;
        return b.id - a.id;
      });

      for (const notice of sortedNewNotices.reverse()) {
        try {
          await sendNoticeMessage(notice);
          await sleep(1000); // Wait 1 second between sends for rate limiting
        } catch (error) {
          logger.error(`Failed to send notice ${notice.id}:`, error);
        }
      }

      const latestNotice = sortedNewNotices[sortedNewNotices.length - 1];

      const updatedLastCheckInfo: LastCheckInfo = {
        lastNoticeId: latestNotice.id,
        lastDate: latestNotice.date,
        lastCreatedAt: new Date().toISOString(),
        lastTitle: latestNotice.title,
        lastUrl: latestNotice.url,
        lastProcessedIdForDate: latestNotice.id
      };

      logger.info(`Saving last check info: ${JSON.stringify(updatedLastCheckInfo)}`);
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

  if (noticeDate > lastCheckDate) {
    return true;
  }

  if (noticeDate.getTime() === lastCheckDate.getTime()) {
    return notice.id > lastCheckInfo.lastProcessedIdForDate;
  }
  
  return false;
}

async function sendNoticeMessage(notice: Notice): Promise<void> {
  const caption = formatNoticeCaption(notice);
  const start = Date.now();
  try {
    const pdfBuffer = await downloadPdfWithRetry(notice.url);
    const filename = `Notice_${notice.id}.pdf`;

    const documentInput: InputFile = {
      source: pdfBuffer,
      filename: filename
    };

    await retry(async () => {
      await bot.telegram.sendDocument(
        config.channelId, 
        documentInput,
        { 
          caption: caption,
          parse_mode: 'HTML'
        }
      );
    }, { retries: 3, delay: 1000 });

    logger.info(`Sent notice: ${notice.id}. Time taken: ${Date.now() - start}ms`);
  } catch (error) {
    logger.error(`Error sending notice ${notice.id}. Time taken: ${Date.now() - start}ms:`, error);
    throw error; // Re-throw the error to be caught in the main loop
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