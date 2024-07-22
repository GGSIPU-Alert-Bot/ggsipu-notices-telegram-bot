import { Context } from 'telegraf';

export async function startCommand(ctx: Context) {
  await ctx.reply('Welcome to GGSIPU Notices Bot! You\'ll receive notifications for new notices.');
}