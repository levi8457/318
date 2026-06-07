import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('payment_orders')
export class PaymentOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'license_id' })
  licenseId: string;

  @Column({ length: 20 })
  planType: 'basic' | 'professional' | 'enterprise';

  @Column({ name: 'billing_cycle', length: 20 })
  billingCycle: 'monthly' | 'yearly';

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ name: 'original_amount', type: 'decimal', precision: 10, scale: 2 })
  originalAmount: number;

  @Column({ length: 20, default: 'pending' })
  status: 'pending' | 'paid' | 'cancelled' | 'expired';

  @Column({ name: 'payment_method', length: 20, default: 'alipay' })
  paymentMethod: 'alipay' | 'wechat' | 'bank_transfer';

  @Column({ name: 'payment_url', length: 255, nullable: true })
  paymentUrl: string;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
