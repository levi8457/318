import { Module } from '@nestjs/common';
import { WechatPushService } from './wechat-push.service';

@Module({
  providers: [WechatPushService],
  exports: [WechatPushService],
})
export class WechatPushModule {}
