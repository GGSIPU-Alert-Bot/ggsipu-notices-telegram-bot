import { bot } from './bot';
import { checkForNewNotices } from './bot/actions/checkNewNotices';
import { CronJob } from 'cron';
import { logger } from './utils/logger';

const job = new CronJob('0 9,12,14,19,21,0 * * *', checkForNewNotices);

bot.launch();
job.start();

logger.info('logger outside job');

// Enable graceful stop
process.once('SIGINT', () => {
  bot.stop('SIGINT');
  job.stop();
});
process.once('SIGTERM', () => {
  bot.stop('SIGTERM');
  job.stop();
});