import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from './config/config.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { ConsultantModule } from './modules/consultant/consultant.module';
import { CustomerModule } from './modules/customer/customer.module';
import { SessionModule } from './modules/session/session.module';
import { TaskModule } from './modules/task/task.module';
import { StrategyModule } from './modules/strategy/strategy.module';
import { SopModule } from './modules/sop/sop.module';
import { ScriptModule } from './modules/script/script.module';
import { CampaignModule } from './modules/campaign/campaign.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { UploadModule } from './modules/upload/upload.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: parseInt(config.get('DB_PORT', '5432')),
        username: config.get('DB_USERNAME', 'postgres'),
        password: config.get('DB_PASSWORD', 'tongquetai'),
        database: config.get('DB_DATABASE', 'tongquetai'),
        autoLoadEntities: true,
        synchronize: true,
        logging: false,
      }),
    }),
    AuthModule,
    UserModule,
    ConsultantModule,
    CustomerModule,
    SessionModule,
    TaskModule,
    StrategyModule,
    SopModule,
    ScriptModule,
    CampaignModule,
    DashboardModule,
    UploadModule,
  ],
})
export class AppModule {}
