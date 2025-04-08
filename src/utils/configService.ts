import axios from 'axios';
import type { Config } from '@/types/config';

class ConfigService {
  private static instance: ConfigService;
  private config: Config | null = null;

  private constructor() {}

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  async loadConfig(): Promise<Config> {
    if (this.config) {
      return this.config;
    }

    try {
      const response = await axios.get<Config>('./config/config.json');
      this.config = response.data;
      return this.config;
    } catch (error) {
      console.error('Failed to load config:', error);
      // 返回默认配置
      return {
        apiBaseUrl: 'https://localhost:44379/api',
        timeout: 10000,
        retryCount: 3,
        cacheMaxAge: 900000
      };
    }
  }

  getConfig(): Config | null {
    return this.config;
  }
}

export const configService = ConfigService.getInstance();