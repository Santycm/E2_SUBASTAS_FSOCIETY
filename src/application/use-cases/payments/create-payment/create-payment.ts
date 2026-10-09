import { OrderRepository } from "../../../../domain/ports/order.repository";
import { AuctionRepository } from "../../../../domain/ports/auction.repository";
import { PaymentRepository } from "../../../../domain/ports/payment.repository";
import { PaymentProvider } from "../../../../domain/ports/payment.provider";

import { ApplicationError } from "../../../errors/application-error";

export interface CreatePaymentDto {
  orderId: string;
  buyerId: string;
}

export interface CreatePaymentResult {
  paymentId: string;
  checkoutUrl: string;
}

export class CreatePaymentUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly auctionRepository: AuctionRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly paymentProvider: PaymentProvider,
  ) {}

  async execute(dto: CreatePaymentDto): Promise<CreatePaymentResult> {
    const order = await this.orderRepository.findById(dto.orderId);

    if (!order) {
      throw new ApplicationError("ORDER_NOT_FOUND", 404);
    }

    if (order.buyerId !== dto.buyerId) {
      throw new ApplicationError("ORDER_NOT_FOUND", 404);
    }

    if (order.status !== "PENDING") {
      throw new ApplicationError("ORDER_NOT_PENDING", 40);
    }

    const existingPayment = await this.paymentRepository.findByOrderId(
      order.id,
    );

    if (existingPayment) {
      if (existingPayment.status === "APPROVED") {
        throw new ApplicationError("PAYMENT_ALREADY_APPROVED", 409);
      }

      if (existingPayment.status === "PENDING") {
        throw new ApplicationError("PAYMENT_ALREADY_PENDING", 409);
      }
    }

    if (order.expiresAt <= new Date()) {
      await this.orderRepository.update({
        ...order,
        status: "EXPIRED",
      });

      throw new ApplicationError("ORDER_EXPIRED", 409);
    }

    const auction = await this.auctionRepository.findById(order.auctionId);

    if (!auction) {
      throw new ApplicationError("AUCTION_NOT_FOUND", 404);
    }

    const externalPayment = await this.paymentProvider.createPayment({
      orderId: order.id,
      amount: order.amount,
      title: auction.title,
      description: auction.description,
      categoryId: auction.categoryId,
    });

    const now = new Date();

    const payment = await this.paymentRepository.save({
      orderId: order.id,
      amount: order.amount,
      status: "PENDING",
      provider: "MERCADOPAGO",
      externalOrderId: externalPayment.externalOrderId,
      externalPaymentId: null,
      externalEventId: null,
      createdAt: now,
      updatedAt: now,
    });

    return {
      paymentId: payment.id,
      checkoutUrl: externalPayment.checkoutUrl,
    };
  }
}
