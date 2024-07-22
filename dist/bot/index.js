"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bot = void 0;
const telegraf_1 = require("telegraf");
const config_1 = require("../config/config");
const start_1 = require("./commands/start");
const logger_1 = require("../utils/logger");
// Detailed logging for bot initialization
logger_1.logger.info('Initializing bot...');
exports.bot = new telegraf_1.Telegraf(config_1.config.botToken, {
    handlerTimeout: 90000, // 90 seconds
    telegram: {
        // Disable webpage preview globally
        webhookReply: false,
        // Use custom agent with higher timeout
        agent: new (require('https').Agent)({
            keepAlive: true,
            timeout: 20000,
        }),
    },
});
// Error handling
exports.bot.catch((err, ctx) => {
    logger_1.logger.error('Unhandled error in bot:', err);
    logger_1.logger.error('Context:', ctx);
});
exports.bot.command('start', (ctx) => {
    logger_1.logger.info('Received /start command');
    (0, start_1.startCommand)(ctx);
});
