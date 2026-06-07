import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('支付管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建支付订单（仅管理员）' })
  createOrder(@Body() dto: CreateOrderDto) {
    return this.paymentService.createOrder(dto.planType, dto.billingCycle, dto.paymentMethod);
  }

  @Get('pending')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: '获取当前待支付订单' })
  getPendingOrder() {
    return this.paymentService.getPendingOrder();
  }

  @Get('history')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: '获取支付历史' })
  getPaymentHistory() {
    return this.paymentService.getPaymentHistory();
  }

  @Get(':id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: '获取订单详情' })
  getOrder(@Param('id') id: string) {
    return this.paymentService.getOrder(id);
  }

  @Post(':id/cancel')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '取消订单' })
  cancelOrder(@Param('id') id: string) {
    return this.paymentService.cancelOrder(id);
  }

  @Post(':id/confirm')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '确认付款（管理员手动确认）' })
  confirmPayment(@Param('id') id: string) {
    return this.paymentService.confirmPayment(id);
  }
}
