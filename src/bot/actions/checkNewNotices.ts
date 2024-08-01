import { bot } from '../index';
import { config } from '../../config/config';
import { getLatestNotices } from '../../services/apiService';
import { getLastCheckInfo, LastCheckInfo, saveLastCheckInfo } from '../../services/storageService';
import { Notice } from '../../models/Notice';
import { logger } from '../../utils/logger';
import axios from 'axios';
import { InputFile } from 'telegraf/typings/core/types/typegram';
import { backOff } from "exponential-backoff";
import { TelegramError } from 'telegraf';

// Custom sleep function
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Set global axios timeout
axios.defaults.timeout = 120000; // 2 minutes

async function downloadPdfWithRetry(url: string): Promise<Buffer> {
  return backOff(async () => {
    logger.info(`Attempting to download PDF from ${url}`);
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'arraybuffer',
      onDownloadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total!);
        logger.info(`Download progress: ${percentCompleted}%`);
      }
    });
    const pdfBuffer = Buffer.from(response.data, 'binary');
    logger.info(`Downloaded PDF. Size: ${pdfBuffer.length} bytes`);
    if (pdfBuffer.length > 50 * 1024 * 1024) { // If larger than 50MB
      throw new Error('PDF too large to send directly');
    }
    return pdfBuffer;
  }, {
    numOfAttempts: 5,
    startingDelay: 1000,
    timeMultiple: 2,
    maxDelay: 30000,
    jitter: 'full'
  });
}

export async function checkForNewNotices(): Promise<void> {
  try {
    logger.info('Checking for new notices');
    const lastCheckInfo = await getLastCheckInfo();
    const latestNotices = await getLatestNotices();
    
    const newNotices = latestNotices.filter(notice => isNewNotice(notice, lastCheckInfo));

    if (newNotices.length > 0) {
      logger.info(`Found ${newNotices.length} new notices`);
      
      const sortedNewNotices = newNotices.sort((a, b) => {
        const dateComparison = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateComparison !== 0) return dateComparison;
        return b.id - a.id;
      });

      let successfullyProcessedNotices = [];

      for (const notice of sortedNewNotices.reverse()) {
        try {
          await sendNoticeMessage(notice);
          successfullyProcessedNotices.push(notice);
          await sleep(2000); // Wait 2 seconds between sends for rate limiting
        } catch (error) {
          logger.error(`Failed to send notice ${notice.id}:`, error);
          // Continue with the next notice
        }
      }

      if (successfullyProcessedNotices.length > 0) {
        const latestSuccessfulNotice = successfullyProcessedNotices[successfullyProcessedNotices.length - 1];

        const updatedLastCheckInfo: LastCheckInfo = {
          lastNoticeId: latestSuccessfulNotice.id,
          lastDate: latestSuccessfulNotice.date,
          lastCreatedAt: latestSuccessfulNotice.createdAt,
          lastTitle: latestSuccessfulNotice.title,
          lastUrl: latestSuccessfulNotice.url,
          lastProcessedIdForDate: latestSuccessfulNotice.id
        };

        logger.info(`Saving last check info: ${JSON.stringify(updatedLastCheckInfo)}`);
        await saveLastCheckInfo(updatedLastCheckInfo);
      } else {
        logger.warn('No notices were successfully processed');
      }
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
    logger.info(`Downloading PDF for notice ${notice.id}. URL: ${notice.url}`);
    const pdfBuffer = await downloadPdfWithRetry(notice.url);
    logger.info(`Downloaded PDF for notice ${notice.id}. Size: ${pdfBuffer.length} bytes`);

    const filename = `Notice_${notice.id}.pdf`;

    const documentInput: InputFile = {
      source: pdfBuffer,
      filename: filename
    };

    await backOff(async () => {
      try {
        logger.info(`Attempting to send notice ${notice.id} to Telegram`);
        await bot.telegram.sendDocument(
          config.channelId, 
          documentInput,
          { 
            caption: caption,
            parse_mode: 'HTML'
          }
        );
        logger.info(`Successfully sent notice ${notice.id} to Telegram`);
      } catch (error) {
        if (error instanceof TelegramError) {
          if (error.response?.error_code === 429) {
            const retryAfter = error.response.parameters?.retry_after || 1;
            logger.warn(`Rate limit hit for notice ${notice.id}. Retrying after ${retryAfter} seconds.`);
            await sleep(retryAfter * 1000);
          } else {
            logger.error(`Telegram error for notice ${notice.id}: ${error.message}`);
          }
        } else {
          logger.error(`Unexpected error for notice ${notice.id}: ${error}`);
        }
        throw error; // Rethrow to trigger backoff retry
      }
    }, {
      numOfAttempts: 5,
      startingDelay: 1000,
      timeMultiple: 2,
      maxDelay: 60000,
      jitter: 'full'
    });

    logger.info(`Sent notice: ${notice.id}. Time taken: ${Date.now() - start}ms`);
  } catch (error) {
    logger.error(`Error sending notice ${notice.id}. Time taken: ${Date.now() - start}ms:`, error);
    throw error;
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

// Helper function to split large PDFs
async function splitAndSendLargePdf(notice: Notice, pdfBuffer: Buffer): Promise<void> {
  const maxSize = 50 * 1024 * 1024; // 50 MB
  if (pdfBuffer.length <= maxSize) {
    await sendNoticeMessage(notice);
  } else {
    const parts = Math.ceil(pdfBuffer.length / maxSize);
    for (let i = 0; i < parts; i++) {
      const start = i * maxSize;
      const end = Math.min((i + 1) * maxSize, pdfBuffer.length);
      const partBuffer = pdfBuffer.slice(start, end);
      const partNotice = {...notice, title: `${notice.title} (Part ${i + 1} of ${parts})`};
      await sendNoticeMessage(partNotice);
      await sleep(2000); // Wait between parts
    }
  }
}