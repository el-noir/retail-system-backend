import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Headers,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import type { RawBodyRequest } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { AuthGuard } from 'src/auth/guards/auth.gaurd';
import { RolesGuard } from 'src/auth/guards/roles.gaurd';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create-intent')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  createPaymentIntent(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.createPaymentIntent(createPaymentDto.purchaseOrderId);
  }

  @Post('webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new Error('Missing raw body');
    }
    return this.paymentService.handleStripeWebhook(signature, rawBody);
  }

  @Get('purchase-order/:purchaseOrderId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  getPaymentsByPurchaseOrder(@Param('purchaseOrderId') purchaseOrderId: string) {
    return this.paymentService.getPaymentsByPurchaseOrder(purchaseOrderId);
  }

  @Get(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  getPayment(@Param('id') id: string) {
    return this.paymentService.getPayment(id);
  }
}
