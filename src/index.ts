const express = require('express');
const { bot } = require('./bot');
const { checkForNewNotices } = require('./bot/actions/checkNewNotices');
const { CronJob } = require('cron');
const { logger } = require('./utils/logger');

const app = express();
const port = process.env.PORT || 8000;

// Custom API route to check server status
app.get('/status', (req: any, res: { json: (arg0: { message: string; }) => void; }) => {
  res.json({ message: 'Server is running' });
});

// Setting up the cron job
const job = new CronJob('10 8,10,12,14,16,17,18,19,20,22 * * *', checkForNewNotices);

// Launch the bot and start the cron job
bot.launch();
job.start();

logger.info('logger outside job');

// checkForNewNotices();

// Graceful shutdown
process.once('SIGINT', () => {
  bot.stop('SIGINT');
  job.stop();
  process.exit(0);
});

process.once('SIGTERM', () => {
  bot.stop('SIGTERM');
  job.stop();
  process.exit(0);
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
