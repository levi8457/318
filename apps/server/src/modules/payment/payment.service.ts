import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentOrder } from './entities/payment-order.entity';
import { LicenseService } from '../license/license.service';

/** 单价（元/月） */
const PLAN_PRICE: Record<string, number> = {
  basic: 2980,
  professional: 5980,
  enterprise: 9980,
};

/** 年付折扣 20% off（8折） */
const YEARLY_DISCOUNT = 0.8;

/** 订单有效期 30 分钟 */
const ORDER_EXPIRE_MINUTES = 30;

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(PaymentOrder)
    private readonly orderRepo: Repository<PaymentOrder>,
    private readonly licenseService: LicenseService,
  ) {}

  /**
   * 创建支付订单
   * 计算价格：月付原价，年付享 8 折优惠
   */
  async createOrder(
    planType: 'basic' | 'professional' | 'enterprise',
    billingCycle: 'monthly' | 'yearly',
    paymentMethod: 'alipay' | 'wechat' | 'bank_transfer',
  ): Promise<PaymentOrder> {
    const license = await this.licenseService.getLicense();

    const monthlyPrice = PLAN_PRICE[planType];
    const originalAmount = monthlyPrice * 12;
    const amount = billingCycle === 'yearly' ? Math.round(originalAmount * YEARLY_DISCOUNT) : monthlyPrice;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + ORDER_EXPIRE_MINUTES * 60 * 1000);

    // 生成模拟支付宝收款二维码链接（收款账号：279139326@qq.com）
    const randomCode = this.generateRandomAlphanumeric(16);
    const paymentUrl = paymentMethod === 'alipay'
      ? `https://qr.alipay.com/${randomCode}`
      : undefined;

    const order = this.orderRepo.create({
      licenseId: license.id,
      planType,
      billingCycle,
      amount,
      originalAmount,
      status: 'pending',
      paymentMethod,
      paymentUrl,
      expiresAt,
    });

    const saved = await this.orderRepo.save(order);
    this.logger.log(`[Payment] 订单创建成功，ID: ${saved.id}，金额: ¥${amount}`);

    return saved;
  }

  /**
   * 获取订单详情
   */
  async getOrder(orderId: string): Promise<PaymentOrder> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    // 检查订单是否已过期
    if (order.status === 'pending' && new Date() > order.expiresAt) {
      order.status = 'expired';
      await this.orderRepo.save(order);
      this.logger.log(`[Payment] 订单 ${orderId} 已过期`);
    }

    return order;
  }

  /**
   * 获取当前待支付订单（状态为 pending 且未过期的最新订单）
   */
  async getPendingOrder(): Promise<PaymentOrder | null> {
    const order = await this.orderRepo.findOne({
      where: { status: 'pending' },
      order: { createdAt: 'DESC' },
    });

    if (!order) {
      return null;
    }

    // 检查是否已过期
    if (new Date() > order.expiresAt) {
      order.status = 'expired';
      await this.orderRepo.save(order);
      this.logger.log(`[Payment] 待支付订单 ${order.id} 已过期`);
      return null;
    }

    return order;
  }

  /**
   * 取消订单
   */
  async cancelOrder(orderId: string): Promise<PaymentOrder> {
    const order = await this.getOrder(orderId);

    if (order.status !== 'pending') {
      throw new BadRequestException('只能取消待支付状态的订单');
    }

    order.status = 'cancelled';
    await this.orderRepo.save(order);
    this.logger.log(`[Payment] 订单 ${orderId} 已取消`);

    return order;
  }

  /**
   * 确认付款（管理员手动确认）
   * 标记订单为已支付，并升级 License
   */
  async confirmPayment(orderId: string): Promise<{ order: PaymentOrder; message: string }> {
    const order = await this.getOrder(orderId);

    if (order.status !== 'pending') {
      throw new BadRequestException('订单状态不是待支付，无法确认');
    }

    order.status = 'paid';
    order.paidAt = new Date();
    await this.orderRepo.save(order);

    // 升级 License
    await this.licenseService.upgradePlan(order.planType, order.billingCycle);

    this.logger.log(`[Payment] 订单 ${orderId} 已确认付款，License 已升级`);

    return { order, message: '付款确认成功，订阅已升级' };
  }

  /**
   * 获取支付历史（已支付的订单列表）
   */
  async getPaymentHistory(): Promise<PaymentOrder[]> {
    return this.orderRepo.find({
      where: { status: 'paid' },
      order: { paidAt: 'DESC' },
    });
  }

  /**
   * 生成指定位数的随机字母数字字符串
   */
  private generateRandomAlphanumeric(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
