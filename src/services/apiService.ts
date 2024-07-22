import axios from 'axios';
import { Notice } from '../models/Notice';
import { config } from '../config/config';
import { logger } from '../utils/logger';

export async function getLatestNotices(): Promise<Notice[]> {
  try {
    const response = await axios.get(config.apiEndpoint);
    return response.data;
  } catch (error) {
    logger.error('Error fetching notices:', error);
    return [];
  }
}