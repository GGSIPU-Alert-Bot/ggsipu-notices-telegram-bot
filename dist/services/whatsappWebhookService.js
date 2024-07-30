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
exports.generateSignature = generateSignature;
exports.sendWebhookEvent = sendWebhookEvent;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const config_1 = require("../config/config");
const logger_1 = require("../utils/logger");
function generateSignature(payload) {
    const hmac = crypto_1.default.createHmac('sha256', config_1.config.webhookSecret);
    const signature = hmac.update(payload).digest('hex');
    return `sha256=${signature}`;
}
function sendWebhookEvent(notice) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const payload = JSON.stringify(notice);
            const signature = generateSignature(payload);
            yield axios_1.default.post(config_1.config.whatsappWebhookUrl, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Hub-Signature-256': signature
                }
            });
            logger_1.logger.info(`Webhook event sent for notice: ${notice.id}`);
        }
        catch (error) {
            logger_1.logger.error(`Error sending webhook event for notice ${notice.id}:`, error);
            if (axios_1.default.isAxiosError(error)) {
                logger_1.logger.error('Response:', (_a = error.response) === null || _a === void 0 ? void 0 : _a.data);
            }
        }
    });
}
