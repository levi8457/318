import { IsString, IsNotEmpty, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({ enum: ['basic', 'professional', 'enterprise'], description: '订阅计划类型' })
  @IsString()
  @IsNotEmpty()
  @IsIn(['basic', 'professional', 'enterprise'])
  planType: 'basic' | 'professional' | 'enterprise';

  @ApiProperty({ enum: ['monthly', 'yearly'], description: '计费周期' })
  @IsString()
  @IsNotEmpty()
  @IsIn(['monthly', 'yearly'])
  billingCycle: 'monthly' | 'yearly';

  @ApiProperty({ enum: ['alipay', 'wechat', 'bank_transfer'], default: 'alipay', description: '支付方式' })
  @IsString()
  @IsNotEmpty()
  @IsIn(['alipay', 'wechat', 'bank_transfer'])
  paymentMethod: 'alipay' | 'wechat' | 'bank_transfer';
}
