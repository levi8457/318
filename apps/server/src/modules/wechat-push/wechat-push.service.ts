import { Injectable, Logger } from '@nestjs/common';

export interface PushMessage {
  userId: string;
  title: string;
  content: string;
  url?: string;
}

@Injectable()
export class WechatPushService {
  private readonly logger = new Logger(WechatPushService.name);

  /**
   * 发送企微消息
   * 当前为简化实现，仅记录日志
   * 生产环境需要对接企业微信 API
   */
  async send(message: PushMessage): Promise<boolean> {
    this.logger.log(`[WechatPush] 发送消息给 ${message.userId}: ${message.title}`);

    // TODO: 对接企业微信 API
    // 实际实现需要：
    // 1. 获取 access_token
    // 2. 调用 https://qyapi.weixin.qq.com/cgi-bin/message/send
    // 3. 支持文本/Markdown/卡片消息

    this.logger.log(`[WechatPush] 消息内容: ${message.content}`);
    return true;
  }

  /**
   * 批量发送
   */
  async sendBatch(messages: PushMessage[]): Promise<number> {
    let successCount = 0;
    for (const msg of messages) {
      const result = await this.send(msg);
      if (result) successCount++;
    }
    return successCount;
  }

  /**
   * 发送任务提醒
   */
  async sendTaskReminder(userId: string, taskTitle: string, customerName: string): Promise<boolean> {
    return this.send({
      userId,
      title: '任务提醒',
      content: `您有一个待办任务：${taskTitle}（客户：${customerName}）`,
    });
  }

  /**
   * 发送生日关怀提醒
   */
  async sendBirthdayReminder(userId: string, customerName: string): Promise<boolean> {
    return this.send({
      userId,
      title: '生日关怀提醒',
      content: `${customerName}即将过生日，请及时送上关怀`,
    });
  }
}
