import { Request, Response } from "express";

import { GetOrdersUseCase } from "../../../application/use-cases/orders/get-orders/get-orders";
import { GetOrderByIdUseCase } from "../../../application/use-cases/orders/get-order-by-id/get-order-by-id";
import { GetSellerOrdersUseCase } from "../../../application/use-cases/orders/get-seller-orders/get-seller-orders";
import { CreatePaymentUseCase } from "../../../application/use-cases/payments/create-payment/create-payment";

export class OrdersController {
  constructor(
    private readonly getOrdersUseCase: GetOrdersUseCase,
    private readonly getOrderByIdUseCase: GetOrderByIdUseCase,
    private readonly getSellerOrdersUseCase: GetSellerOrdersUseCase,
    private readonly createPaymentUseCase: CreatePaymentUseCase,
  ) {}

  getOrders = async (req: Request, res: Response): Promise<void> => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const result = await this.getOrdersUseCase.execute({
      buyerId: req.user!.id,
      page,
      limit,
      status: req.query.status as "PENDING" | "PAID" | "EXPIRED" | undefined,
    });

    res.json(result);
  };

  getOrder = async (req: Request, res: Response): Promise<void> => {
    const order = await this.getOrderByIdUseCase.execute(
      req.params.id.toString(),
      req.user!.id,
    );

    if (!order) {
      res.status(404).json({
        message: "ORDER_NOT_FOUND",
      });

      return;
    }

    res.json(order);
  };

  getSellerOrders = async (req: Request, res: Response): Promise<void> => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const result = await this.getSellerOrdersUseCase.execute({
      sellerId: req.user!.id,
      page,
      limit,
      status: req.query.status as "PENDING" | "PAID" | "EXPIRED" | undefined,
    });

    res.json(result);
  };

  createPayment = async (req: Request, res: Response): Promise<void> => {
    const result = await this.createPaymentUseCase.execute({
      orderId: req.params.id.toString(),
      buyerId: req.user!.id,
    });

    res.status(201).json(result);
  };
}
