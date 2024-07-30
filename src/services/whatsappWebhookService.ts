import axios from 'axios';
import crypto from 'crypto';
import { config } from '../config/config';
import { Notice } from '../models/Notice';
import { logger } from '../utils/logger';

export function generateSignature(payload: string): string {
  const hmac = crypto.createHmac('sha256', config.webhookSecret);
  const signature = hmac.update(payload).digest('hex');
  return `sha256=${signature}`;
}

export async function sendWebhookEvent(notice: Notice): Promise<void> {
  try {
    const payload = JSON.stringify(notice);
    const signature = generateSignature(payload);

    await axios.post(config.whatsappWebhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Hub-Signature-256': signature
      }
    });

    logger.info(`Webhook event sent for notice: ${notice.id}`);
  } catch (error) {
    logger.error(`Error sending webhook event for notice ${notice.id}:`, error);
    if (axios.isAxiosError(error)) {
      logger.error('Response:', error.response?.data);
    }
  }
}