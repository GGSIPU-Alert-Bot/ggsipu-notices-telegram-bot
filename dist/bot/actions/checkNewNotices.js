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
const exponential_backoff_1 = require("exponential-backoff");
const telegraf_1 = require("telegraf");
// Custom sleep function
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
// Set global axios timeout
axios_1.default.defaults.timeout = 120000; // 2 minutes
function downloadPdfWithRetry(url) {
    return __awaiter(this, void 0, void 0, function* () {
        return (0, exponential_backoff_1.backOff)(() => __awaiter(this, void 0, void 0, function* () {
            logger_1.logger.info(`Attempting to download PDF from ${url}`);
            const response = yield (0, axios_1.default)({
                method: 'get',
                url: url,
                responseType: 'arraybuffer',
                onDownloadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    logger_1.logger.info(`Download progress: ${percentCompleted}%`);
                }
            });
            const pdfBuffer = Buffer.from(response.data, 'binary');
            logger_1.logger.info(`Downloaded PDF. Size: ${pdfBuffer.length} bytes`);
            if (pdfBuffer.length > 50 * 1024 * 1024) { // If larger than 50MB
                throw new Error('PDF too large to send directly');
            }
            return pdfBuffer;
        }), {
            numOfAttempts: 5,
            startingDelay: 1000,
            timeMultiple: 2,
            maxDelay: 30000,
            jitter: 'full'
        });
    });
}
function checkForNewNotices() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            logger_1.logger.info('Checking for new notices');
            const lastCheckInfo = yield (0, storageService_1.getLastCheckInfo)();
            const latestNotices = yield (0, apiService_1.getLatestNotices)();
            const newNotices = latestNotices.filter(notice => isNewNotice(notice, lastCheckInfo));
            if (newNotices.length > 0) {
                logger_1.logger.info(`Found ${newNotices.length} new notices`);
                const sortedNewNotices = newNotices.sort((a, b) => {
                    const dateComparison = new Date(b.date).getTime() - new Date(a.date).getTime();
                    if (dateComparison !== 0)
                        return dateComparison;
                    return b.id - a.id;
                });
                let successfullyProcessedNotices = [];
                for (const notice of sortedNewNotices.reverse()) {
                    try {
                        yield sendNoticeMessage(notice);
                        successfullyProcessedNotices.push(notice);
                        yield sleep(2000); // Wait 2 seconds between sends for rate limiting
                    }
                    catch (error) {
                        logger_1.logger.error(`Failed to send notice ${notice.id}:`, error);
                        // Continue with the next notice
                    }
                }
                if (successfullyProcessedNotices.length > 0) {
                    const latestSuccessfulNotice = successfullyProcessedNotices[successfullyProcessedNotices.length - 1];
                    const updatedLastCheckInfo = {
                        lastNoticeId: latestSuccessfulNotice.id,
                        lastDate: latestSuccessfulNotice.date,
                        lastCreatedAt: latestSuccessfulNotice.createdAt,
                        lastTitle: latestSuccessfulNotice.title,
                        lastUrl: latestSuccessfulNotice.url,
                        lastProcessedIdForDate: latestSuccessfulNotice.id
                    };
                    logger_1.logger.info(`Saving last check info: ${JSON.stringify(updatedLastCheckInfo)}`);
                    yield (0, storageService_1.saveLastCheckInfo)(updatedLastCheckInfo);
                }
                else {
                    logger_1.logger.warn('No notices were successfully processed');
                }
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
            logger_1.logger.info(`Downloading PDF for notice ${notice.id}. URL: ${notice.url}`);
            const pdfBuffer = yield downloadPdfWithRetry(notice.url);
            logger_1.logger.info(`Downloaded PDF for notice ${notice.id}. Size: ${pdfBuffer.length} bytes`);
            const filename = `Notice_${notice.id}.pdf`;
            const documentInput = {
                source: pdfBuffer,
                filename: filename
            };
            yield (0, exponential_backoff_1.backOff)(() => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                try {
                    logger_1.logger.info(`Attempting to send notice ${notice.id} to Telegram`);
                    yield index_1.bot.telegram.sendDocument(config_1.config.channelId, documentInput, {
                        caption: caption,
                        parse_mode: 'HTML'
                    });
                    logger_1.logger.info(`Successfully sent notice ${notice.id} to Telegram`);
                }
                catch (error) {
                    if (error instanceof telegraf_1.TelegramError) {
                        if (((_a = error.response) === null || _a === void 0 ? void 0 : _a.error_code) === 429) {
                            const retryAfter = ((_b = error.response.parameters) === null || _b === void 0 ? void 0 : _b.retry_after) || 1;
                            logger_1.logger.warn(`Rate limit hit for notice ${notice.id}. Retrying after ${retryAfter} seconds.`);
                            yield sleep(retryAfter * 1000);
                        }
                        else {
                            logger_1.logger.error(`Telegram error for notice ${notice.id}: ${error.message}`);
                        }
                    }
                    else {
                        logger_1.logger.error(`Unexpected error for notice ${notice.id}: ${error}`);
                    }
                    throw error; // Rethrow to trigger backoff retry
                }
            }), {
                numOfAttempts: 5,
                startingDelay: 1000,
                timeMultiple: 2,
                maxDelay: 60000,
                jitter: 'full'
            });
            logger_1.logger.info(`Sent notice: ${notice.id}. Time taken: ${Date.now() - start}ms`);
        }
        catch (error) {
            logger_1.logger.error(`Error sending notice ${notice.id}. Time taken: ${Date.now() - start}ms:`, error);
            throw error;
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
// Helper function to split large PDFs
function splitAndSendLargePdf(notice, pdfBuffer) {
    return __awaiter(this, void 0, void 0, function* () {
        const maxSize = 50 * 1024 * 1024; // 50 MB
        if (pdfBuffer.length <= maxSize) {
            yield sendNoticeMessage(notice);
        }
        else {
            const parts = Math.ceil(pdfBuffer.length / maxSize);
            for (let i = 0; i < parts; i++) {
                const start = i * maxSize;
                const end = Math.min((i + 1) * maxSize, pdfBuffer.length);
                const partBuffer = pdfBuffer.slice(start, end);
                const partNotice = Object.assign(Object.assign({}, notice), { title: `${notice.title} (Part ${i + 1} of ${parts})` });
                yield sendNoticeMessage(partNotice);
                yield sleep(2000); // Wait between parts
            }
        }
    });
}
