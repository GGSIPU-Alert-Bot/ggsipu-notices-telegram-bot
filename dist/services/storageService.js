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
exports.getLastCheckInfo = getLastCheckInfo;
exports.saveLastCheckInfo = saveLastCheckInfo;
const promises_1 = __importDefault(require("fs/promises"));
const logger_1 = require("../utils/logger");
const LAST_CHECK_FILE = 'last_check_info.json';
function getLastCheckInfo() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const data = yield promises_1.default.readFile(LAST_CHECK_FILE, 'utf-8');
            return JSON.parse(data);
        }
        catch (error) {
            logger_1.logger.warn('Last check info not found, using default values');
            return { lastNoticeId: 1152527, lastDate: '2024-07-20', lastCreatedAt: '2024-07-21T13:25:03.223Z' };
        }
    });
}
function saveLastCheckInfo(info) {
    return __awaiter(this, void 0, void 0, function* () {
        yield promises_1.default.writeFile(LAST_CHECK_FILE, JSON.stringify(info));
        logger_1.logger.info('Last check info updated');
    });
}
