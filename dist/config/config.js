"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    botToken: process.env.BOT_TOKEN,
    apiEndpoint: process.env.API_ENDPOINT,
    channelId: process.env.CHANNEL_ID,
    whatsappWebhookUrl: process.env.WHATSAPP_WEBHOOK_URL,
    webhookSecret: process.env.WHATSAPP_WEBHOOK_SECRET,
};
