const express = require('express');
const { bot, setupBot} = require('./bot');
const { checkForNewNotices } = require('./bot/actions/checkNewNotices');
const { CronJob } = require('cron');
const { logger } = require('./utils/logger');
const { startPolling } = require('./bot/polling');


const app = express();
const port = process.env.PORT || 8000;

// Custom API route to check server status
app.get('/status', (req: any, res: { json: (arg0: { message: string; }) => void; }) => {
  res.json({ message: 'Server is running' });
});

// Setting up the cron job
// const job = new CronJob('10 8,10,12,14,16,17,18,19,20,22 * * *', async () => {
//   try {
//     logger.info('Cron job triggered: Checking for new notices');
//     await checkForNewNotices();
//   } catch (error) {
//     logger.error('Error in cron job:', error);
//   }
// });

async function startBot() {
  try {
    setupBot();
    await bot.launch();
    logger.info('Bot started successfully');
    startPolling();
  } catch (error) {
    logger.error('Failed to start bot:', error);
    process.exit(1);
  }
}

// Launch the bot, start the cron job, and begin polling
startBot();

// Immediately check for new notices
async function runCheckForNewNotices() {
  try {
    logger.info('Running immediate check for new notices');
    await checkForNewNotices();
  } catch (error) {
    logger.error('Error in immediate check for new notices:', error);
  }
}

runCheckForNewNotices();

// job.start();

logger.info('Application initialized');

// Graceful shutdown
process.once('SIGINT', () => {
  bot.stop('SIGINT');
  // job.stop();
  logger.info('Application stopped due to SIGINT');
  process.exit(0);
});

process.once('SIGTERM', () => {
  bot.stop('SIGTERM');
  // job.stop();
  logger.info('Application stopped due to SIGTERM');
  process.exit(0);
});

// Start the Express server
app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});

// Global error handling
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});