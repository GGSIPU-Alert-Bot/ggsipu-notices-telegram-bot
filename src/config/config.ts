import dotenv from 'dotenv';

dotenv.config();

export const config = {
  botToken: process.env.BOT_TOKEN!,
  apiEndpoint: process.env.API_ENDPOINT!,
  channelId: process.env.CHANNEL_ID!,

  whatsappWebhookUrl: process.env.WHATSAPP_WEBHOOK_URL!,
  webhookSecret: process.env.WHATSAPP_WEBHOOK_SECRET!,
};