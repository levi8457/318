import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
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
import { AuditModule } from './modules/audit/audit.module';
import { NotificationModule } from './modules/notification/notification.module';
import { ProjectTypeModule } from './modules/project-type/project-type.module';
import { SearchModule } from './modules/search/search.module';
import { CareReminderModule } from './modules/care-reminder/care-reminder.module';
import { AiChatModule } from './modules/ai-chat/ai-chat.module';
import { WechatPushModule } from './modules/wechat-push/wechat-push.module';
import { ImportModule } from './modules/import/import.module';
import { LicenseModule } from './modules/license/license.module';
import { PaymentModule } from './modules/payment/payment.module';
import { LeadModule } from './modules/lead/lead.module';
import { FollowUpPlanModule } from './modules/follow-up-plan/follow-up-plan.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { DataMaskingInterceptor } from './common/interceptors/data-masking.interceptor';

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
    AuditModule,
    NotificationModule,
    ProjectTypeModule,
    SearchModule,
    CareReminderModule,
    AiChatModule,
    WechatPushModule,
    ImportModule,
    LicenseModule,
    PaymentModule,
    LeadModule,
    FollowUpPlanModule,
    SchedulerModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: DataMaskingInterceptor,
    },
  ],
})
export class AppModule {}
