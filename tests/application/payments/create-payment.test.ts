import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { CreatePaymentUseCase } from "../../../src/application/use-cases/payments/create-payment/create-payment";
import { Auction } from "../../../src/domain/entities/auction";
import { Order } from "../../../src/domain/entities/order";
import { Payment } from "../../../src/domain/entities/payment";
import { AuctionRepository } from "../../../src/domain/ports/auction.repository";
import { OrderRepository } from "../../../src/domain/ports/order.repository";
import { PaymentProvider } from "../../../src/domain/ports/payment.provider";
import { PaymentRepository } from "../../../src/domain/ports/payment.repository";

describe("CreatePaymentUseCase", () => {
  const now = new Date("2026-11-03T12:00:00.000Z");

  const order: Order = {
    id: "order-001",
    auctionId: "auction-001",
    buyerId: "buyer-001",
    amount: 150000,
    status: "PENDING",
    createdAt: new Date("2026-11-01T12:00:00.000Z"),
    expiresAt: new Date("2026-11-04T12:00:00.000Z"),
  };

  const auction: Auction = {
    id: "auction-001",
    title: "Laptop usado",
    description: "Laptop en buen estado",
    categoryId: "category-001",
    sellerId: "seller-001",
    basePrice: 100000,
    minimumIncrement: 10000,
    currentBid: 150000,
    status: "CLOSED",
    closesAt: new Date("2026-11-01T11:00:00.000Z"),
    createdAt: new Date("2026-10-20T12:00:00.000Z"),
  };

  const payment: Payment = {
    id: "payment-001",
    orderId: order.id,
    amount: order.amount,
    status: "PENDING",
    provider: "MERCADOPAGO",
    externalOrderId: "external-order-001",
    externalPaymentId: null,
    externalEventId: null,
    createdAt: now,
    updatedAt: now,
  };

  const externalPayment = {
    externalOrderId: "external-order-001",
    checkoutUrl: "https://checkout.example.com/payment-001",
  };

  let orderRepository: {
    findById: jest.Mock<OrderRepository["findById"]>;
    update: jest.Mock<OrderRepository["update"]>;
  };

  let auctionRepository: {
    findById: jest.Mock<AuctionRepository["findById"]>;
  };

  let paymentRepository: {
    findByOrderId: jest.Mock<PaymentRepository["findByOrderId"]>;
    save: jest.Mock<PaymentRepository["save"]>;
  };

  let paymentProvider: {
    createPayment: jest.Mock<PaymentProvider["createPayment"]>;
  };

  let useCase: CreatePaymentUseCase;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);

    orderRepository = {
      findById: jest.fn<OrderRepository["findById"]>().mockResolvedValue(order),
      update: jest
        .fn<OrderRepository["update"]>()
        .mockImplementation(async (updatedOrder) => updatedOrder),
    };

    auctionRepository = {
      findById: jest
        .fn<AuctionRepository["findById"]>()
        .mockResolvedValue(auction),
    };

    paymentRepository = {
      findByOrderId: jest
        .fn<PaymentRepository["findByOrderId"]>()
        .mockResolvedValue(null),
      save: jest.fn<PaymentRepository["save"]>().mockResolvedValue(payment),
    };

    paymentProvider = {
      createPayment: jest
        .fn<PaymentProvider["createPayment"]>()
        .mockResolvedValue(externalPayment),
    };

    useCase = new CreatePaymentUseCase(
      orderRepository as unknown as OrderRepository,
      auctionRepository as unknown as AuctionRepository,
      paymentRepository as unknown as PaymentRepository,
      paymentProvider as unknown as PaymentProvider,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("creates a pending payment and returns the checkout information", async () => {
    const result = await useCase.execute({
      orderId: order.id,
      buyerId: order.buyerId,
    });

    expect(orderRepository.findById).toHaveBeenCalledWith(order.id);
    expect(paymentRepository.findByOrderId).toHaveBeenCalledWith(order.id);
    expect(auctionRepository.findById).toHaveBeenCalledWith(order.auctionId);

    expect(paymentProvider.createPayment).toHaveBeenCalledWith({
      orderId: order.id,
      amount: order.amount,
      title: auction.title,
      description: auction.description,
      categoryId: auction.categoryId,
    });

    expect(paymentRepository.save).toHaveBeenCalledWith({
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

    expect(result).toEqual({
      paymentId: payment.id,
      checkoutUrl: externalPayment.checkoutUrl,
    });
  });

  it("throws ORDER_NOT_FOUND when the order does not exist", async () => {
    orderRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        orderId: order.id,
        buyerId: order.buyerId,
      }),
    ).rejects.toMatchObject({
      code: "ORDER_NOT_FOUND",
      statusCode: 404,
    });

    expect(paymentRepository.findByOrderId).not.toHaveBeenCalled();
    expect(paymentProvider.createPayment).not.toHaveBeenCalled();
  });

  it("throws ORDER_NOT_FOUND when the order belongs to another buyer", async () => {
    await expect(
      useCase.execute({
        orderId: order.id,
        buyerId: "another-buyer",
      }),
    ).rejects.toMatchObject({
      code: "ORDER_NOT_FOUND",
      statusCode: 404,
    });

    expect(paymentRepository.findByOrderId).not.toHaveBeenCalled();
    expect(auctionRepository.findById).not.toHaveBeenCalled();
    expect(paymentProvider.createPayment).not.toHaveBeenCalled();
  });

  it("throws ORDER_NOT_PENDING when the order is not pending", async () => {
    orderRepository.findById.mockResolvedValue({
      ...order,
      status: "PAID",
    });

    await expect(
      useCase.execute({
        orderId: order.id,
        buyerId: order.buyerId,
      }),
    ).rejects.toMatchObject({
      code: "ORDER_NOT_PENDING",
      statusCode: 409,
    });

    expect(paymentRepository.findByOrderId).not.toHaveBeenCalled();
    expect(paymentProvider.createPayment).not.toHaveBeenCalled();
  });

  it.each(["APPROVED", "PENDING"] as const)(
    "throws the appropriate error when an existing payment is %s",
    async (status) => {
      paymentRepository.findByOrderId.mockResolvedValue({
        ...payment,
        status,
      });

      await expect(
        useCase.execute({
          orderId: order.id,
          buyerId: order.buyerId,
        }),
      ).rejects.toMatchObject({
        code:
          status === "APPROVED"
            ? "PAYMENT_ALREADY_APPROVED"
            : "PAYMENT_ALREADY_PENDING",
        statusCode: 409,
      });

      expect(auctionRepository.findById).not.toHaveBeenCalled();
      expect(paymentProvider.createPayment).not.toHaveBeenCalled();
      expect(paymentRepository.save).not.toHaveBeenCalled();
    },
  );

  it.each(["REJECTED", "CANCELLED"] as const)(
    "allows a new payment when the existing payment is %s",
    async (status) => {
      paymentRepository.findByOrderId.mockResolvedValue({
        ...payment,
        status,
      });

      const result = await useCase.execute({
        orderId: order.id,
        buyerId: order.buyerId,
      });

      expect(paymentProvider.createPayment).toHaveBeenCalledTimes(1);
      expect(paymentRepository.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        paymentId: payment.id,
        checkoutUrl: externalPayment.checkoutUrl,
      });
    },
  );

  it("marks an expired order as EXPIRED and throws ORDER_EXPIRED", async () => {
    const expiredOrder: Order = {
      ...order,
      expiresAt: new Date(now.getTime() - 1),
    };

    orderRepository.findById.mockResolvedValue(expiredOrder);

    await expect(
      useCase.execute({
        orderId: expiredOrder.id,
        buyerId: expiredOrder.buyerId,
      }),
    ).rejects.toMatchObject({
      code: "ORDER_EXPIRED",
      statusCode: 409,
    });

    expect(orderRepository.update).toHaveBeenCalledWith({
      ...expiredOrder,
      status: "EXPIRED",
    });
    expect(auctionRepository.findById).not.toHaveBeenCalled();
    expect(paymentProvider.createPayment).not.toHaveBeenCalled();
    expect(paymentRepository.save).not.toHaveBeenCalled();
  });

  it("propagates an error if updating an expired order fails", async () => {
    const expiredOrder: Order = {
      ...order,
      expiresAt: new Date(now.getTime() - 1),
    };

    orderRepository.findById.mockResolvedValue(expiredOrder);
    orderRepository.update.mockRejectedValue(new Error("Order update failed"));

    await expect(
      useCase.execute({
        orderId: expiredOrder.id,
        buyerId: expiredOrder.buyerId,
      }),
    ).rejects.toThrow("Order update failed");

    expect(orderRepository.update).toHaveBeenCalledWith({
      ...expiredOrder,
      status: "EXPIRED",
    });
  });

  it("throws AUCTION_NOT_FOUND when the order auction does not exist", async () => {
    auctionRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        orderId: order.id,
        buyerId: order.buyerId,
      }),
    ).rejects.toMatchObject({
      code: "AUCTION_NOT_FOUND",
      statusCode: 404,
    });

    expect(paymentProvider.createPayment).not.toHaveBeenCalled();
    expect(paymentRepository.save).not.toHaveBeenCalled();
  });

  it("propagates an error when finding the order fails", async () => {
    orderRepository.findById.mockRejectedValue(
      new Error("Order lookup failed"),
    );

    await expect(
      useCase.execute({
        orderId: order.id,
        buyerId: order.buyerId,
      }),
    ).rejects.toThrow("Order lookup failed");
  });

  it("propagates an error when looking up the existing payment fails", async () => {
    paymentRepository.findByOrderId.mockRejectedValue(
      new Error("Payment lookup failed"),
    );

    await expect(
      useCase.execute({
        orderId: order.id,
        buyerId: order.buyerId,
      }),
    ).rejects.toThrow("Payment lookup failed");

    expect(auctionRepository.findById).not.toHaveBeenCalled();
  });

  it("propagates an error when finding the auction fails", async () => {
    auctionRepository.findById.mockRejectedValue(
      new Error("Auction lookup failed"),
    );

    await expect(
      useCase.execute({
        orderId: order.id,
        buyerId: order.buyerId,
      }),
    ).rejects.toThrow("Auction lookup failed");

    expect(paymentRepository.save).not.toHaveBeenCalled();
  });

  it("propagates an error when the payment provider fails", async () => {
    paymentProvider.createPayment.mockRejectedValue(
      new Error("Payment provider failed"),
    );

    await expect(
      useCase.execute({
        orderId: order.id,
        buyerId: order.buyerId,
      }),
    ).rejects.toThrow("Payment provider failed");

    expect(paymentRepository.save).not.toHaveBeenCalled();
  });

  it("propagates an error when saving the payment fails", async () => {
    paymentRepository.save.mockRejectedValue(
      new Error("Payment persistence failed"),
    );

    await expect(
      useCase.execute({
        orderId: order.id,
        buyerId: order.buyerId,
      }),
    ).rejects.toThrow("Payment persistence failed");

    expect(paymentProvider.createPayment).toHaveBeenCalledTimes(1);
    expect(paymentRepository.save).toHaveBeenCalledTimes(1);
  });
});
