"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkForNewNotices = checkForNewNotices;
const index_1 = require("../index");
const config_1 = require("../../config/config");
const apiService_1 = require("../../services/apiService");
const storageService_1 = require("../../services/storageService");
const logger_1 = require("../../utils/logger");
function checkForNewNotices() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            logger_1.logger.info('Checking for new notices');
            const lastCheckInfo = yield (0, storageService_1.getLastCheckInfo)();
            const notices = yield (0, apiService_1.getLatestNotices)();
            const newNotices = notices.filter(notice => isNewNotice(notice, lastCheckInfo));
            if (newNotices.length > 0) {
                logger_1.logger.info(`Found ${newNotices.length} new notices`);
                for (const notice of newNotices.reverse()) {
                    yield sendNoticeMessage(notice);
                }
                const updatedLastCheckInfo = {
                    lastNoticeId: Math.max(...notices.map(notice => notice.id)),
                    lastDate: notices[0].date,
                    lastCreatedAt: notices[0].createdAt
                };
                yield (0, storageService_1.saveLastCheckInfo)(updatedLastCheckInfo);
            }
            else {
                logger_1.logger.info('No new notices found');
            }
        }
        catch (error) {
            logger_1.logger.error('Error checking for new notices:', error);
        }
    });
}
function isNewNotice(notice, lastCheckInfo) {
    return (new Date(notice.date) > new Date(lastCheckInfo.lastDate) && new Date(notice.createdAt) > new Date(lastCheckInfo.lastCreatedAt));
}
function sendNoticeMessage(notice) {
    return __awaiter(this, void 0, void 0, function* () {
        const message = formatNoticeMessage(notice);
        try {
            yield index_1.bot.telegram.sendMessage(config_1.config.channelId, message, { parse_mode: 'HTML' });
            logger_1.logger.info(`Sent notice: ${notice.id}`);
        }
        catch (error) {
            logger_1.logger.error(`Error sending notice ${notice.id}:`, error);
        }
    });
}
function formatNoticeMessage(notice) {
    return `
<b>New Notice</b>

<b>Title:</b> ${notice.title}
<b>Date:</b> ${notice.date}
<b>URL:</b> ${notice.url}
  `.trim();
}
