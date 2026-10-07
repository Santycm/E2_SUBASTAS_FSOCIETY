import { OrderRepository } from "../../../../domain/ports/order.repository";
import { AuctionRepository } from "../../../../domain/ports/auction.repository";
import { PaymentRepository } from "../../../../domain/ports/payment.repository";
import { PaymentProvider } from "../../../../domain/ports/payment.provider";

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
      throw new Error("ORDER_NOT_FOUND");
    }

    if (order.buyerId !== dto.buyerId) {
      throw new Error("ORDER_NOT_FOUND");
    }

    if (order.status !== "PENDING") {
      throw new Error("ORDER_NOT_PENDING");
    }

    const existingPayment = await this.paymentRepository.findByOrderId(
      order.id,
    );

    if (existingPayment) {
      if (existingPayment.status === "APPROVED") {
        throw new Error("ORDER_ALREADY_PAID");
      }

      if (existingPayment.status === "PENDING") {
        throw new Error("PAYMENT_ALREADY_EXISTS");
      }
    }

    if (order.expiresAt <= new Date()) {
      await this.orderRepository.update({
        ...order,
        status: "EXPIRED",
      });

      throw new Error("ORDER_EXPIRED");
    }

    const auction = await this.auctionRepository.findById(order.auctionId);

    if (!auction) {
      throw new Error("AUCTION_NOT_FOUND");
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
