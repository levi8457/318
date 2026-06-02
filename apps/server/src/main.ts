import * as dotenv from 'dotenv';
import { join } from 'path';

// 加载 .env 文件
const envFile = process.env.APP_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: join(__dirname, '..', '..', '..', envFile) });

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');

  // CORS 配置
  const corsOrigins = process.env.APP_ENV === 'production'
    ? [process.env.FRONTEND_URL || 'https://yourdomain.com']
    : ['http://localhost:5173', 'http://localhost:3000'];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // 健康检查端点
  app.use('/api/health', (req: any, res: any) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Swagger 文档（仅开发环境）
  if (process.env.APP_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('铜雀台医美 AI 智能管家 API')
      .setDescription('铜雀台 AI Agent 后端接口文档')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.APP_PORT || 3000;
  await app.listen(port);
  console.log(`🚀 铜雀台 AI Agent 服务已启动: http://localhost:${port}`);
  if (process.env.APP_ENV !== 'production') {
    console.log(`📖 API 文档: http://localhost:${port}/api/docs`);
  }
}

bootstrap();
