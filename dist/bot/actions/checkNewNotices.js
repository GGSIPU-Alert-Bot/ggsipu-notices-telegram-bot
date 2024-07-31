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
const ts_retry_promise_1 = require("ts-retry-promise");
// Custom sleep function
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
// Set global axios timeout
axios_1.default.defaults.timeout = 60000; // 60 seconds
function downloadPdfWithRetry(url) {
    return __awaiter(this, void 0, void 0, function* () {
        return (0, ts_retry_promise_1.retry)(() => __awaiter(this, void 0, void 0, function* () {
            const response = yield (0, axios_1.default)({
                method: 'get',
                url: url,
                responseType: 'arraybuffer'
            });
            const pdfBuffer = Buffer.from(response.data, 'binary');
            if (pdfBuffer.length > 50 * 1024 * 1024) { // If larger than 50MB
                throw new Error('PDF too large to send directly');
            }
            return pdfBuffer;
        }), { retries: 3, delay: 1000 });
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
                const sortedNewNotices = newNotices.sort((a, b) => {
                    const dateComparison = new Date(b.date).getTime() - new Date(a.date).getTime();
                    if (dateComparison !== 0)
                        return dateComparison;
                    return b.id - a.id;
                });
                for (const notice of sortedNewNotices.reverse()) {
                    try {
                        yield sendNoticeMessage(notice);
                        yield sleep(1000); // Wait 1 second between sends for rate limiting
                    }
                    catch (error) {
                        logger_1.logger.error(`Failed to send notice ${notice.id}:`, error);
                    }
                }
                const latestNotice = sortedNewNotices[sortedNewNotices.length - 1];
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
        const start = Date.now();
        try {
            const pdfBuffer = yield downloadPdfWithRetry(notice.url);
            const filename = `Notice_${notice.id}.pdf`;
            const documentInput = {
                source: pdfBuffer,
                filename: filename
            };
            yield (0, ts_retry_promise_1.retry)(() => __awaiter(this, void 0, void 0, function* () {
                yield index_1.bot.telegram.sendDocument(config_1.config.channelId, documentInput, {
                    caption: caption,
                    parse_mode: 'HTML'
                });
            }), { retries: 3, delay: 1000 });
            logger_1.logger.info(`Sent notice: ${notice.id}. Time taken: ${Date.now() - start}ms`);
        }
        catch (error) {
            logger_1.logger.error(`Error sending notice ${notice.id}. Time taken: ${Date.now() - start}ms:`, error);
            throw error; // Re-throw the error to be caught in the main loop
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
