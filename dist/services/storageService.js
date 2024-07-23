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
                    lastUrl: lastCheck.lastUrl
                };
            }
            else {
                logger_1.logger.warn('Last check info not found, using default values');
                return {
                    lastNoticeId: 1,
                    lastDate: '2024-07-22',
                    lastCreatedAt: '2024-07-23 00:24:15.434',
                    lastTitle: 'Notice regarding Ph.D. Admission Interview (International Students) for USICT',
                    lastUrl: 'http://www.ipu.ac.in/Pubinfo2024/nt220724p431%20(11).pdf'
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
                data: info
            });
            logger_1.logger.info('Last check info updated');
        }
        catch (error) {
            logger_1.logger.error('Error saving last check info:', error);
            throw error;
        }
    });
}
// Don't forget to close the Prisma client when your app shuts down
process.on('beforeExit', () => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
}));
