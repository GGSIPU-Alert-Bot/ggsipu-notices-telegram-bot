import { Telegraf } from 'telegraf';
import { config } from '../config/config';
import { startCommand } from './commands/start';
import { logger } from '../utils/logger';

// Detailed logging for bot initialization
logger.info('Initializing bot...');
export const bot = new Telegraf(config.botToken, {
  handlerTimeout: 90_000, // 90 seconds
  telegram: {
    // Disable webpage preview globally
    webhookReply: false,
    // Use custom agent with higher timeout
    agent: new (require('https').Agent)({
      keepAlive: true,
      timeout: 20_000,
    }),
  },
});

// Error handling
bot.catch((err, ctx) => {
  logger.error('Unhandled error in bot:', err);
  logger.error('Context:', ctx);
});

bot.command('start', (ctx) => {
  logger.info('Received /start command');
  startCommand(ctx);
});


