import { Module, Global } from '@nestjs/common';

export class ConfigService {
  private env: Record<string, string | undefined>;

  constructor() {
    this.env = {
      APP_PORT: process.env.APP_PORT || '3000',
      DB_HOST: process.env.DB_HOST || 'localhost',
      DB_PORT: process.env.DB_PORT || '5432',
      DB_USERNAME: process.env.DB_USERNAME || 'postgres',
      DB_PASSWORD: process.env.DB_PASSWORD || 'tongquetai',
      DB_DATABASE: process.env.DB_DATABASE || 'tongquetai',
      JWT_SECRET: process.env.JWT_SECRET || 'tongquetai_dev_secret_key_2026',
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
      DEFAULT_ADMIN_USERNAME: process.env.DEFAULT_ADMIN_USERNAME || 'admin',
      DEFAULT_ADMIN_PASSWORD: process.env.DEFAULT_ADMIN_PASSWORD || 'admin123456',
    };
  }

  get(key: string, defaultValue?: string): string {
    return this.env[key] || defaultValue || '';
  }

  getNumber(key: string, defaultValue?: number): number {
    const val = this.env[key];
    if (!val) return defaultValue ?? 0;
    const num = parseInt(val);
    return isNaN(num) ? (defaultValue ?? 0) : num;
  }
}

@Global()
@Module({
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
