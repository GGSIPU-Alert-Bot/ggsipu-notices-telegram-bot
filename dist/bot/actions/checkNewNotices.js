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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkForNewNotices = checkForNewNotices;
const index_1 = require("../index");
const config_1 = require("../../config/config");
const apiService_1 = require("../../services/apiService");
const storageService_1 = require("../../services/storageService");
const logger_1 = require("../../utils/logger");
const axios_1 = __importDefault(require("axios"));
// import { sendWebhookEvent } from '../../services/whatsappWebhookService';
function downloadPdf(url) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield (0, axios_1.default)({
                method: 'get',
                url: url,
                responseType: 'arraybuffer'
            });
            return Buffer.from(response.data, 'binary');
        }
        catch (error) {
            logger_1.logger.error(`Error downloading PDF from ${url}:`, error);
            throw new Error('Failed to download PDF');
        }
    });
}
function checkForNewNotices() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            logger_1.logger.info('Checking for new notices');
            const lastCheckInfo = yield (0, storageService_1.getLastCheckInfo)();
            const notices = yield (0, apiService_1.getLatestNotices)();
            const newNotices = notices.filter(notice => isNewNotice(notice, lastCheckInfo));
            if (newNotices.length > 0) {
                logger_1.logger.info(`Found ${newNotices.length} new notices`);
                // Sort new notices by date (descending) and then by ID (descending)
                const sortedNewNotices = newNotices.sort((a, b) => {
                    const dateComparison = new Date(b.date).getTime() - new Date(a.date).getTime();
                    if (dateComparison !== 0)
                        return dateComparison;
                    return b.id - a.id;
                });
                for (const notice of sortedNewNotices.reverse()) {
                    yield sendNoticeMessage(notice);
                    // await sendWebhookEvent(notice); 
                }
                const latestNotice = sortedNewNotices[sortedNewNotices.length - 1]; // This should be the most recent notice
                const updatedLastCheckInfo = {
                    lastNoticeId: latestNotice.id,
                    lastDate: latestNotice.date,
                    lastCreatedAt: new Date().toISOString(),
                    lastTitle: latestNotice.title,
                    lastUrl: latestNotice.url,
                    lastProcessedIdForDate: latestNotice.id
                };
                logger_1.logger.info(`Saving last check info: ${JSON.stringify(updatedLastCheckInfo)}`);
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
    const noticeDate = new Date(notice.date);
    const lastCheckDate = new Date(lastCheckInfo.lastDate);
    if (noticeDate > lastCheckDate) {
        return true;
    }
    if (noticeDate.getTime() === lastCheckDate.getTime()) {
        return notice.id > lastCheckInfo.lastProcessedIdForDate;
    }
    return false;
}
function sendNoticeMessage(notice) {
    return __awaiter(this, void 0, void 0, function* () {
        const caption = formatNoticeCaption(notice);
        try {
            const pdfBuffer = yield downloadPdf(notice.url);
            const filename = `Notice_${notice.id}.pdf`;
            const documentInput = {
                source: pdfBuffer,
                filename: filename
            };
            yield index_1.bot.telegram.sendDocument(config_1.config.channelId, documentInput, {
                caption: caption,
                parse_mode: 'HTML'
            });
            logger_1.logger.info(`Sent notice: ${notice.id}`);
        }
        catch (error) {
            logger_1.logger.error(`Error sending notice ${notice.id}:`, error);
        }
    });
}
function formatNoticeCaption(notice) {
    return `
📢 <b>New Notice</b>

📅 <b>Date:</b> ${new Date(notice.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })}

📄 <b>Title:</b> ${notice.title}
  `.trim();
}
