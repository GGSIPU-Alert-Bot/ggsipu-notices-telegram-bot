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
const stream_1 = require("stream");
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
                for (const notice of newNotices.reverse()) {
                    yield sendNoticeMessage(notice);
                }
                const updatedLastCheckInfo = {
                    lastNoticeId: Math.max(...notices.map(notice => notice.id)),
                    lastDate: notices[0].date,
                    lastCreatedAt: notices[0].createdAt,
                    lastTitle: notices[0].title,
                    lastUrl: notices[0].url
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
    const noticeDate = new Date(notice.date);
    const lastCheckDate = new Date(lastCheckInfo.lastDate);
    const noticeCreatedAt = new Date(notice.createdAt);
    const lastCheckCreatedAt = new Date(lastCheckInfo.lastCreatedAt);
    // If the notice date is newer, it's definitely a new notice
    if (noticeDate > lastCheckDate) {
        return true;
    }
    // If the dates are the same, check the createdAt timestamp
    if (noticeDate.getTime() === lastCheckDate.getTime()) {
        if (noticeCreatedAt > lastCheckCreatedAt) {
            return true;
        }
        // If createdAt is also the same, compare title and URL
        if (noticeCreatedAt.getTime() === lastCheckCreatedAt.getTime()) {
            return notice.title !== lastCheckInfo.lastTitle || notice.url !== lastCheckInfo.lastUrl;
        }
    }
    return false;
}
function sendNoticeMessage(notice) {
    return __awaiter(this, void 0, void 0, function* () {
        const caption = formatNoticeCaption(notice);
        try {
            const pdfBuffer = yield downloadPdf(notice.url);
            const filename = `Notice_${notice.id}.pdf`;
            yield index_1.bot.telegram.sendDocument(config_1.config.channelId, { source: stream_1.Readable.from(pdfBuffer), filename: filename }, {
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
