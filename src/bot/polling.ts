// bot/polling.ts
import { bot } from '../bot';
import { logger } from '../utils/logger';
import { checkForNewNotices } from './actions/checkNewNotices';
import { backOff } from "exponential-backoff";
import { Update, Message } from 'telegraf/typings/core/types/typegram';

let offset = 0;

async function getUpdates() {
  return backOff(async () => {
    try {
      logger.info(`Polling for updates with offset: ${offset}`);
      const updates = await bot.telegram.callApi('getUpdates', {
        offset,
        limit: 100,
        timeout: 30,
        allowed_updates: ['channel_post', 'message']
      });
      
      if (updates.length > 0) {
        offset = updates[updates.length - 1].update_id + 1;
      }
      
      return updates;
    } catch (error) {
      logger.error('Error while getting updates:', error);
      throw error;
    }
  }, {
    numOfAttempts: 5,
    startingDelay: 1000,
    timeMultiple: 2,
    maxDelay: 30000,
    jitter: 'full'
  });
}

function isChannelPostUpdate(update: Update): update is Update.ChannelPostUpdate {
  return 'channel_post' in update;
}

function isMessageUpdate(update: Update): update is Update.MessageUpdate {
  return 'message' in update;
}

function isTextMessage(message: Message): message is Message.TextMessage {
  return 'text' in message;
}

export async function startPolling(): Promise<void> {
    while (true) {
      try {
        const updates = await getUpdates();
        for (const update of updates) {
          try {
            if (isChannelPostUpdate(update)) {
              logger.info(`Received channel post: ${update.channel_post.message_id}`);
              // Handle channel posts if needed
            } else if (isMessageUpdate(update) && isTextMessage(update.message) && update.message.text === '/check_notices') {
              logger.info('Received command to check notices');
              try {
                await checkForNewNotices();
                // Send a confirmation message
                await bot.telegram.sendMessage(update.message.chat.id, 'Check for new notices completed.');
              } catch (error) {
                logger.error('Error checking for new notices:', error);
                await bot.telegram.sendMessage(update.message.chat.id, 'Error checking for new notices. Please try again later.');
              }
            }
          } catch (updateError) {
            logger.error('Error processing update:', updateError);
            // Continue processing other updates
          }
        }
      } catch (error) {
        logger.error('Error in polling loop:', error);
        // Wait for a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
}