"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bot_1 = require("./bot");
const checkNewNotices_1 = require("./bot/actions/checkNewNotices");
const cron_1 = require("cron");
const logger_1 = require("./utils/logger");
const job = new cron_1.CronJob('0 9,12,14,19,21,0 * * *', checkNewNotices_1.checkForNewNotices);
bot_1.bot.launch();
job.start();
logger_1.logger.info('logger outside job');
// Enable graceful stop
process.once('SIGINT', () => {
    bot_1.bot.stop('SIGINT');
    job.stop();
});
process.once('SIGTERM', () => {
    bot_1.bot.stop('SIGTERM');
    job.stop();
});
