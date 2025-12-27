import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { PurchaseStatus, PaymentStatus } from '@prisma/client';
import Stripe from 'stripe';

@Injectable()
export class PaymentService {
  private stripe: Stripe;

  constructor(private readonly prismaService: PrismaService) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!stripeSecretKey) {
      console.warn('⚠️  STRIPE_SECRET_KEY not found in environment variables');
    }

    this.stripe = new Stripe(stripeSecretKey || 'sk_test_dummy', {
      apiVersion: '2025-12-15.clover',
    });
  }

  async createPaymentIntent(purchaseOrderId: string) {
    // Get purchase order
    const order = await this.prismaService.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Purchase order not found');
    }

    if (order.status !== PurchaseStatus.APPROVED) {
      throw new BadRequestException('Only APPROVED orders can be paid');
    }

    // Check if payment already exists
    const existingPayment = await this.prismaService.payment.findFirst({
      where: {
        purchaseOrderId,
        status: { in: [PaymentStatus.PENDING, PaymentStatus.SUCCEEDED] },
      },
    });

    if (existingPayment) {
      throw new BadRequestException('Payment already exists for this order');
    }

    // Create Stripe PaymentIntent
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(Number(order.totalAmount) * 100), // Convert to cents
      currency: 'usd',
      description: `Purchase Order ${order.id} - ${order.supplier.name}`,
      metadata: {
        purchaseOrderId: order.id,
        supplierId: order.supplierId,
        supplierName: order.supplier.name,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Create payment record
    const payment = await this.prismaService.payment.create({
      data: {
        purchaseOrderId,
        amount: order.totalAmount,
        status: PaymentStatus.PENDING,
        stripePaymentId: paymentIntent.id,
        stripeClientSecret: paymentIntent.client_secret,
        metadata: {
          stripePaymentIntentId: paymentIntent.id,
          supplierName: order.supplier.name,
        },
      },
      include: {
        purchaseOrder: {
          include: {
            supplier: true,
          },
        },
      },
    });

    return {
      payment,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  }

  async handleStripeWebhook(signature: string, rawBody: Buffer) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET not configured');
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      throw new BadRequestException(`Webhook signature verification failed: ${err.message}`);
    }

    // Handle payment_intent.succeeded event
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await this.handlePaymentSuccess(paymentIntent);
    }

    // Handle payment_intent.payment_failed event
    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await this.handlePaymentFailure(paymentIntent);
    }

    return { received: true };
  }

  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    // Find payment by Stripe PaymentIntent ID
    const payment = await this.prismaService.payment.findUnique({
      where: { stripePaymentId: paymentIntent.id },
      include: {
        purchaseOrder: true,
      },
    });

    if (!payment) {
      console.error(`Payment not found for PaymentIntent: ${paymentIntent.id}`);
      return;
    }

    // Update payment status
    await this.prismaService.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.SUCCEEDED,
        paymentMethod: paymentIntent.payment_method_types?.[0] || 'unknown',
        metadata: {
          ...((payment.metadata as any) || {}),
          stripePaymentIntentId: paymentIntent.id,
          paidAt: new Date().toISOString(),
        },
      },
    });

    // Update purchase order status to PAID
    await this.prismaService.purchaseOrder.update({
      where: { id: payment.purchaseOrderId },
      data: {
        status: PurchaseStatus.PAID,
        paidAt: new Date(),
      },
    });

    console.log(`✅ Payment succeeded for Purchase Order: ${payment.purchaseOrderId}`);
  }

  private async handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
    const payment = await this.prismaService.payment.findUnique({
      where: { stripePaymentId: paymentIntent.id },
    });

    if (!payment) {
      console.error(`Payment not found for PaymentIntent: ${paymentIntent.id}`);
      return;
    }

    await this.prismaService.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.FAILED,
        metadata: {
          ...((payment.metadata as any) || {}),
          failureReason: paymentIntent.last_payment_error?.message || 'Unknown error',
          failedAt: new Date().toISOString(),
        },
      },
    });

    console.log(`❌ Payment failed for Purchase Order: ${payment.purchaseOrderId}`);
  }

  async getPaymentsByPurchaseOrder(purchaseOrderId: string) {
    return this.prismaService.payment.findMany({
      where: { purchaseOrderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPayment(id: string) {
    const payment = await this.prismaService.payment.findUnique({
      where: { id },
      include: {
        purchaseOrder: {
          include: {
            supplier: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }
}
