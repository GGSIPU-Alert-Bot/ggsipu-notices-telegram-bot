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
exports.getLastCheckInfo = getLastCheckInfo;
exports.saveLastCheckInfo = saveLastCheckInfo;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient();
function getLastCheckInfo() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const lastCheck = yield prisma.lastCheckInfo.findFirst({
                orderBy: { id: 'desc' }
            });
            if (lastCheck) {
                return {
                    lastNoticeId: lastCheck.lastNoticeId,
                    lastDate: lastCheck.lastDate,
                    lastCreatedAt: lastCheck.lastCreatedAt,
                    lastTitle: lastCheck.lastTitle,
                    lastUrl: lastCheck.lastUrl,
                    lastProcessedIdForDate: lastCheck.lastProcessedIdForDate || lastCheck.lastNoticeId // Use lastNoticeId as fallback
                };
            }
            else {
                logger_1.logger.warn('Last check info not found, using default values');
                return {
                    lastNoticeId: 557908,
                    lastDate: '2024-07-30',
                    lastCreatedAt: '2024-07-31T04:56:11.750Z',
                    lastTitle: 'Schedule 1st Counselling/Admission for B.Sc. (Environment Science) CET Code 135',
                    lastUrl: 'http://www.ipu.ac.in/Pubinfo2024/nt300724531%20(1).pdf',
                    lastProcessedIdForDate: 557908
                };
            }
        }
        catch (error) {
            logger_1.logger.error('Error retrieving last check info:', error);
            throw error;
        }
    });
}
function saveLastCheckInfo(info) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield prisma.lastCheckInfo.create({
                data: {
                    lastNoticeId: info.lastProcessedIdForDate,
                    lastDate: info.lastDate,
                    lastCreatedAt: info.lastCreatedAt,
                    lastTitle: info.lastTitle,
                    lastUrl: info.lastUrl,
                    lastProcessedIdForDate: info.lastProcessedIdForDate
                }
            });
            logger_1.logger.info('Last check info updated');
        }
        catch (error) {
            logger_1.logger.error('Error saving last check info:', error);
            throw error;
        }
    });
}
process.on('beforeExit', () => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
}));
