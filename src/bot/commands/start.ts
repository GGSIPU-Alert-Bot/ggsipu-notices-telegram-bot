import { Context } from 'telegraf';
import { logger } from '../../utils/logger';

export async function startCommand(ctx: Context) {
  try {
    await ctx.reply('Welcome to GGSIPU Notices Bot! You\'ll receive notifications for new notices.');
    logger.info(`Start command executed by user ${ctx.from?.id}`);
  } catch (error) {
    logger.error('Error in start command:', error);
    await ctx.reply('Sorry, there was an error processing your command. Please try again later.');
  }
}